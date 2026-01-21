import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { requireJob, updateJob } from "@/lib/jobs/service";

// GET: Retrieve captions (Edit version if exists, otherwise Source)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
   try {
     const { id } = await params;
    const job = await requireJob(id);

    // Prefer edited version, fallback to source
    // CaptionData has { version, cues, defaultStyle } structure
    const captionData = job.captionEdit || job.captionSource;
    const captions = Array.isArray(captionData) 
      ? captionData  // Already an array (legacy format)
      : (captionData?.cues || []);  // Extract cues from CaptionData object

    return NextResponse.json({ 
        captions,
        version: job.editedAt ? "edited" : "original",
        lastEdited: job.editedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 });
  }
}

// POST: Save edited captions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     const { id } = await params;
    const body = await request.json();
    const { captions } = body;

    if (!Array.isArray(captions)) {
        return NextResponse.json({ error: "Invalid captions format" }, { status: 400 });
    }

    // Validate connection
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify job ownership
    const { data: job } = await supabase.from('jobs').select('user_id, subtitle_config').eq('id', id).single();
    if (!job || job.user_id !== user.id) {
         return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 });
    }

    // Update job
    await updateJob(id, {
        captionEdit: {
            version: 1,
            cues: captions,
            defaultStyle: job.subtitle_config || undefined // Preserve or default
        },
        editedAt: new Date().toISOString(),
        // If status was 'awaiting_edit', move to 'editing' or keep as is?
        // Let's keep it simple, purely data update.
    });

    return NextResponse.json({ success: true });

  } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
