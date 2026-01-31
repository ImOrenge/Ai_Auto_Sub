import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { env } from "@/lib/env";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const { id: jobId } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("status, result_srt_url, result_video_url")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "done" && job.status !== "ready_to_export" && job.status !== "awaiting_edit") {
        return NextResponse.json({ 
            error: "Job results are not ready yet", 
            status: job.status 
        }, { status: 400 });
    }

    const results: { srt?: string; video?: string } = {};

    // Generate signed URLs if they are internal storage URLs
    // result_srt_url and result_video_url might already be public URLs if stored in public bucket,
    // but usually they are internal or need signing.
    
    // Helper to get signed URL if it's a storage path
    const getDownloadUrl = async (url: string | null) => {
        if (!url) return null;
        if (url.startsWith("http")) return url; // Already a full URL
        
        const { data, error: signError } = await supabase.storage
            .from(env.resultsBucket)
            .createSignedUrl(url, 3600);
            
        return signError ? null : data?.signedUrl;
    };

    results.srt = (await getDownloadUrl(job.result_srt_url)) ?? undefined;
    results.video = (await getDownloadUrl(job.result_video_url)) ?? undefined;

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
