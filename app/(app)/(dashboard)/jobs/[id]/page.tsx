"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Loader2,
    Pencil,
    Play,
    RefreshCcw,
    RotateCcw,
    Trash2,
    Video,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { cn, formatCurrency } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type JobStatus =
    | "pending"
    | "downloading"
    | "processing"
    | "stt"
    | "translating"
    | "subtitle"
    | "uploading"
    | "preprocessing"
    | "compositing"
    | "awaiting_edit"
    | "editing"
    | "ready_to_export"
    | "exporting"
    | "done"
    | "error"
    | "canceled";

type JobRecord = {
    id: string;
    userId: string | null;
    url: string;
    status: JobStatus;
    step: string | null;
    progress: number;
    resultSrtUrl: string | null;
    resultVideoUrl: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
    cost?: number;
};

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: "대기 중", color: "text-muted-foreground", icon: Clock },
    downloading: { label: "다운로드 중", color: "text-primary", icon: Loader2 },
    processing: { label: "처리 중", color: "text-primary", icon: Loader2 },
    stt: { label: "음성 인식 중", color: "text-primary", icon: Loader2 },
    translating: { label: "번역 중", color: "text-primary", icon: Loader2 },
    subtitle: { label: "자막 생성 중", color: "text-primary", icon: Loader2 },
    uploading: { label: "업로드 중", color: "text-primary", icon: Loader2 },
    preprocessing: { label: "전처리 중", color: "text-primary", icon: Loader2 },
    compositing: { label: "합성 중", color: "text-primary", icon: Loader2 },
    awaiting_edit: { label: "편집 대기", color: "text-amber-500", icon: Pencil },
    editing: { label: "편집 중", color: "text-blue-500", icon: Pencil },
    ready_to_export: { label: "내보내기 준비", color: "text-emerald-500", icon: CheckCircle2 },
    exporting: { label: "내보내는 중", color: "text-primary", icon: Loader2 },
    done: { label: "완료", color: "text-emerald-500", icon: CheckCircle2 },
    error: { label: "오류", color: "text-destructive", icon: AlertTriangle },
    canceled: { label: "취소됨", color: "text-muted-foreground", icon: XCircle },
};

// ============================================================================
// Page Component
// ============================================================================

type Params = Promise<{ id: string }>;

