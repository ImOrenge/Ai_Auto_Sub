import { NextResponse } from "next/server";
import { selectJobById, updateJobById } from "@/lib/jobs/repository";

type Params = {
  id: string;
};

/**
 * POST /api/jobs/[id]/cancel
 * Cancel a pending or processing job
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

    // Only allow canceling pending or active jobs
    const cancelableStatuses = [
      "pending",
      "downloading",
      "processing",
      "stt",
      "translating",
      "subtitle",
      "uploading",
      "preprocessing",
      "compositing",
    ];

    if (!cancelableStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot cancel job with status '${job.status}'` },
        { status: 400 }
      );
    }

    const updatedJob = await updateJobById(id, {
      status: "canceled",
      step: null,
      progress: job.progress,
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
