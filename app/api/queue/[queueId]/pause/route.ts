import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/queue/[queueId]/pause
 * Pause queue execution
 * - Set queue.status = 'paused'
 * - Change 'queued' jobs back to 'draft'
 * - Let 'running' jobs finish
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

    // Update queue status to paused
    const { error: queueError } = await supabase
      .from('queues')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', queueId)
      .eq('user_id', user.id);

    if (queueError) {
      console.error('[Queue Pause] Queue update error:', queueError);
      return NextResponse.json({ error: queueError.message }, { status: 500 });
    }

    // Change queued jobs back to draft
    const { data: updatedJobs, error: jobsError } = await supabase
      .from('jobs')
      .update({ status: 'draft' })
      .eq('queue_id', queueId)
      .eq('status', 'queued')
      .select('id');

    if (jobsError) {
      console.error('[Queue Pause] Jobs update error:', jobsError);
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    console.log(`[Queue Pause] Paused queue ${queueId}, reverted ${updatedJobs?.length || 0} jobs to draft`);

    return NextResponse.json({ 
      success: true,
      queueId,
      jobsReverted: updatedJobs?.length || 0
    });
  } catch (error) {
    console.error("[Queue Pause] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to pause queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
