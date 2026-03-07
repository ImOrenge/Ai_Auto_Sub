import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { validateApiKey } from "@/lib/auth/api-key";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { DEFAULT_SUBTITLE_CONFIG, type CaptionData, type SubtitleConfig } from "@/lib/jobs/types";
import { resolveCachedSourceUrl } from "@/lib/jobs/source";
import { BillingService } from "@/lib/billing/service";
import { env } from "@/lib/env";
import {
  LOCAL_RENDER_ASPECT_RATIOS,
  LOCAL_RENDER_RESOLUTIONS,
  type LocalRenderAspectRatio,
  type LocalRenderResolution,
  type LocalRenderTask,
} from "@/lib/render/local-agent-contract";

const RESOLUTION_SET = new Set<string>(LOCAL_RENDER_RESOLUTIONS);
const ASPECT_RATIO_SET = new Set<string>(LOCAL_RENDER_ASPECT_RATIOS);
const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm|mkv|avi|wmv)$/i;

type RouteParams = { params: Promise<{ id: string }> };

function parseResolution(raw: string | null): LocalRenderResolution | undefined {
  if (!raw) return undefined;
  return RESOLUTION_SET.has(raw) ? (raw as LocalRenderResolution) : undefined;
}

function parseAspectRatio(raw: string | null): LocalRenderAspectRatio | undefined {
  if (!raw) return undefined;
  return ASPECT_RATIO_SET.has(raw) ? (raw as LocalRenderAspectRatio) : undefined;
}

function isDirectVideoUrl(url: string): boolean {
  return VIDEO_EXT_RE.test(url);
}

async function authenticate(request: Request): Promise<string | null> {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) return null;
  return validateApiKey(apiKey);
}

export async function GET(request: Request, { params }: RouteParams) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ error: "Missing or invalid API Key" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const requestUrl = new URL(request.url);
  const resolution = parseResolution(requestUrl.searchParams.get("resolution"));
  const aspectRatio = parseAspectRatio(requestUrl.searchParams.get("aspectRatio"));

  if (requestUrl.searchParams.get("resolution") && !resolution) {
    return NextResponse.json({ error: "Invalid resolution value" }, { status: 400 });
  }

  if (requestUrl.searchParams.get("aspectRatio") && !aspectRatio) {
    return NextResponse.json({ error: "Invalid aspectRatio value" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, user_id, url, result_video_url, caption_source, caption_edit, subtitle_config, sequence")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.sequence) {
    return NextResponse.json(
      { error: "Local agent export does not support sequence jobs yet." },
      { status: 409 }
    );
  }

  const captionData: CaptionData | null = (job.caption_edit ?? job.caption_source) as CaptionData | null;
  if (!captionData?.cues?.length) {
    return NextResponse.json({ error: "No captions available for export" }, { status: 400 });
  }

  const sourceUrl = resolveCachedSourceUrl(job.url, job.result_video_url);
  if (!isDirectVideoUrl(sourceUrl)) {
    return NextResponse.json(
      {
        error:
          "Local agent currently requires a direct downloadable video URL. Re-run with cached/uploaded source.",
      },
      { status: 409 }
    );
  }

  const style: SubtitleConfig = {
    ...DEFAULT_SUBTITLE_CONFIG,
    ...(captionData.defaultStyle || {}),
    ...((job.subtitle_config as SubtitleConfig | null) || {}),
  };

  const entitlements = await BillingService.getEntitlements(userId);
  const watermarkText =
    entitlements.planId === "starter" || entitlements.planId === "pro" ? "AutoSubAI" : undefined;

  const resolvedAspectRatio =
    aspectRatio ||
    (captionData.videoAspectRatio as LocalRenderAspectRatio | undefined) ||
    "original";
  const videoFit = captionData.videoFit || "contain";

  await supabase
    .from("jobs")
    .update({
      status: "exporting",
      progress: 0,
      export_settings: {
        renderer: "local-agent",
        resolution,
        aspectRatio: resolvedAspectRatio,
        videoFit,
        requestedAt: new Date().toISOString(),
      },
    })
    .eq("id", jobId)
    .eq("user_id", userId);

  const task: LocalRenderTask = {
    jobId,
    sourceUrl,
    cues: captionData.cues,
    style,
    resolution,
    aspectRatio: resolvedAspectRatio,
    videoFit,
    watermarkText,
    uploadPath: `/api/v1/jobs/${jobId}/render-local`,
  };

  return NextResponse.json({ task });
}

export async function POST(request: Request, { params }: RouteParams) {
  const userId = await authenticate(request);
  if (!userId) {
    return NextResponse.json({ error: "Missing or invalid API Key" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const supabase = getSupabaseServer();

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const extension = file.name.split(".").pop() || "mp4";
  const objectPath = `exports/${jobId}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(env.resultsBucket)
    .upload(objectPath, file.stream(), {
      contentType: file.type || "video/mp4",
      upsert: true,
      duplex: "half",
    });

  if (uploadError) {
    console.error("[v1/render-local] Upload error:", uploadError);
    await supabase
      .from("jobs")
      .update({
        status: "error",
        error_message: "Failed to upload local render result",
      })
      .eq("id", jobId)
      .eq("user_id", userId);

    return NextResponse.json({ error: "Failed to upload result file" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(env.resultsBucket).getPublicUrl(objectPath);

  await supabase
    .from("jobs")
    .update({
      status: "done",
      progress: 1,
      result_video_url: publicUrl,
      error_message: null,
    })
    .eq("id", jobId)
    .eq("user_id", userId);

  return NextResponse.json({
    success: true,
    jobId,
    publicUrl,
  });
}
