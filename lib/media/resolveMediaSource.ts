import { load } from "cheerio";
import { URL } from "node:url";
import ytdl from "@distube/ytdl-core";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const MEDIA_MIME_PREFIXES = ["audio/", "video/"];
const HTML_MEDIA_SELECTORS: Array<{ selector: string; attr: string }> = [
  { selector: "video[src]", attr: "src" },
  { selector: "video source[src]", attr: "src" },
  { selector: 'source[src][type*="video"]', attr: "src" },
  { selector: 'source[src][type*="audio"]', attr: "src" },
  { selector: "meta[property='og:video'][content]", attr: "content" },
  { selector: "meta[property='twitter:player:stream'][content]", attr: "content" },
];
const MEDIA_EXTENSIONS = [".mp3", ".mp4", ".m4a", ".wav", ".webm", ".ogg", ".mov"];
const MAX_HTML_BYTES = 2_000_000;

export type MediaResolutionKind = "youtube" | "direct" | "html";

export type MediaResolutionLog = {
  level: "info" | "warn";
  message: string;
};

export type MediaResolutionMetadata = {
  title?: string;
  channel?: string;
  source?: string;
  videoId?: string;
  pipedProxy?: string;
  [key: string]: unknown;
};

export type MediaResolution = {
  kind: MediaResolutionKind;
  sourceUrl: string;
  resolvedUrl: string;
  filename: string | null;
  mimeType: string | null;
  contentLength: number | null;
  durationMs: number | null;
  logs: MediaResolutionLog[];
  metadata?: MediaResolutionMetadata;
};

type ProbeResult = {
  url: string;
  filename: string | null;
  mimeType: string | null;
  contentLength: number | null;
};

const DOWNLOAD_HEADERS = {
  "user-agent": USER_AGENT,
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
};

export async function resolveMediaSource(sourceUrl: string): Promise<MediaResolution> {
  const trimmed = sourceUrl.trim();
  if (!trimmed) {
    throw new Error("URL cannot be empty.");
  }
  const logs: MediaResolutionLog[] = [];
  const parsed = parseUrl(trimmed);
  const normalized = parsed.toString();

  if (looksLikeYouTube(parsed)) {
    return await resolveViaYouTube(normalized, logs);
  }

  const direct = await tryResolveDirect(normalized, logs);
  if (direct) {
    return direct;
  }

  const html = await tryResolveFromHtml(normalized, logs);
  if (html) {
    return html;
  }

  throw new Error("Unable to resolve a downloadable media source from the provided URL.");
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error("Invalid URL.");
  }
}

function looksLikeYouTube(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host.includes("youtube.com") ||
    host.includes("youtu.be") ||
    host.endsWith("youtube-nocookie.com")
  );
}

