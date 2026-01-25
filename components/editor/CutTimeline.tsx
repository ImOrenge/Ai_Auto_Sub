"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Scissors, Plus, X, Play, ZoomIn, ZoomOut, MoveVertical, Trash2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubtitleCue, VideoCut, SequenceClip } from "@/lib/jobs/types";
import { AssetRecord } from "@/lib/assets/types";
import { ClipThumbnails, WaveformDisplay } from "./ClipVisuals";

type CutTimelineProps = {
    /** Total video duration in seconds */
    duration: number;
    /** Current playback time in seconds */
    currentTime: number;
    /** Array of subtitle cues */
    cues: SubtitleCue[];
    /** Sequence of clips */
    clips?: {
        id: string;
        asset: AssetRecord;
        startTime: number;
        endTime: number;
        order: number;
    }[] | null;
    /** ID of currently selected clip */
    activeClipId?: string | null;
    /** Callback when timeline is clicked to seek */
    onSeek: (time: number) => void;
    /** Callback when clips change */
    onClipsChange?: (clips: any[]) => void;
    /** Callback when a clip is selected */
    onClipSelect?: (id: string) => void;
    /** Callback to remove a clip */
    onRemoveClip?: (id: string) => void;
    /** Callback when an asset is dropped to add as clip */
    onAddClip?: (asset: AssetRecord) => void;
};

