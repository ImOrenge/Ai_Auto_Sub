"use client";

import { Suspense, useEffect, useState, useCallback, use } from "react";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { CaptionList } from "@/components/editor/CaptionList";
import { Loader2, ArrowLeft, Save, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast"; // Assuming toast exists
import { SubtitleCue } from "@/lib/jobs/types";
import { useRouter } from "next/navigation";

function EditorLoading() {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="size-8 animate-spin text-primary" />
        </div>
    );
}

// Page Component
export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <Suspense fallback={<EditorLoading />}>
            <EditorClient id={id} />
        </Suspense>
    );
}

function EditorClient({ id }: { id: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [job, setJob] = useState<any>(null); // Ideally JobRecord type
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
                // Fetch Job (for video URL)
                const jobRes = await fetch(`/api/jobs/${id}`);
                if (!jobRes.ok) throw new Error("Failed to load job");
                const { job: loadedJob } = await jobRes.json();

                // Fetch Captions
                const capRes = await fetch(`/api/jobs/${id}/captions`);
                if (!capRes.ok) throw new Error("Failed to load captions");
                const { captions: loadedCaptions } = await capRes.json();

                setJob(loadedJob);
                setCaptions(loadedCaptions || []);
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
    }, [id, toast]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/jobs/${id}/captions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ captions }),
            });

            if (!res.ok) throw new Error("Failed to save");

            setHasUnsavedChanges(false);
            toast({
                title: "Saved",
                description: "Subtitle changes saved successfully.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save changes."
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
        // Video player effect will handle the seek
    }, []);

    if (isLoading) return <EditorLoading />;
    if (!job) return <div>Job Not Found</div>;

    // Determine Video Source
    // If it's an asset, `withSignedJobAssets` should have populated `job.asset.signedUrl` or replaced `url`.
    // Let's assume `job.videoUrl` or fallback to `job.url`.
    // Checking `withSignedJobAssets` implementation will confirm.
    // Fallback: If job.assetId exists and job.asset?.signedUrl, use it.
    const videoSrc = job.asset?.signedUrl || job.url;

    return (
        <EditorLayout
            header={
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <Link href={`/jobs/${id}`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-lg">{job.asset?.filename || "Video Editor"}</h1>
                            <p className="text-xs opacity-70">
                                {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
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
                        Save
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
