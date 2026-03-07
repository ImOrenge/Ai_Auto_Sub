"use client";

import { ProjectStatsOverview } from "./ProjectStatsOverview";
import { ProjectQuickActions } from "./ProjectQuickActions";
import { RecentActivityList } from "./RecentActivityList";
import { ProjectEmptyState } from "./ProjectEmptyState";
import { useLanguage } from "@/lib/i18n";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { AssetRecord } from "@/lib/assets/types";
import { JobRecord } from "@/lib/jobs/types";

interface ProjectDashboardContentProps {
    projectId: string;
    project: any;
    assets: AssetRecord[];
    jobs: JobRecord[];
}

export function ProjectDashboardContent({ projectId, project, assets, jobs }: ProjectDashboardContentProps) {
    const { t } = useLanguage();
    const hasMounted = useHasMounted();

    const completedJobs = jobs.filter(j => j.status === 'done').length;
    const isEmpty = assets.length === 0 && jobs.length === 0;

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return `0 ${t("dashboard.project.overview.units.bytes")}`;
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = [
            t("dashboard.project.overview.units.bytes"),
            t("dashboard.project.overview.units.kb"),
            t("dashboard.project.overview.units.mb"),
            t("dashboard.project.overview.units.gb"),
            t("dashboard.project.overview.units.tb")
        ];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground text-lg">{project.description || t("dashboard.project.overview.title")}</p>
            </div>

            {isEmpty ? (
                <ProjectEmptyState projectId={projectId} />
            ) : (
                <>
                    {/* Stats Overview */}
                    <ProjectStatsOverview
                        totalAssets={assets.length}
                        totalJobs={jobs.length}
                        completedJobs={completedJobs}
                        lastUpdated={project.updated_at}
                    />

                    {/* Quick Actions */}
                    <ProjectQuickActions projectId={projectId} />

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Recent Jobs / Activity */}
                        <RecentActivityList jobs={jobs} projectId={projectId} />

                        {/* Recent Assets */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">{t("dashboard.project.overview.recentAssets")}</h2>
                            <div className="bg-white dark:bg-card border rounded-none divide-y">
                                {assets.slice(0, 5).map(asset => (
                                    <div key={asset.id} className="p-4 flex items-center gap-4">
                                        <div className="size-10 bg-muted/50 flex items-center justify-center text-muted-foreground rounded-none">
                                            <span className="text-xs font-bold uppercase">{asset.meta.mimeType?.split('/')[1] || 'FILE'}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate">{asset.filename}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                                                {formatBytes(asset.meta.size || 0)} • {hasMounted ? new Date(asset.createdAt).toLocaleDateString() : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {assets.length === 0 && (
                                    <div className="p-8 text-center text-sm text-muted-foreground">{t("dashboard.project.overview.noAssets")}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
