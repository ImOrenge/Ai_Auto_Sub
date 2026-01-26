"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor } from "./EditorContext";
import { cn } from "@/lib/utils";
import {
    Scissors,
    Plus,
    X,
    Play,
    ZoomIn,
    ZoomOut,
    MoveVertical,
    Trash2,
    Maximize2,
    Layers,
    Copy,
    Scissors as ScissorsIcon,
    ClipboardPaste,
    Files
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AssetRecord } from "@/lib/assets/types";
import { ClipThumbnails, WaveformDisplay } from "./ClipVisuals";

type CutTimelineProps = {
    /** Callback to remove a clip */
    onRemoveClip?: (id: string) => void;
    /** Callback when an asset is dropped to add as clip */
    onAddClip?: (asset: AssetRecord) => void;
};

export function CutTimeline({
    onRemoveClip,
    onAddClip,
}: CutTimelineProps) {
    const {
        duration,
        currentTime,
        clips,
        activeLayerId,
        activeClipId,
        layers,
        setCurrentTime: onSeek,
        setClips: onClipsChange,
        setActiveClipId: onClipSelect,
        switchLayer,
        addLayer,
        addClipToLayer,
        deleteClip,
        duplicateClip,
        copyClip,
        cutClip,
        pasteClip,
        clipboard,
    } = useEditor();

    const trackRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState(100); // Percentage: 100% = 10px per second
    const pps = (zoomLevel / 100) * 10; // Pixels per second
    const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
    const [dragInfo, setDragInfo] = useState<{
        type: 'move' | 'start' | 'end' | 'playhead' | 'selection';
        id?: string;
        startX: number;
        initialStart: number;
        initialEnd: number;
        initialPlayheadTime?: number;
    } | null>(null);

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        clipId?: string;
        layerId?: string;
    } | null>(null);

    // Calculate absolute sequence timings for ALL layers to find maximum duration
    const allLayersDurations = useMemo(() => {
        return layers.map(l => (l.clips || []).reduce((acc, c) => {
            const clipDuration = c.endTime - c.startTime;
            const effectiveSpeed = ('speed' in c && c.speed) ? c.speed : 1;
            return acc + (clipDuration / effectiveSpeed);
        }, 0));
    }, [layers]);

    const maxDuration = useMemo(() => Math.max(...allLayersDurations, duration), [allLayersDurations, duration]);

    // Calculate absolute sequence timings for the ACTIVE layer specifically (for playhead/offsets)
    const clipsWithOffsets = useMemo(() => {
        let total = 0;
        return (clips || []).map(clip => {
            const rawDuration = clip.endTime - clip.startTime;
            const effectiveSpeed = ('speed' in clip && clip.speed) ? clip.speed : 1;
            const clipDuration = rawDuration / effectiveSpeed;
            const offset = total;
            total += clipDuration;
            return { ...clip, offset, clipDuration, rawDuration, effectiveSpeed };
        });
    }, [clips]);

    const sequenceDuration = maxDuration;

    // Playhead in sequence time (relative to active layer offset)
    const sequenceCurrentTime = useMemo(() => {
        const activeClip = clips?.find(c => c.id === activeClipId);
        if (!activeClip) return currentTime; // Fallback to raw currentTime if no active clip
        const activeClipWithOffset = clipsWithOffsets.find(c => c.id === activeClip.id);
        if (!activeClipWithOffset) return currentTime;
        return activeClipWithOffset.offset + (currentTime - activeClip.startTime);
    }, [activeClipId, currentTime, clips, clipsWithOffsets]);

    const sequenceDurationInPx = useMemo(() => sequenceDuration * pps, [sequenceDuration, pps]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSplit = useCallback(() => {
        if (!activeLayerId || !clips || !onClipsChange) return;
        const activeClip = clips.find(c => c.id === activeClipId);
        if (!activeClip) return;

        // currentTime is source time, which is what we want for split
        const splitTime = currentTime;
        if (splitTime <= activeClip.startTime + 0.1 || splitTime >= activeClip.endTime - 0.1) {
            return;
        }

        const index = clips.findIndex(c => c.id === activeClipId);
        const clip1 = { ...activeClip, id: crypto.randomUUID(), endTime: splitTime };
        const clip2 = { ...activeClip, id: crypto.randomUUID(), startTime: splitTime, order: activeClip.order + 1 };

        const newClips = [
            ...clips.slice(0, index),
            clip1,
            clip2,
            ...clips.slice(index + 1).map(c => ({ ...c, order: c.order + 1 }))
        ];
        onClipsChange(newClips);
    }, [activeLayerId, clips, onClipsChange, activeClipId, currentTime]);

    const handleDeleteSelection = useCallback(() => {
        if (!selectionRange || !onClipsChange || !clips) return;
        const { start, end } = selectionRange;
        const min = Math.min(start, end);
        const max = Math.max(start, end);

        let newClips: any[] = [];
        for (const clip of clipsWithOffsets) {
            const clipDur = clip.clipDuration;
            const clipOffsetStart = clip.offset;
            const clipOffsetEnd = clip.offset + clipDur;

            if (clipOffsetEnd <= min) {
                newClips.push(clip);
            }
            else if (clipOffsetStart >= max) {
                newClips.push(clip);
            }
            else if (clipOffsetStart < min && clipOffsetEnd > max) {
                newClips.push({ ...clip, id: crypto.randomUUID(), endTime: clip.startTime + (min - clipOffsetStart) });
                newClips.push({ ...clip, id: crypto.randomUUID(), startTime: clip.startTime + (max - clipOffsetStart), order: clip.order + 1 });
            }
            else if (clipOffsetStart < min && clipOffsetEnd <= max) {
                newClips.push({ ...clip, endTime: clip.startTime + (min - clipOffsetStart) });
            }
            else if (clipOffsetStart >= min && clipOffsetEnd > max) {
                newClips.push({ ...clip, startTime: clip.startTime + (max - clipOffsetStart) });
            }
        }

        onClipsChange(newClips.map((c, i) => ({ ...c, order: i })));
        setSelectionRange(null);
    }, [selectionRange, onClipsChange, clips, clipsWithOffsets]);

    const handleContextMenu = useCallback((e: React.MouseEvent, clipId?: string, layerId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            clipId,
            layerId
        });
    }, []);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'c':
                        if (activeClipId) {
                            copyClip(activeClipId);
                        }
                        break;
                    case 'x':
                        if (activeClipId) {
                            cutClip(activeClipId);
                        }
                        break;
                    case 'v':
                        if (activeLayerId && clipboard) {
                            pasteClip(activeLayerId, sequenceCurrentTime);
                        }
                        break;
                    case 'd':
                        if (activeClipId) {
                            e.preventDefault();
                            duplicateClip(activeClipId);
                        }
                        break;
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (activeClipId) {
                    deleteClip(activeClipId);
                } else if (selectionRange) {
                    handleDeleteSelection();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeClipId, activeLayerId, clipboard, sequenceCurrentTime, selectionRange, copyClip, cutClip, pasteClip, duplicateClip, deleteClip, handleDeleteSelection]);

    useEffect(() => {
        if (!dragInfo) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!trackRef.current || !onClipsChange || !clips) return;

            const rect = trackRef.current.getBoundingClientRect();
            const { type, id, startX, initialStart, initialEnd, initialPlayheadTime } = dragInfo;

            if (type === 'playhead' && initialPlayheadTime !== undefined) {
                const deltaX = (e.clientX - startX);
                const deltaTime = deltaX / pps;
                const nextTime = Math.max(0, Math.min(sequenceDuration, initialPlayheadTime + deltaTime));

                // Seek to nextTime
                let remaining = nextTime;
                for (const c of clipsWithOffsets) {
                    if (remaining <= c.clipDuration) {
                        onClipSelect?.(c.id);
                        onSeek(c.startTime + remaining);
                        break;
                    }
                    remaining -= c.clipDuration;
                }
                return;
            }

            if (type === 'selection') {
                const currentX = e.clientX - rect.left;
                setSelectionRange(prev => prev ? { ...prev, end: Math.max(0, currentX / pps) } : null);
                return;
            }

            const deltaX = (e.clientX - startX);
            const deltaTime = deltaX / pps;

            let nextClips = [...clips];
            const clipIndex = nextClips.findIndex(c => c.id === id);
            if (clipIndex === -1) return;

            const clip = nextClips[clipIndex];

            if (type === 'start') {
                const newStart = Math.max(0, Math.min(initialStart + deltaTime, clip.endTime - 0.1));
                nextClips[clipIndex] = { ...clip, startTime: newStart };
            } else if (type === 'end') {
                const newEnd = Math.max(clip.startTime + 0.1, initialEnd + deltaTime);
                nextClips[clipIndex] = { ...clip, endTime: newEnd };
            }

            onClipsChange(nextClips);
        };

        const handleMouseUp = () => {
            setDragInfo(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragInfo, sequenceDuration, clips, onClipsChange, pps, clipsWithOffsets, onSeek, onClipSelect]);

    const handleDropOnPlaceholder = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        try {
            const data = e.dataTransfer.getData("application/json");
            if (data) {
                const asset = JSON.parse(data);
                addLayer(`Sequence ${layers.length + 1}`, asset);
            }
        } catch (err) {
            console.error("Failed to drop", err);
        }
    }, [layers.length, addLayer]);

    const timeMarkers = useMemo(() => {
        const viewDuration = Math.max(sequenceDuration, 5);
        const interval = 10; // Fixed 10s intervals as requested
        const markers: number[] = [];
        for (let t = 0; t <= viewDuration; t += interval) {
            markers.push(t);
        }
        return markers;
    }, [sequenceDuration]);

    const fitToView = useCallback(() => {
        if (!scrollContainerRef.current || sequenceDuration <= 0) return;
        const containerWidth = scrollContainerRef.current.clientWidth - 100;
        const optimalPPS = Math.max(2, Math.min(100, containerWidth / sequenceDuration));
        // Convert pps back to percentage: pps = (zoom/100)*10 => zoom = (pps/10)*100
        setZoomLevel(Math.round((optimalPPS / 10) * 100));
    }, [sequenceDuration]);

    return (
        <div className="bg-card border-t border-border px-4 py-3 flex flex-col gap-3 h-full select-none w-full max-w-full min-w-0 overflow-hidden">
            <style jsx global>{`
                .timeline-scrollbar::-webkit-scrollbar {
                    height: 10px;
                }
                .timeline-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 5px;
                }
                .timeline-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary), 0.3);
                    border-radius: 5px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                .timeline-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--primary), 0.5);
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
            `}</style>
            {/* Toolbar */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Timeline Stack</span>
                        <span className="text-xs font-mono font-bold text-primary">{layers.length} Layers | {formatTime(sequenceDuration)}</span>
                    </div>
                    <div className="h-4 w-px bg-border mx-2" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-[10px] font-black uppercase tracking-tighter"
                        onClick={handleSplit}
                        disabled={!activeClipId}
                    >
                        <Scissors className="size-3.5" />
                        Split
                    </Button>
                    {selectionRange && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 gap-2 text-[10px] font-black uppercase tracking-tighter"
                            onClick={handleDeleteSelection}
                        >
                            <Trash2 className="size-3.5" />
                            Delete Range
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 px-2 rounded-lg border border-border/50">
                        <ZoomOut className="size-3.5 text-muted-foreground" />
                        <input
                            type="range"
                            min="50"
                            max="300"
                            step="5"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                            className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <ZoomIn className="size-3.5 text-muted-foreground" />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-tighter gap-2"
                        onClick={fitToView}
                    >
                        <Maximize2 className="size-3.5" />
                        Fit
                    </Button>
                </div>
            </div>

            {/* Custom Context Menu with Portal */}
            {contextMenu && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[999999] pointer-events-auto"
                    onClick={() => setContextMenu(null)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                >
                    <div
                        className="fixed z-[999999] bg-popover/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] py-1.5 min-w-[220px] animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            left: Math.min(contextMenu.x, window.innerWidth - 240),
                            top: Math.min(contextMenu.y, window.innerHeight - 300)
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-3 py-1.5 mb-1 border-b border-border/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Clip Actions</span>
                        </div>
                        <div className="flex flex-col">
                            {contextMenu.clipId ? (
                                <>
                                    <button className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors text-foreground w-full text-left" onClick={() => { copyClip(contextMenu.clipId!); setContextMenu(null); }}>
                                        <Copy className="size-4 opacity-70" />
                                        <span>Copy Clip</span>
                                        <span className="ml-auto text-[10px] opacity-40 font-mono">Ctrl+C</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors text-foreground w-full text-left" onClick={() => { cutClip(contextMenu.clipId!); setContextMenu(null); }}>
                                        <ScissorsIcon className="size-4 opacity-70" />
                                        <span>Cut Clip</span>
                                        <span className="ml-auto text-[10px] opacity-40 font-mono">Ctrl+X</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors text-foreground w-full text-left" onClick={() => { duplicateClip(contextMenu.clipId!); setContextMenu(null); }}>
                                        <Files className="size-4 opacity-70" />
                                        <span>Duplicate</span>
                                        <span className="ml-auto text-[10px] opacity-40 font-mono">Ctrl+D</span>
                                    </button>
                                    <div className="h-px bg-border/40 my-1.5 mx-2" />
                                    <button className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors w-full text-left font-bold" onClick={() => { deleteClip(contextMenu.clipId!); setContextMenu(null); }}>
                                        <Trash2 className="size-4 opacity-70" />
                                        <span>Delete Clip</span>
                                        <span className="ml-auto text-[10px] opacity-50 font-mono">Del</span>
                                    </button>
                                </>
                            ) : null}

                            {contextMenu.layerId && (
                                <>
                                    {contextMenu.clipId && <div className="h-px bg-border/40 my-1.5 mx-2" />}
                                    <button
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full text-left",
                                            clipboard ? "hover:bg-primary/10 text-foreground" : "opacity-30 cursor-not-allowed text-muted-foreground"
                                        )}
                                        disabled={!clipboard}
                                        onClick={() => { pasteClip(contextMenu.layerId!, sequenceCurrentTime); setContextMenu(null); }}
                                    >
                                        <ClipboardPaste className="size-4 opacity-70" />
                                        <span>Paste Here</span>
                                        <span className="ml-auto text-[10px] opacity-40 font-mono">Ctrl+V</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Timeline Viewport */}
            <div
                ref={scrollContainerRef}
                className="relative flex-1 bg-muted/10 rounded-xl border border-border/50 overflow-x-auto overflow-y-hidden timeline-scrollbar w-full"
            >
                <div
                    ref={trackRef}
                    className="relative min-w-full flex flex-col pt-10 pb-6"
                    style={{ width: sequenceDurationInPx + 400 }} // Added some buffer
                    onMouseDown={(e) => {
                        if (e.button !== 0) return; // Only left click for seeking/dragging
                        const rect = trackRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const clickX = e.clientX - rect.left;
                        const clickTime = clickX / pps;

                        const isRuler = (e.clientY - rect.top) < 40;
                        const isSelectionDrag = e.altKey || isRuler;

                        if (isSelectionDrag) {
                            setSelectionRange({ start: clickTime, end: clickTime });
                            setDragInfo({
                                type: 'selection',
                                startX: e.clientX,
                                initialStart: 0,
                                initialEnd: 0
                            });
                        } else {
                            // Seek
                            let remaining = clickTime;
                            let matched = false;
                            for (const c of clipsWithOffsets) {
                                if (remaining <= c.clipDuration) {
                                    onClipSelect?.(c.id);
                                    onSeek(c.startTime + remaining);
                                    matched = true;
                                    break;
                                }
                                remaining -= c.clipDuration;
                            }
                            if (!matched) setSelectionRange(null);

                            setDragInfo({
                                type: 'playhead',
                                startX: e.clientX,
                                initialStart: 0,
                                initialEnd: 0,
                                initialPlayheadTime: clickTime
                            });
                        }
                    }}
                >
                    {/* Time Ruler */}
                    <div className="absolute top-0 left-0 right-0 h-10 border-b bg-card/90 backdrop-blur-sm z-30">
                        {timeMarkers.map(t => (
                            <div
                                key={t}
                                className="absolute top-0 border-l border-border h-full flex flex-col justify-end"
                                style={{ left: t * pps }}
                            >
                                <span className="text-[9px] font-mono text-muted-foreground ml-1.5 mb-1">{formatTime(t)}</span>
                                <div className="absolute bottom-0 left-0 w-px h-2 bg-muted-foreground/30" />
                            </div>
                        ))}
                    </div>

                    {/* Top Placeholder */}
                    <div
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/20', 'border-primary/50'); }}
                        onDragLeave={e => e.currentTarget.classList.remove('bg-primary/20', 'border-primary/50')}
                        onDrop={e => { e.currentTarget.classList.remove('bg-primary/20', 'border-primary/50'); handleDropOnPlaceholder(e); }}
                        className="h-8 border-b border-dashed border-border/50 flex items-center justify-center transition-all group/new-track"
                    >
                        <Plus className="size-4 text-muted-foreground/20 group-hover/new-track:text-primary transition-all" />
                    </div>

                    {/* Tracks Stack */}
                    <div className="flex flex-col gap-1 py-1">
                        {layers.map((layer) => (
                            <div
                                key={layer.id}
                                onClick={() => switchLayer(layer.id)}
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary/20'); }}
                                onDragLeave={e => e.currentTarget.classList.remove('ring-2', 'ring-primary/20')}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('ring-2', 'ring-primary/20');
                                    try {
                                        const data = e.dataTransfer.getData("application/json");
                                        if (data) addClipToLayer(layer.id, JSON.parse(data));
                                    } catch { }
                                }}
                                onContextMenu={(e) => handleContextMenu(e, undefined, layer.id)}
                                className={cn(
                                    "relative h-20 transition-all border rounded-lg flex",
                                    activeLayerId === layer.id
                                        ? "bg-primary/5 border-primary/30 shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]"
                                        : "bg-background/40 border-border/30 hover:border-border hover:bg-muted/10"
                                )}
                            >
                                {/* Track Content */}
                                <div className="relative flex-1 overflow-hidden h-full">
                                    {(layer.clips || []).map((clip, idx) => {
                                        // Calculate offset accounting for speed
                                        const clipOffset = layer.clips.slice(0, idx).reduce((acc, c) => {
                                            const dur = c.endTime - c.startTime;
                                            const spd = ('speed' in c && c.speed) ? c.speed : 1;
                                            return acc + (dur / spd);
                                        }, 0);
                                        const rawWidth = clip.endTime - clip.startTime;
                                        const clipSpeed = ('speed' in clip && clip.speed) ? clip.speed : 1;
                                        const clipWidth = rawWidth / clipSpeed;

                                        return (
                                            <div
                                                key={clip.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClipSelect?.(clip.id);
                                                }}
                                                className={cn(
                                                    "absolute inset-y-2 border rounded-md overflow-hidden bg-card shadow-sm transition-all",
                                                    (activeLayerId === layer.id && activeClipId === clip.id) ? "border-primary ring-2 ring-primary/20 z-10" : "border-border/50 z-0"
                                                )}
                                                style={{
                                                    left: clipOffset * pps,
                                                    width: clipWidth * pps
                                                }}
                                                onContextMenu={(e) => handleContextMenu(e, clip.id, layer.id)}
                                            >
                                                <div className="absolute inset-0 opacity-40">
                                                    <ClipThumbnails
                                                        src={clip.asset.storageKey ? `/api/assets/${clip.asset.id}/view` : (clip.asset.sourceUrl || "")}
                                                        startTime={clip.startTime}
                                                        endTime={clip.endTime}
                                                        width={clipWidth * pps}
                                                        height={80}
                                                    />
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 h-8 opacity-20 pointer-events-none">
                                                    <WaveformDisplay
                                                        width={clipWidth * pps}
                                                        height={32}
                                                        color="hsl(var(--primary))"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent flex flex-col justify-end p-1.5 pointer-events-none">
                                                    <span className="text-[9px] font-bold truncate text-foreground">{clip.asset.filename}</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[7px] font-mono opacity-50">{formatTime(clipWidth)}</span>
                                                        {clipSpeed !== 1 && (
                                                            <span className="text-[7px] font-mono text-primary font-bold">{clipSpeed}x</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Trimming Handles */}
                                                {(activeLayerId === layer.id && activeClipId === clip.id) && (
                                                    <>
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/30 z-20"
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                setDragInfo({
                                                                    type: 'start',
                                                                    id: clip.id,
                                                                    startX: e.clientX,
                                                                    initialStart: clip.startTime,
                                                                    initialEnd: clip.endTime
                                                                });
                                                            }}
                                                        />
                                                        <div
                                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/30 z-20"
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                setDragInfo({
                                                                    type: 'end',
                                                                    id: clip.id,
                                                                    startX: e.clientX,
                                                                    initialStart: clip.startTime,
                                                                    initialEnd: clip.endTime
                                                                });
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Placeholder */}
                    <div
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/10', 'border-primary/50'); }}
                        onDragLeave={e => e.currentTarget.classList.remove('bg-primary/10', 'border-primary/50')}
                        onDrop={e => { e.currentTarget.classList.remove('bg-primary/10', 'border-primary/50'); handleDropOnPlaceholder(e); }}
                        className="h-14 flex items-center justify-center border-t border-dashed border-border/50 group/new-track transition-all mt-3 rounded-lg hover:border-primary/30"
                    >
                        <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground/30 group-hover/new-track:text-primary transition-all tracking-[0.2em]">
                            <Plus className="size-4 animate-pulse" />
                            <span>DRAG ASSET HERE TO ADD LAYER</span>
                        </div>
                    </div>

                    {/* Selection Highlight */}
                    {selectionRange && (
                        <div
                            className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/50 z-20 pointer-events-none"
                            style={{
                                left: Math.min(selectionRange.start, selectionRange.end) * pps,
                                width: Math.abs(selectionRange.end - selectionRange.start) * pps
                            }}
                        />
                    )}

                    {/* Global Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-[2px] bg-primary z-50 pointer-events-none transition-none"
                        style={{ left: sequenceCurrentTime * pps }}
                    >
                        <div className="absolute top-0 -left-[5px] size-2.5 bg-primary rotate-45 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    </div>
                </div>
            </div>

            {/* Hint Footer */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest">
                    <div className="flex items-center gap-1.5"><ScissorsIcon className="size-2.5" /> Alt+Drag to select range</div>
                    <div className="size-1 bg-muted-foreground/10 rounded-full" />
                    <div className="flex items-center gap-1.5"><Play className="size-2.5" /> Click onto tracks to prioritize</div>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground/30">
                    Zoom: {zoomLevel}% ({pps.toFixed(1)}px/s)
                </div>
            </div>
        </div>
    );
}
