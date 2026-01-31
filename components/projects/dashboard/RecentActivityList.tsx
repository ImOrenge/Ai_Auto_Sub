"use client";

import { JobRecord } from "@/lib/jobs/types";
import { FileVideo, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RecentActivityListProps {
    jobs: JobRecord[];
    projectId: string;
}

export function RecentActivityList({ jobs, projectId }: RecentActivityListProps) {
    if (jobs.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed rounded-none bg-muted/30">
                <p className="text-muted-foreground text-sm">No recent activity found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
            </div>

            <div className="border rounded-none bg-white dark:bg-card divide-y">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <div className={cn(
                            "size-10 rounded-none flex items-center justify-center shrink-0",
                            job.status === "done" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                            job.status === "error" && "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400",
                            (job.status === "processing") && "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
                            job.status === "pending" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                            {job.status === "done" ? <CheckCircle2 className="size-5" /> :
                                job.status === "error" ? <XCircle className="size-5" /> :
                                    <FileVideo className="size-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {job.asset?.filename || job.url || "Untitled Job"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className={cn(
                                    "capitalize",
                                    job.status === "done" && "text-emerald-600",
                                    job.status === "error" && "text-red-600"
                                )}>{job.status}</span>
                                <span>•</span>
                                <span>{new Date(job.createdAt).toLocaleString()}</span>
                            </div>
                        </div>

                        {job.status === "done" && job.resultSrtUrl && (
                            <Link
                                href={job.resultSrtUrl}
                                target="_blank"
                                className="px-3 py-1 text-xs font-medium border rounded-none hover:bg-muted transition-colors"
                            >
                                Download SRT
                            </Link>
                        )}
                        {job.status === "done" && job.resultVideoUrl && (
                            <Link
                                href={job.resultVideoUrl}
                                target="_blank"
                                className="px-3 py-1 text-xs font-medium border rounded-none hover:bg-muted transition-colors"
                            >
                                Download
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
