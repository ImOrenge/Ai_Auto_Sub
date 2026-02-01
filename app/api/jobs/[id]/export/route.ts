import { NextRequest, NextResponse } from "next/server";
import { rm } from "node:fs/promises";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { generateSrt } from "@/lib/subtitle/srt";
import { generateAss } from "@/lib/subtitle/ass";
import type { CaptionData, SubtitleConfig, VideoCut } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";
import { resolveCachedSourceUrl } from "@/lib/jobs/source";
import {
  downloadAudioFromUrl,
  applySubtitlesToVideo,
  uploadToStorage,
  prepareSequenceMedia,
} from "@/lib/jobs/operations";
import type { SubtitleResult, DownloadedAudio } from "@/lib/jobs/operations";
import { BillingService } from "@/lib/billing/service";
import { env } from "@/lib/env";
import { MOCK_USER_ID } from "@/lib/utils";
import { WebhookService } from "@/lib/webhooks/service";

type RouteParams = { params: Promise<{ id: string }> };

type ExportRequest = {
  format: "srt" | "ass" | "mp4";
  resolution?: "sd" | "hd" | "fhd" | "uhd" | "720p" | "1080p" | "4k";
  renderer?: "remotion" | "ffmpeg" | "canvas";
};

/**
 * POST /api/jobs/[id]/export
 * Export subtitles in the requested format (SRT, ASS, or MP4 with burned-in subtitles)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json().catch(() => null);
    let { format, resolution, renderer } = (body as ExportRequest) || {};
    
    // Default to mp4 if format is missing
    if (!format) {
      format = "mp4";
    }

    console.info(`[export] Requesting export for job ${id}, format: ${format}, resolution: ${resolution || 'original'}`);

    if (!["srt", "ass", "mp4"].includes(format)) {
      console.warn(`[export] Invalid format requested: ${format}`);
      return NextResponse.json(
        { error: "Invalid format. Must be 'srt', 'ass', or 'mp4'" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    console.info(`[export] Fetching job ${id}...`);

    // Fetch job data
    const { data: job, error } = await supabase
      .from("jobs")
      .select("user_id, url, result_video_url, caption_source, caption_edit, subtitle_config, cuts, sequence")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // 1. Plan-based Limit Check (Resolution)
    if (format === "mp4" && resolution) {
      const entitlements = await BillingService.getEntitlements(job.user_id || MOCK_USER_ID);
      if (!BillingService.isResolutionAccessible(entitlements.exportResolutionLimit, resolution)) {
        return NextResponse.json(
          { error: `${entitlements.planName} 플랜에서는 ${resolution} 해상도 내보내기를 지원하지 않습니다. 720p(HD) 이상은 업그레이드가 필요합니다.` },
          { status: 403 }
        );
      }
    }

    // Use edited captions if available, otherwise source
    // Use edited captions if available, otherwise source
    const captionData: CaptionData | null = job.caption_edit ?? job.caption_source;

    if (!captionData || !captionData.cues || captionData.cues.length === 0) {
      console.warn(`[export] No captions found for job ${id}`);
      return NextResponse.json(
        { error: "No captions to export" },
        { status: 400 }
      );
    }

    const style: SubtitleConfig = {
      ...DEFAULT_SUBTITLE_CONFIG,
      ...(captionData.defaultStyle || {}),
      ...(job.subtitle_config || {})
    };

    // Handle MP4 export (video with burned-in subtitles)
    if (format === "mp4") {
      const sourceUrl = resolveCachedSourceUrl(job.url, job.result_video_url);
      
      // Save export settings to job for historical tracking
      await supabase
        .from("jobs")
        .update({
          export_settings: {
            resolution,
            aspectRatio: captionData.videoAspectRatio,
            exportedAt: new Date().toISOString(),
            renderer
          }
        })
        .eq("id", id);
      
      // FIRE AND FORGET: Start the potentially long-running render in the background
      void handleMp4Export(id, sourceUrl, captionData, style, supabase, job.user_id, job.cuts, job.sequence, resolution, renderer, captionData.videoAspectRatio);
      
      // Return immediately so the UI can redirect to the progress/result page
      return NextResponse.json({
        success: true,
        message: "Export started in background",
        jobId: id,
        format: "mp4"
      }, { status: 202 });
    }

    // Handle SRT/ASS export
    let content: string;
    let filename: string;
    let contentType: string;

    if (format === "srt") {
      content = generateSrt(captionData.cues);
      filename = `subtitles_${id.slice(0, 8)}.srt`;
      contentType = "text/srt";
    } else {
      content = generateAss(captionData.cues, style);
      filename = `subtitles_${id.slice(0, 8)}.ass`;
      contentType = "text/x-ssa";
    }

    // Upload to Supabase Storage
    const storagePath = `exports/${id}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from(env.resultsBucket)
      .upload(storagePath, content, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[export] Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload export" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(env.resultsBucket)
      .getPublicUrl(storagePath);

    // Update job status
    await supabase
      .from("jobs")
      .update({
        status: "ready_to_export",
        result_srt_url: format === "srt" ? urlData.publicUrl : undefined,
      })
      .eq("id", id);

    // Trigger Webhook: job.completed (SRT/ASS)
    void WebhookService.trigger(job.user_id || MOCK_USER_ID, "job.completed", { 
      jobId: id, 
      format, 
      downloadUrl: urlData.publicUrl 
    }).catch();

    return NextResponse.json({
      success: true,
      downloadUrl: urlData.publicUrl,
      format,
      filename,
    });
  } catch (err) {
    console.error("[export] Error:", err);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle MP4 export with burned-in subtitles
 */
