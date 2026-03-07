import { load } from "cheerio";
import { URL } from "node:url";
import ytdl from "@distube/ytdl-core";
import { env } from "@/lib/env";

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
  { selector: "meta[property='og:video:url'][content]", attr: "content" },
  { selector: "meta[property='og:video:secure_url'][content]", attr: "content" },
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

const INSTAGRAM_HEADERS = {
  ...DOWNLOAD_HEADERS,
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
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

  if (looksLikeTikTok(parsed) || looksLikeInstagram(parsed) || looksLikeFacebook(parsed)) {
    const isInstagram = looksLikeInstagram(parsed);
    const isFacebook = looksLikeFacebook(parsed);
    logs.push({ level: "info", message: `URL recognized as ${isInstagram ? 'Instagram' : isFacebook ? 'Facebook' : 'TikTok'}.` });
    
    // First, let's try to resolve it via HTML as a more robust fallback
    // especially for Instagram which often works better if we can find a direct link
    if (isInstagram) {
       try {
         const resolved = await tryResolveFromHtml(normalized, logs, true);
         if (resolved) {
           logs.push({ level: "info", message: "Successfully resolved Instagram media via HTML scraping." });
           return resolved;
         }
       } catch (err) {
         logs.push({ level: "warn", message: `Instagram HTML resolution failed: ${err instanceof Error ? err.message : String(err)}` });
       }
    }

    return {
      kind: "direct", // Fallback to yt-dlp
      sourceUrl: normalized,
      resolvedUrl: normalized,
      filename: null,
      mimeType: "video/mp4",
      contentLength: null,
      durationMs: null,
      logs,
    };
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

function looksLikeTikTok(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host.includes("tiktok.com");
}

function looksLikeInstagram(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host.includes("instagram.com");
}

function looksLikeFacebook(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com");
}

// List of public Piped API instances to try as fallback
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://piped-api.garudalinux.org",
  "https://api.piped.projectsegfau.lt",
];

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    // youtu.be/<id>
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    // youtube.com/watch?v=<id> or /shorts/<id> or /embed/<id>
    const vParam = parsed.searchParams.get("v");
    if (vParam) return vParam;
    const pathMatch = parsed.pathname.match(/\/(shorts|embed|v)\/([^/?#]+)/);
    if (pathMatch) return pathMatch[2];
  } catch {
    // ignore
  }
  return null;
}

async function resolveViaYouTubePiped(
  videoId: string,
  logs: MediaResolutionLog[],
): Promise<MediaResolution | null> {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await safeFetch(`${instance}/streams/${videoId}`, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!res || !res.ok) continue;

      const data = await res.json() as {
        title?: string;
        uploader?: string;
        duration?: number;
        videoStreams?: Array<{ url: string; mimeType: string; quality: string; videoOnly?: boolean }>;
        audioStreams?: Array<{ url: string; mimeType: string; quality: string }>;
      };

      // Prefer a muxed stream (both video+audio), fall back to best video-only then audio-only
      const muxed = (data.videoStreams ?? []).find(s => !s.videoOnly);
      const bestVideo = (data.videoStreams ?? [])[0];
      const bestAudio = (data.audioStreams ?? [])[0];
      const stream = muxed ?? bestVideo ?? bestAudio;

      if (!stream?.url) continue;

      const title = data.title ?? null;
      const filename = title
        ? `${sanitizeFilename(title)}.${stream.mimeType?.includes("mp4") ? "mp4" : "webm"}`
        : null;

      logs.push({ level: "info", message: `Resolved via Piped instance: ${instance}` });

      return {
        kind: "youtube",
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
        resolvedUrl: stream.url,
        filename,
        mimeType: stream.mimeType?.split(";")[0] ?? null,
        contentLength: null,
        durationMs: data.duration ? data.duration * 1000 : null,
        logs,
        metadata: {
          title: title ?? undefined,
          channel: data.uploader ?? undefined,
          videoId,
          pipedProxy: `https://piped.video/watch?v=${videoId}`,
        },
      };
    } catch (err) {
      logs.push({ level: "warn", message: `Piped instance ${instance} failed: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  return null;
}

async function resolveViaYouTube(
  url: string,
  logs: MediaResolutionLog[],
): Promise<MediaResolution> {
  // --- Primary: ytdl-core ---
  try {
    const videoIdFromUrl = extractYouTubeVideoId(url);
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: buildYouTubeRequestHeaders(videoIdFromUrl),
      },
    });
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

    logs.push({ level: "info", message: "Resolved media via YouTube metadata." });

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
    logs.push({ level: "warn", message: `ytdl-core failed: ${message}. Trying Piped API fallback...` });
  }

  // --- Fallback: Piped public API ---
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    const piped = await resolveViaYouTubePiped(videoId, logs);
    if (piped) return piped;
  }

  logs.push({
    level: "warn",
    message: "YouTube metadata resolution failed. Falling back to direct downloader.",
  });

  return {
    kind: "youtube",
    sourceUrl: url,
    resolvedUrl: url,
    filename: videoId ? `youtube-${videoId}.mp4` : null,
    mimeType: "video/mp4",
    contentLength: null,
    durationMs: null,
    logs,
    metadata: {
      videoId: videoId ?? undefined,
      pipedProxy: videoId ? `https://piped.video/watch?v=${videoId}` : undefined,
    },
  };
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
  isInstagram: boolean = false,
): Promise<MediaResolution | null> {
  const response = await safeFetch(url, {
    headers: isInstagram ? INSTAGRAM_HEADERS : DOWNLOAD_HEADERS,
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

  // Look for JSON-LD or script tags with video data (Instagram often hides links here)
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "{}");
      if (json.video?.contentUrl) seen.add(json.video.contentUrl);
      if (Array.isArray(json)) {
        for (const item of json) {
           if (item.video?.contentUrl) seen.add(item.video.contentUrl);
        }
      }
    } catch { /* ignore */ }
  });

  // Also look for regular scripts that might contain video URL strings
  if (isInstagram) {
    const rawHtml = html.replace(/\\/g, '');
    const videoMatches = rawHtml.match(/https:\/\/scontent[^"]+?\.mp4[^"]*/g);
    if (videoMatches) {
      for (const match of videoMatches) seen.add(match);
    }
  }

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

function buildYouTubeRequestHeaders(videoId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    ...DOWNLOAD_HEADERS,
    origin: "https://www.youtube.com",
    referer: videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : "https://www.youtube.com/",
  };

  if (env.youtubeCookie) {
    headers.cookie = env.youtubeCookie;
  }

  return headers;
}

async function safeFetch(url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}
