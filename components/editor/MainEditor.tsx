"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useEditor, EditorLayer } from "./EditorContext";
import { VideoPlayer } from "./VideoPlayer";
import { CaptionList } from "./CaptionList";
import { SRTSettingsPanel } from "./SRTSettingsPanel";
import { CutTimeline } from "./CutTimeline";
import { SourcePanel } from "./SourcePanel";
import { InOutControls } from "./InOutControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAutoSave } from "./hooks/useAutoSave";
import { LayerManager } from "./LayerManager";
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
import {
    SubtitleCue,
    VideoCut,
    SubtitleConfig,
    LanguageConfig,
    PlaybackSpeed,
    DEFAULT_SUBTITLE_CONFIG,
    DEFAULT_LANGUAGE_CONFIG,
} from "@/lib/jobs/types";
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


    // Timeline ref for split operation
    const timelineRef = useRef<{ handleSplit: () => void } | null>(null);

    const [isExporting, setIsExporting] = useState(false);
    const [assets, setAssets] = useState<AssetRecord[]>(initialAssets);

    const {
        clips,
        setClips,
        activeClipId,
        setActiveClipId,
        cues: captions,
        setCues: setCaptions,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        isPipelineRunning,
        setIsPipelineRunning,
        currentJobId,
        setCurrentJobId,
        duration,
        setDuration,
        isSaving,
        setIsSaving,
        isDirty,
        markSaved,
        defaultStyle: subtitleStyle,
        setDefaultStyle: setSubtitleStyle,
        language: languageConfig,
        setLanguage: setLanguageConfig,
        playbackSpeed,
        setPlaybackSpeed,
        updateCue,
        inPoint,
        setInPoint,
        outPoint,
        setOutPoint,
        getCaptionData,
        pipelineProgress,
        setPipelineProgress,
        pipelineStatus,
        setPipelineStatus,
        layers,
        activeLayerId,
        addLayer,
        duplicateLayer,
        deleteLayer,
        switchLayer,
        updateLayerName,
        loadLayers,
    } = useEditor();

    const projectName = "Untitled Project"; // Placeholder or derive from first clip

    // Handle Asset Selection
    // Handle Adding Clip to Sequence
    const handleAddClip = useCallback(async (asset: AssetRecord) => {
        const newClipId = `clip-${Date.now()}`;

        // Get video duration from asset meta or by loading the video
        let videoDuration = asset.meta?.duration || 0;

        if (!videoDuration) {
            // ... (duration logic remains same)
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

        setClips((prev: any[]) => [...prev, newClip]);
        setActiveClipId(newClipId);

        // Load captions if they exist on the asset
        if (asset.captions && asset.captions.cues) {
            setCaptions(asset.captions.cues);
        }
    }, [clips.length, setActiveClipId, setClips, setCaptions]);

    // Handle Adding Clip to Sequence - Now just calls handleAddClip
    const ensureJobAndAddClip = useCallback(async (asset: AssetRecord) => {
        handleAddClip(asset);
        // Note: We no longer create a job here by default.
        // Export/Save might still need a job record if we want to store the sequence in DB.
        // But for "rendering subtitles directly", we don't need it for the STT part.
    }, [handleAddClip]);

    const handleRemoveClip = (id: string) => {
        setClips((prev: any[]) => prev.filter((c: any) => c.id !== id));
        if (activeClipId === id) setActiveClipId(null);
    };

    const activeClip = useMemo(() =>
        clips.find(c => c.id === activeClipId) || null
        , [clips, activeClipId]);

    const handleRunPipeline = async () => {
        if (clips.length === 0) {
            alert("클립을 추가해주세요.");
            return;
        }

        setIsPipelineRunning(true);
        setPipelineStatus("준비 중...");
        setPipelineProgress(0);

        try {
            // New Workflow: Transcribe assets one by one (or just the first one for now as per previous logic)
            // The user said "read asset's audio and render subtitles directly"
            const assetToTranscribe = clips[0].asset;

            setPipelineStatus("AI 캡션 생성 시작...");
            const res = await fetch(`/api/assets/${assetToTranscribe.id}/transcribe`, {
                method: "POST"
            });

            if (!res.ok) {
                throw new Error("캡션 생성을 시작할 수 없습니다.");
            }

            // Polling for asset transcription status
            const poll = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/assets/${assetToTranscribe.id}/view`); // This returns redirect, but we need asset data
                    // Correct: we need an endpoint that returns asset JSON.
                    // Let's check api/assets/[id]/route.ts if it exists.
                    const assetRes = await fetch(`/api/assets/${assetToTranscribe.id}`);
                    if (!assetRes.ok) return;

                    const assetData: AssetRecord = await assetRes.json();

                    if (assetData.transcriptionStatus === 'completed' && assetData.captions) {
                        clearInterval(poll);
                        setCaptions(assetData.captions.cues || []);
                        setIsPipelineRunning(false);
                        setPipelineStatus("");
                        setPipelineProgress(0);
                    } else if (assetData.transcriptionStatus === 'failed') {
                        clearInterval(poll);
                        setIsPipelineRunning(false);
                        setPipelineStatus("");
                        alert("캡션 생성 실패: " + assetData.errorMessage);
                    } else {
                        setPipelineStatus("음성 인식 중...");
                        setPipelineProgress(0.5); // Fixed progress for now as we don't have granular asset transcription progress
                    }
                } catch (err) {
                    console.error("[MainEditor] Polling error:", err);
                }
            }, 2000);

        } catch (err) {
            console.error("Pipeline failed", err);
            alert(err instanceof Error ? err.message : "작업 처리에 실패했습니다.");
            setIsPipelineRunning(false);
            setPipelineStatus("");
        }
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
        let jobId = currentJobId;
        setIsSaving(true);

        try {
            // 1. Ensure job exists if we don't have one yet
            if (!jobId) {
                const firstAsset = clips[0]?.asset;
                const res = await fetch(`/api/jobs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        projectId,
                        url: firstAsset?.sourceUrl || "sequence",
                        sourceType: 'sequence',
                        autoStart: false
                    })
                });
                if (res.ok) {
                    const { job } = await res.json();
                    jobId = job.id;
                    setCurrentJobId(jobId);
                } else {
                    throw new Error("작업 저장 공간을 생성하지 못했습니다.");
                }
            }

            const currentLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, clips, cues: captions };
                }
                return l;
            });

            const sequenceData = {
                version: 2,
                activeLayerId,
                layers: currentLayers.map(l => ({
                    id: l.id,
                    name: l.name,
                    clips: l.clips.map(c => ({
                        id: c.id,
                        assetId: c.asset.id,
                        startTime: c.startTime,
                        endTime: c.endTime,
                        order: c.order
                    })),
                    cues: l.cues
                }))
            };

            const res = await fetch(`/api/jobs/${jobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    captionEdit: getCaptionData(),
                    sequence: sequenceData,
                    status: 'editing'
                })
            });
            if (res.ok) {
                markSaved();
            } else {
                const errorText = await res.text();
                let errorMessage = "저장에 실패했습니다.";
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) errorMessage += ` (${errorJson.error})`;
                } catch {
                    errorMessage += ` (${res.status})`;
                }
                alert(errorMessage);
            }
        } catch (err) {
            console.error("Failed to save", err);
            alert(err instanceof Error ? err.message : "저장에 실패했습니다.");
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

    // Auto-save integration
    const getEditorData = useCallback(() => {
        const currentLayers = layers.map(l => {
            if (l.id === activeLayerId) {
                return { ...l, clips, cues: captions };
            }
            return l;
        });
        return {
            layers: currentLayers,
            activeLayerId,
            captionData: getCaptionData()
        };
    }, [layers, activeLayerId, clips, captions, getCaptionData]);

    const { getRecoveryData, clearRecoveryData } = useAutoSave({
        projectId,
        jobId: currentJobId,
        isDirty,
        getData: getEditorData,
        onSave: handleSave
    });

    // Recovery prompt on mount
    const [recoveryChecked, setRecoveryChecked] = useState(false);
    useEffect(() => {
        if (recoveryChecked) return;
        setRecoveryChecked(true);

        const recovery = getRecoveryData();
        if (recovery && recovery.data) {
            const timeDiff = Date.now() - recovery.timestamp;
            const minutesAgo = Math.floor(timeDiff / 60000);
            const timeText = minutesAgo < 1 ? '방금 전' : `${minutesAgo}분 전`;

            const shouldRestore = window.confirm(
                `저장되지 않은 작업이 있습니다 (${timeText}). 복원하시겠습니까?`
            );

            if (shouldRestore && recovery.data.layers) {
                // Restore layers with proper asset mapping
                const restoredLayers = recovery.data.layers.map((l: any) => ({
                    ...l,
                    clips: l.clips?.map((c: any) => ({
                        ...c,
                        asset: initialAssets.find(a => a.id === c.asset?.id || a.id === c.assetId) || c.asset
                    })) || []
                }));
                loadLayers(restoredLayers, recovery.data.activeLayerId);
                console.log('[MainEditor] Restored from localStorage');
            } else {
                clearRecoveryData();
            }
        }
    }, [recoveryChecked, getRecoveryData, clearRecoveryData, loadLayers, initialAssets]);


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background w-screen max-w-full">
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
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        <span className="hidden sm:inline">Save</span>
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-none min-w-[140px]"
                        onClick={handleRunPipeline}
                        disabled={isPipelineRunning || clips.length === 0}
                    >
                        {isPipelineRunning ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span className="hidden sm:inline">
                                    {pipelineStatus || "생성 중..."} {pipelineProgress > 0 ? `(${Math.round(pipelineProgress * 100)}%)` : ''}
                                </span>
                            </>
                        ) : (
                            <>
                                <Zap className="size-4 fill-current" />
                                <span className="hidden sm:inline">Generate AI Captions</span>
                            </>
                        )}
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
            <main className="flex-1 overflow-hidden relative w-full h-full max-w-full min-w-0">
                <ResizablePanelGroup direction="vertical" className="w-full h-full min-w-0">
                    {/* Top Section: Sidebar + Player + Settings */}
                    <ResizablePanel defaultSize={65} minSize={30} className="min-w-0">
                        <ResizablePanelGroup
                            key={`editor-layout-${isSidebarOpen}`}
                            direction="horizontal"
                            className="w-full h-full min-w-0 items-stretch"
                        >
                            {/* Column 1: Source Grid */}
                            {isSidebarOpen && (
                                <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card">
                                    <div className="flex flex-col h-full overflow-hidden">
                                        <div className="p-4 pb-0 shrink-0">
                                            <LayerManager />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <SourcePanel
                                                projectId={projectId}
                                                assets={assets}
                                                selectedAssetId={activeClip?.asset.id}
                                                onSelectAsset={ensureJobAndAddClip}
                                                onAssetsChange={setAssets}
                                            />
                                        </div>
                                    </div>
                                </ResizablePanel>
                            )}

                            {isSidebarOpen && (
                                <ResizableHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />
                            )}

                            {/* Column 2: Player */}
                            <ResizablePanel defaultSize={isSidebarOpen ? 45 : 60} minSize={30} className="min-w-0">
                                <section className="flex flex-col h-full min-w-0 w-full overflow-hidden bg-black/95">
                                    <div className="flex-1 flex items-center justify-center relative">
                                        {activeClip ? (
                                            <div className="w-full h-full flex flex-col">
                                                <div className="flex-1 bg-black overflow-hidden relative border-y border-white/5">
                                                    <VideoPlayer
                                                        src={activeClip?.asset.storageKey ? `/api/assets/${activeClip.asset.id}/view` : activeClip?.asset.sourceUrl || ""}
                                                        activeClip={activeClip}
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
                                                    setClips((prev: any[]) => [...prev, newClip]);
                                                    // Clear markers after adding
                                                    setInPoint(null);
                                                    setOutPoint(null);
                                                }
                                            }}
                                        />
                                    )}
                                </section>
                            </ResizablePanel>

                            <ResizableHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />

                            {/* Column 3: SRT Editor */}
                            <ResizablePanel defaultSize={isSidebarOpen ? 30 : 40} minSize={20} className="min-w-0">
                                <aside className="h-full bg-card flex flex-col overflow-hidden">
                                    <SRTSettingsPanel />
                                </aside>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle className="h-1 bg-border/50 hover:bg-primary/50 transition-colors" />

                    {/* Bottom Section: Full Width Timeline */}
                    <ResizablePanel defaultSize={35} minSize={15} className="min-w-0">
                        <div className="h-full w-full min-w-0 overflow-hidden bg-card/50 backdrop-blur-md">
                            <CutTimeline
                                onRemoveClip={handleRemoveClip}
                                onAddClip={ensureJobAndAddClip}
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}
