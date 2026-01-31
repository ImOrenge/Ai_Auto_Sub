import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/PageContainer";
import { ExportGallery } from "@/components/jobs/ExportGallery";
import { notFound } from "next/navigation";
import { FileVideo, Search } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { selectJobsWithFilters } from "@/lib/jobs/repository";

interface ExportsPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectExportsPage({ params }: ExportsPageProps) {
    const { id: projectId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch ONLY completed jobs for this project using repository function
    let jobs: any[] = [];
    try {
        const result = await selectJobsWithFilters({
            projectId,
            status: "done"
        });
        jobs = result.jobs;
    } catch (error: any) {
        console.error("Failed to fetch exports:", error.message || error);
    }

    const exportCount = jobs.length;

    return (
        <PageContainer className="gap-8 py-8">
            {/* Header */}
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground group">
                        <FileVideo className="size-3 transition-transform group-hover:scale-110" />
                        작업 완료 내역
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">Export History</h1>
                    <p className="text-sm text-muted-foreground">
                        내보내기가 완료된 모든 영상 결과물을 한눈에 확인하고 관리하세요.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="파일 이름 검색..."
                            className="pl-9 pr-4 py-2 rounded-full border bg-card/50 text-sm focus:bg-card focus:ring-2 focus:ring-primary/20 transition-all outline-none w-64"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-4">
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{exportCount}</span>
                    <span>개 결과물</span>
                </div>
                <div className="size-1 bg-muted-foreground/30 rounded-full" />
                <Link
                    href={`/projects/${projectId}/jobs`}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                >
                    진행 중인 작업 보기
                </Link>
            </div>

            {/* Gallery View */}
            <ExportGallery
                jobs={jobs || []}
                projectId={projectId}
            />
        </PageContainer>
    );
}
