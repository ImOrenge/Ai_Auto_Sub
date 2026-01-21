import { env } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { JobCreateInput, JobRecord, JobStep, JobUpdateInput, JobStatus, SubtitleConfig, SourceType, CaptionData } from "@/lib/jobs/types";
import { classifySourceType } from "@/lib/jobs/types";

const TABLE = env.jobsTable;

type JobRow = {
  id: string;
  user_id: string | null;
  project_id?: string | null;
  asset_id?: string | null;
  queue_id?: string | null;
  url: string;
  source_type: string | null;
  status: string;
  step: string | null;
  progress: number | null;
  result_srt_url: string | null;
  result_video_url: string | null;
  error_message: string | null;
  subtitle_config: SubtitleConfig | null;
  caption_source: CaptionData | null;
  caption_edit: CaptionData | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  assets?: { filename: string; storage_key: string } | null;
};

function mapRowToRecord(row: JobRow): JobRecord {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    assetId: row.asset_id,
    queueId: row.queue_id,
    url: row.url,
    sourceType: (row.source_type as SourceType) ?? classifySourceType(row.url),
    status: row.status as JobStatus,
    step: row.step as JobStep | string | null,
    progress: typeof row.progress === "number" ? row.progress : 0,
    resultSrtUrl: row.result_srt_url,
    resultVideoUrl: row.result_video_url,
    errorMessage: row.error_message,
    subtitleConfig: row.subtitle_config,
    captionSource: row.caption_source,
    captionEdit: row.caption_edit,
    editedAt: row.edited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    asset: row.assets ? {
      filename: row.assets.filename,
      storageKey: row.assets.storage_key,
    } : null,
  };
}

export async function insertJobRecord(input: JobCreateInput): Promise<JobRecord> {
  const supabase = getSupabaseServer();
  const row = {
    user_id: input.userId ?? null,
    // project_id: input.projectId ?? null, // Need to update JobCreateInput if we want to save it
    url: input.url,
    source_type: input.sourceType ?? classifySourceType(input.url),
    status: "pending",
    step: null as string | null,
    progress: 0,
    error_message: null,
    result_srt_url: null,
    result_video_url: null,
    subtitle_config: input.subtitleConfig ?? null,
  };

  const { data, error } = await supabase.from(TABLE).insert(row).select().single();

  if (error || !data) {
    throw new Error(`Failed to create job: ${error?.message ?? "Unknown error"}`);
  }

  return mapRowToRecord(data);
}

export async function selectJobById(id: string): Promise<JobRecord | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from(TABLE).select("*, assets(filename, storage_key)").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch job ${id}: ${error.message}`);
  }

  return data ? mapRowToRecord(data) : null;
}

export async function selectJobs(limit = 20): Promise<JobRecord[]> {
  const supabase = getSupabaseServer();
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, assets(filename, storage_key)")
    .order("created_at", { ascending: false })
    .limit(normalizedLimit);

  if (error) {
    throw new Error(`Unable to fetch jobs: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToRecord(row));
}

