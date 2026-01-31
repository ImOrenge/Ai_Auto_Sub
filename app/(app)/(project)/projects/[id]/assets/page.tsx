import { createClient } from "@/lib/supabase/server";
import { listAssets } from "@/lib/assets/repository";
import { notFound } from "next/navigation";
import { AssetsHubClient } from "@/components/assets/AssetsHubClient";
import { PageContainer } from "@/components/PageContainer";

interface AssetsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function AssetsPage({ params }: AssetsPageProps) {
    const { id: projectId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch initial assets (limit 100 for now)
    const { assets } = await listAssets(supabase, user.id, projectId, 100);

    return (
        <PageContainer className="gap-8 py-8">
            <div className="space-y-1">
                <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    리소스 관리
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Media Assets Hub
                </h1>
                <p className="text-sm text-muted-foreground">
                    프로젝트에 사용되는 모든 영상 및 오디오 리소스를 중앙에서 관리합니다.
                </p>
            </div>

            <AssetsHubClient
                initialAssets={assets}
                projectId={projectId}
            />
        </PageContainer>
    );
}
