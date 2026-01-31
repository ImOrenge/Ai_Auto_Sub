import { NextRequest, NextResponse } from "next/server";
import { processJobCaptions } from "@/lib/jobs/processJob";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/jobs/[id]/captions
 * Triggers the STT/Translation pipeline for a job, 
 * optionally using the stored cuts.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Start the captioning process in the background
    void processJobCaptions(id).catch((error) => {
      console.error(`[caption-api] Job ${id} captioning failed:`, error);
    });

    return NextResponse.json({ 
      success: true, 
      message: "Caption generation started" 
    });
  } catch (err) {
    console.error("[caption-api] Error:", err);
    return NextResponse.json(
      { error: "Failed to start captioning" },
      { status: 500 }
    );
  }
}
