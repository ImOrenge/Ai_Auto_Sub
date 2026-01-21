"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Upload, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubtitleConfigForm } from "@/components/SubtitleConfigForm";
import type { SubtitleConfig } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";

type UploadJobResponse = {
  job: {
    id: string;
    url: string;
  };
  upload: {
    publicUrl: string;
  };
};

type ErrorResponse = {
  error?: string;
};

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [autoStart, setAutoStart] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>(DEFAULT_SUBTITLE_CONFIG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setJobId(null);
    setUploadUrl(null);

    if (!file) {
      setError("업로드할 동영상 파일을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("autoStart", autoStart ? "true" : "false");
      formData.append("subtitleConfig", JSON.stringify(subtitleConfig));

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadJobResponse & ErrorResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "업로드를 처리할 수 없습니다.");
      }

      setJobId(payload.job.id);
      setUploadUrl(payload.upload.publicUrl);
      setSuccess("업로드가 완료되었어요. 파이프라인을 확인해보세요!");
      setFile(null);
      setInputKey((value) => value + 1);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "업로드 중 오류가 발생했습니다.";
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
          파일 업로드
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          로컬에 있는 동영상을 바로 업로드해서 자막을 만들어보세요
        </h2>
        <p className="text-sm text-muted-foreground">
          브라우저에서 파일을 전송하면 Supabase Storage로 올라가고, 같은 파이프라인(STT → 번역 →
          캡션 적용)이 자동으로 실행됩니다.
        </p>
      </div>

      <div className="space-y-3 text-sm font-medium">
        <span>동영상 파일</span>
        <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-4">
          <input
            key={inputKey}
            accept="video/*,audio/*"
            className="hidden"
            id="upload-file-input"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
            }}
            type="file"
          />
          <label
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 py-6 text-center transition hover:border-primary"
            htmlFor="upload-file-input"
          >
            <Upload className="size-6 text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {file ? file.name : "여기를 눌러 파일을 선택하세요"}
              </p>
              <p className="text-xs text-muted-foreground">
                최대 250MB, MP4/MOV/WEBM 등 표준 포맷을 지원합니다.
              </p>
            </div>
          </label>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm font-medium">
        <input
          checked={autoStart}
          className="size-4 rounded border-border text-primary focus-visible:ring-primary"
          onChange={(event) => setAutoStart(event.target.checked)}
          type="checkbox"
        />
        업로드 후 자동으로 STT/번역/캡션 파이프라인을 실행합니다.
      </label>

      {/* 자막 스타일 설정 토글 */}
      <button
        type="button"
        onClick={() => setShowConfig(!showConfig)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition"
      >
        <Settings2 className="size-4" />
        {showConfig ? "자막 설정 접기" : "자막 스타일 설정하기"}
      </button>

      {showConfig && (
        <SubtitleConfigForm
          value={subtitleConfig}
          onChange={setSubtitleConfig}
        />
      )}

      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition",
          { "opacity-70": isSubmitting, "hover:bg-primary/90": !isSubmitting },
        )}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            업로드 중...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            동영상 업로드 시작
          </>
        )}
      </button>

      {error ? (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4" />
          <div>
            <p className="font-semibold">업로드 실패</p>
            <p>{error}</p>
          </div>
        </div>
      ) : null}

      {success && jobId ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-4" />
            <p className="font-semibold">{success}</p>
          </div>
          {uploadUrl ? (
            <p className="text-xs text-muted-foreground">
              업로드된 파일:{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={uploadUrl}
                rel="noreferrer"
                target="_blank"
              >
                {uploadUrl}
              </a>
            </p>
          ) : null}
          <Link
            className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
            href={`/jobs/${jobId}`}
          >
            작업 상세로 이동
          </Link>
        </div>
      ) : null}
    </form>
  );
}