async function resolveViaYouTube(
  url: string,
  logs: MediaResolutionLog[],
): Promise<MediaResolution> {
  try {
    const info = await ytdl.getInfo(url);
    const muxed = ytdl.chooseFormat(info.formats, {
      filter: (format) => format.hasVideo && format.hasAudio,
      quality: "highest",
    });
    const audioOnly = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    const format = muxed ?? audioOnly ?? info.formats[0];

    if (!format) {
      throw new Error("No usable YouTube format was found.");
    }

    const durationMs =
      typeof info.videoDetails.lengthSeconds === "string"
        ? Number(info.videoDetails.lengthSeconds) * 1000
        : null;
    const filename = info.videoDetails.title
      ? `${sanitizeFilename(info.videoDetails.title)}.${format.container ?? "mp4"}`
      : null;

    const videoId = info.videoDetails.videoId;
    const metadata: MediaResolutionMetadata = {
      title: info.videoDetails.title,
      channel: info.videoDetails.author?.name ?? undefined,
      videoId,
      pipedProxy: videoId ? `https://piped.video/watch?v=${videoId}` : undefined,
    };

    logs.push({
      level: "info",
      message: "Resolved media via YouTube metadata.",
    });

    return {
      kind: "youtube",
      sourceUrl: url,
      resolvedUrl: url,
      filename,
      mimeType: format.mimeType?.split(";")[0] ?? null,
      contentLength: format.contentLength ? Number(format.contentLength) : null,
      durationMs,
      logs,
      metadata,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown YouTube resolution error";
    logs.push({
      level: "warn",
      message: `YouTube resolution failed: ${message}`,
    });
    throw new Error(message);
  }
}

async function tryResolveDirect(
  url: string,
  logs: MediaResolutionLog[],
): Promise<MediaResolution | null> {
  const probe = await probeMediaUrl(url, logs);
  if (!probe) {
    return null;
  }

  logs.push({ level: "info", message: "Resolved media as direct download." });
  return {
    kind: "direct",
    sourceUrl: url,
    resolvedUrl: probe.url,
    filename: probe.filename,
    mimeType: probe.mimeType,
    contentLength: probe.contentLength,
    durationMs: null,
    logs,
  };
}

async function tryResolveFromHtml(
  url: string,
  logs: MediaResolutionLog[],
): Promise<MediaResolution | null> {
  const response = await safeFetch(url, {
    headers: DOWNLOAD_HEADERS,
    redirect: "follow",
  });
  if (!response || !response.ok) {
    logs.push({
      level: "warn",
      message: "Failed to download HTML to inspect embedded media elements.",
    });
    return null;
  }

  const html = await readHtmlWithLimit(response, MAX_HTML_BYTES);
  const $ = load(html);
  const seen = new Set<string>();

  for (const entry of HTML_MEDIA_SELECTORS) {
    $(entry.selector).each((_, el) => {
      const candidate = $(el).attr(entry.attr);
      if (!candidate) {
        return;
      }
      try {
        const resolved = new URL(candidate, response.url).toString();
        seen.add(resolved);
      } catch {
        // ignore invalid candidate
      }
    });
  }

  for (const candidate of seen) {
    const probe = await probeMediaUrl(candidate, logs, response.url);
    if (!probe) {
      continue;
    }

    logs.push({
      level: "info",
      message: `Resolved media from embedded HTML tag: ${candidate}`,
    });
    return {
      kind: "html",
      sourceUrl: url,
      resolvedUrl: probe.url,
      filename: probe.filename,
      mimeType: probe.mimeType,
      contentLength: probe.contentLength,
      durationMs: null,
      logs,
      metadata: { source: response.url },
    };
  }

  logs.push({
    level: "warn",
    message: "Could not locate downloadable assets within the HTML document.",
  });
  return null;
}

async function probeMediaUrl(
  url: string,
  logs: MediaResolutionLog[],
  referer?: string,
): Promise<ProbeResult | null> {
  const headers: Record<string, string> = { ...DOWNLOAD_HEADERS };
  if (referer) {
    headers.referer = referer;
  }

  const headResponse = await safeFetch(url, {
    method: "HEAD",
    headers,
    redirect: "follow",
  });

  const evaluation = evaluateMediaResponse(headResponse);
  if (evaluation) {
    return evaluation;
  }

  const rangeHeaders = { ...headers, Range: "bytes=0-0" };
  const getResponse = await safeFetch(url, {
    method: "GET",
    headers: rangeHeaders,
    redirect: "follow",
  });
  const evaluationFromGet = evaluateMediaResponse(getResponse);
  if (!evaluationFromGet) {
    if (getResponse?.body) {
      try {
        await getResponse.arrayBuffer();
      } catch {
        // ignore read errors
      }
    }
    logs.push({
      level: "warn",
      message: `Skipping ${url} because the response did not look like media.`,
    });
    return null;
  }

  if (getResponse?.body) {
    try {
      await getResponse.arrayBuffer();
    } catch {
      // ignore partial reads
    }
  }
  return evaluationFromGet;
}

function evaluateMediaResponse(response?: Response | null): ProbeResult | null {
  if (!response || !response.ok) {
    return null;
  }

  const mimeType = response.headers.get("content-type");
  const lengthHeader = response.headers.get("content-length");
  const contentLength = lengthHeader ? Number(lengthHeader) : null;
  const resolvedUrl = response.url ?? null;
  const disposition = response.headers.get("content-disposition");

  const isMedia =
    (mimeType !== null && MEDIA_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) ||
    looksLikeMediaExtension(resolvedUrl);

  if (!isMedia || !resolvedUrl) {
    return null;
  }

  const filename =
    extractFilenameFromDisposition(disposition) ?? deriveFilenameFromPath(resolvedUrl);

  return {
    url: resolvedUrl,
    filename,
    mimeType,
    contentLength,
  };
}

async function readHtmlWithLimit(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    return await response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let chunks = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error("HTML document exceeded the allowable size.");
    }
    chunks += decoder.decode(value, { stream: true });
  }

  chunks += decoder.decode();
  return chunks;
}

function extractFilenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // ignore invalid encodings and fall through
    }
  }

  const quoted = header.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) {
    return quoted[1];
  }

  return null;
}

function deriveFilenameFromPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    if (!pathname) {
      return null;
    }
    const segments = pathname.split("/");
    const last = segments.pop();
    if (!last) {
      return null;
    }
    const cleaned = last.trim();
    if (!cleaned) {
      return null;
    }
    const hasExtension = MEDIA_EXTENSIONS.some((ext) => cleaned.toLowerCase().endsWith(ext));
    if (!hasExtension) {
      return null;
    }
    return sanitizeFilename(cleaned);
  } catch {
    return null;
  }
}

function looksLikeMediaExtension(url: string | null): boolean {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  return MEDIA_EXTENSIONS.some((ext) => lower.includes(ext));
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
}

async function safeFetch(url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}
