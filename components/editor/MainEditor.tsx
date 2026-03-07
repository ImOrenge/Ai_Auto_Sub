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
    Zap,
    Lock as LockIcon
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
import { Project } from "@/lib/projects/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

interface MainEditorProps {
    projectId: string;
    project: Project;
    initialAssets: AssetRecord[];
}

const RESOLUTION_ORDER = ["sd", "hd", "fhd", "uhd"] as const;

const isResolutionAccessible = (userLimit: "hd" | "fhd" | "uhd" | undefined, resolution: "sd" | "hd" | "fhd" | "uhd") => {
    if (resolution === "sd") return true;
    if (!userLimit) return resolution === "hd"; // Default fallback

    const userIdx = RESOLUTION_ORDER.indexOf(userLimit as any);
    const itemIdx = RESOLUTION_ORDER.indexOf(resolution as any);

    return userIdx >= itemIdx;
};

export function MainEditor({ projectId, project, initialAssets }: MainEditorProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);


    // Timeline ref for split operation
    const timelineRef = useRef<{ handleSplit: () => void } | null>(null);

    const [isExporting, setIsExporting] = useState(false);
    const [assets, setAssets] = useState<AssetRecord[]>(initialAssets);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportResolution, setExportResolution] = useState<"sd" | "hd" | "fhd" | "uhd">("fhd");
    const router = useRouter();

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
        entitlements,
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
        videoAspectRatio,
        duplicateLayer,
        deleteLayer,
        switchLayer,
        updateLayerName,
        loadLayers,
        loadCaptionData,
    } = useEditor();

    // Latest state refs for polling closure
    const layersRef = useRef(layers);
    const captionsRef = useRef(captions);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { layersRef.current = layers; }, [layers]);
    useEffect(() => { captionsRef.current = captions; }, [captions]);

    // Cleanup poll on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    const projectName = project.name;

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
            const assetCues: SubtitleCue[] = asset.captions.cues;

            // Calculate total offset based on existing clips
            const currentDuration = clips.reduce((acc, c) => {
                const dur = c.endTime - c.startTime;
                const spd = ('speed' in c && c.speed) ? c.speed : 1;
                return acc + (dur / spd);
            }, 0);

            // Find existing caption layer or create one
            const captionLayer = layers.find(l => l.type === 'caption');

            if (captionLayer) {
                switchLayer(captionLayer.id);
                const offsetCues = assetCues.map(cue => ({
                    ...cue,
                    id: Date.now() + Math.floor(Math.random() * 10000), // Ensure unique IDs
                    startTime: cue.startTime + currentDuration,
                    endTime: cue.endTime + currentDuration
                }));
                setCaptions((prev: SubtitleCue[]) => [...prev, ...offsetCues].sort((a, b) => a.startTime - b.startTime));
            } else {
                addLayer("Captions", undefined, 'caption');
                setCaptions(assetCues);
            }
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

    const startPolling = useCallback((jobId: string) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        pollIntervalRef.current = setInterval(async () => {
            try {
                const jobRes = await fetch(`/api/jobs/${jobId}`);
                if (!jobRes.ok) return;

                const data = await jobRes.json();
                const job = data.job;

                if (job.status === 'awaiting_edit' || job.status === 'done' || job.status === 'ready_to_export') {
                    // Finished!
                    if (job.captionSource || job.captionEdit) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;

                        // Prioritize source (fresh AI result) if we just ran the pipeline
                        const updatedCues = (job.captionSource?.cues || job.captionEdit?.cues || []);

                        // Find existing AI caption layer or create one (using ref to avoid stale state)
                        let captionLayer = layersRef.current.find(l => l.type === 'caption');

                        if (captionLayer) {
                            switchLayer(captionLayer.id);
                            setCaptions(updatedCues);
                        } else {
                            addLayer("AI Captions", undefined, 'caption');
                            setCaptions(updatedCues);
                        }

                        setIsPipelineRunning(false);
                        setPipelineStatus("");
                        setPipelineProgress(100);

                        // Clear markers if they were used for specific cuts
                        setInPoint(null);
                        setOutPoint(null);

                        console.log("[MainEditor] Pipeline complete, updated captions from job:", jobId);
                    }
                } else if (job.status === 'error') {
                    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    setIsPipelineRunning(false);
                    setPipelineStatus("");
                    alert("罹≪뀡 ?앹꽦 ?ㅽ뙣: " + job.errorMessage);
                } else {
                    // Update UI with status and progress
                    setPipelineStatus(job.status.toUpperCase());
                    setPipelineProgress(Math.floor((job.progress || 0) * 100));
                }
            } catch (err) {
                console.error("[MainEditor] Polling error:", err);
            }
        }, 5000); // Increased from 3s to 5s to reduce API load
    }, [addLayer, setCaptions, setInPoint, setIsPipelineRunning, setOutPoint, setPipelineProgress, setPipelineStatus, switchLayer]);

    // Initialize Job/Sequence on mount
    useEffect(() => {
        if (currentJobId) return;

        const fetchExistingJob = async () => {
            try {
                const res = await fetch(`/api/jobs?projectId=${projectId}&limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.jobs && data.jobs.length > 0) {
                        const job = data.jobs[0];
                        setCurrentJobId(job.id);
                        console.log("[MainEditor] Found existing job for project:", job.id);

                        // Handle Sequence Layers Loading
                        if (job.sequence) {
                            const mapClip = (c: any) => ({
                                ...c,
                                asset: initialAssets.find(a => a.id === c.assetId) || c.asset
                            });

                            if (Array.isArray(job.sequence)) {
                                // Migration: Convert legacy flat sequence to first layer
                                const videoLayer: EditorLayer = {
                                    id: 'layer-1',
                                    name: 'Main Timeline',
                                    type: 'video',
                                    clips: job.sequence.map(mapClip),
                                    cues: []
                                };
                                const items = [videoLayer];

                                const existingCues = job.captionEdit?.cues || job.captionSource?.cues || [];
                                if (existingCues.length > 0) {
                                    items.push({
                                        id: 'layer-captions',
                                        name: 'Captions',
                                        type: 'caption',
                                        clips: [],
                                        cues: existingCues
                                    });
                                }
                                loadLayers(items);
                            } else if (job.sequence.version === 2) {
                                // New format: Map assets back to clips in each layer
                                const loadedLayers = job.sequence.layers.map((l: any) => ({
                                    ...l,
                                    clips: l.clips.map(mapClip),
                                    cues: l.cues || []
                                }));
                                loadLayers(loadedLayers, job.sequence.activeLayerId);
                            }
                        }

                        // Also load global settings if present - ONLY for legacy sequences
                        // In v2, captions and styles are part of the layer structure
                        const isLegacy = !job.sequence || (typeof job.sequence === 'object' && job.sequence.version !== 2);
                        if (isLegacy) {
                            if (job.captionEdit) {
                                loadCaptionData(job.captionEdit);
                            } else if (job.captionSource) {
                                loadCaptionData(job.captionSource);
                            }
                        }

                        // Auto-resume polling if job is ongoing
                        const ongoingStatuses = ['stt', 'translating', 'subtitle', 'preparing', 'uploading', 'preprocessing'];
                        if (ongoingStatuses.includes(job.status)) {
                            console.log("[MainEditor] Job is ongoing, starting auto-poll:", job.status);
                            setIsPipelineRunning(true);
                            setPipelineStatus(job.status.toUpperCase());
                            setPipelineProgress(Math.floor((job.progress || 0) * 100));
                            startPolling(job.id);
                        }
                    }
                }
            } catch (err) {
                console.error("[MainEditor] Error fetching existing job:", err);
            }
        };

        fetchExistingJob();
    }, [projectId, currentJobId, setCurrentJobId, loadLayers, initialAssets, startPolling]);

    const handleRunPipeline = async () => {
        if (clips.length === 0) {
            alert("Please add a clip first.");
            return;
        }

        setIsPipelineRunning(true);
        setPipelineStatus("???以?..");
        setPipelineProgress(0);

        try {
            // 1. First Save the current state (to ensure job exists and sequence is up to date)
            const jobId = await handleSave();

            // We need the job ID to trigger the pipeline
            if (!jobId) {
                throw new Error("작업 정보를 찾을 수 없습니다. 다시 시도해주세요.");
            }

            setPipelineStatus("AI 캡션 생성 시작...");
            const res = await fetch(`/api/jobs/${jobId}/transcribe`, {
                method: "POST"
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "罹≪뀡 ?앹꽦???쒖옉?????놁뒿?덈떎.");
            }

            // 2. Polling for job status
            startPolling(jobId);

        } catch (err) {
            console.error("Pipeline failed", err);
            alert(err instanceof Error ? err.message : "?묒뾽 泥섎━???ㅽ뙣?덉뒿?덈떎.");
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

    const handleSave = async (): Promise<string> => {
        let jobId = currentJobId;
        setIsSaving(true);

        try {
            // 1. Ensure job exists if we don't have one yet
            if (!jobId) {
                const firstAsset = clips[0]?.asset;
                const createJobPayload = {
                    projectId,
                    sourceType: 'sequence' as const,
                    autoStart: false,
                    assetId: firstAsset?.id ?? null,
                    ...(firstAsset?.sourceUrl ? { url: firstAsset.sourceUrl } : {}),
                };
                const res = await fetch(`/api/jobs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(createJobPayload)
                });
                if (res.ok) {
                    const { job } = await res.json();
                    jobId = job.id;
                    setCurrentJobId(jobId);
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    const message = errorData.error || "?묒뾽 ???怨듦컙???앹꽦?섏? 紐삵뻽?듬땲??";
                    throw new Error(message);
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
                        order: c.order,
                        speed: c.speed
                    })),
                    cues: l.cues
                }))
            };

            const res = await fetch(`/api/jobs/${jobId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    captionEdit: getCaptionData(),
                    sequence: sequenceData
                })
            });
            if (res.ok) {
                markSaved();
                return jobId;
            } else {
                const errorText = await res.text();
                let errorMessage = "??μ뿉 ?ㅽ뙣?덉뒿?덈떎.";
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) errorMessage += ` (${errorJson.error})`;
                } catch {
                    errorMessage += ` (${res.status})`;
                }
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("Failed to save", err);
            const message = err instanceof Error ? err.message : "저장에 실패했습니다.";
            alert(message);
            throw err instanceof Error ? err : new Error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        if (!currentJobId) return;
        setIsExportModalOpen(false);
        setIsExporting(true);

        try {
            const jobId = await handleSave();
            const res = await fetch(`/api/jobs/${jobId}/export`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    format: "mp4",
                    resolution: exportResolution,
                    renderer: "canvas"
                })
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || "Failed to start export");
            }

            alert("Server render started in background.");
            router.push(routes.exportResult(projectId, jobId));
        } catch (e) {
            console.error(e);
            alert("Export Failed: " + (e instanceof Error ? e.message : "Unknown Error"));
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
            const timeText = minutesAgo < 1 ? "방금 전" : `${minutesAgo}분 전`;

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

                // Restore global settings from recovery (styles/configs), but skip cues since they are in layers
                if (recovery.data.captionData) {
                    loadCaptionData(recovery.data.captionData, { skipCues: true });
                }
                console.log('[MainEditor] Restored from localStorage');
            } else {
                clearRecoveryData();
            }
        }
    }, [recoveryChecked, getRecoveryData, clearRecoveryData, loadLayers, initialAssets]);


    return (
        <div className="flex flex-col h-full overflow-hidden bg-background w-full">
            {/* Top Bar - Consolidated Single Line */}
            <header className="h-12 border-b bg-card flex items-center justify-between px-3 z-30 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="size-8 text-muted-foreground hover:bg-muted"
                        title="Back to Dashboard"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>

                    <div className="h-4 w-px bg-border mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={cn("size-8 text-muted-foreground hover:bg-muted", !isSidebarOpen && "bg-primary/10 text-primary")}
                        title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        {isSidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
                    </Button>

                    <div className="h-4 w-px bg-border mx-1" />

                    <div className="flex flex-col justify-center">
                        <h2 className="text-[13px] font-bold truncate max-w-[180px] leading-tight">
                            {projectName || "Untitled Project"}
                        </h2>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">
                            {clips.length} Clips
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-xs font-semibold px-2 hover:bg-muted"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                        <span className="hidden sm:inline">Save</span>
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 shadow-none px-3 text-xs font-bold"
                        onClick={handleRunPipeline}
                        disabled={isPipelineRunning || clips.length === 0}
                    >
                        {isPipelineRunning ? (
                            <>
                                <Loader2 className="size-3 animate-spin" />
                                <span>{pipelineStatus || "Processing..."}</span>
                            </>
                        ) : (
                            <>
                                <Zap className="size-3 fill-current" />
                                <span>AI Captions</span>
                            </>
                        )}
                    </Button>

                    <Button
                        size="sm"
                        className="h-8 gap-2 bg-primary hover:bg-primary/90 px-3 text-xs font-bold"
                        onClick={() => setIsExportModalOpen(true)}
                        disabled={isExporting || isPipelineRunning || !currentJobId}
                    >
                        {isExporting ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </header>

            {/* Main Content with Resizable Panels */}
            <main className="flex-1 overflow-hidden relative w-full h-full max-w-full min-w-0">
                <ResizablePanelGroup direction="vertical" className="w-full h-full min-w-0">
                    {/* Top Section: Sidebar + Player + Settings */}
                    <ResizablePanel defaultSize={75} minSize={30} className="min-w-0">
                        <ResizablePanelGroup
                            key={`editor-layout-${isSidebarOpen}`}
                            direction="horizontal"
                            className="w-full h-full min-w-0 items-stretch"
                        >
                            {/* Column 1: Source Grid (Slimmer) */}
                            {isSidebarOpen && (
                                <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="bg-card">
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
                                                                        <div
                                                                            className="h-full bg-primary rounded-full transition-all duration-500 animate-progress-stripes"
                                                                            style={{ width: `${pipelineProgress}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-3 font-medium">
                                                                        AI is {pipelineStatus.toLowerCase() || "processing your audio"}
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

                            {/* Column 3: SRT Editor (Slimmer) */}
                            <ResizablePanel defaultSize={isSidebarOpen ? 25 : 35} minSize={15} className="min-w-0">
                                <aside className="h-full bg-card flex flex-col overflow-hidden border-l">
                                    <SRTSettingsPanel />
                                </aside>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>

                    <ResizableHandle className="h-1 bg-border/50 hover:bg-primary/50 transition-colors" />

                    {/* Bottom Section: Full Width Timeline */}
                    <ResizablePanel defaultSize={25} minSize={15} className="min-w-0">
                        <div className="h-full w-full min-w-0 overflow-hidden bg-card/50 backdrop-blur-md">
                            <CutTimeline
                                onRemoveClip={handleRemoveClip}
                                onAddClip={ensureJobAndAddClip}
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>

            {/* Export Settings Modal */}
            <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Export Video</DialogTitle>
                        <DialogDescription>
                            Your export will run on the server in the background.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-muted-foreground ml-1">Resolution</label>
                            <Select
                                value={exportResolution}
                                onValueChange={(v: any) => setExportResolution(v)}
                            >
                                <SelectTrigger className="w-full h-14 rounded-2xl text-lg border-2 focus:ring-primary/20">
                                    <SelectValue placeholder="Select resolution" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl border-border">
                                    <SelectItem value="sd" className="py-3 px-4 rounded-xl">SD (480p) - fastest</SelectItem>

                                    <SelectItem value="hd" className="py-3 px-4 rounded-xl" disabled={!isResolutionAccessible(entitlements?.exportResolutionLimit, "hd")}>
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span>HD (720p) - fast</span>
                                            {!isResolutionAccessible(entitlements?.exportResolutionLimit, "hd") && <LockIcon className="size-3 text-primary" />}
                                        </div>
                                    </SelectItem>

                                    <SelectItem value="fhd" className="py-3 px-4 rounded-xl" disabled={!isResolutionAccessible(entitlements?.exportResolutionLimit, "fhd")}>
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span>FHD (1080p) - recommended</span>
                                            {!isResolutionAccessible(entitlements?.exportResolutionLimit, "fhd") && <LockIcon className="size-3 text-primary" />}
                                        </div>
                                    </SelectItem>

                                    <SelectItem value="uhd" className="py-3 px-4 rounded-xl" disabled={!isResolutionAccessible(entitlements?.exportResolutionLimit, "uhd")}>
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span>UHD (4K) - highest quality</span>
                                            {!isResolutionAccessible(entitlements?.exportResolutionLimit, "uhd") && <LockIcon className="size-3 text-primary" />}
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-secondary/30 p-4 rounded-2xl border border-dashed text-xs text-muted-foreground leading-relaxed">
                            You can track render progress on the result page after starting export.
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3">
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 w-full sm:w-auto" onClick={() => setIsExportModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-2xl h-12 px-8 gap-2 font-bold shadow-lg shadow-primary/20 w-full sm:w-auto"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                            Start Server Render
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}



