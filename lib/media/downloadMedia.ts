import { createWriteStream } from "node:fs";
import { mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { URL } from "node:url";
import { spawn } from "node:child_process";
import ytdl from "@distube/ytdl-core";
import { Innertube } from "youtubei.js";
import { env } from "@/lib/env";
import type { MediaResolutionKind } from "@/lib/media/resolveMediaSource";

const TMP_PREFIX = "ai-subauto-";
const DEFAULT_MAX_BYTES = 250 * 1024 * 1024;
let innertubeClient: Innertube | null = null;
let ytDlpAvailable: boolean | null = null;

export type DownloadMediaOptions = {
  filenameHint?: string | null;
  mimeType?: string | null;
  maxBytes?: number;
  referer?: string | null;
  kind?: MediaResolutionKind;
  sourceUrl?: string;
  youtubeVideoId?: string | null;
  extraHeaders?: Record<string, string>;
};

export type DownloadMediaResult = {
  filePath: string;
  sizeBytes: number;
  mimeType: string | null;
  originalFileName: string | null;
};

const DOWNLOAD_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
};

export async function downloadMediaToFile(
  url: string,
  options: DownloadMediaOptions = {},
): Promise<DownloadMediaResult> {
  const shouldUseYtdl =
    options.kind === "youtube" ||
    looksLikeYouTubeUrl(options.sourceUrl) ||
    looksLikeYouTubeUrl(url);
  const youtubeIdForFallback =
    options.youtubeVideoId ??
    extractYoutubeVideoId(options.sourceUrl) ??
    extractYoutubeVideoId(url);

  if (shouldUseYtdl) {
    const videoId = youtubeIdForFallback ?? extractYoutubeVideoId(options.sourceUrl) ?? extractYoutubeVideoId(url);
    console.info(`[media] YouTube download requested for videoId: ${videoId}`);
    
    // Try yt-dlp first (most reliable against YouTube blocks)
    const ytDlpReady = await isYtDlpAvailable();
    console.info(`[media] yt-dlp available: ${ytDlpReady}`);
    
    if (videoId && ytDlpReady) {
      try {
        console.info(`[media] Attempting download via yt-dlp for ${videoId}...`);
        return await downloadViaYtDlp(videoId, options);
      } catch (ytDlpError) {
        const reason = ytDlpError instanceof Error ? ytDlpError.message : String(ytDlpError);
        console.warn(`[media] yt-dlp failed for video ${videoId}: ${reason}. Falling back to ytdl-core.`);
      }
    }
    
    // Fallback to ytdl-core
    try {
      console.info(`[media] Attempting download via ytdl-core...`);
      return await downloadViaYtdl(options.sourceUrl ?? url, options);
    } catch (error) {
      if (videoId) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(
          `[media] ytdl-core failed for video ${videoId}: ${reason}. Falling back to Innertube.`,
        );
        console.info(`[media] Attempting download via Innertube...`);
        return await downloadViaInnertube(videoId, options);
      }
      throw error;
    }
  }

  const headers: Record<string, string> = { ...DOWNLOAD_HEADERS, ...(options.extraHeaders ?? {}) };
  if (options.referer) {
    headers.referer = options.referer;
  }

  const treatAsYoutubeRequest =
    options.kind === "youtube" || looksLikeYouTubeUrl(options.sourceUrl) || looksLikeYouTubeUrl(url);

  if (treatAsYoutubeRequest) {
    if (!headers.origin) {
      headers.origin = "https://www.youtube.com";
    }
    if (!headers.referer) {
      headers.referer =
        options.referer ??
        (options.youtubeVideoId ? `https://www.youtube.com/watch?v=${options.youtubeVideoId}` : "https://www.youtube.com/");
    }
    if (env.youtubeCookie && !headers.cookie) {
      headers.cookie = env.youtubeCookie;
    }
  }

  const response = await fetch(url, {
    headers,
    redirect: "follow",
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download media (HTTP ${response.status}).`);
  }

  const dir = await mkdtemp(path.join(tmpdir(), TMP_PREFIX));
  const extension =
    options.filenameHint && path.extname(options.filenameHint)
      ? path.extname(options.filenameHint)
      : guessExtension(options.mimeType ?? response.headers.get("content-type"));
  const filename = options.filenameHint
    ? sanitizeFilename(options.filenameHint)
    : `media${extension ?? ""}`;
  const filePath = path.join(dir, filename);

  const writable = createWriteStream(filePath);
  const readable = Readable.fromWeb(response.body as unknown as NodeReadableStream);
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let runningBytes = 0;

  readable.on("data", (chunk: Buffer) => {
    runningBytes += chunk.length;
    if (runningBytes > maxBytes) {
      readable.destroy(new Error("Maximum download size exceeded."));
    }
  });

  try {
    await pipeline(readable, writable);
    const fileStats = await stat(filePath);
    return {
      filePath,
      sizeBytes: fileStats.size,
      mimeType: response.headers.get("content-type"),
      originalFileName: filename,
    };
  } catch (error) {
    await cleanupTempFile(filePath);
    throw error instanceof Error ? error : new Error("Failed to download media.");
  }
}

async function downloadViaYtdl(
  source: string,
  options: DownloadMediaOptions,
): Promise<DownloadMediaResult> {
  const normalizedSource = coerceYouTubeSource(options, source);
  const info = await ytdl.getInfo(normalizedSource);
  const muxed = ytdl.chooseFormat(info.formats, {
    quality: "highest",
    filter: (format) => format.hasVideo && format.hasAudio,
  });
  const fallbackAudio = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
  const format = muxed ?? fallbackAudio ?? info.formats[0];

  if (!format) {
    throw new Error("No downloadable YouTube format was found.");
  }

  const dir = await mkdtemp(path.join(tmpdir(), TMP_PREFIX));
  const hintedExt =
    options.filenameHint && path.extname(options.filenameHint).length > 0
      ? path.extname(options.filenameHint)
      : null;
  const derivedExt =
    format.container ? `.${format.container}` : guessExtension(format.mimeType ?? null);
  const extension = hintedExt ?? derivedExt ?? ".mp4";
  const hintedBase =
    options.filenameHint && hintedExt
      ? path.basename(options.filenameHint, hintedExt)
      : options.filenameHint ?? null;
  const fallbackBase =
    info.videoDetails.title || info.videoDetails.videoId || "youtube-media";
  const filename = sanitizeFilename(hintedBase ?? fallbackBase) + extension;
  const filePath = path.join(dir, filename);

  const writable = createWriteStream(filePath);
  const readable = ytdl.downloadFromInfo(info, {
    format,
    requestOptions: {
      headers: DOWNLOAD_HEADERS,
    },
  });

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let runningBytes = 0;
  readable.on("data", (chunk: Buffer) => {
    runningBytes += chunk.length;
    if (runningBytes > maxBytes) {
      readable.destroy(new Error("Maximum download size exceeded."));
    }
  });

  try {
    await pipeline(readable, writable);
    const fileStats = await stat(filePath);
    const mimeType = format.mimeType?.split(";")[0] ?? options.mimeType ?? null;
    return {
      filePath,
      sizeBytes: fileStats.size,
      mimeType,
      originalFileName: filename,
    };
  } catch (error) {
    await cleanupTempFile(filePath);
    throw error instanceof Error ? error : new Error("Error while downloading from YouTube.");
  }
}

async function cleanupTempFile(filePath: string) {
  try {
    await rm(filePath, { force: true, recursive: true });
  } catch {
    // ignore cleanup failures
  }
}

function looksLikeYouTubeUrl(value?: string | null): boolean {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.endsWith("youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}

function coerceYouTubeSource(options: DownloadMediaOptions, fallback: string): string {
  if (options.youtubeVideoId && ytdl.validateID(options.youtubeVideoId)) {
    return options.youtubeVideoId;
  }
  if (options.sourceUrl && ytdl.validateURL(options.sourceUrl)) {
    return options.sourceUrl;
  }
  if (ytdl.validateURL(fallback) || ytdl.validateID(fallback)) {
    return fallback;
  }
  throw new Error("A valid YouTube URL or video ID is required.");
}

function extractYoutubeVideoId(candidate?: string | null): string | null {
  if (!candidate) {
    return null;
  }
  try {
    return ytdl.getURLVideoID(candidate);
  } catch {
    return null;
  }
}

type RawInnertubeFormat = {
  url?: string;
  mime_type?: string;
  has_audio?: boolean;
  has_video?: boolean;
};

function pickDirectInnertubeFormat(info: Awaited<ReturnType<Innertube["getInfo"]>>) {
  const streaming = info.streaming_data;
  if (!streaming) {
    return null;
  }
  const formats = [
    ...((streaming.formats ?? []) as RawInnertubeFormat[]),
    ...((streaming.adaptive_formats ?? []) as RawInnertubeFormat[]),
  ];
  const available = formats.filter((format) => typeof format.url === "string");
  if (available.length === 0) {
    return null;
  }
  const muxed = available.find((format) => format.has_audio && format.has_video);
  return muxed ?? available.find((format) => format.has_video) ?? available[0];
}

function ensureInnertubeUrls(info: Awaited<ReturnType<Innertube["getInfo"]>>) {
  const streaming = info.streaming_data;
  if (!streaming) {
    return;
  }

  const decipher =
    (info as unknown as { decipher_formats?: (formats: RawInnertubeFormat[]) => void })
      .decipher_formats;

  if (!decipher) {
    return;
  }

  if (Array.isArray(streaming.formats) && streaming.formats.length > 0) {
    decipher(streaming.formats as RawInnertubeFormat[]);
  }
  if (Array.isArray(streaming.adaptive_formats) && streaming.adaptive_formats.length > 0) {
    decipher(streaming.adaptive_formats as RawInnertubeFormat[]);
  }
}

function buildYoutubeRequestHeaders(videoId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    origin: "https://www.youtube.com",
    referer: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "https://www.youtube.com/",
  };
  if (env.youtubeCookie) {
    headers.cookie = env.youtubeCookie;
  }
  return headers;
}

async function downloadViaInnertube(
  videoId: string,
  options: DownloadMediaOptions,
): Promise<DownloadMediaResult> {
  const youtube = await getInnertubeClient();
  const info = await youtube.getInfo(videoId);
  ensureInnertubeUrls(info);
  const hintedExt =
    options.filenameHint && path.extname(options.filenameHint).length > 0
      ? path.extname(options.filenameHint)
      : null;
  const hintedBase =
    options.filenameHint && hintedExt
      ? path.basename(options.filenameHint, hintedExt)
      : options.filenameHint ?? null;
  const baseName = sanitizeFilename(hintedBase ?? info.basic_info?.title ?? videoId);
  const directFormat = pickDirectInnertubeFormat(info);

  if (directFormat?.url) {
    const directMime = directFormat.mime_type?.split(";")[0] ?? null;
    const extFromMime = guessExtension(directMime) ?? (directFormat.has_video ? ".mp4" : ".m4a");
    const filenameHint = options.filenameHint ?? `${baseName}${extFromMime}`;
    return await downloadMediaToFile(directFormat.url, {
      ...options,
      kind: "direct",
      filenameHint,
      mimeType: directMime ?? options.mimeType ?? null,
      sourceUrl: directFormat.url,
      referer: options.referer ?? `https://www.youtube.com/watch?v=${videoId}`,
      extraHeaders: {
        ...buildYoutubeRequestHeaders(videoId),
        ...(options.extraHeaders ?? {}),
      },
    });
  }

  const downloadWithType = async (streamType: "video" | "audio"): Promise<DownloadMediaResult> => {
    const dir = await mkdtemp(path.join(tmpdir(), TMP_PREFIX));
    const extension = hintedExt ?? (streamType === "audio" ? ".m4a" : ".mp4");
    const filename = `${baseName}${extension}`;
    const filePath = path.join(dir, filename);
    const stream = (await info.download({
      type: streamType,
      quality: "best",
    })) as unknown as NodeReadableStream;
    const readable = Readable.fromWeb(stream);
    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    let runningBytes = 0;
    readable.on("data", (chunk: Buffer) => {
      runningBytes += chunk.length;
      if (runningBytes > maxBytes) {
        readable.destroy(new Error("Maximum download size exceeded."));
      }
    });
    try {
      await pipeline(readable, createWriteStream(filePath));
      const fileStats = await stat(filePath);
      return {
        filePath,
        sizeBytes: fileStats.size,
        mimeType: options.mimeType ?? (streamType === "audio" ? "audio/mp4" : "video/mp4"),
        originalFileName: filename,
      };
    } catch (error) {
      await cleanupTempFile(filePath);
      throw error instanceof Error
        ? error
        : new Error("Failed to download via Innertube fallback.");
    }
  };

  try {
    return await downloadWithType("video");
  } catch (videoError) {
    console.warn(
      `[media] Innertube video download failed for ${videoId}: ${
        videoError instanceof Error ? videoError.message : videoError
      }. Trying audio-only stream.`,
    );
    return await downloadWithType("audio");
  }
}

