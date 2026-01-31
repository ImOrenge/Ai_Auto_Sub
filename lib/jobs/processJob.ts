import { readFile, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  downloadAudioFromUrl,
  callWhisper,
  translateSegments,
  generateSrt,
  generateBilingualSrt,
  uploadToStorage,
  uploadVideoToStorage,
  applySubtitlesToVideo,
  prepareTrimmedAudio,
  concatenateClips,
  prepareSequenceMedia,
} from "@/lib/jobs/operations";
import type {
  CaptionedVideoResult,
  DownloadedAudio,
  SubtitleResult,
  TranscriptionResult,
  TranslationResult,
  UploadResult,
} from "@/lib/jobs/operations";
import { requireJob, updateJob } from "@/lib/jobs/service";
import { BillingService } from "@/lib/billing/service";
import type { JobRecord, JobStep, JobStatus, SubtitleConfig, CaptionData, SubtitleCue, VideoCut } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";
import { parseSrt } from "@/lib/subtitle/srt";
import { getAssetById } from "@/lib/assets/repository";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { resolveCachedSourceUrl } from "@/lib/jobs/source";
import { buildSequenceCacheKey, buildTrimmedAudioCacheKey } from "@/lib/jobs/cache";
import { downloadMediaToFile } from "@/lib/media/downloadMedia";
import { env } from "@/lib/env";
import { getMediaCache, upsertMediaCache } from "@/lib/jobs/cacheRepository";
import { WebhookService } from "@/lib/webhooks/service";

type PipelineContext = {
  audio?: DownloadedAudio;
  transcription?: TranscriptionResult;
  translation?: TranslationResult;
  subtitles?: SubtitleResult;
  upload?: UploadResult;
  captionedVideo?: CaptionedVideoResult | null;
  subtitleConfig?: SubtitleConfig;
  /** For URL-based jobs: uploaded source video URL */
  sourceVideoUrl?: string | null;
};

/**
 * Maps time from concatenated "kept segments" back to original source video timeline
 */
function mapTrimmedToOriginal(trimmedTime: number, cuts: VideoCut[]): number {
  const sorted = [...cuts].sort((a, b) => a.start - b.start);
  let accumulated = 0;
  for (const cut of sorted) {
    const duration = cut.end - cut.start;
    if (trimmedTime <= accumulated + duration) {
       return cut.start + (trimmedTime - accumulated);
    }
    accumulated += duration;
  }
  // Should not happen if time is within total duration, but fallback to last cut end
  return sorted.length > 0 ? sorted[sorted.length - 1].end : trimmedTime;
}

/**
 * Parse SRT content to SubtitleCue format for editor
 * Uses actual generated SRT content instead of translation segments
 */
function srtToCaptionData(
  subtitles: SubtitleResult, 
  transcription: TranscriptionResult | undefined, 
  subtitleConfig: SubtitleConfig,
  cuts?: VideoCut[] | null
): CaptionData {
  // Parse the actual SRT content
  const cues = parseSrt(subtitles.content);
  
  // Re-map timestamps if trimming was used
  if (cuts && cuts.length > 0) {
    for (const cue of cues) {
      cue.startTime = mapTrimmedToOriginal(cue.startTime, cuts);
      cue.endTime = mapTrimmedToOriginal(cue.endTime, cuts);
    }
  }

  // Add original text and word timings from transcription if available
  if (transcription) {
    for (let i = 0; i < cues.length && i < transcription.segments.length; i++) {
      const segment = transcription.segments[i];
      if (!segment) continue;

      cues[i].originalText = segment.text;
      
      if (segment.words && segment.words.length > 0) {
        cues[i].words = segment.words.map(w => {
          let start = w.start;
          let end = w.end;
          
          if (cuts && cuts.length > 0) {
            start = mapTrimmedToOriginal(start, cuts);
            end = mapTrimmedToOriginal(end, cuts);
          }
          
          return { word: w.word, start, end };
        });
      }
    }
  }
  
  return {
    version: 1,
    cues,
    defaultStyle: subtitleConfig,
  };
}

type PipelineStep = {
  status: JobStatus;
  step: JobStep;
  progress: number;
  run: (job: JobRecord, ctx: PipelineContext) => Promise<PipelineContext>;
};

