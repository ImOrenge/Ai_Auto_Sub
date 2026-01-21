"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type JobStatus =
  | "pending"
  | "downloading"
  | "processing"
  | "stt"
  | "translating"
  | "subtitle"
  | "done"
  | "error";

type JobRecord = {
  id: string;
  url: string;
  status: JobStatus;
  step: string | null;
  progress: number;
  updatedAt: string;
};

type JobsResponse = {
  jobs: JobRecord[];
};

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "대기 중",
  downloading: "다운로드",
  processing: "처리 중",
  stt: "STT",
  translating: "번역",
  subtitle: "자막 생성",
  done: "완료",
  error: "오류",
};

const STATUS_BADGES: Record<JobStatus, string> = {
  pending: "bg-secondary/80 text-secondary-foreground",
  downloading: "bg-primary/10 text-primary",
  processing: "bg-primary/10 text-primary",
  stt: "bg-primary/10 text-primary",
  translating: "bg-primary/10 text-primary",
  subtitle: "bg-primary/10 text-primary",
  done: "bg-emerald-500/15 text-emerald-700",
  error: "bg-destructive/15 text-destructive",
};

export function JobQueue() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (useIndicator = false) => {
    try {
      if (useIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const response = await fetch("/api/jobs?limit=20", { cache: "no-store" });
      const payload = (await response.json()) as JobsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "작업 목록을 불러올 수 없습니다.");
      }
      setJobs(payload.jobs ?? []);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "작업 목록을 불러올 수 없습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  return (
    <section className="space-y-4 rounded-3xl border bg-card/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">작업 큐</p>
          <p className="text-sm text-muted-foreground">최근 20개의 작업을 모니터링합니다.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold transition hover:bg-secondary disabled:opacity-60"
          disabled={isRefreshing}
          onClick={() => fetchJobs(true)}
          type="button"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              새로 고침 중
            </>
          ) : (
            <>
              <RefreshCcw className="size-4" />
              새로 고침
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-auto rounded-2xl border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">URL</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">단계</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">진행률</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">업데이트</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-center text-muted-foreground" colSpan={6}>
                  <div className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    작업 목록을 불러오는 중입니다...
                  </div>
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-center text-muted-foreground" colSpan={6}>
                  표시할 작업이 없습니다. 새 Job을 생성해보세요.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                        STATUS_BADGES[job.status],
                      )}
                    >
                      {STATUS_LABELS[job.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    <span title={job.url}>{truncate(job.url)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{job.step ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {Math.round(Math.min(Math.max(job.progress, 0), 1) * 100)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(job.updatedAt)}</td>
                  <td className="px-4 py-3 text-xs">
                    <Link className="text-primary underline-offset-4 hover:underline" href={`/jobs/${job.id}`}>
                      상세 보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function truncate(value: string, maxLength = 36) {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
}

function formatRelativeTime(dateInput: string) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}
