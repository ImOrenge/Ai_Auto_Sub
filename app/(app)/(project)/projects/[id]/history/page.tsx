import { PageContainer } from "@/components/PageContainer";
import { History, Clock, ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

interface HistoryPageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectHistoryPage({ params }: HistoryPageProps) {
    const { id: projectId } = await params;

    return (
        <PageContainer className="gap-8 py-12">
            <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <History className="size-10 text-primary animate-pulse" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Work History & Versions</h1>
                    <p className="text-muted-foreground">
                        편집 이력 및 버전 관리 기능이 준비 중입니다.
                        곧 작업한 내용을 타임라인별로 확인하고 이전 상태로 복원할 수 있게 됩니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="p-6 border rounded-2xl bg-card text-left space-y-2 opacity-50">
                        <div className="flex items-center gap-2 font-semibold">
                            <Clock className="size-4" />
                            <span>자동 저장 내역</span>
                        </div>
                        <p className="text-sm text-muted-foreground">분 단위로 자동 저장된 작업 내역을 확인합니다.</p>
                    </div>
                    <div className="p-6 border rounded-2xl bg-card text-left space-y-2 opacity-50">
                        <div className="flex items-center gap-2 font-semibold">
                            <Construction className="size-4" />
                            <span>수동 스냅샷</span>
                        </div>
                        <p className="text-sm text-muted-foreground">주요 편집 시점을 스냅샷으로 저장하고 관리합니다.</p>
                    </div>
                </div>

                <Link
                    href={`/projects/${projectId}/editor`}
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                    <ArrowLeft className="size-4" />
                    에디터로 돌아가기
                </Link>
            </div>
        </PageContainer>
    );
}