const PIPELINE_STEPS: PipelineStep[] = [
  // 1. Supabase Uploads - 업로드 확인 및 미디어 다운로드
  {
    status: "uploading",
    step: "upload",
    progress: 0.05,
    run: async (job, ctx) => {
      // 소스 타입에 따른 로깅
      console.info(`[pipeline] Processing job ${job.id} - sourceType: ${job.sourceType}, url: ${job.url}`);
      
      let targetUrl = job.url;

      let fetchedAsset = null;
      let audio: DownloadedAudio | undefined = undefined;
      let sourceVideoUrl: string | undefined = undefined;

      if (job.sequence) {
        // SEQUENCE MODE: Concatenate multiple assets via helper
        audio = await prepareSequenceMedia(job.sequence, job.id);
      } else if (job.assetId) {
        // SINGLE ASSET MODE (Legacy/Fallback)
        const supabase = getSupabaseServer();
        fetchedAsset = await getAssetById(supabase, job.assetId);
        if (!fetchedAsset) throw new Error(`Asset ${job.assetId} not found`);
        
        let targetUrlInside = job.url; 
        
        // Asset was uploaded to storage - create signed URL
        if (fetchedAsset.storageKey) {
          const { data, error } = await supabase.storage
              .from("uploads") // Use 'uploads' bucket where assets are stored
              .createSignedUrl(fetchedAsset.storageKey, 3600);
              
          if (error || !data) throw new Error(`Failed to sign asset URL: ${error?.message}`);
          targetUrlInside = data.signedUrl;
        } else if (fetchedAsset.sourceUrl) {
          // Asset was created from external URL - use sourceUrl directly
          targetUrlInside = fetchedAsset.sourceUrl;
        }

        // URL에서 미디어 다운로드 (Supabase Storage URL 또는 외부 URL)
        console.info(`[pipeline] Downloading media for job ${job.id} from: ${targetUrlInside.slice(0, 50)}...`);
        audio = await downloadAudioFromUrl(targetUrlInside);
        
        // For URL-based jobs (no assetId OR asset without storageKey), upload the source video to storage
        const isUrlBased = !job.assetId || (fetchedAsset && !fetchedAsset.storageKey);
        if (isUrlBased) {
          console.error(`[pipeline] Uploading source video for URL-based job ${job.id}...`);
          const videoUpload = await uploadVideoToStorage(audio);
          if (videoUpload) {
            sourceVideoUrl = videoUpload.publicUrl;
            await updateJob(job.id, { resultVideoUrl: sourceVideoUrl });
          }
        }
      }

      if (!audio) throw new Error("Failed to prepare source media (no asset or sequence)");
      
      return { ...ctx, audio, sourceVideoUrl };
    },
  },
  // 2. FFmpeg 전처리 - 자막 스타일 설정 및 오디오 준비
  {
    status: "preprocessing",
    step: "prepare",
    progress: 0.15,
    run: async (job, ctx) => {
      if (!ctx.audio) {
        throw new Error("Audio payload missing before preprocessing");
      }
      // 자막 스타일 설정을 컨텍스트에 저장 (DB에 저장된 설정 또는 기본값 사용)
      const subtitleConfig = job.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG;
      return { ...ctx, subtitleConfig };
    },
  },
];

