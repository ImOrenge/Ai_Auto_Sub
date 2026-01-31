import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs/service";
import { updateAsset } from "@/lib/assets/repository";
import { createClient } from "@/lib/supabase/server";
import { withSignedJobAssets } from "@/lib/storage/signing";
import { BillingService } from "@/lib/billing/service";
import { MOCK_USER_ID } from "@/lib/utils";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const enrichedJob = await withSignedJobAssets(job);

  // Enrich with Cost & Usage
  // Using Mock Service for now (fetch ledger for the user)
  const ledger = await BillingService.getUsageLedger(job.userId || MOCK_USER_ID);
  const usageLogs = ledger.filter((item) => item.jobId === id);
  const cost = usageLogs.reduce((sum, item) => sum + item.amount, 0);

  // Return job with cost and usage details
  return NextResponse.json({ 
    job: {
      ...enrichedJob,
      cost,
      usageLogs
    } 
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    
    // Whitelist of allowed update fields
    const updatePayload: Record<string, unknown> = {};
    
    if (body.sequence !== undefined) {
      updatePayload.sequence = body.sequence;
    }
    if (body.cuts !== undefined) {
      updatePayload.cuts = body.cuts;
    }
    if (body.captionEdit !== undefined) {
      updatePayload.captionEdit = body.captionEdit;
      updatePayload.editedAt = new Date().toISOString();
    }
    if (body.status !== undefined) {
      updatePayload.status = body.status;
    }
    if (body.subtitleConfig !== undefined) {
      updatePayload.subtitleConfig = body.subtitleConfig;
    }
    
    // Handle Asset Title Update
    if (body.title !== undefined && job.assetId) {
      const supabase = await createClient();
      await updateAsset(supabase, job.assetId, { filename: body.title });
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedJob = await updateJob(id, updatePayload as any);
    
    return NextResponse.json({ job: updatedJob });
  } catch (err) {
    console.error("[PATCH /api/jobs/[id]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update job" },
      { status: 500 }
    );
  }
}
