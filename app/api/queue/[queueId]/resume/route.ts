import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bulkRunJobs } from "@/lib/queues/repository";
import { processJob } from "@/lib/jobs/processJob";
import { checkUserPlan, getConcurrencyLimit, canRunBatch } from "@/lib/billing/entitlements";

/**
 * Process batch of jobs with concurrency limit
 */
async function processBatch<T>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const running: Promise<void>[] = [];

  while (queue.length > 0 || running.length > 0) {
    // Fill up to concurrency limit
    while (running.length < concurrency && queue.length > 0) {
      const item = queue.shift()!;
      const promise = processor(item)
        .catch(err => console.error(`[Batch] Processing error:`, err))
        .finally(() => {
          const index = running.indexOf(promise);
          if (index > -1) running.splice(index, 1);
        });
      running.push(promise);
    }

    // Wait for at least one to complete
    if (running.length > 0) {
      await Promise.race(running);
    }
  }
}

/**
 * POST /api/queue/[queueId]/resume
 * Resume paused queue execution
 * - Set queue.status = 'active'
 * - Change 'draft' jobs to 'queued'
 * - Trigger processBatch
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { queueId } = await params;

    // Get draft jobs
    const { data: draftJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .eq('queue_id', queueId)
      .eq('status', 'draft')
      .order('queue_position', { ascending: true });

    if (fetchError) {
      console.error('[Queue Resume] Fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const jobIds = (draftJobs || []).map(j => j.id);

    if (jobIds.length === 0) {
      return NextResponse.json({ error: "No draft jobs to resume" }, { status: 400 });
    }

    // Check usage limits
    const usageCheck = await canRunBatch(user.id, jobIds.length);
    
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: usageCheck.reason || 'Usage limit exceeded',
        plan: usageCheck.plan,
        currentUsage: usageCheck.currentUsage,
        upgradeRequired: true
      }, { status: 403 });
    }

    // Update queue status to active
    const { error: queueError } = await supabase
      .from('queues')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', queueId)
      .eq('user_id', user.id);

    if (queueError) {
      console.error('[Queue Resume] Queue update error:', queueError);
      return NextResponse.json({ error: queueError.message }, { status: 500 });
    }

    // Get user's plan and concurrency limit
    const userPlan = usageCheck.plan;
    const maxConcurrent = getConcurrencyLimit(userPlan);

    console.log(`[Queue Resume] Resuming queue ${queueId}, plan: ${userPlan}, jobs: ${jobIds.length}`);

    // Update job status to queued
    await bulkRunJobs(user.id, jobIds);

    // Process jobs with concurrency limit in background
    processBatch(jobIds, maxConcurrent, async (jobId) => {
      await processJob(jobId);
    }).catch(err => console.error('[Queue Resume] Batch processing error:', err));

    return NextResponse.json({ 
      success: true,
      queueId,
      count: jobIds.length,
      concurrency: maxConcurrent,
      plan: userPlan
    });
  } catch (error) {
    console.error("[Queue Resume] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to resume queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