const CAPTION_PIPELINE_STEPS: PipelineStep[] = [
  // 3. Whisper STT - 음성 인식
  {
    status: "stt",
    step: "transcribe",
    progress: 0.3,
    run: async (job, ctx) => {
      if (!ctx.audio) {
        throw new Error("Audio payload missing before transcription");
      }
      
      const cuts = job.cuts;
      if (cuts && cuts.length > 0) {
        // PRECISION MODE: Only transcribe the kept segments
        console.info(`[pipeline] Preparing trimmed audio for job ${job.id} with ${cuts.length} cuts`);
        const sourceFingerprint = job.assetId
          ? `asset:${job.assetId}`
          : job.sequence
            ? `sequence:${buildSequenceCacheKey(job.sequence).hash}`
            : `url:${job.url}`;
        const cacheKey = buildTrimmedAudioCacheKey(sourceFingerprint, cuts);
        const trimmedName = path.basename(cacheKey.storageKey);
        const trimmedPath = path.join(ctx.audio.tempDir, trimmedName);
        const supabase = getSupabaseServer();
        let usedCache = false;

        let cachedTempDir: string | null = null;
        try {
          let cachedEntry = null;
          try {
            cachedEntry = await getMediaCache("trimmed_audio", cacheKey.hash);
          } catch (error) {
            console.warn(`[pipeline] Cache lookup failed for job ${job.id}`, error);
          }

          const cachedStorageKey = cachedEntry?.storageKey ?? cacheKey.storageKey;
          const { data: cachedUrl, error: cachedUrlError } = await supabase.storage
            .from(env.resultsBucket)
            .createSignedUrl(cachedStorageKey, 3600);
          if (!cachedUrlError && cachedUrl?.signedUrl) {
            const cached = await downloadMediaToFile(cachedUrl.signedUrl, {
              filenameHint: trimmedName,
              kind: "direct",
              maxBytes: Number.MAX_SAFE_INTEGER,
              sourceUrl: cachedUrl.signedUrl,
            });
            cachedTempDir = path.dirname(cached.filePath);
            await rename(cached.filePath, trimmedPath);
            await rm(cachedTempDir, { recursive: true, force: true });
            usedCache = true;
            try {
              await upsertMediaCache({
                kind: "trimmed_audio",
                hash: cacheKey.hash,
                storageKey: cachedStorageKey,
                mimeType: cached.mimeType ?? "audio/mpeg",
                durationMs: null,
                sizeBytes: cached.sizeBytes,
              });
            } catch (error) {
              console.warn(`[pipeline] Failed to update cache entry for job ${job.id}`, error);
            }
          }
        } catch (error) {
          if (cachedTempDir) {
            await rm(cachedTempDir, { recursive: true, force: true });
          }
          console.warn(`[pipeline] Cached trim lookup failed for job ${job.id}`, error);
        }

        if (!usedCache) {
          await prepareTrimmedAudio(ctx.audio.audioFile, trimmedPath, cuts);
          try {
            const fileBuffer = await readFile(trimmedPath);
            await supabase.storage.from(env.resultsBucket).upload(cacheKey.storageKey, fileBuffer, {
              contentType: "audio/mpeg",
              cacheControl: "3600",
              upsert: true,
            });
            await upsertMediaCache({
              kind: "trimmed_audio",
              hash: cacheKey.hash,
              storageKey: cacheKey.storageKey,
              mimeType: "audio/mpeg",
              durationMs: null,
              sizeBytes: fileBuffer.byteLength,
            });
          } catch (error) {
            console.warn(`[pipeline] Failed to cache trimmed audio for job ${job.id}`, error);
          }
        }
        
        // Temporarily swap audio file for Whisper
        const originalFile = ctx.audio.audioFile;
        ctx.audio.audioFile = trimmedPath;
        try {
          const transcription = await callWhisper(ctx.audio);
          return { ...ctx, transcription };
        } finally {
          ctx.audio.audioFile = originalFile;
          // trimmedPath will be cleaned up in finally block of processJobCaptions via cleanupPipelineArtifacts
        }
      } else {
        // STANDARD MODE: Transcribe whole video
        const transcription = await callWhisper(ctx.audio);
        return { ...ctx, transcription };
      }
    },
  },
  // 4. 영한 번역
  {
    status: "translating",
    step: "translate",
    progress: 0.7,
    run: async (_job, ctx) => {
      if (!ctx.transcription) {
        throw new Error("Transcription missing before translation");
      }
      const translation = await translateSegments(ctx.transcription, "ko");
      return { ...ctx, translation };
    },
  },
  // 5. SRT 자막 생성
  {
    status: "subtitle",
    step: "subtitle",
    progress: 0.9,
    run: async (_job, ctx) => {
      if (!ctx.translation) {
        throw new Error("Translation missing before subtitle generation");
      }
      const subtitles = await generateSrt(ctx.translation);
      
      // 이중 자막 (원어+번역) 처리
      if (ctx.subtitleConfig?.showBilingual && ctx.transcription) {
        const bilingualSubtitles = await generateBilingualSrt(
          ctx.transcription,
          ctx.translation
        );
        return { ...ctx, subtitles: bilingualSubtitles };
      }
      
      return { ...ctx, subtitles };
    },
  },
];

