import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs/service";
import { ExportResultView } from "@/components/jobs/ExportResultView";
import { withSignedJobAssets } from "@/lib/storage/signing";

interface ExportPageProps {
    params: Promise<{
        id: string;
        jobId: string;
    }>;
}

export default async function ExportPage({ params }: ExportPageProps) {
    const { id, jobId } = await params;

    const job = await getJob(jobId);
    if (!job) {
        return notFound();
    }

    // Ensure job belongs to project
    if (job.projectId !== id) {
        return notFound();
    }

    const enrichedJob = await withSignedJobAssets(job);

    return (
        <ExportResultView
            job={enrichedJob}
            projectId={id}
        />
    );
}
