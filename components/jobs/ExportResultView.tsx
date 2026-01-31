"use client";

import { useEffect, useState, useCallback } from "react";
import { JobRecord } from "@/lib/jobs/types";
import { PageContainer } from "@/components/PageContainer";
import {
    Download,
    CheckCircle2,
    ArrowLeft,
    Loader2,
    Play,
    Film,
    Edit3,
    Check,
    X,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

interface ExportResultViewProps {
    job: JobRecord;
    projectId: string;
}

export function ExportResultView({ job: initialJob, projectId }: ExportResultViewProps) {
    const router = useRouter();
    const [job, setJob] = useState<JobRecord>(initialJob);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(job.asset?.filename || "Untitled Export");
    const [isSavingTitle, setIsSavingTitle] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Polling for job status if not done
    useEffect(() => {
        if (job.status === "done" || job.status === "error") return;

        const poll = setInterval(async () => {
            try {
                const res = await fetch(`/api/jobs/${job.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setJob(data.job);
                    if (data.job.status === "done" || data.job.status === "error") {
                        clearInterval(poll);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);

        return () => clearInterval(poll);
    }, [job.id, job.status]);

    const handleSaveTitle = async () => {
        if (!title.trim()) return;
        setIsSavingTitle(true);
        try {
            const res = await fetch(`/api/jobs/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim() })
            });
            if (res.ok) {
                setIsEditingTitle(false);
                // Update local state to reflect new filename in asset
                setJob(prev => ({
                    ...prev,
                    asset: prev.asset ? { ...prev.asset, filename: title.trim() } : prev.asset
                }));
            } else {
                throw new Error("Failed to update title");
            }
        } catch (err) {
            alert("제목 수정 중 오류가 발생했습니다.");
        } finally {
            setIsSavingTitle(false);
        }
    };

    const isProcessing = job.status !== "done" && job.status !== "error";
    const progress = Math.floor((job.progress || 0) * 100);

    return (
        <PageContainer className="py-12 max-w-5xl mx-auto">
            {/* Header Navigation */}
            <div className="mb-8 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground rounded-full"
                    onClick={() => router.push(`/projects/${projectId}/editor`)}
                >
                    <ArrowLeft className="size-4" />
                    Editor로 돌아가기
                </Button>

                <div className="flex items-center gap-2">
                    <Link href={`/projects/${projectId}/exports`}>
                        <Button variant="outline" size="sm" className="rounded-full gap-2">
                            <Film className="size-4" />
                            내보내기 기록
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Content Area (Left/Top) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Resolution/Status Badge */}
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md",
                            job.status === "done"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : job.status === "error"
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-secondary text-secondary-foreground border-border animate-pulse"
                        )}>
                            {job.status === "done" ? (
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5" />
                                    Export 완료
                                </span>
                            ) : job.status === "error" ? (
                                "Export 실패"
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="size-3.5 animate-spin" />
                                    {job.status.toUpperCase()} 진행 중
                                </span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                            ID: {job.id.slice(0, 8)}
                        </span>
                    </div>

                    {/* Title Section */}
                    <div className="space-y-2">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-3">
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-4xl font-bold tracking-tight bg-transparent border-b-2 border-primary outline-none py-1 w-full"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') setIsEditingTitle(false);
                                    }}
                                />
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-primary" onClick={handleSaveTitle} disabled={isSavingTitle}>
                                        {isSavingTitle ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => setIsEditingTitle(false)} disabled={isSavingTitle}>
                                        <X className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 group">
                                <h1 className="text-4xl font-bold tracking-tight">
                                    {job.asset?.filename || "Untitled Export"}
                                </h1>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setIsEditingTitle(true)}
                                >
                                    <Edit3 className="size-4" />
                                </Button>
                            </div>
                        )}
                        <p className="text-muted-foreground">
                            영상이 완성되었습니다. 이제 고화질 MP4 파일을 다운로드할 수 있습니다.
                        </p>
                    </div>

                    {/* Video Player Section */}
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden border shadow-2xl relative group">
                        {job.status === "done" && job.resultVideoUrl ? (
                            <video
                                key={job.resultVideoUrl}
                                src={job.resultVideoUrl}
                                controls
                                className="w-full h-full"
                                poster={job.asset?.thumbnailUrl}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center space-y-6 bg-gradient-to-br from-slate-900 to-slate-950">
                                {job.status === "error" ? (
                                    <>
                                        <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                            <X className="size-10" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-xl font-semibold">내보내기에 실패했습니다</h3>
                                            <p className="text-muted-foreground max-w-md mx-auto">
                                                {job.errorMessage || "알 수 없는 오류가 발생했습니다. 다시 시도해 주세요."}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <div className="size-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                                                {progress}%
                                            </div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h3 className="text-xl font-semibold">동영상을 렌더링하고 있습니다</h3>
                                            <p className="text-muted-foreground">잠시만 기다려 주세요. 창을 닫아도 작업은 계속됩니다.</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Right/Bottom) */}
                <div className="space-y-6">
                    <div className="bg-card rounded-3xl border p-8 shadow-sm space-y-8">
                        <section className="space-y-4">
                            <h3 className="font-semibold text-lg">내보내기 정보</h3>
                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                <div className="text-muted-foreground">형식</div>
                                <div className="font-semibold text-right">MP4 Video</div>

                                <div className="text-muted-foreground">해상도</div>
                                <div className="font-semibold text-right">
                                    {(job.sequence as any)?.resolution || "1080p (FHD)"}
                                </div>

                                <div className="text-muted-foreground">날짜</div>
                                <div className="font-semibold text-right">
                                    {new Date(job.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </section>

                        <div className="space-y-3">
                            <Button
                                className="w-full py-6 rounded-2xl gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                                disabled={job.status !== "done" || !job.resultVideoUrl}
                                onClick={() => job.resultVideoUrl && window.open(job.resultVideoUrl, '_blank')}
                            >
                                <Download className="size-5" />
                                MP4 다운로드
                            </Button>

                            <Link href={`/projects/${projectId}/editor`} className="block">
                                <Button variant="secondary" className="w-full py-5 rounded-2xl gap-2">
                                    <Play className="size-4 fill-current" />
                                    에디터에서 수정하기
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-secondary/30 rounded-3xl p-6 border border-dashed text-sm space-y-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <ExternalLink className="size-4" />
                            공유하기
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            완성된 영상 링크를 공유하여 다른 사람들과 함께 확인할 수 있습니다.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-xl"
                            onClick={() => {
                                if (job.resultVideoUrl) {
                                    navigator.clipboard.writeText(job.resultVideoUrl);
                                    alert("링크가 복사되었습니다.");
                                }
                            }}
                            disabled={!job.resultVideoUrl}
                        >
                            링크 복사
                        </Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
