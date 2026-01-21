import Link from "next/link";
import {
    Upload as UploadIcon,
    FileVideo,
    Download,
    Trash2,
    Clock,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";

// Mock data for uploads - replace with real data from API
const mockUploads = [
    {
        id: "1",
        filename: "product_demo_v2.mp4",
        size: "245 MB",
        uploadedAt: "2024-12-24 10:30",
        status: "completed",
        jobId: "job_123",
    },
    {
        id: "2",
        filename: "interview_raw.mov",
        size: "1.2 GB",
        uploadedAt: "2024-12-23 15:45",
        status: "processing",
        jobId: "job_124",
    },
    {
        id: "3",
        filename: "tutorial_ep3.mp4",
        size: "890 MB",
        uploadedAt: "2024-12-22 09:00",
        status: "completed",
        jobId: "job_125",
    },
];

const statusConfig = {
    completed: {
        label: "완료",
        icon: CheckCircle2,
        className: "text-emerald-500 bg-emerald-500/10",
    },
    processing: {
        label: "처리 중",
        icon: Clock,
        className: "text-blue-500 bg-blue-500/10",
    },
    failed: {
        label: "실패",
        icon: Trash2,
        className: "text-red-500 bg-red-500/10",
    },
};

interface UploadsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function UploadsPage({ params }: UploadsPageProps) {
    const { id } = await params;

    return (
        <PageContainer className="gap-8 py-8">
            {/* Header */}
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        업로드 관리
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        내 영상 파일
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        업로드한 영상 파일과 처리 결과물을 확인하고 관리합니다.
                    </p>
                </div>
                <Link
                    href={`/projects/${id}/studio`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                    <UploadIcon className="size-4" />
                    새 영상 업로드
                </Link>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    <p className="text-xs uppercase text-muted-foreground">총 업로드</p>
                    <p className="mt-2 text-3xl font-semibold">15</p>
                    <p className="mt-1 text-xs text-muted-foreground">이번 달</p>
                </article>
                <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    <p className="text-xs uppercase text-muted-foreground">처리 완료</p>
                    <p className="mt-2 text-3xl font-semibold">12</p>
                    <p className="mt-1 text-xs text-emerald-500">80% 성공률</p>
                </article>
                <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                    <p className="text-xs uppercase text-muted-foreground">스토리지 사용</p>
                    <p className="mt-2 text-3xl font-semibold">4.2 GB</p>
                    <p className="mt-1 text-xs text-muted-foreground">/ 10 GB</p>
                </article>
            </section>

            {/* Upload List */}
            <section className="rounded-2xl border bg-card/70 shadow-sm">
                <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">최근 업로드</h2>
                </div>
                <div className="divide-y">
                    {mockUploads.map((upload) => {
                        const status = statusConfig[upload.status as keyof typeof statusConfig];
                        const StatusIcon = status.icon;
                        return (
                            <div
                                key={upload.id}
                                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="rounded-lg bg-primary/10 p-2.5">
                                        <FileVideo className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{upload.filename}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {upload.size} · {upload.uploadedAt}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                                    >
                                        <StatusIcon className="size-3" />
                                        {status.label}
                                    </span>
                                    <Link
                                        href={`/projects/${id}/jobs`}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                    >
                                        Job 보기 <ArrowRight className="size-3" />
                                    </Link>
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                        aria-label="다운로드"
                                    >
                                        <Download className="size-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Empty State (hidden when there are uploads) */}
            {mockUploads.length === 0 && (
                <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-card/50 p-12 text-center">
                    <div className="rounded-full bg-primary/10 p-4">
                        <UploadIcon className="size-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">아직 업로드한 파일이 없습니다</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            영상 파일을 업로드하여 자막 자동화를 시작하세요.
                        </p>
                    </div>
                    <Link
                        href={`/projects/${id}/studio`}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        첫 영상 업로드하기
                    </Link>
                </section>
            )}
        </PageContainer>
    );
}
