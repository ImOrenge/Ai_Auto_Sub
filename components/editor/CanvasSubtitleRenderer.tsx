"use client";

import React, { useEffect, useRef } from 'react';
import { SubtitleCue, SubtitleConfig } from '../../lib/jobs/types';
import { EffectPreset } from '../../lib/subtitle-definitions';
import { renderSubtitleFrame } from '../../lib/subtitle/canvas-render-utils';

interface CanvasSubtitleRendererProps {
    cue: SubtitleCue;
    style: SubtitleConfig;
    preset?: EffectPreset;
    currentTime: number;
    width?: number;
    height?: number;
}

export const CanvasSubtitleRenderer: React.FC<CanvasSubtitleRendererProps> = ({
    cue,
    style,
    preset,
    currentTime,
    width = 1920,
    height = 1080
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Use the shared rendering logic
        // We handle clearing here to be explicit
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderSubtitleFrame(
            ctx,
            cue,
            style,
            currentTime,
            preset,
            width,
            height
        );

    }, [cue, style, preset, currentTime, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
            }}
        />
    );
};
