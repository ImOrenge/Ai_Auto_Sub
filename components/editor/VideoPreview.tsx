"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor, useSelectedCue } from "./EditorContext";

// ============================================================================
// Video Preview Panel
// ============================================================================

type VideoPreviewProps = {
    videoUrl: string | null;
    className?: string;
};

export function VideoPreview({ videoUrl, className }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { currentTime, setCurrentTime, isPlaying, setIsPlaying, defaultStyle, cues, selectCue } = useEditor();
    const selectedCue = useSelectedCue();

    // Find active cue based on current time
    const activeCue = cues.find(
        cue => currentTime >= cue.startTime && currentTime < cue.endTime
    );

    // Sync video time with editor state
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const diff = Math.abs(video.currentTime - currentTime);
        if (diff > 0.5) {
            video.currentTime = currentTime;
        }
    }, [currentTime]);

    // Sync playing state
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying && video.paused) {
            video.play().catch(() => setIsPlaying(false));
        } else if (!isPlaying && !video.paused) {
            video.pause();
        }
    }, [isPlaying, setIsPlaying]);

    // Handle video time updates
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setCurrentTime(video.currentTime);
    }, [setCurrentTime]);

    // Handle play/pause toggle
    const togglePlay = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying, setIsPlaying]);

    // Skip to previous/next cue
    const skipPrev = useCallback(() => {
        const prevCue = [...cues]
            .reverse()
            .find(cue => cue.startTime < currentTime - 0.5);
        if (prevCue) {
            setCurrentTime(prevCue.startTime);
            selectCue(prevCue.id);
        }
    }, [cues, currentTime, setCurrentTime, selectCue]);

    const skipNext = useCallback(() => {
        const nextCue = cues.find(cue => cue.startTime > currentTime + 0.5);
        if (nextCue) {
            setCurrentTime(nextCue.startTime);
            selectCue(nextCue.id);
        }
    }, [cues, currentTime, setCurrentTime, selectCue]);

    const [showSafeArea, setShowSafeArea] = useState(false);

    return (
        <div className={cn("flex flex-col bg-black", className)}>
            {/* Video Container - Centers video while preserving aspect ratio */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                {videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="max-h-full max-w-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            playsInline
                        />

                        {/* Subtitle Overlay */}
                        {activeCue && (
                            <div
                                className="pointer-events-none absolute inset-x-0 flex justify-center px-4"
                                style={{
                                    ...(defaultStyle.position === "top" && { top: `${defaultStyle.marginV}px` }),
                                    ...(defaultStyle.position === "bottom" && { bottom: `${defaultStyle.marginV}px` }),
                                    ...(defaultStyle.position === "center" && { top: "50%", transform: "translateY(-50%)" }),
                                }}
                            >
                                <div
                                    className="max-w-[90%] text-center"
                                    style={{
                                        fontFamily: defaultStyle.fontName,
                                        fontSize: `${defaultStyle.fontSize}px`,
                                        color: defaultStyle.primaryColor,
                                        textShadow: `
                      ${defaultStyle.outlineWidth}px ${defaultStyle.outlineWidth}px 0 ${defaultStyle.outlineColor},
                      -${defaultStyle.outlineWidth}px ${defaultStyle.outlineWidth}px 0 ${defaultStyle.outlineColor},
                      ${defaultStyle.outlineWidth}px -${defaultStyle.outlineWidth}px 0 ${defaultStyle.outlineColor},
                      -${defaultStyle.outlineWidth}px -${defaultStyle.outlineWidth}px 0 ${defaultStyle.outlineColor}
                    `,
                                        backgroundColor: defaultStyle.backgroundColor,
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {activeCue.text}
                                </div>
                            </div>
                        )}

                        {/* Safe Area Guide */}
                        {showSafeArea && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="h-[90%] w-[90%] border-2 border-dashed border-yellow-400/50" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        비디오를 불러오는 중...
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 bg-muted/80 px-4 py-2">
                <button
                    type="button"
                    onClick={skipPrev}
                    className="rounded p-1.5 hover:bg-secondary"
                    title="이전 자막"
                >
                    <SkipBack className="size-4" />
                </button>

                <button
                    type="button"
                    onClick={togglePlay}
                    className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
                >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>

                <button
                    type="button"
                    onClick={skipNext}
                    className="rounded p-1.5 hover:bg-secondary"
                    title="다음 자막"
                >
                    <SkipForward className="size-4" />
                </button>

                {/* Time Display */}
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {formatFullTime(currentTime)}
                </span>

                <div className="flex-1" />

                {/* Safe Area Toggle */}
                <button
                    type="button"
                    onClick={() => setShowSafeArea(!showSafeArea)}
                    className={cn(
                        "rounded p-1.5 hover:bg-secondary",
                        showSafeArea && "bg-secondary"
                    )}
                    title="안전 영역 가이드"
                >
                    <Maximize2 className="size-4" />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function formatFullTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    if (h > 0) {
        return `${h}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
    }
    return `${m}:${pad(s)}.${pad(ms, 3)}`;
}

function pad(n: number, len = 2): string {
    return String(n).padStart(len, "0");
}
