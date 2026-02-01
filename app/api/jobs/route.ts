import { NextResponse } from "next/server";
import { processJob } from "@/lib/jobs/processJob";
import { createJob, listJobs } from "@/lib/jobs/service";
import { selectJobsWithFilters, countJobsByStatus } from "@/lib/jobs/repository";
import { getAssetById } from "@/lib/assets/repository";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { MOCK_USER_ID } from "@/lib/utils";
import { classifySourceType, DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";
import type { SubtitleConfig, SourceType, JobStatus, JobRecord } from "@/lib/jobs/types";
import { BillingService } from "@/lib/billing/service";
import { CreateJobSchema, GetJobsQuerySchema } from "@/lib/validators/jobs";

type CreateJobBody = {
  url?: string;
  assetId?: string | null;
  userId?: string | null;
  projectId?: string | null;
  autoStart?: boolean;
  subtitleConfig?: SubtitleConfig;
  sourceType?: SourceType;
};

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Zod Validation
  const validation = CreateJobSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation Error", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const {
    url,
    assetId,
    userId = null,
    projectId = null,
    autoStart = true,
    subtitleConfig,
    sourceType,
  } = validation.data;

  try {
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    let effectiveUserId = userId || MOCK_USER_ID;
    let resolvedUrl = url ?? null;
    let resolvedSourceType = sourceType;
    let resolvedProjectId = projectId;

    if (!resolvedUrl && assetId) {
      const supabase = getSupabaseServer();
      const asset = await getAssetById(supabase, assetId);
      if (!asset) {
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      if (!userId && asset.userId) {
        effectiveUserId = asset.userId;
      }
      resolvedProjectId = resolvedProjectId ?? asset.projectId ?? null;
      resolvedUrl = asset.sourceUrl ?? asset.filename ?? `asset-${assetId}`;
      if (!resolvedSourceType) {
        resolvedSourceType = asset.sourceUrl ? classifySourceType(asset.sourceUrl) : "upload";
      }
    }

    if (!resolvedUrl) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // 1. Check Quotas
    const entitlements = await BillingService.getEntitlements(effectiveUserId);
    
    // Concurrent Jobs Check
    if (autoStart && entitlements.jobs.activeCount >= entitlements.jobs.concurrentExportsLimit) {
      return NextResponse.json({ 
        error: `Concurrent job limit reached (${entitlements.jobs.activeCount}/${entitlements.jobs.concurrentExportsLimit}). Please wait or upgrade.` 
      }, { status: 429 });
    }

    // Usage Limit Check
    const sub = await BillingService.getSubscription(effectiveUserId);
    if (sub.planId === "starter" && entitlements.credits.isOverLimit) {
       return NextResponse.json({
         error: `Starter plan usage limit reached (${entitlements.credits.used}/${entitlements.credits.total} credits). Please upgrade to continue.`
       }, { status: 403 });
    }

    const job = await createJob({
      url: resolvedUrl,
      assetId: assetId ?? null,
      userId: effectiveUserId,
      projectId: resolvedProjectId ?? null,
      sourceType: resolvedSourceType,
      subtitleConfig: subtitleConfig ? { ...DEFAULT_SUBTITLE_CONFIG, ...subtitleConfig } : null,
      priority: entitlements.features.queuePriority,
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
  const paramsObj = Object.fromEntries(searchParams.entries());

  // Zod Validation for Query Params
  const validation = GetJobsQuerySchema.safeParse(paramsObj);
  
  if (!validation.success) {
     return NextResponse.json(
       { error: "Invalid Query Parameters", details: validation.error.flatten() },
       { status: 400 }
     );
  }

  const { 
      counts: countsParam, 
      status: statusParam, 
      search, 
      startDate, 
      endDate, 
      page, 
      limit, 
      projectId, 
      queueId 
  } = validation.data;

  // Check if this is a counts-only request
  const countsOnly = countsParam === "true";

  if (countsOnly) {
    try {
      const counts = await countJobsByStatus();
      return NextResponse.json({ counts });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load counts";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

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
          queueId,
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
    const ledger = await BillingService.getUsageLedger("user_001");
    
    const enrichedJobs = jobs.map((job) => {
      const cost = ledger
        .filter((item) => item.jobId === job.id)
        .reduce((sum, item) => sum + item.amount, 0);
      
      return { ...job, cost };
    });

    if (hasFilters) {
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
