import type { JobCreateInput, JobRecord, JobUpdateInput } from "@/lib/jobs/types";
import {
  insertJobRecord,
  selectJobById,
  selectJobs,
  updateJobById,
} from "@/lib/jobs/repository";

export async function createJob(input: JobCreateInput): Promise<JobRecord> {
  return insertJobRecord(input);
}

export async function getJob(jobId: string): Promise<JobRecord | null> {
  return selectJobById(jobId);
}

export async function requireJob(jobId: string): Promise<JobRecord> {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  return job;
}

export async function updateJob(jobId: string, patch: JobUpdateInput): Promise<JobRecord> {
  return updateJobById(jobId, patch);
}

export async function listJobs(limit?: number): Promise<JobRecord[]> {
  return selectJobs(limit);
}
