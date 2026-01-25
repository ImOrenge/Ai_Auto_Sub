"use client";

import { useRef, useEffect, useState } from "react";
import { SubtitleCue, VideoCut } from "@/lib/jobs/types";
import { AlertCircle, RefreshCcw } from "lucide-react";

type YouTubePlayerState = {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
};

type YouTubePlayer = {
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
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
    cues: SubtitleCue[];
    cuts?: VideoCut[] | null;
    currentTime: number;
    isPlaying: boolean;
    onTimeUpdate: (time: number) => void;
    onDurationChange?: (duration: number) => void;
    onPlayPause?: (playing: boolean) => void;
};

export function VideoPlayer({
    src,
    cues,
    cuts = null,
    currentTime,
    isPlaying,
    onTimeUpdate,
    onDurationChange,
    onPlayPause
}: VideoPlayerProps) {
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

    // Sync external time (seek) - Optimistic check to avoid Loop
    useEffect(() => {
        if (isYouTube) return;
        if (!videoRef.current) return;
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime, isYouTube]);

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
                        onStateChange: (event) => {
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
        const current = player.getCurrentTime();
        if (Number.isFinite(current) && Math.abs(current - currentTime) > 0.5) {
            player.seekTo(currentTime, true);
        }
    }, [currentTime, isYouTube]);

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
        if (!isPlaying || !cuts || cuts.length === 0) return;

        // Find if current time is in a discarded segment
        // A discarded segment is one NOT covered by any cut
        const sortedCuts = [...cuts].sort((a, b) => a.start - b.start);
        const currentCut = sortedCuts.find(c => currentTime >= c.start && currentTime < c.end);

        if (!currentCut) {
            // We are in a discarded zone!
            // Seek to the START of the NEXT available keep-segment
            const nextCut = sortedCuts.find(c => c.start > currentTime);
            if (nextCut) {
                if (isYouTube && youTubePlayerRef.current) {
                    youTubePlayerRef.current.seekTo(nextCut.start, true);
                } else if (videoRef.current) {
                    videoRef.current.currentTime = nextCut.start;
                }
            } else {
                // No more cuts, end playback or loop back
                if (onPlayPause) onPlayPause(false);
            }
        }
    }, [currentTime, isPlaying, cuts, isYouTube, onPlayPause]);

    // Find active cue
    useEffect(() => {
        const cue = cues.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
        setActiveCue(cue || null);
    }, [currentTime, cues]);

    // Reset error when src changes for non-YouTube sources
    useEffect(() => {
        if (isYouTube) return;
        setVideoError(null);
    }, [src, isYouTube]);

    const handleVideoError = () => {
        console.error(`[VideoPlayer] Failed to load video: ${src}`, videoRef.current?.error);
        setVideoError("FAILED_TO_LOAD");
    };

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
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <RefreshCcw className="size-4" />
                    <span>URL 기반 작업은 다시 실행 시 비디오가 저장됩니다.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black group">
            {isYouTube ? (
                <div ref={youTubeContainerRef} className="w-full h-full" />
            ) : (
                <video
                    key={src} // Force re-render when source changes
                    ref={videoRef}
                    src={src}
                    crossOrigin={src.startsWith('/api/') ? undefined : "anonymous"}
                    className="w-full h-full object-contain"
                    onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
                    onDurationChange={(e) => onDurationChange?.(e.currentTarget.duration)}
                    onPlay={() => onPlayPause?.(true)}
                    onPause={() => onPlayPause?.(false)}
                    onError={handleVideoError}
                    controls
                />
            )}

            {/* Caption Overlay */}
            {activeCue && (
                <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none px-8">
                    <div className="inline-block bg-black/60 px-4 py-2 rounded text-white text-lg md:text-xl lg:text-2xl font-medium shadow-lg backdrop-blur-sm transition-all">
                        {activeCue.text.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

