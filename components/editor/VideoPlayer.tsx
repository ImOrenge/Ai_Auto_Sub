"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useEditor } from "./EditorContext";
import { SubtitleCue, VideoCut } from "@/lib/jobs/types";
import { AlertCircle, RefreshCcw, Crop, Maximize, Minimize, Settings2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type YouTubePlayerState = {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
};

type YouTubePlayer = {
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    getPlaybackRate: () => number;
    setPlaybackRate: (rate: number) => void;
    pauseVideo: () => void;
    playVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeApi = {
    Player: new (
        element: HTMLElement,
        options: {
            height?: string | number;
            width?: string | number;
            videoId: string;
            playerVars?: Record<string, number | string>;
            events?: {
                onReady?: () => void;
                onStateChange?: (event: { data: number }) => void;
                onError?: () => void;
            };
        }
    ) => YouTubePlayer;
    PlayerState: YouTubePlayerState;
};

declare global {
    interface Window {
        YT?: YouTubeApi;
        onYouTubeIframeAPIReady?: () => void;
    }
}

let youTubeApiPromise: Promise<YouTubeApi> | null = null;

function loadYouTubeApi(): Promise<YouTubeApi> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("YouTube API is only available in the browser."));
    }

    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }

    if (youTubeApiPromise) {
        return youTubeApiPromise;
    }

    youTubeApiPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
            'script[src="https://www.youtube.com/iframe_api"]'
        );

        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            script.onerror = () => reject(new Error("Failed to load YouTube IFrame API."));
            document.head.appendChild(script);
        }

        const previousCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previousCallback === "function") {
                previousCallback();
            }
            if (window.YT?.Player) {
                resolve(window.YT);
            } else {
                reject(new Error("YouTube IFrame API failed to initialize."));
            }
        };
    });

    return youTubeApiPromise;
}

function parseYouTubeSource(source: string | null | undefined): { isYouTube: boolean; videoId: string | null } {
    if (!source) {
        return { isYouTube: false, videoId: null };
    }

    let parsed: URL;
    try {
        parsed = new URL(source);
    } catch {
        return { isYouTube: false, videoId: null };
    }

    const host = parsed.hostname.toLowerCase();
    const isYouTube =
        host.includes("youtube.com") || host.includes("youtu.be") || host.endsWith("youtube-nocookie.com");

    if (!isYouTube) {
        return { isYouTube: false, videoId: null };
    }

    let videoId: string | null = null;

    if (host.includes("youtu.be")) {
        videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (parsed.pathname.startsWith("/watch")) {
        videoId = parsed.searchParams.get("v");
    } else if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
        const parts = parsed.pathname.split("/");
        videoId = parts[2] ?? null;
    } else if (parsed.pathname.startsWith("/v/")) {
        const parts = parsed.pathname.split("/");
        videoId = parts[2] ?? null;
    }

    return { isYouTube: true, videoId };
}

type VideoPlayerProps = {
    src: string;
    cuts?: VideoCut[] | null;
    activeClip?: {
        id: string;
        startTime: number;
        endTime: number;
    } | null;
};