export async function processJob(jobId: string) {
  const job = await requireJob(jobId);
  let context: PipelineContext = {};
  let currentStep: JobStep | string | null = null;
  let lastProgress = 0;

  try {
    for (const descriptor of PIPELINE_STEPS) {
      currentStep = descriptor.step;
      lastProgress = descriptor.progress;
      await updateJob(jobId, {
        status: descriptor.status,
        step: descriptor.step,
        progress: descriptor.progress,
        errorMessage: null,
      });

      context = await descriptor.run(job, context);
    }

    // Transition to awaiting_edit - 사용자가 에디터에서 편집
    console.info(`[pipeline] Media prepared for job ${jobId}. resultVideoUrl: ${context.sourceVideoUrl ?? 'N/A'}`);
    
    await updateJob(jobId, {
      status: "awaiting_edit",
      step: "prepare",
      progress: 1,
      // For URL-based jobs, store the uploaded source video URL for editor playback
      resultVideoUrl: context.sourceVideoUrl ?? undefined,
      errorMessage: null,
    });

    // Trigger Webhook: job.started (actually media prepared)
    void WebhookService.trigger(job.userId || "user_001", "job.started", { jobId, status: "awaiting_edit" }).catch();

    console.info(`[pipeline] Job ${jobId} initial preparation complete. Awaiting user edit/cuts.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown job error";
    await updateJob(jobId, {
      status: "error",
      step: currentStep,
      progress: lastProgress,
      errorMessage: message,
    });
    
    // Trigger Webhook: job.failed
    void WebhookService.trigger(job.userId || "user_001", "job.failed", { jobId, error: message }).catch();

    throw error;
  } finally {
    await cleanupPipelineArtifacts(context);
  }
}

export async function processJobCaptions(jobId: string) {
  const job = await requireJob(jobId);
  let context: PipelineContext = {};
  let currentStep: JobStep | string | null = null;
  let lastProgress = 0;

  try {
    // Stage 1: Must re-download or get media for processing
    // Re-use logic from the first Step of PIPELINE_STEPS to get audio
    const prepareStep = PIPELINE_STEPS[0];
    const cachedSourceUrl = resolveCachedSourceUrl(job.url, job.resultVideoUrl);
    const jobForPrepare = cachedSourceUrl === job.url ? job : { ...job, url: cachedSourceUrl };
    context = await prepareStep.run(jobForPrepare, context);
    
    // Stage 2: Subtitle Config
    context.subtitleConfig = job.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG;

    // Stage 3: Caption Pipeline
    for (const descriptor of CAPTION_PIPELINE_STEPS) {
      currentStep = descriptor.step;
      lastProgress = descriptor.progress;
      await updateJob(jobId, {
        status: descriptor.status,
        step: descriptor.step,
        progress: descriptor.progress,
        errorMessage: null,
      });

      context = await descriptor.run(job, context);
    }

    if (!context.translation || !context.subtitles) {
      throw new Error("Translation or subtitles missing after pipeline execution");
    }

    // Upload SRT to storage
    const uploadResult = await uploadToStorage(context.subtitles);

    // Parse SRT content to CaptionData format for editor
    // If we have a sequence, we don't apply legacy 'cuts' mapping because 
    // the sequence timeline IS our current target timeline.
    const captionData = srtToCaptionData(
      context.subtitles,
      context.transcription,
      context.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG,
      job.sequence ? null : job.cuts
    );

    // Record Billing Usage
    if (context.audio?.durationMs) {
      try {
        await BillingService.recordJobUsage(
          jobId, 
          job.userId || "user_001", 
          { 
            durationSec: context.audio.durationMs / 1000, 
            translationCount: 1 
          }
        );
      } catch (e) {
        console.error(`[billing] Failed to record usage for job ${jobId}`, e);
      }
    }

    // Return to awaiting_edit
    await updateJob(jobId, {
      status: "awaiting_edit",
      step: "subtitle",
      progress: 1,
      resultSrtUrl: uploadResult.publicUrl,
      captionSource: captionData,
      errorMessage: null,
    });

    // Trigger Webhook: job.completed (Captioning finished)
    void WebhookService.trigger(job.userId || "user_001", "job.completed", { 
      jobId, 
      status: "awaiting_edit",
      resultSrtUrl: uploadResult.publicUrl 
    }).catch();

    console.info(`[pipeline] Job ${jobId} captioning complete.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown caption error";
    await updateJob(jobId, {
      status: "error",
      step: currentStep,
      progress: lastProgress,
      errorMessage: message,
    });

    // Trigger Webhook: job.failed
    void WebhookService.trigger(job.userId || "user_001", "job.failed", { jobId, error: message }).catch();

    throw error;
  } finally {
    await cleanupPipelineArtifacts(context);
  }
}

async function cleanupPipelineArtifacts(ctx: PipelineContext) {
  const dir = ctx.audio?.tempDir;
  if (!dir) {
    return;
  }

  try {
    await rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`[cleanup] Failed to remove temp directory ${dir}`, error);
  }
}
