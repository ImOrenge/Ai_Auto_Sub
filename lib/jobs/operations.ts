import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { downloadMediaToFile } from "@/lib/media/downloadMedia";
import {
  resolveMediaSource,
  type MediaResolutionLog,
} from "@/lib/media/resolveMediaSource";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { SubtitleConfig } from "@/lib/jobs/types";

type WhisperVerboseSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

type WhisperVerboseResponse = {
  language: string;
  segments: WhisperVerboseSegment[];
};

type TranslationPayload = {
  segments: TranscriptSegment[];
};

const openai = new OpenAI({
  apiKey: env.openAiApiKey,
});

const resolvedFfmpegPath = resolveFfmpegBinary(ffmpegStatic);
const ffmpegAvailable = Boolean(resolvedFfmpegPath);

if (resolvedFfmpegPath) {
  ffmpeg.setFfmpegPath(resolvedFfmpegPath);
}

const OPENAI_AUDIO_MAX_BYTES = 25 * 1024 * 1024;
const VIDEO_EXTENSION_MATCHERS = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".mpg", ".mpeg", ".wmv"];
const VIDEO_MIME_HINTS: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/x-matroska": ".mkv",
  "video/webm": ".webm",
  "video/x-msvideo": ".avi",
  "video/avi": ".avi",
  "video/mpeg": ".mpeg",
  "video/x-ms-wmv": ".wmv",
};

export type DownloadedAudio = {
  audioFile: string;
  durationMs: number;
  sourceUrl: string;
  sizeBytes: number;
  mimeType: string | null;
  filename: string | null;
  tempDir: string;
  resolutionLogs?: MediaResolutionLog[];
  metadata?: Record<string, unknown>;
};

export type TranscriptSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type TranscriptionResult = {
  language: string;
  segments: TranscriptSegment[];
};

export type TranslationResult = {
  targetLocale: string;
  segments: TranscriptSegment[];
};

export type SubtitleResult = {
  fileName: string;
  content: string;
};

export type UploadResult = {
  storagePath: string;
  publicUrl: string;
};

export type CaptionedVideoResult = {
  sourceUrl: string;
  subtitlesFile: string;
  publicUrl: string | null;
  storagePath: string | null;
};

export async function downloadAudioFromUrl(sourceUrl: string): Promise<DownloadedAudio> {
  const resolution = await resolveMediaSource(sourceUrl);
  resolution.logs.forEach((entry) => {
    const method = entry.level === "warn" ? console.warn : console.info;
    method(`[media] ${entry.message}`);
  });
  const downloaded = await downloadMediaToFile(resolution.resolvedUrl, {
    filenameHint: resolution.filename,
    mimeType: resolution.mimeType,
    kind: resolution.kind,
    sourceUrl: resolution.sourceUrl,
    youtubeVideoId:
      typeof resolution.metadata?.videoId === "string" ? resolution.metadata.videoId : null,
    referer: resolution.sourceUrl,
  });

  // If we don't have duration from metadata (e.g. direct file download), measure it using FFmpeg
  let durationMs = resolution.durationMs ?? 0;
  if (durationMs === 0 && ffmpegAvailable) {
    try {
      durationMs = await measureMediaDuration(downloaded.filePath);
      console.info(`[media] Measured duration via FFmpeg: ${durationMs}ms`);
    } catch (e) {
      console.warn(`[media] Failed to measure duration via FFmpeg`, e);
    }
  }

  return {
    audioFile: downloaded.filePath,
    durationMs,
    sourceUrl: resolution.resolvedUrl,
    sizeBytes: downloaded.sizeBytes,
    mimeType: coalesceMimeType(downloaded.mimeType, resolution.mimeType),
    filename: downloaded.originalFileName ?? resolution.filename,
    tempDir: path.dirname(downloaded.filePath),
    resolutionLogs: resolution.logs,
    metadata: resolution.metadata,
  };
}

function measureMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .on("codecData", (data) => {
        // format is HH:MM:SS.mm
        if (data.duration) {
           const parts = data.duration.split(':');
           const seconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
           resolve(seconds * 1000);
        } else {
           resolve(0);
        }
      })
      .on("error", (err) => {
        // Ignoring error here, resolve 0 or reject?
        // If it fails to probe, likely invalid media.
        console.warn(`[ffmpeg] Probe error: ${err.message}`);
        resolve(0); 
      })
      .format("null") // Null format is fast
      .output("-") // Output to stdout
      .run();
  });
}

export async function callWhisper(audio: DownloadedAudio): Promise<TranscriptionResult> {
  const prepared = await prepareAudioForWhisper(audio);

  try {
    const stream = createReadStream(prepared.filePath);
    const response = await openai.audio.transcriptions.create({
      file: stream,
      model: env.whisperModel,
      response_format: "verbose_json",
      temperature: 0,
    });

    const payload = response as unknown as WhisperVerboseResponse;
    if (!payload?.segments || payload.segments.length === 0) {
      throw new Error("Whisper API did not return any segments.");
    }

    const segments: TranscriptSegment[] = payload.segments.map((segment) => ({
      id: segment.id,
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
    }));

    return {
      language: payload.language ?? "auto",
      segments,
    };
  } finally {
    await prepared.cleanup();
  }
}

export async function translateSegments(
  transcription: TranscriptionResult,
  targetLocale: string,
): Promise<TranslationResult> {
  const completion = await openai.chat.completions.create({
    model: env.translationModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional subtitling assistant that translates text into ${targetLocale}. Return JSON with the same number of segments.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          targetLocale,
          segments: transcription.segments,
        }),
      },
    ],
  });

  const message = completion.choices[0]?.message?.content;
  if (!message) {
    throw new Error("Translation API did not produce a response.");
  }

  let parsed: TranslationPayload;
  try {
    parsed = JSON.parse(message);
  } catch {
    throw new Error("Unable to parse translation response.");
  }

  if (!parsed.segments || parsed.segments.length === 0) {
    throw new Error("Translation response was empty.");
  }

  const segments = parsed.segments.map((segment, index) => ({
    id: segment.id ?? index,
    start: segment.start,
    end: segment.end,
    text: segment.text.trim(),
  }));

  return {
    targetLocale,
    segments,
  };
}

export async function generateSrt(translation: TranslationResult): Promise<SubtitleResult> {
  const lines = translation.segments.map((segment, index) => {
    const start = formatTimestamp(segment.start);
    const end = formatTimestamp(segment.end);
    return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
  });

  const fileName = `job-${Date.now()}-${randomUUID().slice(0, 8)}.srt`;
  return {
    fileName,
    content: lines.join("\n"),
  };
}

/**
 * 이중 자막 (원어 + 번역) SRT 생성
 * 원어를 위에, 번역을 아래에 표시
 */
export async function generateBilingualSrt(
  transcription: TranscriptionResult,
  translation: TranslationResult,
): Promise<SubtitleResult> {
  const lines = translation.segments.map((segment, index) => {
    const start = formatTimestamp(segment.start);
    const end = formatTimestamp(segment.end);
    const originalText = transcription.segments[index]?.text?.trim() ?? "";
    const translatedText = segment.text.trim();
    // 원어를 위에, 번역을 아래에 표시 (두 줄 자막)
    return `${index + 1}\n${start} --> ${end}\n${originalText}\n${translatedText}\n`;
  });

  const fileName = `job-${Date.now()}-${randomUUID().slice(0, 8)}-bilingual.srt`;
  return {
    fileName,
    content: lines.join("\n"),
  };
}

