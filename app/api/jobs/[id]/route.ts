import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/service";
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
