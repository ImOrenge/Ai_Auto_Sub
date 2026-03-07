import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { listAssets } from "@/lib/assets/repository";
import { selectJobsWithFilters } from "@/lib/jobs/repository";
import { ProjectDashboardContent } from "@/components/projects/dashboard/ProjectDashboardContent";

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

    return (
        <ProjectDashboardContent
            projectId={projectId}
            project={project}
            assets={assets}
            jobs={jobs}
        />
    );
}
