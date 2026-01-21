import { NextResponse } from "next/server";
import { selectJobById, deleteJobById } from "@/lib/jobs/repository";

type Params = {
  id: string;
};

/**
 * DELETE /api/jobs/[id]
 * Delete a job permanently
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;

  try {
    const job = await selectJobById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Prevent deleting jobs that are actively processing
    const activeStatuses = [
      "downloading",
      "processing",
      "stt",
      "translating",
      "subtitle",
      "uploading",
      "preprocessing",
      "compositing",
    ];

    if (activeStatuses.includes(job.status)) {
      return NextResponse.json(
        { error: "Cannot delete an actively processing job. Cancel it first." },
        { status: 400 }
      );
    }

    await deleteJobById(id);

    return NextResponse.json({ success: true, deletedJobId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
