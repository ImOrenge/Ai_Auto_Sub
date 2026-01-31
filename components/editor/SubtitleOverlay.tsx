"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubtitleCue, SubtitleConfig } from "../../lib/jobs/types";
import { getEffectPreset, resolvePresetId } from "../../lib/subtitle-definitions";

type SubtitleOverlayProps = {
    cue: SubtitleCue;
    style?: SubtitleConfig;
    currentTime: number;
    onClick?: () => void;
};



export function SubtitleOverlay({
    cue,
    style: propStyle,
    currentTime,
    onClick
}: SubtitleOverlayProps) {
    const style = propStyle;

    if (!style) return null;
    const preset = getEffectPreset(style.effect || 'none');

    // Base container styles
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 2rem',
        zIndex: 10,
        pointerEvents: 'none', // Allow clicks to pass through wrapper
        // Positioning
        bottom: style.position === 'bottom' ? `${style.marginV ?? 20}px` : undefined,
        top: style.position === 'top' ? `${style.marginV ?? 20}px` : undefined,
        display: style.position === 'center' ? 'flex' : undefined,
        alignItems: style.position === 'center' ? 'center' : undefined,
        justifyContent: style.position === 'center' ? 'center' : undefined,
        height: style.position === 'center' ? '100%' : undefined,
    };

    // Base text styles
    const textBaseStyle: React.CSSProperties & { WebkitPaintOrder?: string; paintOrder?: string } = {
        display: 'inline-block',
        backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.6)',
        color: style.primaryColor || '#FFFFFF',
        fontSize: `${style.fontSize || 24}px`,
        fontFamily: style.fontName || 'Arial',
        fontWeight: style.fontWeight || 'normal',
        padding: '0.25rem 1rem',
        borderRadius: '0.25rem',
        WebkitTextStroke: `${style.strokeWidth ?? style.outlineWidth ?? 0}px ${style.strokeColor ?? style.outlineColor ?? '#000000'}`,
        WebkitPaintOrder: "stroke fill", // Crucial for clean outlines that don't eat text
        paintOrder: "stroke fill",
        textShadow: style.shadowBlur
            ? `${style.shadowOffsetX ?? 0}px ${style.shadowOffsetY ?? 0}px ${style.shadowBlur}px ${style.shadowColor ?? 'rgba(0,0,0,0.5)'}`
            : '0 2px 4px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        pointerEvents: 'auto',
    };

    // Calculate duration for progress-based effects
    const duration = cue.endTime - cue.startTime;
    const elapsed = currentTime - cue.startTime;
    const progress = Math.max(0, Math.min(1, elapsed / duration));

    // Word segmentation
    const words = useMemo(() => {
        return cue.text.split(/\s+/).filter(Boolean);
    }, [cue.text]);

    // Active Word Index Logic
    const activeWordIndex = useMemo(() => {
        if (!cue.words || cue.words.length === 0) {
            return Math.floor(progress * words.length);
        }
        return cue.words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
    }, [cue.words, currentTime, progress, words.length]);

    // -------------------------------------------------------------------------
    // NEW JSON-BASED RENDERER
    // -------------------------------------------------------------------------
    if (preset) {
        // 1. Line Scope Effects
        if (preset.scope === 'line') {
            const entry = preset.entry;
            const exit = preset.exit;

            let initial: any = { opacity: 0 };
            let animate: any = { opacity: 1 };
            let exitAnim: any = { opacity: 0 };
            let transition: any = { duration: 0.3 };

            // Handle Line Entry
            if (entry) {
                if (entry.type === 'lineMotion') {
                    initial = entry.initial || initial;
                    animate = entry.animate || animate;
                    transition = entry.transition || transition;
                } else if (entry.type === 'lineClipReveal') {
                    // Map directions to clip-path
                    const dir = entry.direction;
                    if (dir === 'ltr') initial.clipPath = 'inset(0 100% 0 0)';
                    if (dir === 'rtl') initial.clipPath = 'inset(0 0 0 100%)';
                    if (dir === 'btt') initial.clipPath = 'inset(100% 0 0 0)';
                    if (dir === 'ttb') initial.clipPath = 'inset(0 0 100% 0)';

                    animate.clipPath = 'inset(0 0 0 0)';
                    transition = { duration: entry.duration };
                }
            }

            // Handle Line Exit
            if (exit) {
                if (exit.type === 'lineMotion') {
                    exitAnim = exit.animate || exitAnim;
                } else if (exit.type === 'lineClipReveal') {
                    const dir = exit.direction;
                    if (dir === 'ltr') exitAnim.clipPath = 'inset(0 0 0 100%)'; // Wipe out to right
                    if (dir === 'rtl') exitAnim.clipPath = 'inset(0 100% 0 0)'; // Wipe out to left
                    if (dir === 'btt') exitAnim.clipPath = 'inset(0 0 100% 0)'; // Wipe out to top
                    if (dir === 'ttb') exitAnim.clipPath = 'inset(100% 0 0 0)'; // Wipe out to bottom
                }
            }

            // Special case for 'decor_focus_dim_others' (mapped as Line effect in JSON list but logic is word-aware)
            // But JSON defines it as scope: "line", active: { type: "wordDecorToggle", ... } ?? 
            // Wait, the JSON says: { "id": "decor_focus_dim_others", "scope": "line", "active": { "type": "wordDecorToggle", "decor": "dimOthers", ... } }
            // This is a bit inconsistent in schema (Line scope but WordDecorToggle active type). 
            // We should check active type regardless of scope? No, scope defines the main container behavior.

            // Actually, for decor_focus_dim_others, we might need to render words individually to dim them.
            // If the preset has 'active' property, even if scope is line, we should probably treat it as needing word splitting?
            // Or maybe just render generic line motion for now.

            return (
                <div style={containerStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                    <motion.div
                        initial={initial}
                        animate={animate}
                        exit={exitAnim}
                        transition={transition}
                        style={textBaseStyle}
                    >
                        {/* If it's dimOthers, we need to map words */}
                        {preset.id === 'decor_focus_dim_others' ? (
                            words.map((word, i) => (
                                <span key={i} style={{
                                    opacity: i === activeWordIndex ? 1 : (preset.active as any)?.inactiveOpacity ?? 0.5,
                                    transition: 'opacity 0.2s'
                                }}>
                                    {word}{' '}
                                </span>
                            ))
                        ) : cue.text}
                    </motion.div>
                </div>
            );
        }

        // 2. Word Scope Effects
        if (preset.scope === 'word') {
            const wordContainerStyle = {
                ...textBaseStyle,
                // Make background transparent for word effects usually, or keep it if it's a block
                backgroundColor: 'transparent',
                display: 'flex',
                flexWrap: 'wrap' as const,
                justifyContent: 'center',
                gap: `${style.highlightGap ?? 12}px`,
                // Removing border/shadow from container for word effects usually
                boxShadow: 'none',
                WebkitTextStroke: '0px',
                border: 'none',
                backdropFilter: 'none',
            };

            const activeConfig = preset.active;
            const inactiveConfig = preset.inactive;

            return (
                <div style={containerStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                    <motion.div style={wordContainerStyle}>
                        {words.map((word, i) => {
                            const isActive = i === activeWordIndex;

                            // Calculate word progress
                            let wordProgress = 0;
                            if (isActive) {
                                if (cue.words && cue.words[i]) {
                                    const w = cue.words[i];
                                    const duration = w.end - w.start;
                                    if (duration > 0) {
                                        wordProgress = Math.max(0, Math.min(1, (currentTime - w.start) / duration));
                                    }
                                } else {
                                    // Fallback estimate
                                    wordProgress = 0.5;
                                }
                            } else if (i < activeWordIndex) {
                                wordProgress = 1;
                            }

                            // A. Word Motion (Transform/Filter)
                            if (activeConfig?.type === 'wordMotion') {
                                return (
                                    <motion.span
                                        key={i}
                                        animate={isActive ? (activeConfig.animate as any) : (inactiveConfig || {})}
                                        transition={activeConfig.transition as any}
                                        style={{
                                            display: 'inline-block',
                                            color: style.primaryColor,
                                            // Apply styles that might be needed
                                            textShadow: style.shadowBlur ? `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}` : undefined,
                                            WebkitTextStroke: `${style.strokeWidth ?? style.outlineWidth ?? 0}px ${style.strokeColor ?? style.outlineColor ?? '#000000'}`,
                                        }}
                                    >
                                        {word}
                                    </motion.span>
                                );
                            }

                            // B. Word Progress Fill (Karaoke)
                            if (activeConfig?.type === 'wordProgressFill') {
                                const fillPercent = wordProgress * 100;
                                const direction = activeConfig.direction;
                                // Setup gradient based on direction
                                // For simplicity, mostly supporting LTR/RTL linear gradients
                                // 'clipInset' mode usually means using background-clip: text

                                const highlightColor = style.highlightColor || '#FFFF00';

                                let gradient = '';
                                if (direction === 'ltr') {
                                    gradient = `linear-gradient(to right, ${highlightColor} ${fillPercent}%, ${style.primaryColor} ${fillPercent}%)`;
                                } else if (direction === 'rtl') {
                                    gradient = `linear-gradient(to left, ${highlightColor} ${fillPercent}%, ${style.primaryColor} ${fillPercent}%)`;
                                } else if (direction === 'btt') {
                                    gradient = `linear-gradient(to top, ${highlightColor} ${fillPercent}%, ${style.primaryColor} ${fillPercent}%)`;
                                } else {
                                    // Center out (approximate with radial or complex linear)
                                    gradient = `linear-gradient(to right, ${style.primaryColor} 0%, ${highlightColor} ${50 - fillPercent / 2}%, ${highlightColor} ${50 + fillPercent / 2}%, ${style.primaryColor} 100%)`; // Rough approx
                                    if (direction === 'center') {
                                        // simpler approach for center:
                                        // just LTR for now or advanced mask. Use LTR fallback.
                                        gradient = `linear-gradient(to right, ${highlightColor} ${fillPercent}%, ${style.primaryColor} ${fillPercent}%)`;
                                    }
                                }

                                return (
                                    <span key={i} className="relative inline-block" style={{
                                        WebkitTextStroke: `${style.strokeWidth ?? style.outlineWidth ?? 0}px ${style.strokeColor ?? style.outlineColor ?? '#000000'}`,
                                    }}>
                                        <span className="absolute inset-0 pointer-events-none select-none text-transparent" aria-hidden="true"
                                            style={{ WebkitTextStroke: `${style.strokeWidth ?? style.outlineWidth ?? 0}px ${style.strokeColor ?? style.outlineColor ?? '#000000'}` }}
                                        >
                                            {word}
                                        </span>
                                        <span
                                            style={{
                                                backgroundImage: gradient,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text',
                                                // Ensure stroke is consistent or handled
                                            }}
                                        >
                                            {word}
                                        </span>
                                    </span>
                                );
                            }

                            // C. Word Decor Toggle / Progress Decor
                            if (activeConfig?.type === 'wordDecorToggle' || activeConfig?.type === 'wordProgressDecor') {
                                const decorType = activeConfig.decor;
                                const isToggle = activeConfig.type === 'wordDecorToggle';

                                // Common highlight props
                                const highlightColor = style.highlightColor || '#FFFF00';
                                const opacity = activeConfig.opacity ?? 1;
                                const paddingX = activeConfig.paddingX ?? 4;
                                const paddingY = activeConfig.paddingY ?? 0;
                                const radius = activeConfig.radius ?? 4;

                                const decorVisible = isActive;

                                const gap = 'gap' in activeConfig ? activeConfig.gap : 0;
                                return (
                                    <span key={i} className="relative inline-block z-0" style={{ margin: `0 ${gap ? gap / 2 : 0}px` }}>
                                        {/* Background Decors */}
                                        {decorVisible && ['pillBehind', 'boxBehind', 'tape', 'backdropBlurChip'].includes(decorType) && (
                                            <motion.div
                                                layoutId={`decor-${cue.id}`}
                                                className="absolute"
                                                style={{
                                                    inset: `-${paddingY}px -${paddingX}px`,
                                                    backgroundColor: decorType === 'backdropBlurChip' ? 'rgba(255,255,255,0.1)' : highlightColor,
                                                    borderRadius: `${radius}px`,
                                                    zIndex: -1,
                                                    opacity: opacity,
                                                    backdropFilter: decorType === 'backdropBlurChip' ? `blur(${activeConfig.blurPx ?? 4}px)` : undefined,
                                                }}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: opacity }}
                                            />
                                        )}

                                        {/* Underline/Overline/Strike Static */}
                                        {decorVisible && ['underlineStatic', 'overlineStatic', 'strikeStatic'].includes(decorType) && (
                                            <motion.div
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    height: `${activeConfig.height ?? 2}px`,
                                                    backgroundColor: highlightColor,
                                                    top: decorType === 'overlineStatic' ? `${activeConfig.offsetY ?? -2}px` : (decorType === 'strikeStatic' ? '50%' : undefined),
                                                    bottom: decorType === 'underlineStatic' ? `${-(activeConfig.offsetY ?? 0)}px` : undefined,
                                                    borderRadius: `${radius}px`,
                                                }}
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                            />
                                        )}

                                        {/* Progress Decors (Growing Underline etc) */}
                                        {activeConfig.type === 'wordProgressDecor' && (
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: decorType === 'overline' ? `${activeConfig.offsetY ?? -10}px` : (decorType === 'strike' ? '50%' : undefined),
                                                bottom: decorType === 'underline' ? `${activeConfig.offsetY ?? 8}px` : undefined,
                                                height: `${activeConfig.height ?? 4}px`,
                                                width: `${isActive ? wordProgress * 100 : (i < activeWordIndex ? 100 : 0)}%`,
                                                backgroundColor: highlightColor,
                                                borderRadius: `${radius}px`,
                                                pointerEvents: 'none',
                                            }} />
                                        )}

                                        {/* Text Content */}
                                        <span style={{
                                            color: (decorVisible && ['pillBehind', 'boxBehind'].includes(decorType)) ? (style.highlightColor ? '#000' : '#FFF') : style.primaryColor,
                                            position: 'relative',
                                            textShadow: style.shadowBlur ? `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}` : undefined,
                                            WebkitTextStroke: `${style.strokeWidth ?? style.outlineWidth ?? 0}px ${style.strokeColor ?? style.outlineColor ?? '#000000'}`,
                                        }}>
                                            {word}
                                        </span>

                                        {/* Quotes/Brackets */}
                                        {decorVisible && decorType === 'brackets' && (
                                            <>
                                                <motion.span className="absolute left-0 top-0 bottom-0" style={{ x: -10, borderLeft: `3px solid ${highlightColor}` }} />
                                                <motion.span className="absolute right-0 top-0 bottom-0" style={{ x: 10, borderRight: `3px solid ${highlightColor}` }} />
                                            </>
                                        )}
                                    </span>
                                );
                            }

                            return <span key={i} style={{ color: style.primaryColor }}>{word}</span>;
                        })}
                    </motion.div>
                </div>
            )
        }
    }



    // -------------------------------------------------------------------------
    // LEGACY RENDERERS (Keep for backward compatibility)
    // -------------------------------------------------------------------------

    // 1. Single Word Mode (Special Case)
    if (style.displayMode === 'single-word') {
        const currentWord = words[Math.min(activeWordIndex >= 0 ? activeWordIndex : 0, words.length - 1)] || "";

        return (
            <div style={containerStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentWord}
                        initial={{ scale: 0.8, opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ scale: 1.1, opacity: 0, filter: "blur(4px)" }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        style={{
                            ...textBaseStyle,
                            minHeight: '1.5em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {currentWord}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    // 2. Typewriter Effect
    if (resolvePresetId(style.effect) === 'typewriter') {
        const charLength = cue.text.length;
        const visibleChars = Math.floor(progress * charLength);
        const visibleText = cue.text.slice(0, visibleChars);

        return (
            <div style={containerStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={textBaseStyle}
                >
                    {visibleText}
                    <span className="opacity-0">{cue.text.slice(visibleChars)}</span>
                </motion.div>
            </div>
        );
    }

    // 3. Stagger Effect (Not fully covered by JSON presets yet)
    if (resolvePresetId(style.effect) === 'stagger') {
        const wordContainerStyle = {
            ...textBaseStyle,
            backgroundColor: 'transparent',
            display: 'flex',
            flexWrap: 'wrap' as const,
            justifyContent: 'center',
            gap: `${style.highlightGap ?? 12}px`,
            boxShadow: 'none',
            WebkitTextStroke: '0px',
            border: 'none',
            backdropFilter: 'none',
        };

        return (
            <div style={containerStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
                <motion.div style={wordContainerStyle}>
                    {words.map((word, i) => (
                        <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{ color: style.primaryColor, display: 'inline-block' }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </motion.div>
            </div>
        );
    }

    // 4. Default / Fade (Block Entry)
    // If not handled by preset or above specials, fall back to simple block render
    const blockVariants = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 }
        },
        none: {
            initial: { opacity: 1 },
            animate: { opacity: 1 },
            exit: { opacity: 1 }
        }
    };

    const selectedVariant = (resolvePresetId(style.effect) === 'fade') ? blockVariants.fade : blockVariants.none;

    return (
        <div style={containerStyle} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
            <motion.div
                variants={selectedVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={textBaseStyle}
            >
                {cue.text}
            </motion.div>
        </div>
    );
}
