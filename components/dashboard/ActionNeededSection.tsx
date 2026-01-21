"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, FileEdit, ArrowRight, RotateCcw } from "lucide-react";
import { routes } from "@/lib/routes";
import { JobRecord } from "@/lib/jobs/types";

interface ActionNeededSectionProps {
    // We can also let the component fetch its own data to isolate logic
    initialAwaiting?: JobRecord[];
    initialFailed?: JobRecord[];
}

export function ActionNeededSection({ initialAwaiting = [], initialFailed = [] }: ActionNeededSectionProps) {
    const [awaitingJobs, setAwaitingJobs] = useState<JobRecord[]>(initialAwaiting);
    const [failedJobs, setFailedJobs] = useState<JobRecord[]>(initialFailed);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActionItems = async () => {
            try {
                // Parallel fetch for specific statuses
                // Note: Current API might only support single status filter per request
                const [awaitingRes, failedRes] = await Promise.all([
                    fetch('/api/jobs?status=awaiting_edit&limit=5'),
                    fetch('/api/jobs?status=error&limit=5')
                ]);

                const awaitingData = await awaitingRes.json();
                const failedData = await failedRes.json();

                if (awaitingData.jobs) setAwaitingJobs(awaitingData.jobs);
                if (failedData.jobs) setFailedJobs(failedData.jobs);

            } catch (error) {
                console.error("Failed to fetch action items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActionItems();
    }, []);

    if (loading) {
        return <div className="h-24 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />;
    }

    if (awaitingJobs.length === 0 && failedJobs.length === 0) {
        return null; // Hide section if nothing needs action
    }

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Action Needed</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Awaiting Edit Column */}
                {awaitingJobs.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-medium text-sm">
                            <FileEdit className="size-4" />
                            <span>Awaiting Edit ({awaitingJobs.length})</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {awaitingJobs.map(job => (
                                <Link
                                    key={job.id}
                                    href={routes.editor(job.projectId || 'unknown', job.id)}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-amber-200 dark:border-amber-900/50 rounded-lg hover:shadow-md transition-all hover:border-amber-400">
                                        <div className="min-w-0">
                                            <p className="font-medium truncate text-sm">
                                                {job.asset?.filename || 'Untitled Job'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Ready for review
                                            </p>
                                        </div>
                                        <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="size-4" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Failed Jobs Column */}
                {failedJobs.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-medium text-sm">
                            <AlertCircle className="size-4" />
                            <span>Failed Jobs ({failedJobs.length})</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {failedJobs.map(job => (
                                <div key={job.id} className="flex items-center justify-between p-3 bg-white dark:bg-card border border-red-200 dark:border-red-900/50 rounded-lg">
                                    <div className="min-w-0">
                                        <p className="font-medium truncate text-sm text-foreground">
                                            {job.asset?.filename || 'Untitled Job'}
                                        </p>
                                        <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]" title={job.errorMessage || 'Unknown error'}>
                                            {job.errorMessage || 'Processing failed'}
                                        </p>
                                    </div>
                                    <Link
                                        href={job.projectId ? routes.projectJobs(job.projectId) : routes.jobs()}
                                        className="text-muted-foreground hover:text-foreground p-1"
                                        title="View Details"
                                    >
                                        <RotateCcw className="size-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
