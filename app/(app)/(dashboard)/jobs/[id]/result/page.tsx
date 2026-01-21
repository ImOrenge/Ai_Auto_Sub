"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Download, ArrowLeft, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { type JobRecord } from "@/lib/jobs/types";

// ============================================================================
// Job Result Page
// ============================================================================

export default function JobResultPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const jobId = params.id;

    const [job, setJob] = useState<JobRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);
                if (!res.ok) throw new Error("작업 정보를 불러올 수 없습니다.");
                const data = await res.json();
                setJob(data.job);
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 오류");
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [jobId]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-destructive">{error ?? "작업을 찾을 수 없습니다"}</p>
                <Link href="/jobs" className="text-primary hover:underline">
                    ← 작업 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    const isDone = job.status === "done";
    const isError = job.status === "error";

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="flex items-center border-b px-6 py-4">
                <Link href="/jobs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" />
                    <span>목록으로</span>
                </Link>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mx-auto max-w-lg space-y-8">
                    {/* Status Icon */}
                    <div className="flex justify-center">
                        {isDone ? (
                            <div className="flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                                <CheckCircle className="size-10" />
                            </div>
                        ) : isError ? (
                            <div className="flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                                <AlertCircle className="size-10" />
                            </div>
                        ) : (
                            <div className="flex size-20 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                                <Loader2 className="size-10 animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Title & Message */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">
                            {isDone ? "작업이 완료되었습니다!" : isError ? "작업 처리 중 오류 발생" : "처리 중..."}
                        </h1>
                        <p className="text-muted-foreground">
                            {isDone
                                ? "영상이 성공적으로 렌더링되었습니다. 아래 버튼을 눌러 다운로드하세요."
                                : isError
                                    ? job.errorMessage || "알 수 없는 오류가 발생했습니다."
                                    : "잠시만 기다려주세요."}
                        </p>
                    </div>

                    {/* Actions Card */}
                    {isDone && (
                        <div className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="mb-6 space-y-4">
                                {job.resultVideoUrl && (
                                    <a
                                        href={job.resultVideoUrl}
                                        download={`video-${job.id.slice(0, 8)}.mp4`}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
                                    >
                                        <Download className="size-5" />
                                        MP4 영상 다운로드
                                    </a>
                                )}
                                {job.resultSrtUrl && (
                                    <a
                                        href={job.resultSrtUrl}
                                        download={`subtitles-${job.id.slice(0, 8)}.srt`}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border bg-background px-4 py-3 font-medium hover:bg-secondary"
                                    >
                                        <Download className="size-5" />
                                        SRT 자막 다운로드
                                    </a>
                                )}
                            </div>

                            <hr className="my-4" />

                            {/* Billing Info */}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">차감 포인트/비용</span>
                                <span className="font-semibold">{formatCurrency(job.cost ?? 0)}</span>
                            </div>

                            {/* Detailed Usage Logs */}
                            {job.usageLogs && job.usageLogs.length > 0 && (
                                <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-left text-xs">
                                    <p className="mb-2 font-medium text-muted-foreground">상세 이용 내역</p>
                                    <div className="space-y-1">
                                        {job.usageLogs.map((log) => (
                                            <div key={log.id} className="flex justify-between">
                                                <span>
                                                    {log.metric === "stt_minutes" ? "음성 인식 (STT)" : "번역"}
                                                    <span className="ml-1 text-muted-foreground">
                                                        ({log.quantity.toFixed(1)} {log.metric === "stt_minutes" ? "분" : "개"})
                                                    </span>
                                                    {log.reason === "included" && (
                                                        <span className="ml-1 rounded bg-green-500/10 px-1 py-0.5 text-[10px] text-green-600">
                                                            무료 제공
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {formatCurrency(log.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Back Link */}
                    <div className="pt-4">
                        <Link href="/jobs" className="text-sm text-muted-foreground hover:underline">
                            대시보드로 이동
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