async function getInnertubeClient(): Promise<Innertube> {
  if (!innertubeClient) {
    innertubeClient = await Innertube.create();
  }
  return innertubeClient;
}

function guessExtension(mimeType: string | null): string | null {
  if (!mimeType) {
    return null;
  }
  if (mimeType.includes("mpeg")) return ".mp3";
  if (mimeType.includes("mp4")) return ".mp4";
  if (mimeType.includes("wav")) return ".wav";
  if (mimeType.includes("webm")) return ".webm";
  if (mimeType.includes("ogg")) return ".ogg";
  return null;
}

function sanitizeFilename(filename: string): string {
  const normalized = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
  return normalized.length > 0 ? normalized : "media";
}

// =====================================================
// yt-dlp Integration
// =====================================================

type YtDlpMetadata = {
  title?: string;
  ext?: string;
  filename?: string;
  _filename?: string;
  duration?: number;
};

async function isYtDlpAvailable(): Promise<boolean> {
  if (ytDlpAvailable !== null) {
    return ytDlpAvailable;
  }

  console.info(`[media] Checking yt-dlp availability at path: ${env.ytDlpPath}`);
  
  try {
    const result = await spawnYtDlp(["--version"]);
    ytDlpAvailable = result.exitCode === 0;
    if (ytDlpAvailable) {
      console.info(`[media] yt-dlp found, version: ${result.stdout.trim()}`);
    } else {
      console.warn(`[media] yt-dlp check failed with exit code ${result.exitCode}: ${result.stderr}`);
    }
    return ytDlpAvailable;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[media] yt-dlp spawn error: ${reason}`);
    ytDlpAvailable = false;
    return false;
  }
}

async function downloadViaYtDlp(
  videoId: string,
  options: DownloadMediaOptions,
): Promise<DownloadMediaResult> {
  const dir = await mkdtemp(path.join(tmpdir(), TMP_PREFIX));
  // Use videoId for filename to avoid special character issues with FFmpeg merge
  const outputTemplate = path.join(dir, `${videoId}.%(ext)s`);
  
  // Check if cookie is in Netscape format (contains tabs or starts with # Netscape)
  const isNetscapeCookie = env.youtubeCookie && (
    env.youtubeCookie.includes("# Netscape HTTP Cookie File") ||
    env.youtubeCookie.includes("\t")  // Netscape format uses tabs
  );
  
  const cookieFile = isNetscapeCookie ? path.join(dir, "cookies.txt") : null;

  // Write cookie file only if in valid Netscape format
  if (cookieFile && env.youtubeCookie) {
    await writeFile(cookieFile, env.youtubeCookie, "utf-8");
    console.info("[media] Using Netscape format cookie file for yt-dlp");
  } else if (env.youtubeCookie) {
    console.warn("[media] YOUTUBE_COOKIE is not in Netscape format, skipping cookie usage for yt-dlp");
  }

  const args: string[] = [
    "--no-playlist",
    // Use format 18 (360p video+audio) as primary to ensure single file, then try merging
    "--format", "18/22/bv*+ba/b",
    "--merge-output-format", "mp4",
    "--output", outputTemplate,
    "--print-json",
    "--no-simulate",
    "--no-warnings",
  ];

  if (cookieFile) {
    args.push("--cookies", cookieFile);
  }

  args.push(`https://www.youtube.com/watch?v=${videoId}`);

  const result = await spawnYtDlp(args);

  if (result.exitCode !== 0) {
    await rm(dir, { recursive: true, force: true });
    throw new Error(`yt-dlp failed with exit code ${result.exitCode}: ${result.stderr}`);
  }

  // Parse JSON output to get metadata (for future use)
  try {
    const jsonLines = result.stdout.trim().split("\n");
    const lastJsonLine = jsonLines[jsonLines.length - 1];
    JSON.parse(lastJsonLine) as YtDlpMetadata;  // Validate JSON but don't store
  } catch {
    console.warn("[media] Could not parse yt-dlp JSON output.");
  }

  // Find the downloaded file - prefer video formats over audio-only
  const files = await readdir(dir);
  console.info(`[media] yt-dlp produced files: ${JSON.stringify(files)}`);
  
  // Prioritize video formats over audio-only
  const videoFile = files.find((f) => 
    f.endsWith(".mp4") || f.endsWith(".webm") || f.endsWith(".mkv")
  );
  const audioFile = files.find((f) => f.endsWith(".m4a"));
  const mediaFile = videoFile ?? audioFile;
  
  console.info(`[media] Selected file: ${mediaFile} (video: ${videoFile}, audio: ${audioFile})`);

  if (!mediaFile) {
    await rm(dir, { recursive: true, force: true });
    throw new Error("yt-dlp did not produce a downloadable file.");
  }

  const filePath = path.join(dir, mediaFile);
  const fileStats = await stat(filePath);

  // Check file size limit
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (fileStats.size > maxBytes) {
    await rm(dir, { recursive: true, force: true });
    throw new Error("Maximum download size exceeded.");
  }

  const extension = path.extname(mediaFile);
  const mimeType = extension === ".mp4" ? "video/mp4" 
    : extension === ".webm" ? "video/webm"
    : extension === ".mkv" ? "video/x-matroska"
    : extension === ".m4a" ? "audio/mp4"
    : options.mimeType ?? "video/mp4";

  return {
    filePath,
    sizeBytes: fileStats.size,
    mimeType,
    originalFileName: mediaFile,
  };
}

type SpawnResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

function spawnYtDlp(args: string[]): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(env.ytDlpPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      reject(err);
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