export function VideoPlayer({
    src,
    cuts = null,
    activeClip = null
}: VideoPlayerProps) {
    const {
        allCues: cues,
        currentTime,
        setCurrentTime: onTimeUpdate,
        isPlaying,
        setIsPlaying: onPlayPause,
        playbackSpeed: playbackRate,
        setDuration: onDurationChange,
        videoFit,
        setVideoFit,
        videoAspectRatio,
        setVideoAspectRatio,
        isCropping,
        setIsCropping,
        cropArea,
        setCropArea,
        defaultStyle,
        setDefaultStyle
    } = useEditor();

    const [isStyleToolbarOpen, setIsStyleToolbarOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const youTubeContainerRef = useRef<HTMLDivElement>(null);
    const youTubePlayerRef = useRef<YouTubePlayer | null>(null);
    const youTubeReadyRef = useRef(false);
    const lastReportedTimeRef = useRef<number | null>(null);
    const lastReportedDurationRef = useRef<number | null>(null);
    const latestTimeRef = useRef(currentTime);
    const latestIsPlayingRef = useRef(isPlaying);
    const { isYouTube, videoId } = parseYouTubeSource(src);
    const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);

    const [sourceDimensions, setSourceDimensions] = useState({ width: 1920, height: 1080 });

    const handleMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const vid = e.currentTarget;
        if (vid.videoWidth && vid.videoHeight) {
            setSourceDimensions({ width: vid.videoWidth, height: vid.videoHeight });
            if (onDurationChange) onDurationChange(vid.duration);
        }
    };

    const containerAspectRatio = useMemo(() => {
        if (videoAspectRatio === 'original') {
            if (!sourceDimensions.height) return 16 / 9;
            return sourceDimensions.width / sourceDimensions.height;
        }
        if (videoAspectRatio === '9:16') return 9 / 16;
        if (videoAspectRatio === '1:1') return 1;
        if (videoAspectRatio === '16:9') return 16 / 9;
        return 16 / 9;
    }, [videoAspectRatio, sourceDimensions]);

    const contentFitClass = videoFit === 'cover' ? "object-cover" : "object-contain";

    useEffect(() => {
        latestTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => {
        latestIsPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Sync external play state
    useEffect(() => {
        if (isYouTube) return;
        if (!videoRef.current) return;
        if (isPlaying && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
        } else if (!isPlaying && !videoRef.current.paused) {
            videoRef.current.pause();
        }
    }, [isPlaying, isYouTube]);

    // Sync playback rate
    useEffect(() => {
        if (isYouTube) {
            const player = youTubePlayerRef.current;
            if (player && youTubeReadyRef.current) {
                player.setPlaybackRate(playbackRate);
            }
        } else if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate, isYouTube]);

    // Sync external time (seek)
    useEffect(() => {
        if (isYouTube) return;
        if (!videoRef.current) return;

        // Ensure time is within clip bounds if provided
        let targetTime = currentTime;
        if (activeClip) {
            targetTime = Math.max(activeClip.startTime, Math.min(activeClip.endTime, currentTime));
        }

        if (Math.abs(videoRef.current.currentTime - targetTime) > 0.5) {
            videoRef.current.currentTime = targetTime;
        }
    }, [currentTime, isYouTube, activeClip]);

    useEffect(() => {
        if (!isYouTube) {
            youTubeReadyRef.current = false;
            if (youTubePlayerRef.current) {
                youTubePlayerRef.current.destroy();
                youTubePlayerRef.current = null;
            }
            return;
        }

        if (!videoId) {
            setVideoError("FAILED_TO_LOAD");
            return;
        }

        let canceled = false;
        lastReportedTimeRef.current = null;
        lastReportedDurationRef.current = null;
        setVideoError(null);

        loadYouTubeApi()
            .then((YT) => {
                if (canceled) return;
                const container = youTubeContainerRef.current;
                if (!container) return;

                if (youTubePlayerRef.current) {
                    youTubePlayerRef.current.destroy();
                    youTubePlayerRef.current = null;
                }

                youTubePlayerRef.current = new YT.Player(container, {
                    height: "100%",
                    width: "100%",
                    videoId,
                    playerVars: {
                        controls: 1,
                        modestbranding: 1,
                        rel: 0,
                        playsinline: 1,
                    },
                    events: {
                        onReady: () => {
                            youTubeReadyRef.current = true;
                            const player = youTubePlayerRef.current;
                            if (!player) return;
                            const duration = player.getDuration();
                            if (duration && onDurationChange) {
                                lastReportedDurationRef.current = duration;
                                onDurationChange(duration);
                            }
                            const seekTime = latestTimeRef.current;
                            if (seekTime > 0) {
                                player.seekTo(seekTime, true);
                            }
                            if (latestIsPlayingRef.current) {
                                player.playVideo();
                            }
                        },
                        onStateChange: (event: any) => {
                            if (!onPlayPause) return;
                            if (event.data === YT.PlayerState.PLAYING) {
                                onPlayPause(true);
                            } else if (
                                event.data === YT.PlayerState.PAUSED ||
                                event.data === YT.PlayerState.ENDED
                            ) {
                                onPlayPause(false);
                            }
                        },
                        onError: () => {
                            setVideoError("FAILED_TO_LOAD");
                        },
                    },
                });
            })
            .catch((error) => {
                console.error("[VideoPlayer] Failed to load YouTube API", error);
                setVideoError("FAILED_TO_LOAD");
            });

        return () => {
            canceled = true;
            youTubeReadyRef.current = false;
            if (youTubePlayerRef.current) {
                youTubePlayerRef.current.destroy();
                youTubePlayerRef.current = null;
            }
        };
    }, [isYouTube, videoId, onDurationChange, onPlayPause]);

    useEffect(() => {
        if (!isYouTube) return;
        const player = youTubePlayerRef.current;
        if (!player || !youTubeReadyRef.current) return;
        if (isPlaying) {
            player.playVideo();
        } else {
            player.pauseVideo();
        }
    }, [isPlaying, isYouTube]);

    useEffect(() => {
        if (!isYouTube) return;
        const player = youTubePlayerRef.current;
        if (!player || !youTubeReadyRef.current) return;

        let targetTime = currentTime;
        if (activeClip) {
            targetTime = Math.max(activeClip.startTime, Math.min(activeClip.endTime, currentTime));
        }

        const current = player.getCurrentTime();
        if (Number.isFinite(current) && Math.abs(current - targetTime) > 0.5) {
            player.seekTo(targetTime, true);
        }
    }, [currentTime, isYouTube, activeClip]);

    useEffect(() => {
        if (!isYouTube) return;
        const interval = window.setInterval(() => {
            const player = youTubePlayerRef.current;
            if (!player || !youTubeReadyRef.current) return;
            const time = player.getCurrentTime();
            if (Number.isFinite(time)) {
                const last = lastReportedTimeRef.current;
                if (last === null || Math.abs(time - last) >= 0.05) {
                    lastReportedTimeRef.current = time;
                    onTimeUpdate(time);
                }
            }
            if (onDurationChange) {
                const duration = player.getDuration();
                const lastDuration = lastReportedDurationRef.current;
                if (duration && duration !== lastDuration) {
                    lastReportedDurationRef.current = duration;
                    onDurationChange(duration);
                }
            }
        }, 250);

        return () => window.clearInterval(interval);
    }, [isYouTube, onTimeUpdate, onDurationChange]);

    // Trimming / Auto-skip logic for preview
    useEffect(() => {
        if (!isPlaying) return;

        // 1. Handle Active Clip boundaries (Prioritized)
        if (activeClip) {
            if (currentTime < activeClip.startTime) {
                if (isYouTube && youTubePlayerRef.current) {
                    youTubePlayerRef.current.seekTo(activeClip.startTime, true);
                } else if (videoRef.current) {
                    videoRef.current.currentTime = activeClip.startTime;
                }
                return;
            }
            if (currentTime >= activeClip.endTime) {
                if (onPlayPause) onPlayPause(false);
                return;
            }
        }

        // 2. Handle specific Cuts if provided
        if (!cuts || cuts.length === 0) return;

        const sortedCuts = [...cuts].sort((a, b) => a.start - b.start);
        const currentCut = sortedCuts.find(c => currentTime >= c.start && currentTime < c.end);

        if (!currentCut) {
            const nextCut = sortedCuts.find(c => c.start > currentTime);
            if (nextCut) {
                if (isYouTube && youTubePlayerRef.current) {
                    youTubePlayerRef.current.seekTo(nextCut.start, true);
                } else if (videoRef.current) {
                    videoRef.current.currentTime = nextCut.start;
                }
            } else {
                if (onPlayPause) onPlayPause(false);
            }
        }
    }, [currentTime, isPlaying, cuts, activeClip, isYouTube, onPlayPause]);

    // Find active cue - must be within clip boundaries if activeClip is present
    useEffect(() => {
        let matchedCue = cues.find(c => currentTime >= c.startTime && currentTime <= c.endTime);

        // Filter by activeClip if present
        if (matchedCue && activeClip) {
            if (matchedCue.startTime > activeClip.endTime || matchedCue.endTime < activeClip.startTime) {
                matchedCue = undefined;
            }
        }

        setActiveCue(matchedCue || null);
    }, [currentTime, cues, activeClip]);

    // ------------------------------------------------------------------------
    // High-Resolution Time Tracking (for smooth animations)
    // ------------------------------------------------------------------------
    const [smoothTime, setSmoothTime] = useState(currentTime);
    const timeRequestRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isPlaying) {
            setSmoothTime(currentTime);
            if (timeRequestRef.current) {
                cancelAnimationFrame(timeRequestRef.current);
                timeRequestRef.current = null;
            }
            return;
        }

        const tick = () => {
            let now = 0;
            if (isYouTube && youTubePlayerRef.current && youTubeReadyRef.current) {
                now = youTubePlayerRef.current.getCurrentTime();
            } else if (videoRef.current) {
                now = videoRef.current.currentTime;
            }

            if (now > 0) {
                // Update local visual time (60fps)
                setSmoothTime(now);

                // Still update global context time but throttled (handled by existing effect)
                // Just use rAF for the visual overlay
            }
            timeRequestRef.current = requestAnimationFrame(tick);
        };

        timeRequestRef.current = requestAnimationFrame(tick);

        return () => {
            if (timeRequestRef.current) cancelAnimationFrame(timeRequestRef.current);
        };
    }, [isPlaying, isYouTube, currentTime]); // Depend on currentTime to sync when scrubbing

    // ------------------------------------------------------------------------
    // Existing Effects
    // ------------------------------------------------------------------------

    // Reset error when src changes for non-YouTube sources
    useEffect(() => {
        if (isYouTube) return;
        setVideoError(null);
    }, [src, isYouTube]);

    const handleVideoError = () => {
        console.error(`[VideoPlayer] Failed to load video: ${src}`, videoRef.current?.error);
        setVideoError("FAILED_TO_LOAD");
    };

    // Crop functionality - corner-based resizing
    type DragType = 'none' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | 'move';
    const [localCrop, setLocalCrop] = useState(cropArea);
    const [dragType, setDragType] = useState<DragType>('none');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: localCrop });
    const cropOverlayRef = useRef<HTMLDivElement>(null);
    const MIN_CROP_SIZE = 10; // Minimum 10% size

    // Initialize crop area when entering crop mode
    useEffect(() => {
        if (isCropping) {
            // If no crop set (full 100%), initialize to center 80%
            if (cropArea.width >= 100 && cropArea.height >= 100) {
                setLocalCrop({ x: 10, y: 10, width: 80, height: 80 });
            } else {
                setLocalCrop(cropArea);
            }
        }
    }, [isCropping, cropArea]);

    const getMousePosition = (e: React.MouseEvent) => {
        if (!cropOverlayRef.current) return { x: 0, y: 0 };
        const rect = cropOverlayRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100
        };
    };

    const handleCornerMouseDown = (e: React.MouseEvent, corner: DragType) => {
        e.stopPropagation();
        const pos = getMousePosition(e);
        setDragType(corner);
        setDragStart({ x: pos.x, y: pos.y, crop: { ...localCrop } });
    };

    const handleMoveMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const pos = getMousePosition(e);
        setDragType('move');
        setDragStart({ x: pos.x, y: pos.y, crop: { ...localCrop } });
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (dragType === 'none' || !cropOverlayRef.current) return;
        const pos = getMousePosition(e);
        const deltaX = pos.x - dragStart.x;
        const deltaY = pos.y - dragStart.y;
        const startCrop = dragStart.crop;

        let newCrop = { ...localCrop };

        if (dragType === 'move') {
            // Move entire crop box
            let newX = startCrop.x + deltaX;
            let newY = startCrop.y + deltaY;
            // Constrain to bounds
            newX = Math.max(0, Math.min(100 - startCrop.width, newX));
            newY = Math.max(0, Math.min(100 - startCrop.height, newY));
            newCrop = { ...startCrop, x: newX, y: newY };
        } else {
            // Resize based on corner/edge
            let { x, y, width, height } = startCrop;

            // Handle horizontal resize
            if (dragType.includes('w')) {
                const newX = Math.max(0, Math.min(x + width - MIN_CROP_SIZE, startCrop.x + deltaX));
                width = x + width - newX;
                x = newX;
            } else if (dragType.includes('e')) {
                width = Math.max(MIN_CROP_SIZE, Math.min(100 - x, startCrop.width + deltaX));
            }

            // Handle vertical resize
            if (dragType.includes('n')) {
                const newY = Math.max(0, Math.min(y + height - MIN_CROP_SIZE, startCrop.y + deltaY));
                height = y + height - newY;
                y = newY;
            } else if (dragType.includes('s')) {
                height = Math.max(MIN_CROP_SIZE, Math.min(100 - y, startCrop.height + deltaY));
            }

            newCrop = { x, y, width, height };
        }

        setLocalCrop(newCrop);
    };

    const handleCropMouseUp = () => {
        setDragType('none');
    };

    const getCursorForHandle = (handle: DragType): string => {
        switch (handle) {
            case 'nw': case 'se': return 'nwse-resize';
            case 'ne': case 'sw': return 'nesw-resize';
            case 'n': case 's': return 'ns-resize';
            case 'e': case 'w': return 'ew-resize';
            case 'move': return 'move';
            default: return 'default';
        }
    };

    // Check if crop is applied
    const isCropped = !isCropping && cropArea.width < 100;

    // Calculate the scale factor and offset for centering
    const scaleX = isCropped ? 100 / cropArea.width : 1;
    const scaleY = isCropped ? 100 / cropArea.height : 1;
    const scale = Math.max(scaleX, scaleY);

    // Calculate center offset: move the crop center to the container center
    const cropCenterX = cropArea.x + cropArea.width / 2;
    const cropCenterY = cropArea.y + cropArea.height / 2;
    const offsetX = isCropped ? (50 - cropCenterX) * scale : 0;
    const offsetY = isCropped ? (50 - cropCenterY) * scale : 0;

    const cropStyle: React.CSSProperties = isCropped ? {
        clipPath: `inset(${cropArea.y}% ${100 - (cropArea.x + cropArea.width)}% ${100 - (cropArea.y + cropArea.height)}% ${cropArea.x}%)`,
        transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`,
        transformOrigin: 'center center'
    } : {};

    // JS-based sizing for robust "contain" behavior
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState<{ width: number, height: number } | null>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width: parentW, height: parentH } = entry.contentRect;
                if (parentW === 0 || parentH === 0) continue;

                const targetRatio = containerAspectRatio;
                const parentRatio = parentW / parentH;

                let newW, newH;

                if (parentRatio > targetRatio) {
                    // Parent is wider than target -> Fit to Height
                    newH = parentH;
                    newW = newH * targetRatio;
                } else {
                    // Parent is taller than target -> Fit to Width
                    newW = parentW;
                    newH = newW / targetRatio;
                }

                // Adding a small buffer or floor to prevent sub-pixel rounding overflow issues
                setCanvasSize({ width: Math.floor(newW), height: Math.floor(newH) });
            }
        });

        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [containerAspectRatio]);

    const renderingDimensions = useMemo(() => {
        if (videoAspectRatio === 'original') {
            if (sourceDimensions.width && sourceDimensions.height) {
                return sourceDimensions;
            }
            return { width: 1920, height: 1080 };
        }
        if (videoAspectRatio === '9:16') return { width: 1080, height: 1920 };
        if (videoAspectRatio === '1:1') return { width: 1080, height: 1080 };
        return { width: 1920, height: 1080 };
    }, [videoAspectRatio, sourceDimensions]);

    if (videoError) {
        return (
            <div className="relative w-full h-full bg-black flex flex-col items-center justify-center text-white gap-4 p-8">
                <AlertCircle className="size-12 text-destructive" />
                <div className="text-center space-y-2">
                    <p className="text-lg font-medium">
                        {src?.includes("youtube.com") || src?.includes("youtu.be")
                            ? "YouTube 영상은 직접 재생할 수 없습니다."
                            : "비디오를 로드할 수 없습니다."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        작업 상세 페이지에서 다시 실행(Retry)을 하면 해결될 수 있습니다.
                        URL 기반 작업은 다시 실행 시 비디오가 서버에 자동으로 저장됩니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="relative w-full h-full bg-neutral-950 group flex items-center justify-center overflow-hidden p-6 md:p-10">
            <div
                className={cn(
                    "relative transition-all duration-300 shadow-2xl bg-black ring-1 ring-white/10 overflow-hidden",
                )}
                style={{
                    width: canvasSize?.width ?? '100%',
                    height: canvasSize?.height ?? '100%',
                    // Fallback to aspect ratio just in case JS lags
                    aspectRatio: !canvasSize ? containerAspectRatio : undefined,
                }}
            >
                {/* Checkerboard pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                />

                {isYouTube ? (
                    <div
                        ref={youTubeContainerRef}
                        className={cn(
                            "absolute inset-0 transition-all duration-300",
                            contentFitClass === "object-cover" ? "scaling-cover" : "scaling-contain"
                        )}
                        style={cropStyle}
                    />
                ) : (
                    <video
                        key={src}
                        ref={videoRef}
                        src={src}
                        crossOrigin={src.startsWith('/api/') ? undefined : "anonymous"}
                        className={cn(
                            "absolute inset-0 w-full h-full transition-all duration-500",
                            contentFitClass
                        )}
                        style={cropStyle}
                        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
                        onLoadedMetadata={handleMetadataLoaded}
                        onPlay={() => onPlayPause?.(true)}
                        onPause={() => onPlayPause?.(false)}
                        onError={handleVideoError}
                    />
                )}

                {/* Caption Overlay */}
                <AnimatePresence mode="popLayout">
                    {activeCue && (
                        <SubtitleOverlayView
                            key={`${activeCue.layerId}-${activeCue.id}`}
                            cue={activeCue}
                            style={defaultStyle}
                            currentTime={smoothTime}
                            width={renderingDimensions.width}
                            height={renderingDimensions.height}
                            onClick={() => setIsStyleToolbarOpen(!isStyleToolbarOpen)}
                        />
                    )}
                </AnimatePresence>

                {/* Floating Style Toolbar */}
                {isStyleToolbarOpen && (
                    <FloatingStyleToolbar
                        style={defaultStyle}
                        onChange={(updates) => setDefaultStyle({ ...defaultStyle, ...updates })}
                        onClose={() => setIsStyleToolbarOpen(false)}
                    />
                )}
            </div>

            {/* Hover Floating Controls */}
            {!isCropping && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 translate-y-2 group-hover:translate-y-0">
                    <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 px-3 gap-2 text-white hover:bg-white/10 whitespace-nowrap rounded-xl"
                            onClick={() => setIsCropping(true)}
                        >
                            <Crop className="size-4 text-primary" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Crop Area</span>
                        </Button>

                        <div className="w-px h-5 bg-white/10 mx-0.5" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 text-white hover:bg-white/10 whitespace-nowrap rounded-xl",
                                videoFit === 'cover' && "bg-white/10 text-primary"
                            )}
                            onClick={() => setVideoFit(videoFit === 'contain' ? 'cover' : 'contain')}
                        >
                            {videoFit === 'cover' ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                {videoFit === 'cover' ? 'Fit to Center' : 'Fill Canvas'}
                            </span>
                        </Button>

                        <div className="w-px h-5 bg-white/10 mx-0.5" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3 gap-2 text-white hover:bg-white/10 whitespace-nowrap rounded-xl"
                                >
                                    <Settings2 className="size-4" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Canvas Size: {videoAspectRatio}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" side="top" sideOffset={12} className="bg-black/90 backdrop-blur-xl border-white/10 text-white min-w-[160px] rounded-xl p-1 shadow-2xl">
                                <DropdownMenuItem
                                    className={cn(
                                        "gap-3 focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2",
                                        videoAspectRatio === 'original' && "bg-white/5"
                                    )}
                                    onClick={() => {
                                        setVideoAspectRatio('original');
                                        setCropArea({ x: 0, y: 0, width: 100, height: 100 });
                                    }}
                                >
                                    <div className="size-4 flex items-center justify-center">
                                        {videoAspectRatio === 'original' && <Check className="size-3 text-primary" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold capitalize">Smart Original</span>
                                        <span className="text-[9px] opacity-40">Native Aspect</span>
                                    </div>
                                </DropdownMenuItem>

                                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                                    <DropdownMenuItem
                                        key={ratio}
                                        className={cn(
                                            "gap-3 focus:bg-white/10 focus:text-white cursor-pointer rounded-lg py-2",
                                            videoAspectRatio === ratio && "bg-white/5"
                                        )}
                                        onClick={() => {
                                            setVideoAspectRatio(ratio);
                                        }}
                                    >
                                        <div className="size-4 flex items-center justify-center">
                                            {videoAspectRatio === ratio && <Check className="size-3 text-primary" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold capitalize">{ratio}</span>
                                            <span className="text-[9px] opacity-40">
                                                {ratio === '9:16' ? 'TikTok / Reels' : ratio === '16:9' ? 'YouTube' : ratio === '1:1' ? 'Instagram' : 'Standard'}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Cropping Mode Overlay */}
            {isCropping && (
                <div
                    ref={cropOverlayRef}
                    className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm overflow-hidden flex items-center justify-center p-12"
                    style={{ cursor: dragType !== 'none' ? getCursorForHandle(dragType) : 'default' }}
                    onMouseMove={handleCropMouseMove}
                    onMouseUp={handleCropMouseUp}
                    onMouseLeave={handleCropMouseUp}
                >
                    <div
                        className={cn(
                            "relative transition-all shadow-xl",
                            "bg-black ring-1 ring-white/20"
                        )}
                        style={{
                            aspectRatio: containerAspectRatio,
                            height: containerAspectRatio < 1 ? '100%' : 'auto',
                            width: containerAspectRatio >= 1 ? '100%' : 'auto',
                            maxHeight: '100%',
                            maxWidth: '100%'
                        }}
                    >
                        {/* Video Background for Crop */}
                        <div className="absolute inset-0 opacity-20">
                            {isYouTube ? (
                                <div className="w-full h-full bg-muted" />
                            ) : (
                                <video src={src} className={cn("w-full h-full", contentFitClass)} />
                            )}
                        </div>

                        {/* Selected Area - Draggable for moving */}
                        <div
                            className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move"
                            style={{
                                left: `${localCrop.x}%`,
                                top: `${localCrop.y}%`,
                                width: `${localCrop.width}%`,
                                height: `${localCrop.height}%`,
                            }}
                            onMouseDown={handleMoveMouseDown}
                        >
                            {/* Visual Grid */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={cn(
                                        "border-white/50",
                                        i < 2 ? "border-r" : "border-b"
                                    )} />
                                ))}
                            </div>

                            {/* Corner Drag Handles */}
                            {['nw', 'ne', 'sw', 'se'].map((corner) => (
                                <div
                                    key={corner}
                                    className={cn(
                                        "absolute size-4 bg-primary ring-4 ring-black/50 rounded-full hover:scale-125 transition-transform z-10",
                                        corner.includes('n') ? "-top-2" : "-bottom-2",
                                        corner.includes('w') ? "-left-2" : "-right-2",
                                        corner === 'nw' || corner === 'se' ? "cursor-nwse-resize" : "cursor-nesw-resize"
                                    )}
                                    // @ts-ignore
                                    onMouseDown={(e) => handleCornerMouseDown(e, corner as DragType)}
                                />
                            ))}

                            {/* Edge Drag Handles */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary/80 rounded-full cursor-ns-resize hover:bg-primary transition-colors z-10" onMouseDown={(e) => handleCornerMouseDown(e, 'n')} />
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary/80 rounded-full cursor-ns-resize hover:bg-primary transition-colors z-10" onMouseDown={(e) => handleCornerMouseDown(e, 's')} />
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-8 bg-primary/80 rounded-full cursor-ew-resize hover:bg-primary transition-colors z-10" onMouseDown={(e) => handleCornerMouseDown(e, 'w')} />
                            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-8 bg-primary/80 rounded-full cursor-ew-resize hover:bg-primary transition-colors z-10" onMouseDown={(e) => handleCornerMouseDown(e, 'e')} />
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/90 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/20 shadow-2xl">
                        <div className="flex flex-col pr-4 border-r border-white/10">
                            <span className="text-[10px] text-primary font-black uppercase tracking-widest mb-0.5">Crop Region</span>
                            <span className="text-xs text-white/50 font-medium whitespace-nowrap">Drag corners to resize</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 px-4 text-white hover:bg-white/10 rounded-xl font-bold"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCropping(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCropArea(localCrop);
                                    setIsCropping(false);
                                }}
                            >
                                Set Crop
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


import { SubtitleOverlayView } from "./SubtitleOverlayView";

import {
    Bold,
    Type as TypeIcon,
    Palette as PaletteIcon,
    ChevronDown,
    ArrowUpToLine,
    AlignCenter as AlignCenterIcon,
    ArrowDownToLine,
    X as CloseIcon
} from "lucide-react";

/**
 * Floating Style Toolbar Component
 */
function FloatingStyleToolbar({
    style,
    onChange,
    onClose
}: {
    style: any;
    onChange: (updates: any) => void;
    onClose: () => void;
}) {
    const FONT_OPTIONS = [
        "Arial", "NanumGothic", "NanumBarunGothic", "Malgun Gothic", "Noto Sans KR"
    ];

    const FONT_SIZE_OPTIONS = [12, 16, 20, 24, 28, 32, 36, 40, 48, 64];

    const COLORS = ["#FFFFFF", "#FFFF00", "#FF0000", "#00FF00", "#00FFFF", "#000000"];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 p-1.5 shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in duration-200">
            {/* Color */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 outline-none">
                        <div className="size-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: style.primaryColor }} />
                        <PaletteIcon className="size-3.5 text-white/70" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/10 p-2 min-w-[120px] rounded-xl shadow-2xl">
                    <div className="px-2 pb-2 mb-2 border-b border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Primary Color</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className="size-8 rounded-lg border border-white/20 hover:scale-110 transition-transform"
                                style={{ backgroundColor: c }}
                                onClick={() => onChange({ primaryColor: c })}
                            />
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Outline Color */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 outline-none relative">
                        <div className="size-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: style.outlineColor }} />
                        <div className="absolute top-1 right-1 size-1.5 bg-primary rounded-full border border-black" />
                        <PaletteIcon className="size-3.5 text-white/70" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/10 p-2 min-w-[120px] rounded-xl shadow-2xl">
                    <div className="px-2 pb-2 mb-2 border-b border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Outline Color</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className="size-8 rounded-lg border border-white/20 hover:scale-110 transition-transform"
                                style={{ backgroundColor: c }}
                                onClick={() => onChange({ outlineColor: c })}
                            />
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Outline Width */}
            <div className="flex items-center gap-2 px-2 group">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/30 uppercase leading-none mb-1">Outline</span>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold text-white focus:outline-none focus:border-primary"
                        value={style.outlineWidth}
                        onChange={(e) => onChange({ outlineWidth: parseFloat(e.target.value) || 0 })}
                    />
                </div>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Font */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-white outline-none">
                        <span className="truncate max-w-[80px]">{style.fontName || 'Arial'}</span>
                        <ChevronDown className="size-3 text-white/40" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/10 p-1 min-w-[140px] rounded-xl shadow-2xl">
                    {FONT_OPTIONS.map(f => (
                        <DropdownMenuItem
                            key={f}
                            style={{ fontFamily: f }}
                            className="text-white focus:bg-white/10 cursor-pointer rounded-lg text-sm"
                            onClick={() => onChange({ fontName: f })}
                        >
                            {f}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Bold */}
            <button
                className={cn(
                    "p-2 rounded-lg transition-colors outline-none",
                    style.fontWeight === 'bold' ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10"
                )}
                onClick={() => onChange({ fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' })}
            >
                <Bold className="size-4" />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Font Size */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-white outline-none">
                        <TypeIcon className="size-3.5 text-white/60 mr-1" />
                        {style.fontSize}
                        <ChevronDown className="size-3 text-white/40" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/90 border-white/10 p-1 min-w-[80px] rounded-xl shadow-2xl h-[200px] overflow-y-auto">
                    {/* Direct Input */}
                    <div className="p-2 border-b border-white/10 mb-1">
                        <input
                            type="number"
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                            placeholder="Size"
                            defaultValue={style.fontSize}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onChange({ fontSize: parseInt((e.target as HTMLInputElement).value) });
                                }
                            }}
                        />
                    </div>
                    {FONT_SIZE_OPTIONS.map(s => (
                        <DropdownMenuItem
                            key={s}
                            className="text-white focus:bg-white/10 cursor-pointer rounded-lg text-sm"
                            onClick={() => onChange({ fontSize: s })}
                        >
                            {s}px
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Position */}
            <div className="flex items-center gap-0.5 p-0.5 bg-white/5 rounded-lg border border-white/10">
                <button
                    className={cn(
                        "p-1.5 rounded-md transition-all outline-none",
                        style.position === 'top' ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white/100"
                    )}
                    onClick={() => onChange({ position: 'top' })}
                >
                    <ArrowUpToLine className="size-4" />
                </button>
                <button
                    className={cn(
                        "p-1.5 rounded-md transition-all outline-none",
                        style.position === 'center' ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white/100"
                    )}
                    onClick={() => onChange({ position: 'center' })}
                >
                    <AlignCenterIcon className="size-4" />
                </button>
                <button
                    className={cn(
                        "p-1.5 rounded-md transition-all outline-none",
                        style.position === 'bottom' ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white/100"
                    )}
                    onClick={() => onChange({ position: 'bottom' })}
                >
                    <ArrowDownToLine className="size-4" />
                </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Close */}
            <button
                className="p-2 text-white/40 hover:text-white hover:bg-red-500/20 rounded-lg transition-all ml-1"
                onClick={onClose}
            >
                <CloseIcon className="size-4" />
            </button>
        </div>
    );
}
