import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import fs from "node:fs/promises"; // For copyFile, mkdir, unlink via fs.method
import { spawn } from "node:child_process";
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
import { getAssetById } from "@/lib/assets/repository";
import { buildSequenceCacheKey } from "@/lib/jobs/cache";
import { getMediaCache, upsertMediaCache } from "@/lib/jobs/cacheRepository";
import { 
  SubtitleCue, 
  SubtitleConfig, 
  VideoCut, 
  SequenceClip, 
  SequenceData,
  DEFAULT_SUBTITLE_CONFIG,
} from "@/lib/jobs/types";
import { renderSubtitleVideo } from "@/lib/render/node-renderer";

type WhisperVerboseSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: {
    word: string;
    start: number;
    end: number;
  }[];
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
  words?: {
    word: string;
    start: number;
    end: number;
  }[];
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
  return new Promise((resolve) => {
    // Prefer ffprobe if we can just call it, but we have fluent-ffmpeg
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.warn(`[ffmpeg] Probe error: ${err.message}`);
        // Fallback to basic probe if ffprobe fails
        ffmpeg(filePath)
          .on("codecData", (data) => {
            if (data.duration) {
              const parts = data.duration.split(':');
              const seconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
              resolve(Math.round(seconds * 1000));
            } else {
              resolve(0);
            }
          })
          .on("error", () => resolve(0))
          .format("null")
          .output("-")
          .run();
        return;
      }
      
      const durationSeconds = metadata.format.duration;
      if (durationSeconds) {
        resolve(Math.round(durationSeconds * 1000));
      } else {
        resolve(0);
      }
    });
  });
}


export async function callWhisper(audio: DownloadedAudio): Promise<TranscriptionResult> {
  const prepared = await prepareAudioForWhisper(audio);

  try {
    const preparedStats = await stat(prepared.filePath);
    console.error(`[stt] Calling Whisper API for ${prepared.filePath} (${formatBytes(preparedStats.size)})...`);
    
    if (preparedStats.size === 0) {
        throw new Error(`[stt] Transcoded audio is empty (0 bytes). Source: ${audio.audioFile}`);
    }

    const response = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(createReadStream(prepared.filePath), path.basename(prepared.filePath), {
        type: 'audio/mpeg',
      }),
      model: env.whisperModel,
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"], // Request BOTH word and segment timestamps
      temperature: 0,
    }, {
      timeout: 120000, // 2 minute timeout for Whisper
    });

    console.error(`[stt] Whisper API response received successfully.`);

    const payload = response as unknown as WhisperVerboseResponse;
    const finalSegments: TranscriptSegment[] = [];

    if (payload.segments && payload.segments.length > 0) {
      // STANDARD CASE: Using segments directly from API
      payload.segments.forEach((segment) => {
        finalSegments.push({
          id: segment.id,
          start: segment.start,
          end: segment.end,
          text: segment.text.trim(),
          words: segment.words?.map(w => ({
            word: w.word,
            start: w.start,
            end: w.end
          }))
        });
      });
    } else if ((payload as any).words && (payload as any).words.length > 0) {
      // FALLBACK CASE: Synthesize segments from words if API didn't return group segments
      const words = (payload as any).words;
      console.warn(`[stt] No segments in payload, but found ${words.length} words. Synthesizing segments...`);
      
      const MAX_WORDS_PER_SEGMENT = 10;
      for (let i = 0; i < words.length; i += MAX_WORDS_PER_SEGMENT) {
        const chunk = words.slice(i, i + MAX_WORDS_PER_SEGMENT);
        const text = chunk.map((w: any) => w.word).join(" ").trim();
        finalSegments.push({
          id: Math.floor(i / MAX_WORDS_PER_SEGMENT),
          start: chunk[0].start,
          end: chunk[chunk.length - 1].end,
          text,
          words: chunk.map((w: any) => ({
            word: w.word,
            start: w.start,
            end: w.end
          }))
        });
      }
    } else {
      console.error(`[stt] Whisper API payload:`, JSON.stringify(payload, null, 2));
      throw new Error(`Whisper API did not return any segments or words. Language: ${payload?.language || 'unknown'}`);
    }

    return {
      language: payload.language ?? "auto",
      segments: finalSegments,
    };
  } finally {
    await prepared.cleanup();
  }
}

