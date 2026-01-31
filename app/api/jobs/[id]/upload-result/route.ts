import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { updateJob } from "@/lib/jobs/service";
import { env } from "@/lib/env";
import { randomUUID } from "node:crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique path for the result
    const extension = file.name.split('.').pop() || 'mp4';
    const objectPath = `exports/${id}/${randomUUID()}.${extension}`;

    console.info(`[api/upload-result] Uploading client render for job ${id} to ${objectPath}`);

    const { error: uploadError } = await supabase.storage
      .from(env.resultsBucket)
      .upload(objectPath, buffer, {
        contentType: file.type || "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      console.error("[api/upload-result] Storage error:", uploadError);
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(env.resultsBucket)
      .getPublicUrl(objectPath);

    // Update job status and result URL
    await updateJob(id, {
      status: "done",
      resultVideoUrl: publicUrl
    } as any);

    return NextResponse.json({ 
      success: true, 
      publicUrl,
      jobId: id 
    });

  } catch (err) {
    console.error("[api/upload-result] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
