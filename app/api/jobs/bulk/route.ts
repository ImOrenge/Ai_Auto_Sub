import { NextResponse } from "next/server";
import { bulkDeleteJobs, bulkUpdateJobs } from "@/lib/jobs/repository";
import { processJob } from "@/lib/jobs/processJob";

export async function POST(request: Request) {
  try {
    const { action, jobIds } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: "No job IDs provided" }, { status: 400 });
    }

    if (action === "delete") {
      await bulkDeleteJobs(jobIds);
      return NextResponse.json({ success: true, count: jobIds.length });
    }

    if (action === "cancel") {
      await bulkUpdateJobs(jobIds, { status: "canceled" });
      return NextResponse.json({ success: true, count: jobIds.length });
    }

    if (action === "retry") {
      // 1. Reset status to pending
      await bulkUpdateJobs(jobIds, { 
        status: "pending", 
        errorMessage: null, 
        step: null, 
        progress: 0 
      });

      // 2. Trigger processing in background
      jobIds.forEach((id: string) => {
        processJob(id).catch(err => console.error(`Failed to retry job ${id}`, err));
      });

      return NextResponse.json({ success: true, count: jobIds.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk action failed";
    console.error("Bulk action error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
