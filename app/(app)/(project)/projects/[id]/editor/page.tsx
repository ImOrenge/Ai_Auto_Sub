import { MainEditor } from "@/components/editor/MainEditor";
import { EditorProvider } from "@/components/editor/EditorContext";
import { createClient } from "@/lib/supabase/server";
import { listAssets } from "@/lib/assets/repository";
import { notFound } from "next/navigation";

interface ProjectEditorPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectEditorPage({ params }: ProjectEditorPageProps) {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Fetch user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch initial assets for the project
    const { assets } = await listAssets(supabase, user.id, projectId, 50);

    return (
        <div className="h-screen bg-background">
            <EditorProvider>
                <MainEditor
                    projectId={projectId}
                    initialAssets={assets}
                />
            </EditorProvider>
        </div>
    );
}
