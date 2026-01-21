"use client";

import { Suspense, useEffect, useState, useCallback, use } from "react";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { CaptionList } from "@/components/editor/CaptionList";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { SubtitleCue } from "@/lib/jobs/types";

function EditorLoading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
            <Loader2 className="size-8 animate-spin text-primary" />
        </div>
    );
}

type PageParams = {
    id: string;    // project id
    jobId: string; // job id
};

export default function ProjectEditorPage({ params }: { params: Promise<PageParams> }) {
    const { id: projectId, jobId } = use(params);

    return (
        <Suspense fallback={<EditorLoading />}>
            <EditorClient projectId={projectId} jobId={jobId} />
        </Suspense>
    );
}

function EditorClient({ projectId, jobId }: { projectId: string; jobId: string }) {
    const { toast } = useToast();
    const [job, setJob] = useState<any>(null);
    const [captions, setCaptions] = useState<SubtitleCue[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Initial Fetch
    useEffect(() => {
        async function loadData() {
            try {
                const jobRes = await fetch(`/api/jobs/${jobId}`);
                if (!jobRes.ok) throw new Error("Failed to load job");
                const { job: loadedJob } = await jobRes.json();

                const capRes = await fetch(`/api/jobs/${jobId}/captions`);
                if (!capRes.ok) throw new Error("Failed to load captions");
                const { captions: loadedCaptions } = await capRes.json();

                setJob(loadedJob);
                setCaptions(loadedCaptions?.cues || loadedCaptions || []);
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load editor resources."
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [jobId, toast]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/jobs/${jobId}/captions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ captions }),
            });

            if (!res.ok) throw new Error("Failed to save");

            setHasUnsavedChanges(false);
            toast({
                title: "저장 완료",
                description: "자막이 성공적으로 저장되었습니다.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "저장에 실패했습니다."
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCueUpdate = useCallback((cueId: number, text: string) => {
        setCaptions(prev => prev.map(c => c.id === cueId ? { ...c, text } : c));
        setHasUnsavedChanges(true);
    }, []);

    const handleVideoTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handleSeek = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    if (isLoading) return <EditorLoading />;
    if (!job) return <div className="p-8 text-center text-muted-foreground">Job을 찾을 수 없습니다.</div>;

    const videoSrc = job.asset?.signedUrl || job.url;

    return (
        <EditorLayout
            header={
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/projects/${projectId}/jobs`}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-lg">{job.asset?.filename || "자막 편집"}</h1>
                            <p className="text-xs opacity-70">
                                {hasUnsavedChanges ? "저장되지 않은 변경사항" : "모든 변경사항 저장됨"}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        variant={hasUnsavedChanges ? "default" : "secondary"}
                        className="gap-2"
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        저장
                    </Button>
                </div>
            }
            video={
                <VideoPlayer
                    src={videoSrc}
                    cues={captions}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    onTimeUpdate={handleVideoTimeUpdate}
                    onPlayPause={setIsPlaying}
                />
            }
            sidebar={
                <CaptionList
                    cues={captions}
                    currentTime={currentTime}
                    onCueClick={handleSeek}
                    onCueUpdate={handleCueUpdate}
                />
            }
        />
    );
}
