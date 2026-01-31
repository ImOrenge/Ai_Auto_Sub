import { NextResponse } from "next/server";
import { selectJobById, insertJobRecord } from "@/lib/jobs/repository";
import { processJob } from "@/lib/jobs/processJob";

type Params = {
  id: string;
};

/**
 * POST /api/jobs/[id]/retry
 * Retry a failed or canceled job by creating a new job with same config
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;

  try {
    const job = await selectJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only allow retrying failed, canceled or STALLED jobs
    const retryableStatuses = ["error", "canceled", "translating", "preprocessing"];

    if (!retryableStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot retry job with status '${job.status}'` },
        { status: 400 }
      );
    }

    // Create a new job with the same configuration
    const newJob = await insertJobRecord({
      url: job.url,
      userId: job.userId,
      assetId: job.assetId,
      sourceType: job.sourceType,
      subtitleConfig: job.subtitleConfig,
    });

    // Start processing the new job
    void processJob(newJob.id).catch((error) => {
      console.error(`Retry job ${newJob.id} failed`, error);
    });

    return NextResponse.json({
      job: newJob,
      originalJobId: id,
      message: "New job created and processing started",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
