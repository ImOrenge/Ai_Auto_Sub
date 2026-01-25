"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type ClipThumbnailsProps = {
    /** Video source URL */
    src: string;
    /** Start time of the clip */
    startTime: number;
    /** End time of the clip */
    endTime: number;
    /** Width of the container in pixels */
    width: number;
    /** Height of the thumbnails */
    height?: number;
    /** Number of thumbnails to show */
    count?: number;
    className?: string;
};

/**
 * Extracts and displays multiple thumbnail frames from a video
 * Uses canvas to capture frames at regular intervals
 */
export function ClipThumbnails({
    src,
    startTime,
    endTime,
    width,
    height = 48,
    count,
    className,
}: ClipThumbnailsProps) {
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Calculate optimal number of thumbnails based on width
    const thumbnailCount = count ?? Math.max(1, Math.floor(width / 60));
    const thumbnailWidth = width / thumbnailCount;

    // Calculate times to extract
    const extractTimes = useMemo(() => {
        const duration = endTime - startTime;
        const times: number[] = [];
        for (let i = 0; i < thumbnailCount; i++) {
            const t = startTime + (duration * i) / thumbnailCount;
            times.push(t);
        }
        return times;
    }, [startTime, endTime, thumbnailCount]);

    useEffect(() => {
        if (!src || width <= 0) return;

        setLoading(true);
        setThumbnails([]);

        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.preload = "metadata";
        video.muted = true;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        videoRef.current = video;
        canvasRef.current = canvas;

        let currentIndex = 0;
        const extractedThumbnails: string[] = [];
        let cancelled = false;

        const extractFrame = () => {
            if (cancelled) return;

            canvas.width = Math.ceil(thumbnailWidth);
            canvas.height = height;

            // Draw the current frame scaled to fit
            const aspectRatio = video.videoWidth / video.videoHeight;
            const drawHeight = height;
            const drawWidth = drawHeight * aspectRatio;
            const offsetX = (canvas.width - drawWidth) / 2;

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, offsetX, 0, drawWidth, drawHeight);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
            extractedThumbnails.push(dataUrl);

            currentIndex++;
            if (currentIndex < extractTimes.length) {
                video.currentTime = extractTimes[currentIndex];
            } else {
                setThumbnails(extractedThumbnails);
                setLoading(false);
            }
        };

        video.addEventListener("seeked", extractFrame);
        video.addEventListener("loadedmetadata", () => {
            if (extractTimes.length > 0) {
                video.currentTime = extractTimes[0];
            }
        });

        video.addEventListener("error", () => {
            console.warn("[ClipThumbnails] Failed to load video for thumbnails:", src);
            setLoading(false);
        });

        video.src = src;

        return () => {
            cancelled = true;
            video.removeEventListener("seeked", extractFrame);
            video.pause();
            video.src = "";
        };
    }, [src, extractTimes, width, height, thumbnailWidth]);

    if (loading || thumbnails.length === 0) {
        // Show placeholder gradient while loading
        return (
            <div
                className={cn("flex", className)}
                style={{ width, height }}
            >
                {Array.from({ length: thumbnailCount }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-shrink-0 bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse"
                        style={{
                            width: thumbnailWidth,
                            height,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn("flex", className)}
            style={{ width, height }}
        >
            {thumbnails.map((thumb, i) => (
                <img
                    key={i}
                    src={thumb}
                    alt=""
                    className="flex-shrink-0 object-cover"
                    style={{
                        width: thumbnailWidth,
                        height,
                    }}
                    draggable={false}
                />
            ))}
        </div>
    );
}

type WaveformDisplayProps = {
    /** Width of the waveform in pixels */
    width: number;
    /** Height of the waveform */
    height?: number;
    /** Number of bars */
    bars?: number;
    /** Color of the waveform */
    color?: string;
    /** Pre-generated waveform data (0-1 values) or generate random */
    data?: number[];
    className?: string;
};

/**
 * Displays a waveform visualization
 * Can use pre-generated data or display a pseudo-random pattern
 */
export function WaveformDisplay({
    width,
    height = 32,
    bars,
    color = "currentColor",
    data,
    className,
}: WaveformDisplayProps) {
    const barCount = bars ?? Math.max(8, Math.floor(width / 4));

    // Generate pseudo-random but stable waveform if no data provided
    const waveformData = useMemo(() => {
        if (data) return data.slice(0, barCount);

        // Generate a more realistic waveform pattern
        const result: number[] = [];
        let prevValue = 0.3;

        for (let i = 0; i < barCount; i++) {
            // Smooth random walk
            const change = (Math.random() - 0.5) * 0.4;
            let newValue = prevValue + change;
            newValue = Math.max(0.1, Math.min(1, newValue));
            result.push(newValue);
            prevValue = newValue;
        }
        return result;
    }, [barCount, data]);

    const barWidth = Math.max(1, (width / barCount) - 1);

    return (
        <div
            className={cn("flex items-end justify-around gap-px", className)}
            style={{ width, height }}
        >
            {waveformData.map((value, i) => (
                <div
                    key={i}
                    className="rounded-t-sm transition-all"
                    style={{
                        width: barWidth,
                        height: `${Math.max(10, value * 100)}%`,
                        backgroundColor: color,
                        opacity: 0.3 + value * 0.4,
                    }}
                />
            ))}
        </div>
    );
}
