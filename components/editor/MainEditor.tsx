"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useEditor } from "./EditorContext";
import { VideoPlayer } from "./VideoPlayer";
import { CaptionList } from "./CaptionList";
import { CutTimeline } from "./CutTimeline";
import { SourcePanel } from "./SourcePanel";
import { InOutControls } from "./InOutControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { Button } from "@/components/ui/button";
import {
    PanelLeftClose,
    PanelLeftOpen,
    Play,
    Save,
    Download,
    Scissors,
    ArrowLeft,
    Loader2,
    Zap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AssetRecord } from "@/lib/assets/types";
import { SubtitleCue, VideoCut } from "@/lib/jobs/types";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

interface MainEditorProps {
    projectId: string;
    initialAssets: AssetRecord[];
}

export function MainEditor({ projectId, initialAssets }: MainEditorProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [clips, setClips] = useState<{
        id: string;
        asset: AssetRecord;
        startTime: number;
        endTime: number;
        order: number;
    }[]>([]);
    const [activeClipId, setActiveClipId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPipelineRunning, setIsPipelineRunning] = useState(false);

    // In/Out points for marking clip ranges
    const [inPoint, setInPoint] = useState<number | null>(null);
    const [outPoint, setOutPoint] = useState<number | null>(null);

    // Timeline ref for split operation
    const timelineRef = useRef<{ handleSplit: () => void } | null>(null);

    const [assets, setAssets] = useState<AssetRecord[]>(initialAssets);
    const [captions, setCaptions] = useState<SubtitleCue[]>([]);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);

    const projectName = "Untitled Project"; // Placeholder or derive from first clip

    // Handle Asset Selection
    // Handle Adding Clip to Sequence
    const handleAddClip = useCallback(async (asset: AssetRecord) => {
        const newClipId = `clip-${Date.now()}`;

        // Get video duration from asset meta or by loading the video
        let videoDuration = asset.meta?.duration || 0;

        if (!videoDuration) {
            // Try to get duration by loading video metadata
            const videoSrc = asset.storageKey
                ? `/api/assets/${asset.id}/view`
                : asset.sourceUrl || "";

            if (videoSrc) {
                try {
                    videoDuration = await new Promise<number>((resolve, reject) => {
                        const video = document.createElement("video");
                        video.preload = "metadata";
                        video.onloadedmetadata = () => {
                            resolve(video.duration || 10);
                            video.remove();
                        };
                        video.onerror = () => {
                            resolve(10); // Fallback to 10s on error
                            video.remove();
                        };
                        // Timeout after 5 seconds
                        setTimeout(() => {
                            resolve(10);
                            video.remove();
                        }, 5000);
                        video.src = videoSrc;
                    });
                } catch {
                    videoDuration = 10;
                }
            } else {
                videoDuration = 10;
            }
        }

        const newClip = {
            id: newClipId,
            asset,
            startTime: 0,
            endTime: videoDuration,
            order: clips.length
        };

        setClips(prev => [...prev, newClip]);
        setActiveClipId(newClipId);

        // Also set the duration for the player
        setDuration(videoDuration);

        // If no job exists for the project, we should create one or track it differently
        // For now, let's ensure we have a "project job"
        if (!currentJobId) {
            const res = await fetch(`/api/jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    url: asset.sourceUrl || "sequence",
                    sourceType: 'sequence',
                    autoStart: false
                })
            });
            if (res.ok) {
                const { job } = await res.json();
                setCurrentJobId(job.id);
            }
        }
    }, [clips.length, currentJobId, projectId]);

    const handleRemoveClip = (id: string) => {
        setClips(prev => prev.filter(c => c.id !== id));
        if (activeClipId === id) setActiveClipId(null);
    };

    const activeClip = useMemo(() =>
        clips.find(c => c.id === activeClipId) || null
        , [clips, activeClipId]);

    const handleRunPipeline = async () => {
        if (clips.length === 0 || !currentJobId) return;
        setIsPipelineRunning(true);
        try {
            // 1. Save current sequence first
            const sequenceData = clips.map(c => ({
                id: c.id,
                assetId: c.asset.id,
                startTime: c.startTime,
                endTime: c.endTime,
                order: c.order
            }));

            await fetch(`/api/jobs/${currentJobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sequence: sequenceData })
            });

            // 2. Trigger caption generation
            const res = await fetch(`/api/jobs/${currentJobId}/captions`, {
                method: "POST"
            });

            if (res.ok) {
                // Polling for caption completion
                const poll = setInterval(async () => {
                    const statusRes = await fetch(`/api/jobs/${currentJobId}`);
                    const { job: updatedJob } = await statusRes.json();

                    // The backend returns to 'awaiting_edit' after finishing subtitles
                    // But we check the 'step' or presence of captions
                    if (updatedJob.status === 'awaiting_edit' && updatedJob.step === 'subtitle' && updatedJob.captionSource) {
                        clearInterval(poll);
                        setCaptions(updatedJob.captionSource?.cues || []);
                        setIsPipelineRunning(false);
                    } else if (updatedJob.status === 'error') {
                        clearInterval(poll);
                        setIsPipelineRunning(false);
                        alert("Captioning failed: " + updatedJob.errorMessage);
                    }
                }, 3000);
            }
        } catch (err) {
            console.error("Captioning failed", err);
            setIsPipelineRunning(false);
        }
    };

    const handleCueUpdate = (id: number, text: string) => {
        setCaptions(prev => prev.map(c => c.id === id ? { ...c, text } : c));
    };

    const handleClipsChange = (newClips: typeof clips) => {
        setClips(newClips);
    };

    const handleSeek = (time: number) => {
        setCurrentTime(time);
    };

    // Split active clip at current playhead position
    const handleSplit = useCallback(() => {
        if (!activeClipId || !clips) return;
        const activeClip = clips.find(c => c.id === activeClipId);
        if (!activeClip) return;

        // Current time relative to clip start
        const clipLocalTime = currentTime;
        if (clipLocalTime <= activeClip.startTime + 0.1 || clipLocalTime >= activeClip.endTime - 0.1) {
            return; // Can't split too close to boundaries
        }

        const index = clips.findIndex(c => c.id === activeClipId);
        const clip1 = { ...activeClip, id: crypto.randomUUID(), endTime: clipLocalTime };
        const clip2 = { ...activeClip, id: crypto.randomUUID(), startTime: clipLocalTime, order: activeClip.order + 1 };

        const newClips = [
            ...clips.slice(0, index),
            clip1,
            clip2,
            ...clips.slice(index + 1).map(c => ({ ...c, order: c.order + 1 }))
        ];
        setClips(newClips);
    }, [activeClipId, clips, currentTime]);

    // Delete active clip
    const handleDeleteActiveClip = useCallback(() => {
        if (activeClipId) {
            handleRemoveClip(activeClipId);
        }
    }, [activeClipId]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        inPoint,
        outPoint,
        setInPoint,
        setOutPoint,
        onSplit: handleSplit,
        onDelete: handleDeleteActiveClip,
    });

    const handleSave = async () => {
        if (!currentJobId) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/jobs/${currentJobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    captionEdit: { version: 1, cues: captions, defaultStyle: {} },
                    sequence: clips.map(c => ({
                        id: c.id,
                        assetId: c.asset.id,
                        startTime: c.startTime,
                        endTime: c.endTime,
                        order: c.order
                    })),
                    status: 'editing'
                })
            });
            if (res.ok) {
                // Success feedback?
            }
        } catch (err) {
            console.error("Failed to save", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        if (!currentJobId) return;
        setIsExporting(true);
        try {
            const res = await fetch(`/api/jobs/${currentJobId}/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format: "mp4" })
            });
            if (res.ok) {
                const { downloadUrl } = await res.json();
                if (downloadUrl) {
                    window.open(downloadUrl, '_blank');
                } else {
                    alert("Export started. You will be notified when it's done.");
                }
            }
        } catch (err) {
            console.error("Export failed", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Top Bar */}
            <header className="h-14 border-b bg-card flex items-center justify-between px-4 z-30 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-muted-foreground"
                    >
                        {isSidebarOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
                    </Button>
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity">
                        <div className="size-6 bg-primary rounded flex items-center justify-center text-primary-foreground">
                            <Play className="size-4 fill-current" />
                        </div>
                        <span className="hidden sm:inline">AI SUB AUTO</span>
                    </Link>
                    <div className="h-4 w-px bg-border mx-2" />
                    <h2 className="text-sm font-medium truncate max-w-[200px]">
                        {projectName || "Untitled Project"} ({clips.length} clips)
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleSave}
                        disabled={isSaving || !currentJobId}
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        <span className="hidden sm:inline">Save</span>
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-none"
                        onClick={handleRunPipeline}
                        disabled={isPipelineRunning || clips.length === 0}
                    >
                        {isPipelineRunning ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4 fill-current" />}
                        <span className="hidden sm:inline">Generate AI Captions</span>
                    </Button>

                    <Button
                        size="sm"
                        className="gap-2 bg-primary hover:bg-primary/90"
                        onClick={handleExport}
                        disabled={isExporting || !currentJobId}
                    >
                        {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </header>

            {/* Main Content with Resizable Panels */}
            <main className="flex-1 overflow-hidden relative">
                <ResizablePanelGroup
                    key={`editor-layout-${isSidebarOpen}`}
                    direction="horizontal"
                    className="h-full items-stretch"
                >
                    {/* Column 1: Source Grid */}
                    {isSidebarOpen && (
                        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card">
                            <SourcePanel
                                projectId={projectId}
                                assets={assets}
                                selectedAssetId={activeClip?.asset.id}
                                onSelectAsset={handleAddClip}
                                onAssetsChange={setAssets}
                            />
                        </ResizablePanel>
                    )}

                    {isSidebarOpen && (
                        <ResizableHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />
                    )}

                    {/* Column 2: Player & Timeline */}
                    <ResizablePanel defaultSize={isSidebarOpen ? 45 : 60} minSize={30}>
                        <section className="flex flex-col h-full min-w-0 bg-black/95">
                            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative">
                                {activeClip ? (
                                    <div className="w-full h-full max-w-5xl flex flex-col">
                                        <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
                                            <VideoPlayer
                                                src={activeClip?.asset.storageKey ? `/api/assets/${activeClip.asset.id}/view` : activeClip?.asset.sourceUrl || ""}
                                                cues={captions}
                                                currentTime={currentTime}
                                                isPlaying={isPlaying}
                                                onTimeUpdate={setCurrentTime}
                                                onDurationChange={setDuration}
                                                onPlayPause={setIsPlaying}
                                            />

                                            {/* Progress Overlay for Pipeline */}
                                            {isPipelineRunning && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-20">
                                                    <div className="text-center space-y-6 max-w-xs px-4">
                                                        <div className="relative size-24 mx-auto">
                                                            <Loader2 className="size-24 animate-spin text-primary opacity-20" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Zap className="size-8 text-primary animate-pulse" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white mb-2">Generating Magic...</h3>
                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '45%' }} />
                                                            </div>
                                                            <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-3 font-medium">
                                                                AI is transcribing your audio
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="size-20 bg-muted rounded-3xl flex items-center justify-center mx-auto text-muted-foreground/30 border-2 border-dashed border-muted-foreground/20">
                                            <Play className="size-10" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Add clips from the left to begin</p>
                                    </div>
                                )}
                            </div>

                            {/* In/Out Controls */}
                            {activeClip && (
                                <InOutControls
                                    currentTime={currentTime}
                                    duration={duration}
                                    inPoint={inPoint}
                                    outPoint={outPoint}
                                    onSetInPoint={setInPoint}
                                    onSetOutPoint={setOutPoint}
                                    onSeek={handleSeek}
                                    onAddToTimeline={() => {
                                        if (inPoint !== null && outPoint !== null && outPoint > inPoint && activeClip) {
                                            // Create a new clip from the marked range
                                            const newClip = {
                                                id: crypto.randomUUID(),
                                                asset: activeClip.asset,
                                                startTime: inPoint,
                                                endTime: outPoint,
                                                order: clips.length
                                            };
                                            setClips(prev => [...prev, newClip]);
                                            // Clear markers after adding
                                            setInPoint(null);
                                            setOutPoint(null);
                                        }
                                    }}
                                />
                            )}

                            {/* Timeline */}
                            <div className="h-48 border-t bg-card/50 backdrop-blur-md">
                                <CutTimeline
                                    duration={duration}
                                    currentTime={currentTime}
                                    cues={captions}
                                    clips={clips}
                                    activeClipId={activeClipId}
                                    onSeek={handleSeek}
                                    onClipsChange={handleClipsChange}
                                    onClipSelect={setActiveClipId}
                                    onRemoveClip={handleRemoveClip}
                                    onAddClip={handleAddClip}
                                />
                            </div>
                        </section>
                    </ResizablePanel>

                    <ResizableHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

                    {/* Column 3: SRT Editor */}
                    <ResizablePanel defaultSize={isSidebarOpen ? 30 : 40} minSize={20}>
                        <aside className="h-full bg-card flex flex-col overflow-hidden">
                            {captions.length > 0 ? (
                                <CaptionList
                                    cues={captions}
                                    currentTime={currentTime}
                                    onCueClick={handleSeek}
                                    onCueUpdate={handleCueUpdate}
                                />
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
                                    <Zap className="size-12 mb-4 text-primary/30" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1">No Captions Yet</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Run the pipeline to generate subtitles</p>
                                </div>
                            )}
                        </aside>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}