export function CutTimeline({
    duration,
    currentTime,
    cues,
    clips = null,
    activeClipId,
    onSeek,
    onClipsChange,
    onClipSelect,
    onRemoveClip,
    onAddClip,
}: CutTimelineProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState(10); // pixels per second
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
    const [dragInfo, setDragInfo] = useState<{
        type: 'move' | 'start' | 'end' | 'playhead' | 'selection';
        id?: string;
        startX: number;
        initialStart: number;
        initialEnd: number;
        initialPlayheadTime?: number;
    } | null>(null);

    // Calculate absolute sequence timings
    const { sequenceDuration, clipsWithOffsets } = useMemo(() => {
        let total = 0;
        const result = (clips || []).map(clip => {
            const clipDuration = clip.endTime - clip.startTime;
            const offset = total;
            total += clipDuration;
            return { ...clip, offset, clipDuration };
        });
        return { sequenceDuration: total, clipsWithOffsets: result };
    }, [clips]);

    // Playhead in sequence time
    // This is tricky: currentTime is relative to the ACTIVE clip's source
    // We need to know where the playback IS in the entire sequence.
    // For simplicity, let's assume MainEditor tells us the "sequenceTime" or we calculate it.
    // If currentTime is active clip source time, we find the active clip's offset.
    const sequenceCurrentTime = useMemo(() => {
        const activeClip = clips?.find(c => c.id === activeClipId);
        if (!activeClip) return 0;
        const activeClipWithOffset = clipsWithOffsets.find(c => c.id === activeClipId);
        if (!activeClipWithOffset) return 0;
        return activeClipWithOffset.offset + (currentTime - activeClip.startTime);
    }, [activeClipId, currentTime, clips, clipsWithOffsets]);

    // Format time for display (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSplit = () => {
        if (!activeClipId || !onClipsChange || !clips) return;
        const activeClip = clips.find(c => c.id === activeClipId);
        if (!activeClip) return;

        // Current time relative to clip start
        const clipLocalTime = currentTime;
        if (clipLocalTime <= activeClip.startTime + 0.1 || clipLocalTime >= activeClip.endTime - 0.1) {
            // alert("Cannot split too close to boundaries");
            return;
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
        onClipsChange(newClips);
    };

    const handleDeleteSelection = () => {
        if (!selectionRange || !onClipsChange || !clips) return;
        const { start, end } = selectionRange;
        const min = Math.min(start, end);
        const max = Math.max(start, end);

        let newClips: any[] = [];
        let currentOffset = 0;

        for (const clip of clipsWithOffsets) {
            const clipDur = clip.clipDuration;
            const clipOffsetStart = clip.offset;
            const clipOffsetEnd = clip.offset + clipDur;

            // 1. Clip is entirely before selection
            if (clipOffsetEnd <= min) {
                newClips.push(clip);
            }
            // 2. Clip is entirely after selection
            else if (clipOffsetStart >= max) {
                newClips.push(clip);
            }
            // 3. Selection is entirely inside clip
            else if (clipOffsetStart < min && clipOffsetEnd > max) {
                // Split into two
                newClips.push({ ...clip, id: crypto.randomUUID(), endTime: clip.startTime + (min - clipOffsetStart) });
                newClips.push({ ...clip, id: crypto.randomUUID(), startTime: clip.startTime + (max - clipOffsetStart) });
            }
            // 4. Clip starts before selection but ends inside it
            else if (clipOffsetStart < min && clipOffsetEnd <= max) {
                newClips.push({ ...clip, endTime: clip.startTime + (min - clipOffsetStart) });
            }
            // 5. Clip starts inside selection but ends after it
            else if (clipOffsetStart >= min && clipOffsetEnd > max) {
                newClips.push({ ...clip, startTime: clip.startTime + (max - clipOffsetStart) });
            }
            // 6. Clip is entirely inside selection (discard)
            // This case is implicitly handled by the other conditions.
            // If clipOffsetStart >= min && clipOffsetEnd <= max, it won't fall into 1, 2, 3, 4, 5.
            // So it's effectively discarded.
        }

        onClipsChange(newClips.map((c, i) => ({ ...c, order: i })));
        setSelectionRange(null);
    };

    useEffect(() => {
        if (!dragInfo) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!trackRef.current || !onClipsChange || !clips) return;

            const rect = trackRef.current.getBoundingClientRect();
            const { type, id, startX, initialStart, initialEnd, initialPlayheadTime } = dragInfo;

            if (type === 'playhead' && initialPlayheadTime !== undefined) {
                const deltaX = (e.clientX - startX);
                const deltaTime = deltaX / zoomLevel;
                const nextTime = Math.max(0, Math.min(sequenceDuration, initialPlayheadTime + deltaTime));

                // Seek to nextTime (need to find which clip and what source time)
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
                setSelectionRange(prev => prev ? { ...prev, end: Math.max(0, currentX / zoomLevel) } : null);
                return;
            }

            const deltaX = (e.clientX - startX);
            const deltaTime = deltaX / zoomLevel;

            let nextClips = [...clips];
            const clipIndex = nextClips.findIndex(c => c.id === id);
            if (clipIndex === -1) return;

            const clip = nextClips[clipIndex];

            if (type === 'start') {
                const newStart = Math.max(0, Math.min(initialStart + deltaTime, clip.endTime - 0.1));
                nextClips[clipIndex] = { ...clip, startTime: newStart };
            } else if (type === 'end') {
                const newEnd = Math.max(clip.startTime + 0.1, initialEnd + deltaTime);
                // Should also check asset total duration if we had it
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
    }, [dragInfo, sequenceDuration, clips, onClipsChange, zoomLevel, clipsWithOffsets, onSeek, onClipSelect]);

    const timeMarkers = useMemo(() => {
        if (sequenceDuration <= 0) return [];
        const interval = sequenceDuration > 600 ? 60 : sequenceDuration > 120 ? 30 : sequenceDuration > 60 ? 10 : 5;
        const markers: number[] = [];
        for (let t = 0; t <= sequenceDuration; t += interval) {
            markers.push(t);
        }
        return markers;
    }, [sequenceDuration]);

    // Auto-fit zoom when sequence duration changes
    const fitToView = useCallback(() => {
        if (!scrollContainerRef.current || sequenceDuration <= 0) return;
        const containerWidth = scrollContainerRef.current.clientWidth - 100; // padding
        const optimalZoom = Math.max(2, Math.min(100, containerWidth / sequenceDuration));
        setZoomLevel(optimalZoom);
    }, [sequenceDuration]);

    // Auto-fit on initial load or when clips change significantly
    useEffect(() => {
        if (sequenceDuration > 0 && scrollContainerRef.current) {
            const containerWidth = scrollContainerRef.current.clientWidth - 100;
            const currentTotalWidth = sequenceDuration * zoomLevel;
            // If content is wider than viewport, fit to view
            if (currentTotalWidth > containerWidth * 1.5) {
                fitToView();
            }
        }
    }, [sequenceDuration]); // Only run when duration changes

    return (
        <div className="bg-card border-t border-border px-4 py-3 flex flex-col gap-3 h-full select-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Timeline</span>
                        <span className="text-xs font-mono font-bold">{clips?.length || 0} Clips | {formatTime(sequenceDuration)}</span>
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
                    <div className="flex items-center gap-2">
                        <ZoomOut className="size-3.5 text-muted-foreground" />
                        <input
                            type="range"
                            min="2"
                            max="100"
                            step="1"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                            className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <ZoomIn className="size-3.5 text-muted-foreground" />
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-tighter"
                        onClick={fitToView}
                        title="Fit to View"
                    >
                        <Maximize2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            {/* Timeline Viewport */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    "relative flex-1 bg-muted/10 rounded-xl border overflow-x-auto overflow-y-hidden custom-scrollbar transition-all",
                    isDragOver
                        ? "border-primary border-2 bg-primary/5 ring-4 ring-primary/20"
                        : "border-border/50"
                )}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                    setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                    // Only set false if leaving the container entirely
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDragOver(false);
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    try {
                        const data = e.dataTransfer.getData("application/json");
                        if (data && onAddClip) {
                            const asset: AssetRecord = JSON.parse(data);
                            onAddClip(asset);
                        }
                    } catch (err) {
                        console.error("[CutTimeline] Failed to parse dropped asset:", err);
                    }
                }}
            >
                <div
                    ref={trackRef}
                    className="relative h-full min-w-full"
                    style={{ width: Math.max(800, sequenceDuration * zoomLevel + 200) }} // padding at end, min width for small sequences
                    onMouseDown={(e) => {
                        const rect = trackRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const clickX = e.clientX - rect.left;
                        const clickTime = clickX / zoomLevel;

                        // Shift+Click or Alt+Click for selection? 
                        // Or just drag on empty area? 
                        // Let's assume drag on empty area (top ruler or bottom of track)
                        const isRuler = (e.clientY - rect.top) < 24;
                        const isSelectionDrag = e.altKey || isRuler;

                        if (isSelectionDrag) {
                            setSelectionRange({ start: clickTime, end: clickTime });
                            setDragInfo({
                                type: 'selection',
                                startX: e.clientX,
                                initialStart: 0, // Not used for selection
                                initialEnd: 0 // Not used for selection
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
                            if (!matched) setSelectionRange(null); // Clear selection if clicking outside clips

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
                    <div className="absolute top-0 left-0 right-0 h-6 border-b bg-muted/20 z-10">
                        {timeMarkers.map(t => (
                            <div
                                key={t}
                                className="absolute top-0 border-l border-muted-foreground/20 h-full flex flex-col justify-end"
                                style={{ left: t * zoomLevel }}
                            >
                                <span className="text-[8px] font-mono text-muted-foreground ml-1 mb-0.5">{formatTime(t)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Selection Highlight */}
                    {selectionRange && (
                        <div
                            className="absolute top-0 bottom-0 bg-primary/20 border-x border-primary/50 z-30 pointer-events-none"
                            style={{
                                left: Math.min(selectionRange.start, selectionRange.end) * zoomLevel,
                                width: Math.abs(selectionRange.end - selectionRange.start) * zoomLevel
                            }}
                        />
                    )}

                    {/* Clips Area */}
                    <div className="absolute top-6 bottom-0 left-0 right-0 py-2">
                        {clipsWithOffsets.map((clip) => (
                            <div
                                key={clip.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClipSelect?.(clip.id);
                                }}
                                className={cn(
                                    "absolute top-0 bottom-0 border-2 rounded-lg transition-all cursor-pointer overflow-hidden group/clip",
                                    activeClipId === clip.id
                                        ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] z-20"
                                        : "bg-card border-border hover:border-primary/50 z-10"
                                )}
                                style={{
                                    left: clip.offset * zoomLevel,
                                    width: clip.clipDuration * zoomLevel
                                }}
                            >
                                {/* Clip Thumbnails */}
                                <div className="absolute inset-0 overflow-hidden opacity-40">
                                    <ClipThumbnails
                                        src={clip.asset.storageKey ? `/api/assets/${clip.asset.id}/view` : (clip.asset.sourceUrl || "")}
                                        startTime={clip.startTime}
                                        endTime={clip.endTime}
                                        width={clip.clipDuration * zoomLevel}
                                        height={80}
                                    />
                                </div>

                                {/* Waveform overlay */}
                                <div className="absolute inset-x-0 bottom-0 h-8 opacity-30 pointer-events-none">
                                    <WaveformDisplay
                                        width={clip.clipDuration * zoomLevel}
                                        height={32}
                                        color={activeClipId === clip.id ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                                    />
                                </div>

                                {/* Labels */}
                                <div className="relative p-2 flex flex-col h-full justify-between select-none">
                                    <div className="flex items-start justify-between gap-1 overflow-hidden">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold truncate leading-none mb-1">{clip.asset.filename}</span>
                                            <span className="text-[8px] text-muted-foreground font-mono leading-none">
                                                {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveClip?.(clip.id);
                                            }}
                                            className="shrink-0 size-5 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover/clip:opacity-100 hover:bg-destructive hover:text-white transition-all"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Trimming Handles */}
                                {activeClipId === clip.id && (
                                    <>
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-primary/40 active:bg-primary/60 border-r border-primary/20 flex items-center justify-center z-40"
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
                                        >
                                            <MoveVertical className="size-2 text-primary" />
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-primary/40 active:bg-primary/60 border-l border-primary/20 flex items-center justify-center z-40"
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
                                        >
                                            <MoveVertical className="size-2 text-primary" />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 bottom-0 w-[2px] bg-primary z-50 transition-none pointer-events-none"
                        style={{ left: sequenceCurrentTime * zoomLevel }}
                    >
                        <div className="absolute top-0 -left-[5px] size-2.5 bg-primary rotate-45" />
                    </div>
                </div>
            </div>

            {/* Hint */}
            <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest shrink-0">
                <div className="flex items-center gap-1.5"><Scissors className="size-2.5" /> Split at playhead</div>
                <div className="size-1 bg-muted-foreground/20 rounded-full" />
                <div className="flex items-center gap-1.5"><Play className="size-2.5" /> Drag Playhead to scrub</div>
                <div className="size-1 bg-muted-foreground/20 rounded-full" />
                <div className="flex items-center gap-1.5"><ZoomIn className="size-2.5" /> Use slider to zoom</div>
                <div className="size-1 bg-muted-foreground/20 rounded-full" />
                <div className="flex items-center gap-1.5"><MoveVertical className="size-2.5" /> Alt+Drag or Ruler drag to select range</div>
            </div>
        </div>
    );
}