export async function uploadToStorage(subtitles: SubtitleResult): Promise<UploadResult> {
  const supabase = getSupabaseServer();
  const storagePath = `subtitles/${subtitles.fileName}`;
  const buffer = Buffer.from(subtitles.content, "utf-8");

  const { error } = await supabase.storage.from(env.resultsBucket).upload(storagePath, buffer, {
    contentType: "text/plain; charset=utf-8",
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload SRT to storage: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(env.resultsBucket).getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl,
  };
}

export async function applySubtitlesToVideo(
  media: DownloadedAudio,
  subtitles: SubtitleResult,
  subtitleConfig?: SubtitleConfig,
): Promise<CaptionedVideoResult> {
  console.info(`[caption] Checking if media is video-like:`);
  console.info(`[caption]   mimeType: ${media.mimeType}`);
  console.info(`[caption]   filename: ${media.filename}`);
  console.info(`[caption]   audioFile: ${media.audioFile}`);
  
  const videoLike = isVideoLike(media.mimeType, media.filename, media.audioFile);
  console.info(`[caption]   isVideoLike: ${videoLike}`);
  
  if (!videoLike) {
    console.warn(`[caption] Skipping video rendering - not a video file`);
    return {
      sourceUrl: media.sourceUrl,
      subtitlesFile: subtitles.fileName,
      publicUrl: null,
      storagePath: null,
    };
  }

  if (!ffmpegAvailable) {
    throw new Error("FFmpeg binary is not available in this environment.");
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "ai-subauto-caption-"));
  const subtitlePath = path.join(workDir, subtitles.fileName);
  await writeFile(subtitlePath, subtitles.content, "utf-8");

  const extension =
    (media.filename && path.extname(media.filename)) || inferVideoExtension(media.mimeType) || ".mp4";
  const outputPath = path.join(workDir, `captioned-${randomUUID()}${extension}`);

  try {
    await renderVideoWithCaptions(media.audioFile, subtitlePath, outputPath, subtitleConfig);

    const supabase = getSupabaseServer();
    const objectPath = `videos/${path.basename(outputPath)}`;
    const fileBuffer = await readFile(outputPath);
    const { error } = await supabase.storage
      .from(env.resultsBucket)
      .upload(objectPath, fileBuffer, {
        contentType: media.mimeType ?? "video/mp4",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload captioned video: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(env.resultsBucket).getPublicUrl(objectPath);

    return {
      sourceUrl: media.sourceUrl,
      subtitlesFile: subtitles.fileName,
      publicUrl,
      storagePath: objectPath,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},000`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function inferVideoExtension(mimeType: string | null): string | null {
  if (!mimeType) {
    return null;
  }
  const normalized = mimeType.toLowerCase();
  if (VIDEO_MIME_HINTS[normalized]) {
    return VIDEO_MIME_HINTS[normalized];
  }
  if (normalized.startsWith("video/")) {
    return ".mp4";
  }
  return null;
}

function isVideoLike(mimeType: string | null, filename: string | null, filePath: string) {
  if (mimeType?.toLowerCase().startsWith("video/")) {
    return true;
  }
  const candidates = [filename, filePath].filter(Boolean) as string[];
  return candidates.some((value) => {
    const lower = value.toLowerCase();
    return VIDEO_EXTENSION_MATCHERS.some((ext) => lower.endsWith(ext));
  });
}

async function renderVideoWithCaptions(
  input: string,
  subtitlesPath: string,
  output: string,
  subtitleConfig?: SubtitleConfig,
) {
  const normalizedSubPath = escapeSubtitlePath(subtitlesPath);
  
  // SubtitleConfig에서 FFmpeg force_style 문자열 생성
  const forceStyle = buildForceStyle(subtitleConfig);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(input)
      .outputOptions([
        "-vf",
        `subtitles='${normalizedSubPath}':force_style='${forceStyle}'`,
        "-c:a",
        "copy",
      ])
      .output(output)
      .on("error", (error) => reject(error))
      .on("end", () => resolve())
      .run();
  });
}

/**
 * SubtitleConfig를 FFmpeg ASS/SSA force_style 문자열로 변환
 */
function buildForceStyle(config?: SubtitleConfig): string {
  if (!config) {
    return "FontSize=24,PrimaryColour=&Hffffff&";
  }

  const parts: string[] = [];
  
  // 폰트 설정
  parts.push(`FontName=${config.fontName}`);
  parts.push(`FontSize=${config.fontSize}`);
  
  // 색상 변환 (hex to ASS format: &HBBGGRR&)
  parts.push(`PrimaryColour=${hexToAssColor(config.primaryColor)}`);
  parts.push(`OutlineColour=${hexToAssColor(config.outlineColor)}`);
  parts.push(`BackColour=${hexToAssColor(config.backgroundColor)}`);
  
  // 외곽선
  parts.push(`Outline=${config.outlineWidth}`);
  
  // 위치 설정 (Alignment: 1-3 하단, 4-6 중앙, 7-9 상단)
  const alignmentMap = { bottom: 2, center: 5, top: 8 };
  parts.push(`Alignment=${alignmentMap[config.position]}`);
  
  // 마진
  parts.push(`MarginV=${config.marginV}`);
  
  return parts.join(",");
}

/**
 * HEX 색상을 ASS 형식 (&HAABBGGRR&)으로 변환
 */
function hexToAssColor(hex: string): string {
  // #RRGGBB 또는 #RRGGBBAA 형식 지원
  const cleaned = hex.replace(/^#/, "");
  
  let r = "00", g = "00", b = "00", a = "00";
  
  if (cleaned.length >= 6) {
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
  }
  if (cleaned.length === 8) {
    a = cleaned.slice(6, 8);
  }
  
  // ASS format: &HAABBGGRR& (Alpha, Blue, Green, Red 순서)
  return `&H${a}${b}${g}${r}&`;
}

function escapeSubtitlePath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:");
}

type PreparedAudio = {
  filePath: string;
  cleanup: () => Promise<void>;
};

async function prepareAudioForWhisper(audio: DownloadedAudio): Promise<PreparedAudio> {
  const originalStats = await stat(audio.audioFile);
  if (originalStats.size <= OPENAI_AUDIO_MAX_BYTES) {
    return { filePath: audio.audioFile, cleanup: async () => {} };
  }

  if (!ffmpegAvailable) {
    throw new Error(
      `Audio is ${formatBytes(originalStats.size)} but exceeds Whisper's ${formatBytes(OPENAI_AUDIO_MAX_BYTES)} limit and FFmpeg is unavailable to compress it.`,
    );
  }

  const compressedPath = path.join(audio.tempDir, `whisper-${randomUUID()}.mp3`);
  await transcodeAudioForWhisper(audio.audioFile, compressedPath);
  const compressedStats = await stat(compressedPath);

  if (compressedStats.size > OPENAI_AUDIO_MAX_BYTES) {
    await rm(compressedPath, { force: true });
    throw new Error(
      `Audio remains ${formatBytes(compressedStats.size)} after compression, above Whisper's ${formatBytes(OPENAI_AUDIO_MAX_BYTES)} upload cap.`,
    );
  }

  return {
    filePath: compressedPath,
    cleanup: async () => {
      await rm(compressedPath, { force: true });
    },
  };
}

async function transcodeAudioForWhisper(inputPath: string, outputPath: string) {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate("64k")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("mp3")
      .on("error", (error) => reject(error))
      .on("end", () => resolve())
      .save(outputPath);
  });
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatter = value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatter} ${units[unitIndex]}`;
}

function resolveFfmpegBinary(staticPath: string | null | undefined): string | null {
  const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const candidates = new Set<string>();

  if (typeof staticPath === "string" && staticPath.length > 0) {
    candidates.add(staticPath);
    const normalized = normalizeRootPlaceholder(staticPath);
    if (normalized) {
      candidates.add(normalized);
    }
  }

  candidates.add(path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function normalizeRootPlaceholder(candidate: string): string | null {
  const match = candidate.match(/^[\\/]+ROOT([\\/].*)$/);
  if (!match) {
    return null;
  }
  return path.join(process.cwd(), match[1]);
}

function coalesceMimeType(primary: string | null, fallback: string | null): string | null {
  const normalizedPrimary = normalizeMimeType(primary);
  if (normalizedPrimary) {
    return normalizedPrimary;
  }
  return normalizeMimeType(fallback);
}

function normalizeMimeType(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const base = value.split(";")[0]?.trim().toLowerCase();
  if (!base || base === "application/octet-stream" || base === "binary/octet-stream") {
    return null;
  }
  return base;
}
