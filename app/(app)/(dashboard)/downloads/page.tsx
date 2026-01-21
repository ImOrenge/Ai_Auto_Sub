"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Download,
    FileText,
    Video,
    Loader2,
    RefreshCcw,
    CheckCircle2,
    Clock,
    ExternalLink,
    Trash2,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type JobRecord = {
    id: string;
    url: string;
    status: string;
    resultSrtUrl: string | null;
    resultVideoUrl: string | null;
    createdAt: string;
    updatedAt: string;
};

// ============================================================================
// Page Component
// ============================================================================

export default function DownloadsPage() {
    const [jobs, setJobs] = useState<JobRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchJobs = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/jobs?limit=100");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            // Filter to only show jobs with results
            const jobsWithResults = (data.jobs as JobRecord[]).filter(
                (job) =>
                    job.status === "done" ||
                    job.status === "ready_to_export" ||
                    job.resultSrtUrl ||
                    job.resultVideoUrl
            );
            setJobs(jobsWithResults);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchJobs();
    }, [fetchJobs]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getSourceName = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("youtube")) return "YouTube";
            if (urlObj.hostname.includes("supabase")) return "업로드 파일";
            return urlObj.hostname.replace("www.", "");
        } catch {
            return url.slice(0, 30);
        }
    };

    return (
        <PageContainer>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">다운로드</h1>
                        <p className="text-sm text-muted-foreground">
                            완료된 작업의 자막과 영상을 다운로드하세요
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void fetchJobs()}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
                    >
                        <RefreshCcw className={cn("size-4", isLoading && "animate-spin")} />
                        새로고침
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && jobs.length === 0 ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                ) : jobs.length === 0 ? (
                    /* Empty State */
                    <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed">
                        <Download className="size-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium">다운로드 가능한 파일이 없습니다</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            작업을 완료하면 여기에 다운로드 링크가 표시됩니다
                        </p>
                        <Link
                            href="/dashboard"
                            className="mt-4 text-sm text-primary hover:underline"
                        >
                            새 작업 시작하기 →
                        </Link>
                    </div>
                ) : (
                    /* Downloads Grid */
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                className="rounded-2xl border bg-card p-5 transition hover:shadow-md"
                            >
                                {/* Job Header */}
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {getSourceName(job.url)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(job.updatedAt)}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                            job.status === "done"
                                                ? "bg-emerald-500/15 text-emerald-700"
                                                : "bg-amber-500/15 text-amber-700"
                                        )}
                                    >
                                        {job.status === "done" ? (
                                            <CheckCircle2 className="size-3" />
                                        ) : (
                                            <Clock className="size-3" />
                                        )}
                                        {job.status === "done" ? "완료" : "준비됨"}
                                    </span>
                                </div>

                                {/* Download Links */}
                                <div className="space-y-2">
                                    {job.resultSrtUrl && (
                                        <a
                                            href={job.resultSrtUrl}
                                            download
                                            className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-secondary"
                                        >
                                            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                                                <FileText className="size-5 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">SRT 자막</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    자막 파일 다운로드
                                                </p>
                                            </div>
                                            <Download className="size-4 text-muted-foreground" />
                                        </a>
                                    )}

                                    {job.resultVideoUrl && (
                                        <a
                                            href={job.resultVideoUrl}
                                            download
                                            className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-secondary"
                                        >
                                            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                                                <Video className="size-5 text-purple-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">MP4 영상</p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    자막이 번인된 영상
                                                </p>
                                            </div>
                                            <Download className="size-4 text-muted-foreground" />
                                        </a>
                                    )}

                                    {!job.resultSrtUrl && !job.resultVideoUrl && (
                                        <div className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-muted-foreground">
                                            <Clock className="size-5" />
                                            <p className="text-sm">아직 다운로드 가능한 파일이 없습니다</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex items-center gap-2 pt-3 border-t">
                                    <Link
                                        href={`/jobs/${job.id}/edit`}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        편집기 열기
                                    </Link>
                                    <span className="text-muted-foreground">·</span>
                                    <Link
                                        href={`/jobs/${job.id}`}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        상세 보기
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Stats */}
                {jobs.length > 0 && (
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border bg-card p-4 text-center">
                            <p className="text-3xl font-bold">{jobs.length}</p>
                            <p className="text-sm text-muted-foreground">전체 작업</p>
                        </div>
                        <div className="rounded-2xl border bg-card p-4 text-center">
                            <p className="text-3xl font-bold text-blue-500">
                                {jobs.filter((j) => j.resultSrtUrl).length}
                            </p>
                            <p className="text-sm text-muted-foreground">SRT 파일</p>
                        </div>
                        <div className="rounded-2xl border bg-card p-4 text-center">
                            <p className="text-3xl font-bold text-purple-500">
                                {jobs.filter((j) => j.resultVideoUrl).length}
                            </p>
                            <p className="text-sm text-muted-foreground">MP4 영상</p>
                        </div>
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
