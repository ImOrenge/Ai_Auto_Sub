"use client";

import { SubtitleCue, SubtitleConfig } from "../../lib/jobs/types";
import { getEffectPreset } from "../../lib/subtitle-definitions";
import { CanvasSubtitleRenderer } from "./CanvasSubtitleRenderer";

export type SubtitleOverlayViewProps = {
    cue: SubtitleCue;
    style: SubtitleConfig;
    currentTime: number;
    onClick?: () => void;
    width?: number;
    height?: number;
    isRemotion?: boolean;
};

const LEGACY_EFFECT_MAPPING: Record<string, string> = {
    'karaoke': 'prog_fill_ltr',
    'pop-in': 'word_pop_soft',
    'highlight': 'decor_box',
    'pill-follow': 'decor_pill',
    'underline': 'decor_under_static',
    'marker': 'prog_marker',
    'shake': 'word_shake_x',
    'impact': 'word_slam',
    'blur': 'line_blur_in',
    'wipe': 'line_wipe_ltr',
    'glow': 'word_glow_pulse',
    'color-flip': 'word_flip_hint',
};

export function SubtitleOverlayView({
    cue,
    style,
    currentTime,
    onClick,
    width,
    height,
    isRemotion
}: SubtitleOverlayViewProps) {
    const rawEffect = style.effect || 'none';
    const effect = LEGACY_EFFECT_MAPPING[rawEffect] || rawEffect;
    const preset = getEffectPreset(effect);

    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
    };

    const SCALE_FACTOR = 2.5;
    const marginPct = ((style.marginV ?? 100) * SCALE_FACTOR / 10.8).toFixed(2);

    const hitBoxStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 2rem',
        pointerEvents: 'auto',
        cursor: 'pointer',
        bottom: style.position === 'bottom' ? `${marginPct}%` : undefined,
        top: style.position === 'top' ? `${marginPct}%` : undefined,
        display: style.position === 'center' ? 'flex' : undefined,
        alignItems: style.position === 'center' ? 'center' : undefined,
        justifyContent: style.position === 'center' ? 'center' : undefined,
        height: style.position === 'center' ? '100%' : '15%',
        zIndex: 20,
    };

    return (
        <div style={containerStyle}>
            {/* Clickable hit-box layer */}
            <div style={hitBoxStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }} />

            <CanvasSubtitleRenderer
                cue={cue}
                style={style}
                preset={preset}
                currentTime={currentTime}
                width={width ?? (isRemotion ? 1920 : undefined)}
                height={height ?? (isRemotion ? 1080 : undefined)}
            />
        </div>
    );
}
