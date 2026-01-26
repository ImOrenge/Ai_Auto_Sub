import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAsset } from "@/lib/assets/transcribe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start transcription in background
    // We don't await it here to return a quick response to the UI
    void transcribeAsset(supabase, assetId, user.id).catch(err => {
      console.error(`[api-transcribe] Background transcription failed for asset ${assetId}:`, err);
    });

    return NextResponse.json({ 
      success: true, 
      message: "Transcription started" 
    });

  } catch (error) {
    console.error("[api-transcribe] Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
