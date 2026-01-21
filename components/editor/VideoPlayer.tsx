"use client";

import { useRef, useEffect, useState } from "react";
import { SubtitleCue } from "@/lib/jobs/types";

type VideoPlayerProps = {
    src: string;
    cues: SubtitleCue[];
    currentTime: number;
    isPlaying: boolean;
    onTimeUpdate: (time: number) => void;
    onDurationChange?: (duration: number) => void;
    onPlayPause?: (playing: boolean) => void;
};

export function VideoPlayer({
    src,
    cues,
    currentTime,
    isPlaying,
    onTimeUpdate,
    onDurationChange,
    onPlayPause
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);

    // Sync external play state
    useEffect(() => {
        if (!videoRef.current) return;
        if (isPlaying && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
        } else if (!isPlaying && !videoRef.current.paused) {
            videoRef.current.pause();
        }
    }, [isPlaying]);

    // Sync external time (seek) - Optimistic check to avoid Loop
    useEffect(() => {
        if (!videoRef.current) return;
        if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime]);

    // Find active cue
    useEffect(() => {
        const cue = cues.find(c => currentTime >= c.startTime && currentTime <= c.endTime);
        setActiveCue(cue || null);
    }, [currentTime, cues]);

    return (
        <div className="relative w-full h-full bg-black group">
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
                onDurationChange={(e) => onDurationChange?.(e.currentTarget.duration)}
                onPlay={() => onPlayPause?.(true)}
                onPause={() => onPlayPause?.(false)}
                controls
            />

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
