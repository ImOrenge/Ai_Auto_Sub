import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProjectStatsOverview } from "@/components/projects/dashboard/ProjectStatsOverview";
import { ProjectQuickActions } from "@/components/projects/dashboard/ProjectQuickActions";
import { RecentActivityList } from "@/components/projects/dashboard/RecentActivityList";
import { ProjectEmptyState } from "@/components/projects/dashboard/ProjectEmptyState";
import { listAssets } from "@/lib/assets/repository";
import { selectJobsWithFilters } from "@/lib/jobs/repository";

interface ProjectPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Fetch user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch Project details
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

    if (projectError || !project) return notFound();

    // Fetch Stats (Parallelize where possible)
    const statsPromise = Promise.all([
        listAssets(supabase, user.id, projectId, 10),
        selectJobsWithFilters({ projectId }, 1, 5)
    ]);

    const [{ assets }, { jobs }] = await statsPromise;

    const completedJobs = jobs.filter(j => j.status === 'done').length;

    // Use a simple heuristic for "Empty Project"
    // If no assets and no jobs, it's virtually empty
    const isEmpty = assets.length === 0 && jobs.length === 0;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground text-lg">{project.description || "Project Dashboard"}</p>
            </div>

            {isEmpty ? (
                <ProjectEmptyState projectId={projectId} />
            ) : (
                <>
                    {/* Stats Overview */}
                    <ProjectStatsOverview
                        totalAssets={assets.length} // Note: This listAssets call might be paginated, for real total count we might need a separate query, but this suffices for now or we update listAssets
                        totalJobs={jobs.length} // Same note on pagination
                        completedJobs={completedJobs}
                        lastUpdated={project.updated_at}
                    />

                    {/* Quick Actions */}
                    <ProjectQuickActions projectId={projectId} />

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Recent Jobs / Activity */}
                        <RecentActivityList jobs={jobs} projectId={projectId} />

                        {/* Recent Assets (Reusing existing Card but simplified or moving to component) */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold tracking-tight">Recent Assets</h2>
                            <div className="bg-white dark:bg-card border rounded-none divide-y">
                                {assets.slice(0, 5).map(asset => (
                                    <div key={asset.id} className="p-4 flex items-center gap-4">
                                        <div className="size-10 bg-muted/50 flex items-center justify-center text-muted-foreground rounded-none">
                                            {/* Simple icon based on file type */}
                                            <span className="text-xs font-bold uppercase">{asset.meta.mimeType?.split('/')[1] || 'FILE'}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{asset.filename}</p>
                                            <p className="text-xs text-muted-foreground">{formatBytes(asset.meta.size || 0)} • {new Date(asset.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {assets.length === 0 && (
                                    <div className="p-8 text-center text-sm text-muted-foreground">No assets found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
