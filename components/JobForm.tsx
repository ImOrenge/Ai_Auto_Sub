"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type JobCreationResponse = {
  job: {
    id: string;
    url: string;
    status: string;
    step: string | null;
  };
};

type ErrorResponse = {
  error?: string;
};

const demoSources = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
];

export function JobForm() {
  const [url, setUrl] = useState("");
  const [autoStart, setAutoStart] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setJobId(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("영상이나 음원이 포함된 URL을 입력해주세요.");
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError("유효한 URL 형식이 아닙니다. https://example.com/video.mp4 형태로 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: trimmedUrl,
          autoStart,
        }),
      });
      const payload = (await response.json()) as JobCreationResponse & ErrorResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "작업을 생성할 수 없습니다.");
      }

      setJobId(payload.job.id);
      setSuccess("작업이 생성되었습니다. 진행 상황을 확인해보세요!");
      setUrl("");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "작업 생성 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-6 rounded-3xl border bg-background/90 p-6 shadow-lg"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Job 요청
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          영상이 있는 곳의 링크를 붙여넣고 바로 시작하세요
        </h2>
        <p className="text-sm text-muted-foreground">
          AutoSubAI가 URL을 분석하고 오디오를 추출한 뒤, STT → 번역 → SRT 생성까지 한 번에 처리합니다.
        </p>
      </div>

      <label className="space-y-2 text-sm font-medium">
        소스 URL
        <div className="space-y-2">
          <input
            className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-primary"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            type="url"
            required
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>샘플 링크</span>
            {demoSources.map((sample) => (
              <button
                key={sample}
                className="rounded-full border border-border px-3 py-1 font-semibold transition hover:border-primary"
                type="button"
                onClick={() => setUrl(sample)}
              >
                {new URL(sample).hostname.replace("www.", "")}
              </button>
            ))}
          </div>
        </div>
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm font-medium">
        <input
          checked={autoStart}
          className="size-4 rounded border-border text-primary focus-visible:ring-primary"
          onChange={(event) => setAutoStart(event.target.checked)}
          type="checkbox"
        />
        URL을 등록하면 즉시 파이프라인(STT/번역/SRT)을 실행합니다.
      </label>

      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition",
          {
            "opacity-70": isSubmitting,
            "hover:bg-primary/90": !isSubmitting,
          },
        )}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            작업 생성 중...
          </>
        ) : (
          <>
            <Wand2 className="size-4" />
            자막 생성 시작하기
          </>
        )}
      </button>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4" />
          <div>
            <p className="font-semibold">요청 실패</p>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {success && jobId ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{success}</p>
            <Link
              className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
              href={`/jobs/${jobId}`}
            >
              작업 상세 보기
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </form>
  );
}
