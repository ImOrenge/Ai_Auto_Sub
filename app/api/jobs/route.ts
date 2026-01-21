import { NextResponse } from "next/server";
import { processJob } from "@/lib/jobs/processJob";
import { createJob, listJobs } from "@/lib/jobs/service";
import { selectJobsWithFilters, countJobsByStatus } from "@/lib/jobs/repository";
import { MOCK_USER_ID } from "@/lib/utils";
import type { SubtitleConfig, SourceType, JobStatus, JobRecord } from "@/lib/jobs/types";
import { BillingService } from "@/lib/billing/service"; // Import BillingService

type CreateJobBody = {
  url?: string;
  userId?: string | null;
  autoStart?: boolean;
  subtitleConfig?: SubtitleConfig;
  sourceType?: SourceType;
};

export async function POST(request: Request) {
  let body: CreateJobBody;
  try {
    body = (await request.json()) as CreateJobBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, userId = null, autoStart = true, subtitleConfig, sourceType } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const effectiveUserId = userId || MOCK_USER_ID;

    // 1. Check Quotas
    const entitlements = await BillingService.getEntitlements(effectiveUserId);
    
    // Concurrent Jobs Check
    if (entitlements.jobs.activeCount >= entitlements.jobs.concurrentLimit) {
      return NextResponse.json({ 
        error: `Concurrent job limit reached (${entitlements.jobs.activeCount}/${entitlements.jobs.concurrentLimit}). Please wait or upgrade.` 
      }, { status: 429 });
    }

    // Usage Limit Check (Block Free tier only)
    const sub = await BillingService.getSubscription(effectiveUserId);
    if (sub.planId === "free" && entitlements.stt.isOverLimit) {
       return NextResponse.json({
         error: `Free plan usage limit reached (${entitlements.stt.used}/${entitlements.stt.total} mins). Please upgrade to continue.`
       }, { status: 403 });
    }

    const job = await createJob({
      url,
      userId: effectiveUserId,
      sourceType,
      subtitleConfig,
    });

    if (autoStart) {
      void processJob(job.id).catch((error) => {
        console.error(`Job ${job.id} failed`, error);
      });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Check if this is a counts-only request
  const countsOnly = searchParams.get("counts") === "true";

  if (countsOnly) {
    try {
      const counts = await countJobsByStatus();
      return NextResponse.json({ counts });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load counts";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Parse filter parameters
  const statusParam = searchParams.get("status") as JobStatus | null;
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const limitParam = Number(searchParams.get("limit") ?? "20");
  const projectId = searchParams.get("projectId");
  const queueId = searchParams.get("queueId"); // NEW

  // Validate pagination
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 20;

  // Check if any filters are applied (use new endpoint)
  const hasFilters = statusParam || search || startDate || endDate || page > 1 || projectId || queueId;

  try {
    // 1. Fetch raw jobs
    let jobs: JobRecord[] = [];
    let resultMeta: any = {};

    if (hasFilters) {
      // Use filtered endpoint
      const result = await selectJobsWithFilters(
        {
          status: statusParam,
          search,
          startDate,
          endDate,
          projectId,
          queueId, // NEW
        },
        page,
        limit
      );
      
      jobs = result.jobs;
      resultMeta = {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } else {
      // Use simple endpoint for homepage widget
      jobs = await listJobs(limit);
    }

    // 2. Enrich with Cost Data
    // In a real implementation, this would be a JOIN or a batch query to the Usage Ledger table.
    // For now, we fetch the Ledger from our Mock BillingService and map it in memory.
    const ledger = await BillingService.getUsageLedger("user_001");
    
    const enrichedJobs = jobs.map((job) => {
      // Calculate total cost for this job id
      const cost = ledger
        .filter((item) => item.jobId === job.id)
        .reduce((sum, item) => sum + item.amount, 0);
      
      return { ...job, cost };
    });

    if (hasFilters) {
       // Also fetch counts for the pills
       const counts = await countJobsByStatus();
       
       return NextResponse.json({
        jobs: enrichedJobs,
        counts,
        ...resultMeta
      });
    }

    return NextResponse.json({ jobs: enrichedJobs });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