export async function updateJobById(id: string, patch: JobUpdateInput): Promise<JobRecord> {
  const supabase = getSupabaseServer();
  const updatePayload = mapUpdateToRow(patch);

  if (Object.keys(updatePayload).length === 0) {
    const job = await selectJobById(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }
    return job;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update job ${id}: ${error?.message ?? "Unknown error"}`);
  }

  return mapRowToRecord(data);
}

function mapUpdateToRow(update: JobUpdateInput): Partial<JobRow> {
  const payload: Partial<JobRow> = {};

  if (update.status) {
    payload.status = update.status;
  }
  if ("step" in update) {
    payload.step = (update.step as JobStep | string | null) ?? null;
  }
  if (typeof update.progress === "number") {
    payload.progress = clampProgress(update.progress);
  } else if (update.progress === null) {
    payload.progress = null;
  }
  if ("errorMessage" in update) {
    payload.error_message = update.errorMessage ?? null;
  }
  if ("resultSrtUrl" in update) {
    payload.result_srt_url = update.resultSrtUrl ?? null;
  }
  if ("resultVideoUrl" in update) {
    payload.result_video_url = update.resultVideoUrl ?? null;
  }
  if ("sourceType" in update) {
    payload.source_type = update.sourceType ?? null;
  }
  if ("subtitleConfig" in update) {
    payload.subtitle_config = update.subtitleConfig ?? null;
  }
  if ("captionSource" in update) {
    payload.caption_source = update.captionSource ?? null;
  }
  if ("captionEdit" in update) {
    payload.caption_edit = update.captionEdit ?? null;
  }
  if ("editedAt" in update) {
    payload.edited_at = update.editedAt ?? null;
  }

  return payload;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

// ============================================================================
// Extended repository functions for /jobs page
// ============================================================================

export type JobFilters = {
  status?: JobStatus | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  projectId?: string | null;
  queueId?: string | null; // NEW: Filter by queue
};

export type PaginatedJobsResult = {
  jobs: JobRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type StatusCounts = {
  all: number;
  pending: number;
  processing: number;
  done: number;
  error: number;
  canceled: number;
};

/**
 * Fetch jobs with filtering and pagination support
 */
export async function selectJobsWithFilters(
  filters: JobFilters,
  page = 1,
  limit = 20
): Promise<PaginatedJobsResult> {
  const supabase = getSupabaseServer();
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const offset = (normalizedPage - 1) * normalizedLimit;

  // Build query
  let query = supabase.from(TABLE).select("*, assets(filename, storage_key)", { count: "exact" });

  // Status filter
  if (filters.status) {
    // For "processing" filter, include all active statuses
    if (filters.status === "processing") {
      query = query.in("status", [
        "queued",
        "running",
        "downloading",
        "processing",
        "stt",
        "translating",
        "subtitle",
        "uploading",
        "preprocessing",
        "compositing",
        "exporting",
      ]);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  // Search filter (job ID or URL)
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`id.ilike.${searchTerm},url.ilike.${searchTerm}`);
  }

  // Project Filter
  if (filters.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  // Queue filter
  if (filters.queueId) {
    query = query.eq("queue_id", filters.queueId);
  }

  // Date range filters
  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  // Order and pagination
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + normalizedLimit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Unable to fetch jobs: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / normalizedLimit);

  return {
    jobs: (data ?? []).map((row) => mapRowToRecord(row)),
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages,
  };
}

/**
 * Get counts of jobs by status for Summary Pills
 */
export async function countJobsByStatus(): Promise<StatusCounts> {
  const supabase = getSupabaseServer();

  // Count all jobs
  const { count: allCount, error: allError } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (allError) {
    throw new Error(`Unable to count jobs: ${allError.message}`);
  }

  // Count by individual statuses
  const statusQueries = [
    { key: "pending", statuses: ["pending"] },
    { key: "processing", statuses: ["queued", "running", "downloading", "processing", "stt", "translating", "subtitle", "uploading", "preprocessing", "compositing", "exporting"] },
    { key: "done", statuses: ["done"] },
    { key: "error", statuses: ["error"] },
    { key: "canceled", statuses: ["canceled"] },
  ] as const;

  const counts: StatusCounts = {
    all: allCount ?? 0,
    pending: 0,
    processing: 0,
    done: 0,
    error: 0,
    canceled: 0,
  };

  for (const { key, statuses } of statusQueries) {
    const { count, error } = await supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true })
      .in("status", statuses);

    if (error) {
      throw new Error(`Unable to count ${key} jobs: ${error.message}`);
    }

    counts[key] = count ?? 0;
  }

  return counts;
}

/**
 * Delete a job by ID (hard delete)
 */
export async function deleteJobById(id: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete job ${id}: ${error.message}`);
  }
}

export async function bulkDeleteJobs(ids: string[]): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from(TABLE).delete().in("id", ids);
  if (error) throw new Error(`Failed to delete jobs: ${error.message}`);
}

export async function bulkUpdateJobs(ids: string[], patch: JobUpdateInput): Promise<void> {
  const supabase = getSupabaseServer();
  const payload = mapUpdateToRow(patch);
  const { error } = await supabase.from(TABLE).update(payload).in("id", ids);
  if (error) throw new Error(`Failed to update jobs: ${error.message}`);
}
