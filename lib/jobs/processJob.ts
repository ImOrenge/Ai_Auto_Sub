import { rm } from "node:fs/promises";
import {
  downloadAudioFromUrl,
  callWhisper,
  translateSegments,
  generateSrt,
  generateBilingualSrt,
  uploadToStorage,
  applySubtitlesToVideo,
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
import type { JobRecord, JobStep, JobStatus, SubtitleConfig, CaptionData, SubtitleCue } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";
import { parseSrt } from "@/lib/subtitle/srt";
import { getAssetById } from "@/lib/assets/repository";
import { getSupabaseServer } from "@/lib/supabaseServer";

type PipelineContext = {
  audio?: DownloadedAudio;
  transcription?: TranscriptionResult;
  translation?: TranslationResult;
  subtitles?: SubtitleResult;
  upload?: UploadResult;
  captionedVideo?: CaptionedVideoResult | null;
  subtitleConfig?: SubtitleConfig;
};

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

      // Handle Asset-based Job
      if (job.assetId) {
        const supabase = getSupabaseServer();
        const asset = await getAssetById(supabase, job.assetId);
        if (!asset) throw new Error(`Asset ${job.assetId} not found`);
        
        const { data, error } = await supabase.storage
            .from("uploads") // Use 'uploads' bucket where assets are stored
            .createSignedUrl(asset.storageKey, 3600);
            
        if (error || !data) throw new Error(`Failed to sign asset URL: ${error?.message}`);
        targetUrl = data.signedUrl;
      }

      // URL에서 미디어 다운로드 (Supabase Storage URL 또는 외부 URL)
      const audio = await downloadAudioFromUrl(targetUrl);
      return { ...ctx, audio };
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
  // 3. Whisper STT - 음성 인식
  {
    status: "stt",
    step: "transcribe",
    progress: 0.4,
    run: async (_job, ctx) => {
      if (!ctx.audio) {
        throw new Error("Audio payload missing before transcription");
      }
      const transcription = await callWhisper(ctx.audio);
      return { ...ctx, transcription };
    },
  },
  // 4. 영한 번역
  {
    status: "translating",
    step: "translate",
    progress: 0.6,
    run: async (_job, ctx) => {
      if (!ctx.transcription) {
        throw new Error("Transcription missing before translation");
      }
      const translation = await translateSegments(ctx.transcription, "ko");
      return { ...ctx, translation };
    },
  },
  // 5. SRT 자막 생성 (파이프라인 종료 지점 - 에디터로 전환)
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
  // NOTE: 6. 자막 합성 단계는 제거됨 - 사용자가 에디터에서 편집 후 Export 시 수행
];

/**
 * Parse SRT content to SubtitleCue format for editor
 * Uses actual generated SRT content instead of translation segments
 */
function srtToCaptionData(subtitles: SubtitleResult, transcription: TranscriptionResult | undefined, subtitleConfig: SubtitleConfig): CaptionData {
  // Parse the actual SRT content
  const cues = parseSrt(subtitles.content);
  
  // Add original text from transcription if available (for bilingual display)
  if (transcription) {
    for (let i = 0; i < cues.length && i < transcription.segments.length; i++) {
      cues[i].originalText = transcription.segments[i]?.text;
    }
  }
  
  return {
    version: 1,
    cues,
    defaultStyle: subtitleConfig,
  };
}

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

    if (!context.translation || !context.subtitles) {
      throw new Error("Translation or subtitles missing after pipeline execution");
    }

    // Upload SRT to storage
    const uploadResult = await uploadToStorage(context.subtitles);

    // Parse SRT content to CaptionData format for editor
    const captionData = srtToCaptionData(
      context.subtitles,
      context.transcription,
      context.subtitleConfig ?? DEFAULT_SUBTITLE_CONFIG
    );

    // Record Billing Usage (Overage Logic)
    if (context.audio?.durationMs) {
      try {
        await BillingService.recordJobUsage(
          jobId, 
          job.userId || "user_001", 
          { 
            durationSec: context.audio.durationMs / 1000, 
            translationCount: context.translation ? 1 : 0 
          }
        );
      } catch (e) {
        console.error(`[billing] Failed to record usage for job ${jobId}`, e);
        // Do not fail the job? Ideally we should log this critical error.
      }
    }

    // Transition to awaiting_edit - 사용자가 에디터에서 편집
    await updateJob(jobId, {
      status: "awaiting_edit",
      step: "subtitle",
      progress: 1,
      resultSrtUrl: uploadResult.publicUrl,
      captionSource: captionData,
      errorMessage: null,
    });

    console.info(`[pipeline] Job ${jobId} completed STT/SRT. Awaiting user edit.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown job error";
    await updateJob(jobId, {
      status: "error",
      step: currentStep,
      progress: lastProgress,
      errorMessage: message,
    });
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
