"use client";

import { useState, type FormEvent, useRef, useEffect } from "react";
import Link from "next/link";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Link as LinkIcon,
    Loader2,
    Upload,
    Wand2,
    Play,
    Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";

type InputMode = "url" | "upload";

type JobCreationResponse = {
    job: {
        id: string;
        url: string;
        status: string;
        step: string | null;
    };
};

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

type VideoInputPipelineProps = {
    className?: string;
};

const demoSources = [
    {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        title: "Big Buck Bunny",
        thumbnail: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    },
    {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        title: "Tears of Steel",
        thumbnail: "https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    },
];

export function VideoInputPipeline({ className }: VideoInputPipelineProps) {
    const [mode, setMode] = useState<InputMode>("url");
    const [url, setUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    // const [autoStart, setAutoStart] = useState(true); // Always true now
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [inputKey, setInputKey] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Create object URL for file preview
    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setFilePreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setFilePreviewUrl(null);
        }
    }, [file]);

    const previewUrl = mode === "url" ? url : filePreviewUrl;
    const isValidPreviewUrl = previewUrl && (mode === "upload" || isValidUrl(previewUrl));

    function isValidUrl(urlString: string): boolean {
        try {
            new URL(urlString);
            return true;
        } catch {
            return false;
        }
    }

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setJobId(null);

        if (mode === "url") {
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
                        autoStart: true,
                        subtitleConfig: DEFAULT_SUBTITLE_CONFIG,
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
        } else {
            // Upload mode
            if (!file) {
                setError("업로드할 동영상 파일을 선택해주세요.");
                return;
            }

            setIsSubmitting(true);
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("autoStart", "true");
                formData.append("subtitleConfig", JSON.stringify(DEFAULT_SUBTITLE_CONFIG));

                const response = await fetch("/api/uploads", {
                    method: "POST",
                    body: formData,
                });
                const payload = (await response.json()) as UploadJobResponse & ErrorResponse;

                if (!response.ok) {
                    throw new Error(payload.error ?? "업로드를 처리할 수 없습니다.");
                }

                setJobId(payload.job.id);
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
        }
    };

    return (
        <form
            className={cn(
                "flex flex-col gap-6 rounded-3xl border bg-background/90 p-6 shadow-lg",
                className
            )}
            onSubmit={handleSubmit}
        >
            {/* Header */}
            <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    비디오 입력
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                    영상 소스를 선택하고 자막을 생성하세요
                </h2>
                <p className="text-sm text-muted-foreground">
                    URL을 입력하거나 파일을 업로드하면 STT → 번역 → SRT 생성까지 자동으로 처리됩니다.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-2xl border border-border bg-secondary/30 p-1">
                <button
                    type="button"
                    onClick={() => setMode("url")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                        mode === "url"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <LinkIcon className="size-4" />
                    URL 입력
                </button>
                <button
                    type="button"
                    onClick={() => setMode("upload")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                        mode === "upload"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Upload className="size-4" />
                    파일 업로드
                </button>
            </div>

            {/* Input Area */}
            {mode === "url" ? (
                <div className="space-y-3">
                    <label className="space-y-2 text-sm font-medium">
                        소스 URL
                        <input
                            className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-primary"
                            placeholder="https://youtube.com/watch?v=..."
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            type="url"
                        />
                    </label>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>샘플 선택:</span>
                        {demoSources.map((sample) => (
                            <button
                                key={sample.url}
                                className="rounded-full border border-border px-3 py-1 font-semibold transition hover:border-primary hover:bg-primary/10"
                                type="button"
                                onClick={() => setUrl(sample.url)}
                            >
                                {sample.title}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
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
            )}

            {/* Video Preview */}
            {isValidPreviewUrl && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">미리보기</p>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
                        <video
                            ref={videoRef}
                            src={previewUrl ?? undefined}
                            className="aspect-video w-full object-contain"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            controls={false}
                            muted
                        />
                        <button
                            type="button"
                            onClick={togglePlayPause}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100"
                        >
                            <div className="flex size-16 items-center justify-center rounded-full bg-white/90">
                                {isPlaying ? (
                                    <Pause className="size-8 text-black" />
                                ) : (
                                    <Play className="ml-1 size-8 text-black" />
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Submit button - No autoStart checkbox anymore */}
            <button
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition",
                    {
                        "opacity-70": isSubmitting,
                        "hover:bg-primary/90": !isSubmitting,
                    }
                )}
                disabled={isSubmitting}
                type="submit"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        {mode === "url" ? "작업 생성 중..." : "업로드 중..."}
                    </>
                ) : (
                    <>
                        <Wand2 className="size-4" />
                        자막 생성 시작하기
                    </>
                )}
            </button>

            {/* Error message */}
            {error ? (
                <div className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4" />
                    <div>
                        <p className="font-semibold">요청 실패</p>
                        <p>{error}</p>
                    </div>
                </div>
            ) : null}

            {/* Success message */}
            {success && jobId ? (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold">{success}</p>
                        <div className="flex items-center gap-3">
                            <Link
                                className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                                href={`/jobs/${jobId}/edit`}
                            >
                                자막 편집하기
                                <ArrowRight className="size-4" />
                            </Link>
                            <Link
                                className="inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                href={`/jobs/${jobId}`}
                            >
                                작업 상세 보기
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </form>
    );
}
