"use client";

import { useCallback } from "react";
import { useEditor } from "./EditorContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    CornerDownLeft,
    CornerDownRight,
    Plus,
    X,
    Play
} from "lucide-react";

type InOutControlsProps = {
    /** Add marked range to timeline */
    onAddToTimeline?: () => void;
};

/**
 * In/Out Point Controls
 * Shows current marking and allows setting/clearing In/Out points
 */
export function InOutControls({
    onAddToTimeline,
}: InOutControlsProps) {
    const {
        currentTime,
        duration,
        inPoint,
        outPoint,
        setInPoint: onSetInPoint,
        setOutPoint: onSetOutPoint,
        setCurrentTime: onSeek
    } = useEditor();
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const frames = Math.floor((seconds % 1) * 30); // Assume 30fps
        return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    };

    const handleSetIn = useCallback(() => {
        onSetInPoint(currentTime);
    }, [currentTime, onSetInPoint]);

    const handleSetOut = useCallback(() => {
        onSetOutPoint(currentTime);
    }, [currentTime, onSetOutPoint]);

    const handleClearIn = useCallback(() => {
        onSetInPoint(null);
    }, [onSetInPoint]);

    const handleClearOut = useCallback(() => {
        onSetOutPoint(null);
    }, [onSetOutPoint]);

    const handleGoToIn = useCallback(() => {
        if (inPoint !== null) {
            onSeek(inPoint);
        }
    }, [inPoint, onSeek]);

    const handleGoToOut = useCallback(() => {
        if (outPoint !== null) {
            onSeek(outPoint);
        }
    }, [outPoint, onSeek]);

    const hasValidRange = inPoint !== null && outPoint !== null && outPoint > inPoint;
    const rangeDuration = hasValidRange ? outPoint - inPoint : 0;

    // Calculate progress bar positions
    const inPercent = inPoint !== null && duration > 0 ? (inPoint / duration) * 100 : 0;
    const outPercent = outPoint !== null && duration > 0 ? (outPoint / duration) * 100 : 100;
    const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex flex-col gap-2 p-3 bg-card border-t border-border">
            {/* Progress bar with In/Out markers */}
            <div className="relative h-6 bg-muted rounded-md overflow-hidden">
                {/* In/Out range highlight */}
                {(inPoint !== null || outPoint !== null) && (
                    <div
                        className="absolute top-0 bottom-0 bg-primary/20"
                        style={{
                            left: `${inPercent}%`,
                            right: `${100 - outPercent}%`,
                        }}
                    />
                )}

                {/* In point marker */}
                {inPoint !== null && (
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-pointer hover:bg-green-400 z-10"
                        style={{ left: `${inPercent}%` }}
                        onClick={handleGoToIn}
                        title={`In: ${formatTime(inPoint)}`}
                    >
                        <div className="absolute -top-1 -left-1.5 text-[8px] font-bold text-green-500">I</div>
                    </div>
                )}

                {/* Out point marker */}
                {outPoint !== null && (
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-pointer hover:bg-red-400 z-10"
                        style={{ left: `${outPercent}%` }}
                        onClick={handleGoToOut}
                        title={`Out: ${formatTime(outPoint)}`}
                    >
                        <div className="absolute -top-1 -left-1.5 text-[8px] font-bold text-red-500">O</div>
                    </div>
                )}

                {/* Current time indicator */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
                    style={{ left: `${currentPercent}%` }}
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* In Point */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs font-mono"
                            onClick={handleSetIn}
                            title="Mark In (I)"
                        >
                            <CornerDownLeft className="size-3 text-green-500" />
                            I
                        </Button>
                        {inPoint !== null && (
                            <>
                                <span
                                    className="text-xs font-mono text-green-500 cursor-pointer hover:underline"
                                    onClick={handleGoToIn}
                                >
                                    {formatTime(inPoint)}
                                </span>
                                <button
                                    onClick={handleClearIn}
                                    className="p-0.5 hover:bg-muted rounded"
                                    title="Clear In"
                                >
                                    <X className="size-3 text-muted-foreground" />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="w-px h-4 bg-border" />

                    {/* Out Point */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-xs font-mono"
                            onClick={handleSetOut}
                            title="Mark Out (O)"
                        >
                            <CornerDownRight className="size-3 text-red-500" />
                            O
                        </Button>
                        {outPoint !== null && (
                            <>
                                <span
                                    className="text-xs font-mono text-red-500 cursor-pointer hover:underline"
                                    onClick={handleGoToOut}
                                >
                                    {formatTime(outPoint)}
                                </span>
                                <button
                                    onClick={handleClearOut}
                                    className="p-0.5 hover:bg-muted rounded"
                                    title="Clear Out"
                                >
                                    <X className="size-3 text-muted-foreground" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Range info and Add button */}
                <div className="flex items-center gap-3">
                    {hasValidRange && (
                        <>
                            <span className="text-xs text-muted-foreground">
                                Duration: <span className="font-mono text-foreground">{formatTime(rangeDuration)}</span>
                            </span>
                            {onAddToTimeline && (
                                <Button
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={onAddToTimeline}
                                >
                                    <Plus className="size-3" />
                                    Add to Timeline
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center gap-4 text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest">
                <span>I = Set In</span>
                <span>O = Set Out</span>
                <span>← → = Frame step</span>
            </div>
        </div>
    );
}
