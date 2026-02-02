import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processJobCaptions } from "@/lib/jobs/processJob";
import { requireJob } from "@/lib/jobs/service";
import { BillingService } from "@/lib/billing/service";
import { MOCK_USER_ID } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    // Verify job exists
    const job = await requireJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check Quotas (Concurrent Jobs)
    const entitlements = await BillingService.getEntitlements(job.userId || MOCK_USER_ID);
    if (entitlements.jobs.activeCount >= entitlements.jobs.concurrentExportsLimit) {
      return NextResponse.json({ 
        error: `Concurrent job limit reached (${entitlements.jobs.activeCount}/${entitlements.jobs.concurrentExportsLimit}). Please wait or upgrade.` 
      }, { status: 429 });
    }

    // Start transcription pipeline in background
    // This pipeline handles: Sequence merging -> STT -> Translate -> Subtitle
    void processJobCaptions(jobId).catch(err => {
      console.error(`[api-job-transcribe] Background transcription failed for job ${jobId}:`, err);
    });

    return NextResponse.json({ 
      success: true, 
      message: "Job transcription pipeline started" 
    });

  } catch (error) {
    console.error("[api-job-transcribe] Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
