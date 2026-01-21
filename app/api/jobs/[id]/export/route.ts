import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { generateSrt } from "@/lib/subtitle/srt";
import { generateAss } from "@/lib/subtitle/ass";
import type { CaptionData, SubtitleConfig } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";
import {
  downloadAudioFromUrl,
  applySubtitlesToVideo,
  uploadToStorage,
} from "@/lib/jobs/operations";
import type { SubtitleResult } from "@/lib/jobs/operations";
import { BillingService } from "@/lib/billing/service";
import { env } from "@/lib/env";
import { MOCK_USER_ID } from "@/lib/utils";

type RouteParams = { params: Promise<{ id: string }> };

type ExportRequest = {
  format: "srt" | "ass" | "mp4";
};

/**
 * POST /api/jobs/[id]/export
 * Export subtitles in the requested format (SRT, ASS, or MP4 with burned-in subtitles)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = (await request.json()) as ExportRequest;
    const { format } = body;

    if (!format || !["srt", "ass", "mp4"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be 'srt', 'ass', or 'mp4'" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Fetch job data
    const { data: job, error } = await supabase
      .from("jobs")
      .select("user_id, url, caption_source, caption_edit, subtitle_config")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Use edited captions if available, otherwise source
    const captionData: CaptionData | null = job.caption_edit ?? job.caption_source;

    if (!captionData || !captionData.cues || captionData.cues.length === 0) {
      return NextResponse.json(
        { error: "No captions to export" },
        { status: 400 }
      );
    }

    const style: SubtitleConfig = captionData.defaultStyle ?? job.subtitle_config ?? DEFAULT_SUBTITLE_CONFIG;

    // Handle MP4 export (video with burned-in subtitles)
    if (format === "mp4") {
      return await handleMp4Export(id, job.url, captionData, style, supabase, job.user_id);
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
  userId: string
) {
  try {
    // Update status to exporting
    await supabase
      .from("jobs")
      .update({ status: "exporting" })
      .eq("id", jobId);

    // Download the source video
    console.info(`[export/mp4] Downloading source video for job ${jobId}`);
    const audio = await downloadAudioFromUrl(sourceUrl);

    // Generate SRT content for subtitle burning
    const srtContent = generateSrt(captionData.cues);
    const subtitles: SubtitleResult = {
      fileName: `subtitles_${jobId.slice(0, 8)}.srt`,
      content: srtContent,
    };

    // Apply subtitles to video
    console.info(`[export/mp4] Rendering video with subtitles for job ${jobId}`);
    const captionedVideo = await applySubtitlesToVideo(audio, subtitles, style);

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

    console.info(`[export/mp4] Video export completed for job ${jobId}`);

    return NextResponse.json({
      success: true,
      downloadUrl: captionedVideo.publicUrl,
      format: "mp4",
      filename: `video_${jobId.slice(0, 8)}.mp4`,
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

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "MP4 export failed" },
      { status: 500 }
    );
  }
}
