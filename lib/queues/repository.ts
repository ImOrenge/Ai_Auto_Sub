import { getSupabaseServer } from "@/lib/supabaseServer";
import type { QueueRecord, JobRecord } from "./types";

function mapQueue(row: any): QueueRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    defaultOptions: row.default_options || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrCreateDefaultQueue(userId: string): Promise<QueueRecord> {
  const supabase = getSupabaseServer();
  
  // Try to find existing
  const { data: existing, error } = await supabase
    .from("queues")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (existing) return mapQueue(existing);

  // Create new
  const { data: created, error: createError } = await supabase
    .from("queues")
    .insert({
      user_id: userId,
      name: "Default Queue",
      default_options: {},
    })
    .select()
    .single();

  if (createError) throw createError;
  return mapQueue(created);
}

export async function listDraftJobs(queueId: string): Promise<any[]> {
    const supabase = getSupabaseServer();
    // We join with assets to give full context
    const { data, error } = await supabase
        .from("jobs")
        .select("*, assets(*)")
        .eq("queue_id", queueId)
        .eq("status", "draft")
        .order("queue_position", { ascending: true });
    
    if (error) throw error;
    
    // transform specific fields if needed
    return data.map(job => ({
        ...job,
        asset: job.assets,
        options: job.options || {},
    }));
}

export async function createDraftJob(params: { userId: string, queueId: string, assetId: string, options?: any }): Promise<void> {
    const supabase = getSupabaseServer();

    console.log('[createDraftJob] Starting:', { queueId: params.queueId, assetId: params.assetId });

    const { data: queueData, error: queueError } = await supabase
        .from("queues")
        .select("project_id")
        .eq("id", params.queueId)
        .maybeSingle();

    console.log('[createDraftJob] Queue data:', { queueData, queueError });

    if (queueError) {
        console.error('[createDraftJob] Queue fetch error:', queueError);
        throw queueError;
    }
    
    // CRITICAL: Ensure project_id exists - this prevents NULL project_id in jobs
    if (!queueData || !queueData.project_id) {
        console.error('[createDraftJob] Missing project_id:', { queueData });
        throw new Error(`Queue ${params.queueId} has no associated project_id. Cannot create draft job.`);
    }
    
    // Get max position
    const { data: maxPosData } = await supabase
        .from("jobs")
        .select("queue_position")
        .eq("queue_id", params.queueId)
        .order("queue_position", { ascending: false })
        .limit(1)
        .maybeSingle();
        
    const nextPos = (maxPosData?.queue_position ?? -1) + 1;
    
    const { error } = await supabase
        .from("jobs")
        .insert({
            user_id: params.userId,
            queue_id: params.queueId,
            project_id: queueData.project_id, // Now guaranteed to be non-null
            asset_id: params.assetId,
            status: 'draft',
            queue_position: nextPos,
            options: params.options || {},
            url: 'Asset Job', // Fallback for legacy column constraint if needed, or migration should have handled it. 
                              // Current migration didn't drop 'url' not null constraint?
                              // Let's check schema. 'url text not null'.
                              // I need to provide a value or fix the schema.
        });
        
    if (error) {
        console.error('[createDraftJob] Insert error:', error);
        throw error;
    }

    console.log('[createDraftJob] Success');
}

export async function bulkRunJobs(userId: string, jobIds: string[]): Promise<void> {
    const supabase = getSupabaseServer();
    
    const { data: queueJob, error: queueError } = await supabase
        .from("jobs")
        .select("queue_id")
        .in("id", jobIds)
        .limit(1)
        .maybeSingle();

    if (queueError) throw queueError;

    let projectId: string | null = null;
    if (queueJob?.queue_id) {
        const { data: queueData, error: queueLookupError } = await supabase
            .from("queues")
            .select("project_id")
            .eq("id", queueJob.queue_id)
            .maybeSingle();
        if (queueLookupError) throw queueLookupError;
        projectId = queueData?.project_id ?? null;
    }

    // Validation: Ensure jobs belong to user
    // Update status to 'queued' or 'pending' depending on the runner.
    // The prompt says 'queued'. master-plane says 'pending'.
    // The trigger migration added 'queued' to the constraint.
    
    const updatePayload: Record<string, any> = {
        status: 'queued', // The runner mechanism will pick this up
    };

    if (projectId) {
        updatePayload.project_id = projectId;
    }

    const { error } = await supabase
        .from("jobs")
        .update(updatePayload)
        .in("id", jobIds)
        .eq("user_id", userId)
        .eq("status", "draft"); // Only run drafts
    
    if (error) throw error;
}
