"use client";

import { useEffect, useCallback, useRef } from "react";

type PlaybackRate = -4 | -2 | -1 | 0 | 1 | 2 | 4;

interface KeyboardShortcutsConfig {
    // Playback controls
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    duration: number;
    
    // Optional: playback rate for JKL scrubbing
    playbackRate?: number;
    setPlaybackRate?: (rate: number) => void;
    
    // Optional: In/Out points
    inPoint?: number | null;
    outPoint?: number | null;
    setInPoint?: (time: number | null) => void;
    setOutPoint?: (time: number | null) => void;
    
    // Optional: Split/Cut
    onSplit?: () => void;
    
    // Optional: Delete selected
    onDelete?: () => void;
    
    // Frame stepping (default: 1/30 second)
    frameStep?: number;
}

/**
 * Keyboard shortcuts hook for professional video editing
 * 
 * Shortcuts:
 * - Space: Play/Pause toggle
 * - J: Reverse playback (tap multiple times for faster)
 * - K: Pause
 * - L: Forward playback (tap multiple times for faster)
 * - ←: Step back 1 frame
 * - →: Step forward 1 frame
 * - Shift+←: Step back 1 second
 * - Shift+→: Step forward 1 second
 * - I: Set In point
 * - O: Set Out point
 * - C: Split/Cut at playhead
 * - Delete/Backspace: Delete selected
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
    const {
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        playbackRate = 1,
        setPlaybackRate,
        setInPoint,
        setOutPoint,
        onSplit,
        onDelete,
        frameStep = 1/30, // 30fps default
    } = config;

    // JKL state tracking
    const jklStateRef = useRef<{ direction: 'forward' | 'reverse' | 'stopped'; speed: number }>({
        direction: 'stopped',
        speed: 0
    });
    const lastJKeyTimeRef = useRef<number>(0);
    const lastLKeyTimeRef = useRef<number>(0);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        const now = Date.now();

        switch (e.key.toLowerCase()) {
            // ========== Playback Controls ==========
            case ' ': // Space - Play/Pause
                e.preventDefault();
                setIsPlaying(!isPlaying);
                jklStateRef.current = { direction: 'stopped', speed: 0 };
                break;

            case 'k': // K - Pause (always stops)
                e.preventDefault();
                setIsPlaying(false);
                jklStateRef.current = { direction: 'stopped', speed: 0 };
                if (setPlaybackRate) setPlaybackRate(1);
                break;

            case 'j': // J - Reverse playback (speed up on repeated press)
                e.preventDefault();
                {
                    const timeSinceLastJ = now - lastJKeyTimeRef.current;
                    lastJKeyTimeRef.current = now;
                    
                    if (jklStateRef.current.direction === 'reverse' && timeSinceLastJ < 500) {
                        // Increase reverse speed
                        const speeds = [1, 2, 4, 8];
                        const currentIdx = speeds.indexOf(jklStateRef.current.speed);
                        const nextSpeed = speeds[Math.min(currentIdx + 1, speeds.length - 1)];
                        jklStateRef.current = { direction: 'reverse', speed: nextSpeed };
                    } else {
                        // Start reverse at 1x
                        jklStateRef.current = { direction: 'reverse', speed: 1 };
                    }
                    
                    if (setPlaybackRate) {
                        setPlaybackRate(-jklStateRef.current.speed);
                    }
                    setIsPlaying(true);
                }
                break;

            case 'l': // L - Forward playback (speed up on repeated press)
                e.preventDefault();
                {
                    const timeSinceLastL = now - lastLKeyTimeRef.current;
                    lastLKeyTimeRef.current = now;
                    
                    if (jklStateRef.current.direction === 'forward' && timeSinceLastL < 500) {
                        // Increase forward speed
                        const speeds = [1, 2, 4, 8];
                        const currentIdx = speeds.indexOf(jklStateRef.current.speed);
                        const nextSpeed = speeds[Math.min(currentIdx + 1, speeds.length - 1)];
                        jklStateRef.current = { direction: 'forward', speed: nextSpeed };
                    } else {
                        // Start forward at 1x
                        jklStateRef.current = { direction: 'forward', speed: 1 };
                    }
                    
                    if (setPlaybackRate) {
                        setPlaybackRate(jklStateRef.current.speed);
                    }
                    setIsPlaying(true);
                }
                break;

            // ========== Frame Stepping ==========
            case 'arrowleft':
                e.preventDefault();
                {
                    const step = e.shiftKey ? 1 : frameStep; // 1 second or 1 frame
                    setCurrentTime(Math.max(0, currentTime - step));
                    setIsPlaying(false);
                }
                break;

            case 'arrowright':
                e.preventDefault();
                {
                    const step = e.shiftKey ? 1 : frameStep;
                    setCurrentTime(Math.min(duration, currentTime + step));
                    setIsPlaying(false);
                }
                break;

            // ========== In/Out Points ==========
            case 'i': // Set In point
                if (setInPoint) {
                    e.preventDefault();
                    setInPoint(currentTime);
                }
                break;

            case 'o': // Set Out point
                if (setOutPoint) {
                    e.preventDefault();
                    setOutPoint(currentTime);
                }
                break;

            // ========== Editing ==========
            case 'c': // Cut/Split at playhead
                if (onSplit && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onSplit();
                }
                break;

            case 'delete':
            case 'backspace':
                if (onDelete && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onDelete();
                }
                break;
        }
    }, [
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setPlaybackRate,
        setInPoint,
        setOutPoint,
        onSplit,
        onDelete,
        frameStep
    ]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return {
        jklState: jklStateRef.current,
    };
}
