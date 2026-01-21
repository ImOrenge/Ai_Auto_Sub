import { getSupabaseServer } from "@/lib/supabaseServer";
import { UsageLedgerItem, LedgerMetric } from "./types";

const TABLE = "usage_ledger";

export async function getUsageLedger(
  userId: string, 
  periodStart?: Date, 
  periodEnd?: Date,
  limit = 50,
  projectId?: string
): Promise<UsageLedgerItem[]> {
  const supabase = getSupabaseServer();
  let query = supabase
    .from(TABLE)
    .select(`
        *,
        jobs (
            id,
            assets (
                filename
            )
        )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (periodStart) {
    query = query.gte("created_at", periodStart.toISOString());
  }
  if (periodEnd) {
    query = query.lte("created_at", periodEnd.toISOString());
  }
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch ledger: ${error.message}`);

  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    jobId: row.job_id,
    metric: row.metric as LedgerMetric,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    amount: row.amount,
    reason: row.reason,
    status: row.status,
    createdAt: new Date(row.created_at),
    description: row.description || (row.jobs?.assets?.filename ? `Asset: ${row.jobs.assets.filename}` : "Usage Charge"),
  }));
}

export async function aggregateUsage(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  projectId?: string
) {
  const supabase = getSupabaseServer();
  
  // Sum quantity for stt_minutes
  let query = supabase
    .from(TABLE)
    .select("quantity")
    .eq("user_id", userId)
    .eq("metric", "stt_minutes")
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());
    
  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

    if (error) throw new Error(`Failed to aggregate usage: ${error.message}`);

    const totalMinutes = data.reduce((sum, row) => sum + (row.quantity || 0), 0);

    return { sttMinutes: totalMinutes };
}