export default function JobDetailPage(props: { params: Params }) {
    const params = use(props.params);
    const jobId = params.id;
    const router = useRouter();

    const [job, setJob] = useState<JobRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch job data
    const fetchJob = useCallback(async () => {
        try {
            const res = await fetch(`/api/jobs/${jobId}`);
            if (!res.ok) {
                throw new Error("작업을 불러올 수 없습니다");
            }
            const data = await res.json();
            setJob(data.job);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류");
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    // Initial fetch
    useEffect(() => {
        void fetchJob();
    }, [fetchJob]);

    // Polling for active jobs
    useEffect(() => {
        if (!job) return;
        const isActive = ![
            "done", "error", "canceled",
            "awaiting_edit", "editing", "ready_to_export"
        ].includes(job.status);

        if (!isActive) return;

        const interval = setInterval(() => {
            void fetchJob();
        }, 3000);

        return () => clearInterval(interval);
    }, [job, fetchJob]);

    // Action handlers
    const handleRetry = async () => {
        setActionLoading("retry");
        try {
            const res = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
            if (!res.ok) throw new Error("재시도 실패");
            await fetchJob();
        } catch {
            alert("재시도에 실패했습니다");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm("이 작업을 취소하시겠습니까?")) return;
        setActionLoading("cancel");
        try {
            const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
            if (!res.ok) throw new Error("취소 실패");
            await fetchJob();
        } catch {
            alert("취소에 실패했습니다");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm("이 작업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
        setActionLoading("delete");
        try {
            const res = await fetch(`/api/jobs/${jobId}/delete`, { method: "DELETE" });
            if (!res.ok) throw new Error("삭제 실패");
            router.push("/jobs");
        } catch {
            alert("삭제에 실패했습니다");
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <PageContainer>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            </PageContainer>
        );
    }

    if (error || !job) {
        return (
            <PageContainer>
                <div className="flex h-96 flex-col items-center justify-center gap-4">
                    <AlertTriangle className="size-12 text-destructive" />
                    <p className="text-destructive">{error ?? "작업을 찾을 수 없습니다"}</p>
                    <Link href="/jobs" className="text-primary hover:underline">
                        ← 작업 목록으로 돌아가기
                    </Link>
                </div>
            </PageContainer>
        );
    }

    const statusConfig = STATUS_CONFIG[job.status];
    const StatusIcon = statusConfig.icon;
    const isActive = !["done", "error", "canceled", "awaiting_edit", "editing", "ready_to_export"].includes(job.status);
    const canEdit = ["done", "awaiting_edit", "editing", "ready_to_export"].includes(job.status);

    return (
        <PageContainer>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/jobs"
                            className="rounded-lg p-2 hover:bg-secondary"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold">작업 상세</h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                {job.id}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Link
                                href={`/jobs/${jobId}/edit`}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                <Pencil className="size-4" />
                                자막 편집
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={() => void fetchJob()}
                            className="rounded-lg border p-2 hover:bg-secondary"
                            title="새로고침"
                        >
                            <RefreshCcw className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Status Card */}
                <div className="rounded-2xl border bg-card p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex size-12 items-center justify-center rounded-full",
                            job.status === "error" && "bg-destructive/10",
                            isActive && "bg-primary/10",
                            canEdit && "bg-amber-500/10",
                            job.status === "done" && "bg-emerald-500/10",
                        )}>
                            <StatusIcon className={cn(
                                "size-6",
                                statusConfig.color,
                                isActive && "animate-spin"
                            )} />
                        </div>
                        <div className="flex-1">
                            <p className={cn("text-lg font-semibold", statusConfig.color)}>
                                {statusConfig.label}
                            </p>
                            {job.step && isActive && (
                                <p className="text-sm text-muted-foreground">
                                    현재 단계: {job.step}
                                </p>
                            )}
                            {job.errorMessage && (
                                <p className="mt-1 text-sm text-destructive">
                                    {job.errorMessage}
                                </p>
                            )}
                        </div>
                        {isActive && (
                            <div className="text-right">
                                <p className="text-2xl font-bold tabular-nums">
                                    {Math.round(job.progress * 100)}%
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {isActive && (
                        <div className="mt-4">
                            <div className="h-2 overflow-hidden rounded-full bg-secondary">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${job.progress * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Source Info */}
                    <div className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">소스 정보</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground">URL</p>
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                    {job.url.length > 50 ? `${job.url.slice(0, 50)}...` : job.url}
                                    <ExternalLink className="size-3" />
                                </a>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">생성일</p>
                                <p className="text-sm">{new Date(job.createdAt).toLocaleString("ko-KR")}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">마지막 업데이트</p>
                                <p className="text-sm">{new Date(job.updatedAt).toLocaleString("ko-KR")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Cost Info */}
                    <div className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">비용 정보</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground">총 비용</p>
                                <p className="text-xl font-bold text-foreground">
                                    {job.cost ? formatCurrency(job.cost) : "무료 (Free)"}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <p>* 플랜 정책에 따라 과금된 금액입니다.</p>
                                <Link href="/usage" className="underline hover:text-primary">
                                    상세 내역 보기
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">결과물</h3>
                        <div className="space-y-3">
                            {job.resultSrtUrl ? (
                                <a
                                    href={job.resultSrtUrl}
                                    download
                                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-secondary"
                                >
                                    <Download className="size-5 text-emerald-500" />
                                    <div>
                                        <p className="text-sm font-medium">SRT 자막 파일</p>
                                        <p className="text-xs text-muted-foreground">다운로드 가능</p>
                                    </div>
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-muted-foreground">
                                    <Download className="size-5" />
                                    <p className="text-sm">SRT 파일 없음</p>
                                </div>
                            )}

                            {job.resultVideoUrl ? (
                                <a
                                    href={job.resultVideoUrl}
                                    download
                                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-secondary"
                                >
                                    <Video className="size-5 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium">자막 영상 파일</p>
                                        <p className="text-xs text-muted-foreground">다운로드 가능</p>
                                    </div>
                                </a>
                            ) : (
                                <div className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-muted-foreground">
                                    <Video className="size-5" />
                                    <p className="text-sm">영상 파일 없음</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    {(job.status === "error" || job.status === "canceled") && (
                        <button
                            type="button"
                            onClick={() => void handleRetry()}
                            disabled={actionLoading === "retry"}
                            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                        >
                            {actionLoading === "retry" ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <RotateCcw className="size-4" />
                            )}
                            재시도
                        </button>
                    )}

                    {isActive && (
                        <button
                            type="button"
                            onClick={() => void handleCancel()}
                            disabled={actionLoading === "cancel"}
                            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                            {actionLoading === "cancel" ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <XCircle className="size-4" />
                            )}
                            취소
                        </button>
                    )}

                    {!isActive && (
                        <button
                            type="button"
                            onClick={() => void handleDelete()}
                            disabled={actionLoading === "delete"}
                            className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                            {actionLoading === "delete" ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            삭제
                        </button>
                    )}
                </div>
            </div>
        </PageContainer >
    );
}