export async function translateSegments(
  transcription: TranscriptionResult,
  targetLocale: string,
): Promise<TranslationResult> {
  const CHUNK_SIZE = 25; // Translate 25 segments at a time
  const segments = transcription.segments;
  const translatedSegments: TranscriptSegment[] = [];

  console.error(`[translate] Starting translation for ${segments.length} segments in chunks of ${CHUNK_SIZE}`);

  for (let i = 0; i < segments.length; i += CHUNK_SIZE) {
    const chunk = segments.slice(i, i + CHUNK_SIZE);
    const chunkId = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(segments.length / CHUNK_SIZE);

    console.error(`[translate] Translating chunk ${chunkId}/${totalChunks} (${chunk.length} segments)...`);

    try {
      const completion = await openai.chat.completions.create({
        model: env.translationModel,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional subtitling assistant that translates text into ${targetLocale}. Return JSON with a "segments" array containing the same number of items.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetLocale,
              segments: chunk,
            }),
          },
        ],
      }, {
        timeout: 60000, // 60 second timeout per chunk
      });

      const message = completion.choices[0]?.message?.content;
      if (!message) {
        throw new Error(`Translation API did not produce a response for chunk ${chunkId}.`);
      }

      const parsed: TranslationPayload = JSON.parse(message);
      if (!parsed.segments || parsed.segments.length === 0) {
        throw new Error(`Translation response was empty for chunk ${chunkId}.`);
      }

      // Map and add to final results
      const mappedChunk = parsed.segments.map((segment, idx) => ({
        id: segment.id ?? (i + idx),
        start: segment.start,
        end: segment.end,
        text: segment.text.trim(),
      }));

      translatedSegments.push(...mappedChunk);
      console.error(`[translate] Chunk ${chunkId} successfully translated.`);
    } catch (error: any) {
      console.error(`[translate] ERROR in chunk ${chunkId}:`, error);
      // Fallback: If translation fails for a chunk, use the original English text
      // This prevents the whole pipeline from failing
      console.warn(`[translate] Using original text fallback for chunk ${chunkId}`);
      translatedSegments.push(...chunk);
    }
  }

  console.error(`[translate] Translation complete. Total segments: ${translatedSegments.length}`);
  return {
    targetLocale,
    segments: translatedSegments,
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

/**
 * Upload downloaded video to Storage for URL-based jobs
 * Returns signed URL for playback in editor
 */
export async function uploadVideoToStorage(media: DownloadedAudio): Promise<UploadResult | null> {
  // Only upload video files, not audio-only
  const videoLike = isVideoLike(media.mimeType, media.filename, media.audioFile);
  if (!videoLike) {
    console.error(`[storage] Skipping video upload - not a video file. MIME: ${media.mimeType}, Filename: ${media.filename}, Path: ${media.audioFile}`);
    return null;
  }

  try {
    const supabase = getSupabaseServer();
    const extension = (media.filename && path.extname(media.filename)) || inferVideoExtension(media.mimeType) || ".mp4";
    const objectPath = `videos/source-${randomUUID()}${extension}`;
    const contentType = media.mimeType ?? "video/mp4";
    
    console.info(`[storage] Uploading source video: path=${objectPath}, contentType=${contentType}, size=${media.sizeBytes}`);
    
    const fileBuffer = await readFile(media.audioFile);
    const { error } = await supabase.storage
      .from(env.resultsBucket)
      .upload(objectPath, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.warn(`[storage] Failed to upload source video: ${error.message}`);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(env.resultsBucket).getPublicUrl(objectPath);

    console.error(`[storage] Successfully uploaded source video. Object: ${objectPath}, URL: ${publicUrl}`);
    return {
      storagePath: objectPath,
      publicUrl,
    };
  } catch (e) {
    console.error(`[storage] CRITICAL ERROR in uploadVideoToStorage:`, e);
    return null;
  }
}

export async function applySubtitlesToVideo(
  media: DownloadedAudio,
  subtitles: SubtitleResult,
  subtitleConfig?: SubtitleConfig,
  cuts?: VideoCut[] | null,
  resolution?: string,
  cues?: SubtitleCue[], // Added for Remotion
  jobId?: string, // Added for UI progress updates
  renderer?: 'canvas', // Deprecated: 'remotion', 'ffmpeg'
  aspectRatio?: 'original' | '9:16' | '1:1' | '16:9' // Target aspect ratio from editor
): Promise<CaptionedVideoResult> {
  console.info(`[caption] Checking if media is video-like:`);
  console.info(`[caption]   mimeType: ${media.mimeType}`);
  console.info(`[caption]   filename: ${media.filename}`);
  console.info(`[caption]   audioFile: ${media.audioFile}`);
  
  // Auto-select optimal resolution for short-form content
  if (!resolution && aspectRatio === '9:16' && media.durationMs && media.durationMs < 120000) {
    resolution = '1080p'; // Standard for Instagram Reels/TikTok
    console.info(`[caption] Auto-selected 1080p for short-form vertical content (${Math.round(media.durationMs/1000)}s)`);
  }
  
  const videoLike = isVideoLike(media.mimeType, media.filename, media.audioFile);
  console.info(`[caption]   isVideoLike: ${videoLike}`);
  console.info(`[caption]   cues available: ${!!cues} (count: ${cues?.length ?? 0})`);
  console.info(`[caption]   config available: ${!!subtitleConfig}`);
  console.info(`[caption]   aspectRatio: ${aspectRatio || 'original'}`);
  console.info(`[caption]   resolution: ${resolution || 'original'}`);
  
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
    // Use Node.js Canvas Renderer (New Standard)
    // Render if we have cues OR if we need to change aspect ratio/resolution
    const shouldRender = (cues && cues.length > 0) || (aspectRatio && aspectRatio !== 'original') || !!resolution;

    if (shouldRender) {
      await renderSubtitleVideo(
        media.audioFile.replaceAll("\\", "/"),
        outputPath.replaceAll("\\", "/"),
        cues || [], // Pass empty array if no cues
        subtitleConfig || { ...DEFAULT_SUBTITLE_CONFIG, fontName: 'Arial' },
        { jobId, resolution, aspectRatio }
      );
    } else {
      console.warn(`[caption] No cues and no format changes requested. Copying original video.`);
      await fs.copyFile(media.audioFile, outputPath);
    }

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
  const ms = Math.round(totalSeconds * 1000) % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${ms.toString().padStart(3, "0")}`;
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
  const normalizedMime = mimeType?.toLowerCase() || "";
  if (normalizedMime.startsWith("video/") || normalizedMime.startsWith("audio/")) {
    console.debug(`[media] isVideoLike: true (MIME ${normalizedMime})`);
    return true;
  }
  const candidates = [filename, filePath].filter(Boolean) as string[];
  const hasVideoExt = candidates.some((value: string) => {
    const lower = value.toLowerCase();
    return VIDEO_EXTENSION_MATCHERS.some((ext: string) => lower.endsWith(ext));
  });
  
  console.debug(`[media] isVideoLike: ${hasVideoExt} (Extension check)`);
  return hasVideoExt;
}

// --- Standard FFmpeg Utilities ---



// --- Standard FFmpeg Utilities ---


type PreparedAudio = {
  filePath: string;
  cleanup: () => Promise<void>;
};

async function prepareAudioForWhisper(audio: DownloadedAudio): Promise<PreparedAudio> {
  const originalStats = await stat(audio.audioFile);
  // Force transcoding to MP3 to ensure consistent audio format and fix potential container issues
  // if (originalStats.size <= OPENAI_AUDIO_MAX_BYTES) {
  //   return { filePath: audio.audioFile, cleanup: async () => {} };
  // }

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
  
  if (compressedStats.size < 1024) {
    console.warn(`[stt] Warning: Transcoded audio is very small (${formatBytes(compressedStats.size)}). It might be silent or truncated.`);
  }

  return {
    filePath: compressedPath,
    cleanup: async () => {
      await rm(compressedPath, { force: true });
    },
  };
}

async function transcodeAudioForWhisper(inputPath: string, outputPath: string) {
  console.error(`[ffmpeg] Transcoding audio for Whisper: ${inputPath} -> ${outputPath}`);
  await new Promise<void>((resolve, reject) => {
    // Normalize path for Windows FFmpeg
    const input = path.normalize(inputPath).replaceAll("\\", "/");
    const output = path.normalize(outputPath).replaceAll("\\", "/");
    
    ffmpeg(input)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate("64k")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("mp3")
      .on("end", () => {
        console.error(`[ffmpeg] Transcoding complete.`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`[ffmpeg] Transcoding failed: ${err.message}`);
        reject(err);
      })
      .save(output);
  });
}

/**
 * Creates a joined audio file from specific cuts for Whisper STT
 */
export async function prepareTrimmedAudio(
  inputPath: string,
  outputPath: string,
  cuts: VideoCut[]
): Promise<void> {
  const sortedCuts = [...cuts].sort((a, b) => a.start - b.start);
  const filterParts: string[] = [];
  const concatInputs: string[] = [];

  sortedCuts.forEach((cut, i) => {
    const aLabel = `a${i}`;
    filterParts.push(`[0:a]atrim=start=${cut.start}:end=${cut.end},asetpts=PTS-STARTPTS[${aLabel}]`);
    concatInputs.push(`[${aLabel}]`);
  });

  filterParts.push(`${concatInputs.join("")}concat=n=${sortedCuts.length}:v=0:a=1[a_out]`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath.replaceAll("\\", "/"))
      .complexFilter(filterParts, ["a_out"])
      .map("a_out")
      .audioCodec("libmp3lame")
      .audioBitrate("64k")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("mp3")
      .on("end", () => {
        console.error(`[ffmpeg] Trimmed audio preparation complete.`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`[ffmpeg] Trimmed audio preparation failed: ${err.message}`);
        reject(err);
      })
      .save(outputPath.replaceAll("\\", "/"));
  });
}

/**
 * Concatenates multiple clips into a single file
 */
export async function concatenateClips(
  clips: { filePath: string; start: number; end: number }[],
  outputPath: string
): Promise<void> {
  if (clips.length === 0) throw new Error("No clips to concatenate");
  if (!ffmpegAvailable) throw new Error("FFmpeg not available");

  if (clips.length === 1) {
    const clip = clips[0];
    await new Promise<void>((resolve, reject) => {
      ffmpeg(clip.filePath.replaceAll("\\", "/"))
        .setStartTime(clip.start)
        .setDuration(clip.end - clip.start)
        .on("error", (e) => reject(e))
        .on("end", () => resolve())
        .save(outputPath.replaceAll("\\", "/"));
    });
    return;
  }

  const filterParts: string[] = [];
  const concatInputs: string[] = [];
  const command = ffmpeg();

  clips.forEach((clip, i) => {
    command.input(clip.filePath.replaceAll("\\", "/"));
    const vLabel = `v${i}`;
    const aLabel = `a${i}`;
    filterParts.push(`[${i}:v]trim=start=${clip.start}:end=${clip.end},setpts=PTS-STARTPTS[${vLabel}]`);
    filterParts.push(`[${i}:a]atrim=start=${clip.start}:end=${clip.end},asetpts=PTS-STARTPTS[${aLabel}]`);
    concatInputs.push(`[${vLabel}][${aLabel}]`);
  });

  filterParts.push(`${concatInputs.join("")}concat=n=${clips.length}:v=1:a=1[v_out][a_out]`);

  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filterParts, ["v_out", "a_out"])
      .map("v_out")
      .map("a_out")
      .outputOptions([
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-sn",
        "-y"
      ])
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputPath.replaceAll("\\", "/"));
  });
}

/**
 * Prepares a single master video from a sequence (multi-clip timeline).
 * Can accept either a flat array of clips or a SequenceData (version 2).
 */
export async function prepareSequenceMedia(
  sequence: SequenceClip[] | SequenceData,
  jobId: string
): Promise<DownloadedAudio> {
  let clipsToProcess: SequenceClip[] = [];

  if (Array.isArray(sequence)) {
    clipsToProcess = sequence;
  } else if (typeof sequence === 'object' && (sequence as any).version === 2) {
    const seqData = sequence as SequenceData;
    const activeLayer = seqData.layers.find((l) => l.id === seqData.activeLayerId) || seqData.layers[0];
    clipsToProcess = activeLayer?.clips || [];
  }

  if (clipsToProcess.length === 0) {
    throw new Error("No clips found in sequence to process");
  }

  console.info(`[sequence] Preparing sequence of ${clipsToProcess.length} clips for job ${jobId}`);
  const supabase = getSupabaseServer();
  const cacheKey = buildSequenceCacheKey(sequence);
  const cacheFilename = path.basename(cacheKey.storageKey);
  const estimatedDurationMs =
    clipsToProcess.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0) * 1000;

  try {
    let cachedEntry = null;
    try {
      cachedEntry = await getMediaCache("sequence_video", cacheKey.hash);
    } catch (error) {
      console.warn(`[sequence] Cache lookup failed for job ${jobId}`, error);
    }

    const cachedStorageKey = cachedEntry?.storageKey ?? cacheKey.storageKey;
    const { data: cachedUrl, error: cachedUrlError } = await supabase.storage
      .from(env.resultsBucket)
      .createSignedUrl(cachedStorageKey, 3600);
    if (!cachedUrlError && cachedUrl?.signedUrl) {
      const cached = await downloadMediaToFile(cachedUrl.signedUrl, {
        filenameHint: cacheFilename,
        kind: "direct",
        maxBytes: Number.MAX_SAFE_INTEGER,
        sourceUrl: cachedUrl.signedUrl,
      });

      console.info(`[sequence] Using cached sequence media for job ${jobId}`);
      try {
        await upsertMediaCache({
          kind: "sequence_video",
          hash: cacheKey.hash,
          storageKey: cachedStorageKey,
          mimeType: cached.mimeType ?? "video/mp4",
          durationMs: Math.round(estimatedDurationMs),
          sizeBytes: cached.sizeBytes,
        });
      } catch (error) {
        console.warn(`[sequence] Failed to update cache entry for job ${jobId}`, error);
      }

      return {
        audioFile: cached.filePath,
        durationMs: estimatedDurationMs,
        sourceUrl: cachedUrl.signedUrl,
        sizeBytes: cached.sizeBytes,
        mimeType: cached.mimeType ?? "video/mp4",
        filename: cacheFilename,
        tempDir: path.dirname(cached.filePath),
      };
    }
  } catch (error) {
    console.warn(`[sequence] Cached sequence lookup failed for job ${jobId}`, error);
  }

  const clipsToJoin: { filePath: string; start: number; end: number }[] = [];
  const workDir = await mkdtemp(path.join(tmpdir(), "ai-subauto-seq-"));

  try {
    // 1. Download each asset
    for (const clip of clipsToProcess) {
      const asset = await getAssetById(supabase, clip.assetId);
      if (!asset) {
        console.warn(`[sequence] Asset ${clip.assetId} not found, skipping.`);
        continue;
      }

      let targetUrl = asset.sourceUrl || "";
      if (asset.storageKey) {
        const { data } = await supabase.storage
          .from("uploads")
          .createSignedUrl(asset.storageKey, 3600);
        if (data) targetUrl = data.signedUrl;
      }

      if (!targetUrl) {
        console.warn(`[sequence] No URL for asset ${asset.id}, skipping clip ${clip.id}`);
        continue;
      }

      const downloaded = await downloadAudioFromUrl(targetUrl);
      clipsToJoin.push({
        filePath: downloaded.audioFile,
        start: clip.startTime,
        end: clip.endTime,
      });
    }

    if (clipsToJoin.length === 0) {
      throw new Error("Failed to download any clips from sequence");
    }

    // 2. Concatenate
    const outputPath = path.join(workDir, `sequence-${randomUUID()}.mp4`);
    await concatenateClips(clipsToJoin, outputPath);

    try {
      const fileBuffer = await readFile(outputPath);
      await supabase.storage.from(env.resultsBucket).upload(cacheKey.storageKey, fileBuffer, {
        contentType: "video/mp4",
        cacheControl: "3600",
        upsert: true,
      });
      await upsertMediaCache({
        kind: "sequence_video",
        hash: cacheKey.hash,
        storageKey: cacheKey.storageKey,
        mimeType: "video/mp4",
        durationMs: Math.round(estimatedDurationMs),
        sizeBytes: fileBuffer.byteLength,
      });
    } catch (error) {
      console.warn(`[sequence] Failed to store cached sequence for job ${jobId}`, error);
    }

    // 3. Create a DownloadedAudio object for the concatenated result
    return {
      audioFile: outputPath,
      durationMs: estimatedDurationMs,
      sourceUrl: "sequence",
      sizeBytes: (await stat(outputPath)).size,
      mimeType: "video/mp4", // Combined result is always mp4 for now
      filename: `sequence-${jobId.slice(0, 8)}.mp4`,
      tempDir: workDir,
    };
  } catch (err) {
    // Clean up workDir if something failed during the process
    await rm(workDir, { recursive: true, force: true });
    throw err;
  }
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
