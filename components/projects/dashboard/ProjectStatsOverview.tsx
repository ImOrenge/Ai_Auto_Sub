"use client";

import { Clock, Film, FileText, CheckCircle2 } from "lucide-react";

interface ProjectStatsProps {
    totalAssets: number;
    totalJobs: number;
    completedJobs: number;
    lastUpdated: string;
}

export function ProjectStatsOverview({ totalAssets, totalJobs, completedJobs, lastUpdated }: ProjectStatsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-card border rounded-none">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-none text-primary">
                        <Film className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Project Assets</p>
                        <p className="text-2xl font-bold">{totalAssets}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-card border rounded-none">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-none text-indigo-600">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Jobs</p>
                        <p className="text-2xl font-bold">{totalJobs}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-card border rounded-none">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-none text-emerald-600">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Completed Exports</p>
                        <p className="text-2xl font-bold">{completedJobs}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-card border rounded-none">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500/10 rounded-none text-gray-600">
                        <Clock className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Last Updated</p>
                        <p className="text-sm font-semibold">{new Date(lastUpdated).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
