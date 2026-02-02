import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { createJob } from "@/lib/jobs/service";
import { processJob } from "@/lib/jobs/processJob";
import { classifySourceType } from "@/lib/jobs/types";
import type { SubtitleConfig, SourceType } from "@/lib/jobs/types";
import { BillingService } from "@/lib/billing/service";

export async function POST(request: Request) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  let body: {
    url?: string;
    projectId?: string;
    subtitleConfig?: SubtitleConfig;
    autoStart?: boolean;
    sourceType?: SourceType;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, projectId, subtitleConfig, autoStart = true, sourceType } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  try {
    // 1. Check Quotas
    const entitlements = await BillingService.getEntitlements(userId);
    
    if (autoStart && entitlements.jobs.activeCount >= entitlements.jobs.concurrentExportsLimit) {
      return NextResponse.json({ 
        error: `Concurrent job limit reached (${entitlements.jobs.activeCount}/${entitlements.jobs.concurrentExportsLimit}).` 
      }, { status: 429 });
    }

    const sub = await BillingService.getSubscription(userId);
    if (sub.planId === "starter" && entitlements.credits.isOverLimit) {
       return NextResponse.json({
         error: "Free plan usage limit reached."
       }, { status: 403 });
    }

    // 2. Create Job
    const resolvedSourceType = sourceType || classifySourceType(url);
    const job = await createJob({
      url,
      userId,
      projectId,
      sourceType: resolvedSourceType,
      subtitleConfig,
    });

    // 3. Start Pipeline if autoStart
    if (autoStart) {
      void processJob(job.id).catch((error) => {
        console.error(`[API v1] Job ${job.id} failed`, error);
      });
    }

    return NextResponse.json({ 
      id: job.id, 
      status: job.status,
      createdAt: job.createdAt 
    }, { status: 201 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const { getSupabaseServer } = await import("@/lib/supabaseServer");
    const supabase = getSupabaseServer();
    
    // Using simple query for now
    const { data: jobs, error, count } = await supabase
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ 
      jobs,
      pagination: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
