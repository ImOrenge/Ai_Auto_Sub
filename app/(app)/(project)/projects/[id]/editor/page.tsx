import { MainEditor } from "@/components/editor/MainEditor";
import { EditorProvider } from "@/components/editor/EditorContext";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/projects/repository";
import { listAssets } from "@/lib/assets/repository";
import { notFound } from "next/navigation";
import { BillingService } from "@/lib/billing/service";

interface ProjectEditorPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectEditorPage({ params }: ProjectEditorPageProps) {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Fetch user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch project details
    const project = await getProjectById(supabase, projectId);
    if (!project) return notFound();

    // Fetch initial assets for the project
    const { assets } = await listAssets(supabase, user.id, projectId, 50);

    // Fetch entitlements
    const entitlements = await BillingService.getEntitlements(user.id);

    return (
        <div className="h-screen bg-background">
            <EditorProvider entitlements={entitlements}>
                <MainEditor
                    projectId={projectId}
                    project={project}
                    initialAssets={assets}
                />
            </EditorProvider>
        </div>
    );
}