async function handleMp4Export(
  jobId: string,
  sourceUrl: string,
  captionData: CaptionData,
  style: SubtitleConfig,
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
  cuts?: VideoCut[] | null,
  sequence?: any | null,
  resolution?: string,
  renderer?: "remotion" | "ffmpeg" | "canvas",
  aspectRatio?: 'original' | '9:16' | '1:1' | '16:9'
) {
  let audio: DownloadedAudio | undefined;
  try {
    // Update status to exporting
    await supabase
      .from("jobs")
      .update({ status: "exporting" })
      .eq("id", jobId);

    // Prepare master video (Sequence or Single source)
    if (sequence) {
      console.info(`[export/mp4] Preparing sequence media for job ${jobId}`);
      audio = await prepareSequenceMedia(sequence, jobId);
      // For sequence jobs, segments are already handled by concatenation.
      // We set cuts to null so renderVideoWithCaptions doesn't try to cut the master video.
      cuts = null;
    } else {
      console.info(`[export/mp4] Downloading source video for job ${jobId}`);
      audio = await downloadAudioFromUrl(sourceUrl);
    }

    // Generate ASS content for subtitle burning
    const assContent = generateAss(captionData.cues, style);
    const subtitles: SubtitleResult = {
      fileName: `subtitles_${jobId.slice(0, 8)}.ass`,
      content: assContent,
    };

    // Apply subtitles to video
    console.info(`[export/mp4] Rendering video with subtitles for job ${jobId} at ${resolution || 'original'} resolution, aspect ${aspectRatio || 'original'} (using ${renderer || 'canvas'})`);
    const captionedVideo = await applySubtitlesToVideo(audio, subtitles, style, cuts, resolution, captionData.cues, jobId, renderer as 'canvas' | undefined, aspectRatio);

    if (!captionedVideo.publicUrl) {
      throw new Error("Failed to render video with subtitles");
    }

    // Billing Logic (Fallback)
    if (audio.durationMs) {
      const { count } = await supabase
        .from("usage_ledger")
        .select("*", { count: "exact", head: true })
        .eq("job_id", jobId);
      
      if (count === 0) {
         console.info(`[export/mp4] Recording usage for job ${jobId} (Fallback)`);
         await BillingService.recordJobUsage(
           jobId,
           userId || MOCK_USER_ID,
           { 
             durationSec: audio.durationMs / 1000, 
             translationCount: 0 
           }
         );
      }
    }

    // Update job with result
    await supabase
      .from("jobs")
      .update({
        status: "done",
        result_video_url: captionedVideo.publicUrl,
      })
      .eq("id", jobId);

    // Trigger Webhook: job.completed (MP4)
    void WebhookService.trigger(userId || MOCK_USER_ID, "job.completed", { 
      jobId, 
      format: "mp4", 
      downloadUrl: captionedVideo.publicUrl 
    }).catch();

    console.info(`[export/mp4] Video export completed for job ${jobId}`);

    // Generate filename with date and resolution
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const resolutionLabel = resolution ? `_${resolution}` : '';
    const filename = `video_${dateStr}${resolutionLabel}_${jobId.slice(0, 8)}.mp4`;

    return NextResponse.json({
      success: true,
      downloadUrl: captionedVideo.publicUrl,
      format: "mp4",
      filename,
    });
  } catch (err) {
    console.error("[export/mp4] Error:", err);
    
    // Update status to error
    await supabase
      .from("jobs")
      .update({
        status: "error",
        error_message: err instanceof Error ? err.message : "MP4 export failed",
      })
      .eq("id", jobId);

    // Trigger Webhook: job.failed
    void WebhookService.trigger(userId || MOCK_USER_ID, "job.failed", { 
      jobId, 
      error: err instanceof Error ? err.message : "MP4 export failed" 
    }).catch();

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MP4 export failed" },
      { status: 500 }
    );

  } finally {
    if (audio?.tempDir) {
      console.info(`[export/mp4] Cleaning up temp directory: ${audio.tempDir}`);
      await rm(audio.tempDir, { recursive: true, force: true });
    }
  }
}
