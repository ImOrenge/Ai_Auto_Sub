import { SubtitleCue, SubtitleConfig } from '../jobs/types';
import { EffectPreset, AnimationProps, TransitionProps } from '../subtitle-definitions';

// Shared Types
export type ShadowSpec = {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
};

// --- Helper Functions ---

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const parseColor = (color: string) => {
    const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    if (ctx) {
        ctx.fillStyle = color;
        const norm = ctx.fillStyle; // Get normalized color
        if (norm.startsWith('#')) {
            const r = parseInt(norm.slice(1, 3), 16);
            const g = parseInt(norm.slice(3, 5), 16);
            const b = parseInt(norm.slice(5, 7), 16);
            const a = norm.length === 9 ? parseInt(norm.slice(7, 9), 16) / 255 : 1;
            return { r, g, b, a };
        }
    }
    // Fallback for Node.js or failed parse
    if (color.startsWith('rgba')) {
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: m[4] ? parseFloat(m[4]) : 1 };
    }
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const a = color.length === 9 ? parseInt(color.slice(7, 9), 16) / 255 : 1;
        return { r, g, b, a };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
};

const lerpColor = (from: string, to: string, t: number) => {
    const c1 = parseColor(from);
    const c2 = parseColor(to);
    const r = Math.round(lerp(c1.r, c2.r, t));
    const g = Math.round(lerp(c1.g, c2.g, t));
    const b = Math.round(lerp(c1.b, c2.b, t));
    const a = lerp(c1.a, c2.a, t);
    return `rgba(${r},${g},${b},${a})`;
};

const interpolateArray = (values: number[], t: number) => {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];
    const segment = 1 / (values.length - 1);
    const index = Math.min(values.length - 2, Math.floor(t / segment));
    const localT = (t - index * segment) / segment;
    return lerp(values[index], values[index + 1], localT);
};

const parseNumber = (value: number | string): number | undefined => {
    if (typeof value === 'number') return value;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseAngle = (value: number | string): number | undefined => {
    if (typeof value === 'number') return value;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseLength = (value: number | string, fontSize: number): number | undefined => {
    if (typeof value === 'number') return value;
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return undefined;
    if (typeof value === 'string' && value.endsWith('em')) return parsed * fontSize;
    return parsed;
};

const pickFromArray = <T,>(value: T[], t: number) => {
    if (value.length === 0) return undefined;
    if (value.length === 1) return value[0];
    const index = Math.min(value.length - 1, Math.floor(t * (value.length - 1)));
    return value[index];
};

const resolveNumber = (
    value: number | number[] | string | string[] | undefined,
    t: number,
    fallback: number
): number => {
    if (value === undefined) return fallback;
    if (Array.isArray(value)) {
        const numbers = value.map(parseNumber).filter((v): v is number => v !== undefined);
        if (numbers.length === 0) return fallback;
        return interpolateArray(numbers, t);
    }
    if (typeof value === 'string') {
        const parsed = parseNumber(value);
        return parsed ?? fallback;
    }
    return value;
};

const resolveAngle = (
    value: number | number[] | string | string[] | undefined,
    t: number,
    fallback: number
): number => {
    if (value === undefined) return fallback;
    if (Array.isArray(value)) {
        const numbers = value.map(parseAngle).filter((v): v is number => v !== undefined);
        if (numbers.length === 0) return fallback;
        return interpolateArray(numbers, t);
    }
    if (typeof value === 'string') {
        const parsed = parseAngle(value);
        return parsed ?? fallback;
    }
    return value;
};

const resolveLength = (
    value: number | number[] | string | string[] | undefined,
    t: number,
    fallback: number,
    fontSize: number
): number => {
    if (value === undefined) return fallback;
    if (Array.isArray(value)) {
        const numbers = value.map((item) => parseLength(String(item), fontSize)).filter((v): v is number => v !== undefined);
        if (numbers.length === 0) return fallback;
        return interpolateArray(numbers, t);
    }
    if (typeof value === 'string') {
        const parsed = parseLength(value, fontSize);
        return parsed ?? fallback;
    }
    return value;
};

const resolveTextShadow = (value: string | string[] | undefined, t: number): ShadowSpec | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
        if (value.length === 0) return undefined;
        if (value.length === 1) return resolveTextShadow(value[0], 0);

        const segment = 1 / (value.length - 1);
        const index = Math.min(value.length - 2, Math.floor(t / segment));
        const localT = (t - index * segment) / segment;

        const s1 = resolveTextShadow(value[index], 0);
        const s2 = resolveTextShadow(value[index + 1], 0);

        if (!s1) return s2;
        if (!s2) return s1;

        return {
            offsetX: lerp(s1.offsetX, s2.offsetX, localT),
            offsetY: lerp(s1.offsetY, s2.offsetY, localT),
            blur: lerp(s1.blur, s2.blur, localT),
            color: lerpColor(s1.color, s2.color, localT)
        };
    }

    const parts = value.trim().split(/\s+/);
    if (parts.length < 3) return undefined;
    const offsetX = Number.parseFloat(parts[0]);
    const offsetY = Number.parseFloat(parts[1]);
    const blur = Number.parseFloat(parts[2]);
    if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY) || !Number.isFinite(blur)) return undefined;
    const color = parts.slice(3).join(' ') || 'rgba(0,0,0,0.5)';
    return { offsetX, offsetY, blur, color };
};

const applyShadow = (ctx: CanvasRenderingContext2D | any, shadow?: ShadowSpec) => {
    if (!shadow) return;
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
};

const resetShadow = (ctx: CanvasRenderingContext2D | any) => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

const measureTextWithSpacing = (ctx: CanvasRenderingContext2D | any, text: string, letterSpacing: number) => {
    if (!letterSpacing) return ctx.measureText(text).width;
    const chars = Array.from(text);
    const baseWidth = chars.reduce((acc, char) => acc + ctx.measureText(char as string).width, 0);
    return baseWidth + Math.max(0, chars.length - 1) * letterSpacing;
};

const drawMultiShadowText = (
    ctx: CanvasRenderingContext2D | any,
    text: string,
    x: number,
    y: number,
    letterSpacing: number,
    mode: 'fill' | 'stroke',
    shadows: ShadowSpec[],
    skipMainText = false
) => {
    const offX = 5000;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';

    shadows.forEach(shadow => {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        applyShadow(ctx, {
            ...shadow,
            offsetX: (shadow.offsetX || 0) + offX,
            offsetY: shadow.offsetY || 0
        });
        drawTextWithSpacing(ctx, text, x - offX, y, letterSpacing, mode);
        ctx.restore();
    });
    ctx.restore();

    if (!skipMainText) {
        resetShadow(ctx);
        drawTextWithSpacing(ctx, text, x, y, letterSpacing, mode);
    }
};

const drawMultiLineText = (
    ctx: CanvasRenderingContext2D | any,
    text: string,
    x: number,
    y: number,
    lineHeight: number,
    letterSpacing: number,
    mode: 'fill' | 'stroke',
    shadows?: ShadowSpec[],
    skipMainText = false
) => {
    const lines = text.split('\n');
    const totalHeight = lines.length * lineHeight;
    let currentY = y - totalHeight / 2 + lineHeight / 2;
    
    lines.forEach(line => {
        if (shadows && shadows.length > 0) {
            drawMultiShadowText(ctx, line, x, currentY, letterSpacing, mode, shadows, skipMainText);
        } else {
            drawTextWithSpacing(ctx, line, x, currentY, letterSpacing, mode);
        }
        currentY += lineHeight;
    });
};


const drawTextWithSpacing = (
    ctx: CanvasRenderingContext2D | any,
    text: string,
    x: number,
    y: number,
    letterSpacing: number,
    mode: 'fill' | 'stroke'
) => {
    if (!letterSpacing) {
        if (mode === 'fill') ctx.fillText(text, x, y);
        else ctx.strokeText(text, x, y);
        return;
    }
    const chars = Array.from(text);
    const totalWidth = measureTextWithSpacing(ctx, text, letterSpacing);
    let currentX = x - totalWidth / 2;
    const prevAlign = ctx.textAlign;
    ctx.textAlign = 'left';
    chars.forEach((char) => {
        const charWidth = ctx.measureText(char as string).width;
        const drawX = currentX;
        if (mode === 'fill') ctx.fillText(char as string, drawX, y);
        else ctx.strokeText(char as string, drawX, y);
        currentX += charWidth + letterSpacing;
    });
    ctx.textAlign = prevAlign;
};


const toRadians = (deg: number) => (deg * Math.PI) / 180;

const to3dScale = (angle: number) => Math.max(0.2, Math.cos(toRadians(angle)));

const Easing = {
    linear: (t: number) => t,
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    easeIn: (t: number) => Math.pow(t, 3),
    easeInOut: (t: number) => (t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2),
    circOut: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
    spring: (t: number, stiffness = 100, damping = 10, mass = 1) => {
        // Simplified spring solver for a 0-1 range
        const w0 = Math.sqrt(stiffness / mass);
        const zeta = damping / (2 * Math.sqrt(stiffness * mass));
        
        if (zeta < 1) {
            // Underdamped
            const wd = w0 * Math.sqrt(1 - zeta * zeta);
            return 1 - Math.exp(-zeta * w0 * t * 5) * (Math.cos(wd * t * 5) + (zeta * w0 / wd) * Math.sin(wd * t * 5));
        } else {
            // Overdamped or Critically Damped
            return 1 - Math.exp(-w0 * t * 5) * (1 + w0 * t * 5);
        }
    }
};

const resolveEase = (transition?: TransitionProps) => {
    if (transition?.type === 'spring') {
        const stiffness = transition.stiffness ?? 100;
        const damping = transition.damping ?? 10;
        const mass = transition.mass ?? 1;
        return (t: number) => Easing.spring(t, stiffness, damping, mass);
    }
    const ease = transition?.ease ?? 'linear';
    if (ease.includes('easeInOut')) return Easing.easeInOut;
    if (ease.includes('easeOut')) return Easing.easeOut;
    if (ease.includes('easeIn')) return Easing.easeIn;
    if (ease.includes('circOut')) return Easing.circOut;
    return Easing.linear;
};

const resolveBlur = (filter: string | string[] | undefined, t: number): string | undefined => {
    const extract = (value: string | undefined) => {
        if (!value) return undefined;
        const match = value.match(/blur\(([\d.]+)px\)/);
        return match ? Number.parseFloat(match[1]) : undefined;
    };
    if (!filter) return undefined;
    if (Array.isArray(filter)) {
        const values = filter.map((value) => extract(String(value))).filter((v): v is number => v !== undefined);
        if (values.length === 0) return undefined;
        const blur = interpolateArray(values, t);
        return `blur(${blur}px)`;
    }
    const blur = extract(filter);
    return blur === undefined ? undefined : `blur(${blur}px)`;
};

const toFilterArray = (value?: string | string[]) => (Array.isArray(value) ? value : value ? [value] : []);

type ResolvedMotion = {
    opacity?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    x?: number;
    y?: number;
    rotate?: number;
    rotateX?: number;
    rotateY?: number;
    skewX?: number;
    skewY?: number;
    letterSpacing?: number;
    filter?: string;
    textShadow?: ShadowSpec;
};

const resolveMotion = (anim: AnimationProps | undefined, t: number, fontSize: number): ResolvedMotion => ({
    opacity: anim?.opacity === undefined ? undefined : resolveNumber(anim.opacity, t, 1),
    scale: anim?.scale === undefined ? undefined : resolveNumber(anim.scale, t, 1),
    scaleX: anim?.scaleX === undefined ? undefined : resolveNumber(anim.scaleX, t, 1),
    scaleY: anim?.scaleY === undefined ? undefined : resolveNumber(anim.scaleY, t, 1),
    x: anim?.x === undefined ? undefined : resolveNumber(anim.x, t, 0),
    y: anim?.y === undefined ? undefined : resolveNumber(anim.y, t, 0),
    rotate: anim?.rotate === undefined ? undefined : resolveNumber(anim.rotate, t, 0),
    rotateX: anim?.rotateX === undefined ? undefined : resolveAngle(anim.rotateX, t, 0),
    rotateY: anim?.rotateY === undefined ? undefined : resolveAngle(anim.rotateY, t, 0),
    skewX: anim?.skewX === undefined ? undefined : resolveAngle(anim.skewX, t, 0),
    skewY: anim?.skewY === undefined ? undefined : resolveAngle(anim.skewY, t, 0),
    letterSpacing: anim?.letterSpacing === undefined ? undefined : resolveLength(anim.letterSpacing, t, 0, fontSize),
    filter: anim?.filter ? resolveBlur(anim.filter, t) : undefined,
    textShadow: anim?.textShadow ? resolveTextShadow(anim.textShadow, t) : undefined
});

const resolveMotionBetween = (
    from: AnimationProps,
    to: AnimationProps,
    t: number,
    fontSize: number
): ResolvedMotion => {
    // We resolve 'from' at t=1 and 'to' at t=1 (to handle keyframes within either), 
    // then lerp between those two results based on outer t.
    // However, usually word motions are just single values or arrays.
    // Simplified: interpolate basic props.
    const start = resolveMotion(from, 1, fontSize);
    const end = resolveMotion(to, 1, fontSize);
    
    return {
        opacity: lerp(start.opacity ?? 1, end.opacity ?? 1, t),
        scale: lerp(start.scale ?? 1, end.scale ?? 1, t),
        scaleX: lerp(start.scaleX ?? 1, end.scaleX ?? 1, t),
        scaleY: lerp(start.scaleY ?? 1, end.scaleY ?? 1, t),
        x: lerp(start.x ?? 0, end.x ?? 0, t),
        y: lerp(start.y ?? 0, end.y ?? 0, t),
        rotate: lerp(start.rotate ?? 0, end.rotate ?? 0, t),
        rotateX: lerp(start.rotateX ?? 0, end.rotateX ?? 0, t),
        rotateY: lerp(start.rotateY ?? 0, end.rotateY ?? 0, t),
        skewX: lerp(start.skewX ?? 0, end.skewX ?? 0, t),
        skewY: lerp(start.skewY ?? 0, end.skewY ?? 0, t),
        letterSpacing: lerp(start.letterSpacing ?? 0, end.letterSpacing ?? 0, t),
        filter: t < 0.5 ? start.filter : end.filter, // Filter lerp is hard, just switch
        textShadow: t < 0.5 ? start.textShadow : end.textShadow
    };
};

// --- Main Rendering Function ---

export const renderSubtitleFrame = (
    ctx: CanvasRenderingContext2D | any,
    cue: SubtitleCue,
    style: SubtitleConfig,
    currentTime: number,
    preset?: EffectPreset,
    width = 1920,
    height = 1080
) => {
    // 1. Clear Canvas (Note: Caller might want to clear or not, but usually yes for fresh frame)
    // ctx.clearRect(0, 0, width, height); // Let caller decide clearing

    // 2. Setup Base Styling
    // 2. Setup Base Styling
    const SCALE_FACTOR = 2.5; // Base scale for 1080p reference
    
    // Calculate responsive scale based on 1920x1080 reference
    const refW = 1920;
    const refH = 1080;
    const scaleX = width / refW;
    const scaleY = height / refH;
    // Use the smaller scale factor to ensure content fits within both dimensions
    // This effectively scales down for narrow (portrait) and scales up for 4K
    const responsiveScale = Math.min(scaleX, scaleY);
    
    // Allow slightly larger text on mobile/vertical by blending scales? 
    // For now, stick to strict fit to avoid overflow as requested.

    const baseFontSize = style.fontSize || 24;
    const fontSize = baseFontSize * SCALE_FACTOR * responsiveScale;
    const fontWeight = style.fontWeight || 'bold';
    const fontName = style.fontName || 'Arial';
    // Prioritize Korean fonts for better CJK support
    const fontFallback = ", 'Malgun Gothic', 'NanumGothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Segoe UI', sans-serif";
    ctx.font = `${fontWeight} ${fontSize}px "${fontName}"${fontFallback}`; 
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 3. Animation Timing
    const duration = cue.endTime - cue.startTime;
    const elapsed = currentTime - cue.startTime;
    const progress = clamp(duration > 0 ? elapsed / duration : 0);
    
    // Update canvasScale to use our responsive metric instead of just height
    const canvasScale = responsiveScale; 

    let globalAlpha = 1;
    let globalYOffset = 0;
    let globalXOffset = 0;
    let globalScale = 1;
    let globalScaleX = 1;
    let globalScaleY = 1;
    let globalRotate = 0;
    let globalSkewX = 0;
    let globalSkewY = 0;
    let globalLetterSpacing = 0;
    let globalFilter: string | undefined;
    let globalTextShadow: ShadowSpec | undefined;

    // Word segmentation
    const words = cue.text.split(/\s+/).filter(Boolean);
    const hasWordTimings = !!cue.words && cue.words.length === words.length;
    const wordTimings = words.map((word, index) => {
        if (hasWordTimings && cue.words?.[index]) {
            return cue.words[index];
        }
        const step = duration > 0 && words.length > 0 ? duration / words.length : 0;
        const start = cue.startTime + index * step;
        return { word, start, end: start + step };
    });
    const activeIdxFromTimings = wordTimings.findIndex((w) => currentTime >= w.start && currentTime <= w.end);
    const activeIdx = words.length > 0
        ? (activeIdxFromTimings !== -1
            ? activeIdxFromTimings
            : Math.min(words.length - 1, Math.max(0, Math.floor(progress * words.length))))
        : -1;
    const getWordProgress = (index: number) => {
        const timing = wordTimings[index];
        if (!timing) return 0;
        const denom = timing.end - timing.start;
        if (denom <= 0) return 0;
        return clamp((currentTime - timing.start) / denom);
    };

    // Default Entry/Exit (None/Fade)
    const ENTRY_DUR = 0.3;
    const EXIT_DUR = 0.3;

    if (!preset || preset.scope !== 'line') {
        if (elapsed < ENTRY_DUR) globalAlpha = elapsed / ENTRY_DUR;
        const leaveTime = cue.endTime - currentTime;
        if (leaveTime < EXIT_DUR) globalAlpha = Math.min(globalAlpha, Math.max(0, leaveTime / EXIT_DUR));
    }
    
    if (preset && preset.scope === 'line') {
        const entry = preset.entry;
        const exit = preset.exit;
        const entryDur = (entry?.type === 'lineClipReveal' ? entry.duration : (entry as any)?.transition?.duration) || 0.3;

        if (entry?.type === 'lineMotion' && elapsed < entryDur) {
            const r = clamp(entryDur > 0 ? elapsed / entryDur : 0);
            const ease = resolveEase(entry.transition);
            const t = ease(r);
            const init: AnimationProps = entry.initial || {};
            const anim: AnimationProps = entry.animate || {};
            globalAlpha = lerp(resolveNumber(init.opacity, 0, 0), resolveNumber(anim.opacity, 1, 1), t);
            globalYOffset = lerp(resolveNumber(init.y, 0, 0), resolveNumber(anim.y, 1, 0), t) * canvasScale;
            globalXOffset = lerp(resolveNumber(init.x, 0, 0), resolveNumber(anim.x, 1, 0), t) * canvasScale;
            globalScale = lerp(resolveNumber(init.scale, 0, 1), resolveNumber(anim.scale, 1, 1), t);
            globalRotate = lerp(resolveNumber(init.rotate, 0, 0), resolveNumber(anim.rotate, 1, 0), t);
            globalSkewX = lerp(resolveAngle(init.skewX, 0, 0), resolveAngle(anim.skewX, 1, 0), t);
            globalSkewY = lerp(resolveAngle(init.skewY, 0, 0), resolveAngle(anim.skewY, 1, 0), t);
            globalLetterSpacing = lerp(
                resolveLength(init.letterSpacing, 0, 0, fontSize),
                resolveLength(anim.letterSpacing, 1, 0, fontSize),
                t
            );
            const rotateX = lerp(resolveAngle(init.rotateX, 0, 0), resolveAngle(anim.rotateX, 1, 0), t);
            const rotateY = lerp(resolveAngle(init.rotateY, 0, 0), resolveAngle(anim.rotateY, 1, 0), t);
            globalScaleX = to3dScale(rotateY);
            globalScaleY = to3dScale(rotateX);
            const blurFilters = ['blur(0px)', ...toFilterArray(init.filter), ...toFilterArray(anim.filter)];
            globalFilter = resolveBlur(blurFilters, t);
            const shadowValues = [init.textShadow, anim.textShadow].filter(Boolean) as string[];
            globalTextShadow = shadowValues.length > 0 ? resolveTextShadow(shadowValues, t) : undefined;
        }

        const leaveTime = cue.endTime - currentTime;
        const exitDur = (exit?.type === 'lineClipReveal' ? exit.duration : (exit as any)?.transition?.duration) || 0.3;
        if (exit?.type === 'lineMotion' && leaveTime < exitDur && leaveTime >= 0) {
            const r = clamp(exitDur > 0 ? 1 - (leaveTime / exitDur) : 1);
            const ease = resolveEase(exit.transition);
            const t = ease(r);
            const anim: AnimationProps = exit.animate || {};
            globalAlpha = lerp(1, resolveNumber(anim.opacity, 1, 0), t);
            globalYOffset = lerp(0, resolveNumber(anim.y, 1, 0), t) * canvasScale;
            globalXOffset = lerp(0, resolveNumber(anim.x, 1, 0), t) * canvasScale;
            globalScale = lerp(1, resolveNumber(anim.scale, 1, 1), t);
            globalRotate = lerp(0, resolveNumber(anim.rotate, 1, 0), t);
            globalSkewX = lerp(0, resolveAngle(anim.skewX, 1, 0), t);
            globalSkewY = lerp(0, resolveAngle(anim.skewY, 1, 0), t);
            globalLetterSpacing = lerp(0, resolveLength(anim.letterSpacing, 1, 0, fontSize), t);
            const rotateX = lerp(0, resolveAngle(anim.rotateX, 1, 0), t);
            const rotateY = lerp(0, resolveAngle(anim.rotateY, 1, 0), t);
            globalScaleX = to3dScale(rotateY);
            globalScaleY = to3dScale(rotateX);
            const blurFilters = ['blur(0px)', ...toFilterArray(anim.filter)];
            globalFilter = resolveBlur(blurFilters, t);
            globalTextShadow = anim.textShadow ? resolveTextShadow(anim.textShadow, t) : undefined;
        }
    }

    ctx.globalAlpha = globalAlpha;
    if (globalFilter && ctx.filter) ctx.filter = globalFilter; // Check ctx.filter availability (Node-canvas supports it?)

    // 4. Position Calculation
    const x = width / 2 + globalXOffset;
    // Scale margins responsively
    let y = height - ((style.marginV ?? 100) * SCALE_FACTOR * responsiveScale) + globalYOffset;
    if (style.position === 'top') {
        y = ((style.marginV ?? 100) * SCALE_FACTOR * responsiveScale) + globalYOffset;
    } else if (style.position === 'center') {
        y = height / 2 + globalYOffset;
    }

    // Measure Text & Wrap Logic
    // Measure Text & Wrap Logic
    // Use 85% to leave room for padding and shadows/glows
    const maxWidth = width * 0.85; 
    
    // Define helper first
    const wrapText = (context: any, text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = measureTextWithSpacing(context, currentLine + " " + word, globalLetterSpacing);
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    // Calculate final lines
    let finalLines: string[] = [cue.text];
    if (style.displayMode !== 'single-word') {
         const fullWidth = measureTextWithSpacing(ctx, cue.text, globalLetterSpacing);
         if (fullWidth > maxWidth) {
             finalLines = wrapText(ctx, cue.text, maxWidth);
         }
    } else {
        // Single word mode
        finalLines = [words[Math.max(0, activeIdx)] || words[0] || ""];
    }

    const lineHeight = fontSize * 1.2;
    
    // Calculate dimensions of the *block* for background/animations
    // Width is the max width of any line
    const textWidth = Math.max(...finalLines.map(line => measureTextWithSpacing(ctx, line, globalLetterSpacing)));
    const textHeight = finalLines.length * lineHeight;

    // Adjust Y position based on lines
    if (style.position !== 'top' && style.position !== 'center') {
        // Bottom anchor (default) grows up
        y -= (finalLines.length - 1) * lineHeight;
    }
    if (style.position === 'center') {
        y -= ((finalLines.length - 1) * lineHeight) / 2;
    }

    // 5. Drawing Content Logic
    if (style.displayMode === 'single-word') {
        const currentWord = finalLines[0];

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(globalRotate * Math.PI / 180);
        if (globalSkewX || globalSkewY) {
            ctx.transform(1, Math.tan(toRadians(globalSkewY)), Math.tan(toRadians(globalSkewX)), 1, 0, 0);
        }
        ctx.scale(globalScale * globalScaleX, globalScale * globalScaleY);
        ctx.globalAlpha = globalAlpha;

        const isNeon = (style.effect as string) === 'neon' || (style.shadowBlur ?? 0) > 15;
        const neonShadows: ShadowSpec[] | undefined = isNeon ? [
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 0.4, color: '#FFFFFF' }, 
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 1.0, color: style.shadowColor || style.primaryColor || '#00FFFF' },
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 2.5, color: style.shadowColor || style.primaryColor || '#00FFFF' },
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 4.5, color: style.shadowColor || style.primaryColor || '#00FFFF' },
        ] : undefined;

        if (isNeon && neonShadows) {
            drawMultiLineText(ctx, currentWord, 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill', neonShadows, true);
        }

        if (style.outlineWidth && !isNeon) {
            ctx.strokeStyle = style.outlineColor || '#000000';
            ctx.lineWidth = style.outlineWidth * 2 * SCALE_FACTOR;
            drawMultiLineText(ctx, currentWord, 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
        }

        ctx.fillStyle = style.primaryColor || '#FFFFFF';
        drawMultiLineText(ctx, currentWord, 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill');

        if (isNeon && style.strokeWidth) {
             ctx.strokeStyle = style.strokeColor || '#FFFFFF';
             ctx.lineWidth = style.strokeWidth * 2 * SCALE_FACTOR;
             ctx.lineJoin = 'round';
             drawMultiLineText(ctx, currentWord, 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
        }
        ctx.restore();
    } else if (style.effect === 'typewriter') {
        const charCount = cue.text.length;
        const visibleChars = Math.floor(progress * charCount);
        const visibleText = cue.text.slice(0, visibleChars);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(globalRotate * Math.PI / 180);
        if (globalSkewX || globalSkewY) {
            ctx.transform(1, Math.tan(toRadians(globalSkewY)), Math.tan(toRadians(globalSkewX)), 1, 0, 0);
        }
        ctx.scale(globalScale * globalScaleX, globalScale * globalScaleY);

        const isNeon = (style.effect as string) === 'neon' || (style.shadowBlur ?? 0) > 15;
        const neonShadows: ShadowSpec[] | undefined = isNeon ? [
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 0.4, color: '#FFFFFF' }, 
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 1.0, color: style.shadowColor || style.primaryColor || '#00FFFF' },
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 2.5, color: style.shadowColor || style.primaryColor || '#00FFFF' },
            { offsetX: (style.shadowOffsetX || 0) * canvasScale, offsetY: (style.shadowOffsetY || 0) * canvasScale, blur: (style.shadowBlur ?? 20) * 4.5, color: style.shadowColor || style.primaryColor || '#00FFFF' },
        ] : undefined;

        if (isNeon && neonShadows) {
            drawMultiLineText(ctx, visibleText, 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill', neonShadows, true);
        }

        if (style.outlineWidth && !isNeon) {
            ctx.strokeStyle = style.outlineColor || '#000000';
            ctx.lineWidth = style.outlineWidth * 2;
            drawMultiLineText(ctx, visibleText, 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
        }
        ctx.fillStyle = style.primaryColor || '#FFFFFF';
        drawMultiLineText(ctx, visibleText, 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill');

        if (isNeon && style.strokeWidth) {
             ctx.strokeStyle = style.strokeColor || '#FFFFFF';
             ctx.lineWidth = style.strokeWidth * 2;
             ctx.lineJoin = 'round';
             drawMultiLineText(ctx, visibleText, 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
        }
        ctx.restore();
    } else if (!preset || preset.scope === 'line') {
        // Line-scope or standard
        ctx.save();
        if (preset?.scope === 'line') {
            const entry = preset.entry;
            const exit = preset.exit;
            const entryDur = (entry?.type === 'lineClipReveal' ? entry.duration : 0.3);
            const leaveTime = cue.endTime - currentTime;
            const exitDur = (exit?.type === 'lineClipReveal' ? exit.duration : 0.3);

            if (elapsed < entryDur && entry?.type === 'lineClipReveal') {
                const p = Math.max(0, Math.min(1, elapsed / entryDur));
                const dir = entry.direction;
                ctx.beginPath();
                if (dir === 'ltr') ctx.rect(x - textWidth / 2, y - textHeight / 2, textWidth * p, textHeight);
                if (dir === 'rtl') ctx.rect(x + textWidth / 2 - textWidth * p, y - textHeight / 2, textWidth * p, textHeight);
                if (dir === 'btt') ctx.rect(x - textWidth / 2, y + textHeight / 2 - textHeight * p, textWidth, textHeight * p);
                if (dir === 'ttb') ctx.rect(x - textWidth / 2, y - textHeight / 2, textWidth, textHeight * p);
                ctx.clip();
            } else if (leaveTime < exitDur && exit?.type === 'lineClipReveal') {
                const p = Math.max(0, Math.min(1, leaveTime / exitDur));
                const dir = exit.direction;
                ctx.beginPath();
                if (dir === 'ltr') ctx.rect(x - textWidth / 2 + textWidth * (1 - p), y - textHeight / 2, textWidth * p, textHeight);
                if (dir === 'rtl') ctx.rect(x - textWidth / 2, y - textHeight / 2, textWidth * p, textHeight);
                ctx.clip();
            }
        }

        // Background Box
        if (style.backgroundColor && style.backgroundColor !== 'transparent') {
            const paddingH = fontSize * 0.5;
            const paddingV = fontSize * 0.2;
            const boxWidth = textWidth + paddingH * 2;
            const boxHeight = textHeight + paddingV * 2;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(globalRotate * Math.PI / 180);
            if (globalSkewX || globalSkewY) {
                ctx.transform(1, Math.tan(toRadians(globalSkewY)), Math.tan(toRadians(globalSkewX)), 1, 0, 0);
            }
            ctx.scale(globalScale * globalScaleX, globalScale * globalScaleY);
            ctx.fillStyle = style.backgroundColor;
            ctx.beginPath();
            
            // roundRect support check
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 8);
            } else {
                 ctx.rect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
            }
            ctx.fill();
            ctx.restore();
        }

        // Text
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(globalRotate * Math.PI / 180);
        if (globalSkewX || globalSkewY) {
            ctx.transform(1, Math.tan(toRadians(globalSkewY)), Math.tan(toRadians(globalSkewX)), 1, 0, 0);
        }
        ctx.scale(globalScale * globalScaleX, globalScale * globalScaleY);

        if (globalTextShadow) {
            applyShadow(ctx, {
                ...globalTextShadow,
                offsetX: globalTextShadow.offsetX * SCALE_FACTOR,
                offsetY: globalTextShadow.offsetY * SCALE_FACTOR,
                blur: globalTextShadow.blur * SCALE_FACTOR
            });
        } else if (style.shadowBlur) {
            applyShadow(ctx, {
                offsetX: (style.shadowOffsetX || 0) * SCALE_FACTOR,
                offsetY: (style.shadowOffsetY || 2) * SCALE_FACTOR,
                blur: style.shadowBlur * SCALE_FACTOR,
                color: style.shadowColor || 'rgba(0,0,0,0.5)'
            });
        }

        const isNeon = (style.effect as string) === 'neon' || (globalTextShadow && globalTextShadow.blur > 15) || (style.shadowBlur ?? 0) > 15;
        
        if (isNeon) {
            const baseBlur = globalTextShadow?.blur || (style.shadowBlur ?? 20);
            const baseColor = globalTextShadow?.color || style.shadowColor || style.primaryColor || '#00FFFF';
            const baseOffX = (globalTextShadow?.offsetX ?? (style.shadowOffsetX || 0)) * canvasScale * SCALE_FACTOR;
            const baseOffY = (globalTextShadow?.offsetY ?? (style.shadowOffsetY || 0)) * canvasScale * SCALE_FACTOR;

            const neonShadows: ShadowSpec[] = [
                { offsetX: baseOffX, offsetY: baseOffY, blur: baseBlur * 0.4, color: '#FFFFFF' }, 
                { offsetX: baseOffX, offsetY: baseOffY, blur: baseBlur * 1.0, color: baseColor }, 
                { offsetX: baseOffX, offsetY: baseOffY, blur: baseBlur * 2.5, color: baseColor }, 
                { offsetX: baseOffX, offsetY: baseOffY, blur: baseBlur * 4.5, color: baseColor },
            ];
            // 1. Draw shadows only (multiple layers)
            drawMultiLineText(ctx, finalLines.join('\n'), 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill', neonShadows, true);
        }

        // 2. Outlines/Strokes for non-neon
        if (!isNeon) {
            if (style.outlineWidth) {
                ctx.strokeStyle = style.outlineColor || '#000000';
                ctx.lineWidth = (style.outlineWidth + (style.strokeWidth || 0)) * 2 * SCALE_FACTOR;
                ctx.lineJoin = 'round';
                drawMultiLineText(ctx, finalLines.join('\n'), 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
            }

            if (style.strokeWidth) {
                ctx.strokeStyle = style.strokeColor || '#000000';
                ctx.lineWidth = style.strokeWidth * 2 * SCALE_FACTOR;
                ctx.lineJoin = 'round';
                drawMultiLineText(ctx, finalLines.join('\n'), 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
            }
        }

        resetShadow(ctx);
        ctx.fillStyle = style.primaryColor || '#FFFFFF';
        
        if (isNeon) {
            // 3. Draw Fill for Neon
            drawMultiLineText(ctx, finalLines.join('\n'), 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill');
            
            // 4. Draw Stroke ON TOP for Neon (this creates the white core)
            if (style.strokeWidth) {
                ctx.strokeStyle = style.strokeColor || '#FFFFFF';
                ctx.lineWidth = style.strokeWidth * 2;
                ctx.lineJoin = 'round';
                drawMultiLineText(ctx, finalLines.join('\n'), 0, 0, fontSize * 1.2, globalLetterSpacing, 'stroke');
            }
        } else {
            drawMultiLineText(ctx, finalLines.join('\n'), 0, 0, fontSize * 1.2, globalLetterSpacing, 'fill');
        }

        ctx.restore();

        ctx.restore();

    } else if (preset.scope === 'word' || preset.active?.type?.startsWith('word')) {
        const activeConfig = preset.active;
        const inactiveConfig: AnimationProps | undefined = preset.inactive;

        const wordMetrics = words.map((word) => ctx.measureText(word));
        const spaceWidth = ctx.measureText(' ').width;
        const gap = style.highlightGap ?? spaceWidth;
        const totalWidth = wordMetrics.reduce((acc, m) => acc + m.width, 0) + (words.length - 1) * gap;
        const baseAlpha = globalAlpha;
        const highlightColor = style.highlightColor || '#FFFF00';
        const highlightAlpha = style.highlightOpacity ?? 1;

        let currentX = x - totalWidth / 2;
        const wordBounds = words.map((word, i) => {
            const w = wordMetrics[i].width;
            const b = { x: currentX + w / 2, w };
            currentX += w + gap;
            return b;
        });

        // Layout Transition State (Framer Motion layoutId simulation)
        let layoutRectX = 0;
        let layoutRectW = 0;
        const layoutTransitionDur = 0.18; // Seconds

        if (activeIdx >= 0) {
            const currentBound = wordBounds[activeIdx];
            const prevBound = activeIdx > 0 ? wordBounds[activeIdx - 1] : currentBound;

            const wordStart = cue.words?.[activeIdx]?.start ?? (cue.startTime + (activeIdx / words.length) * (cue.endTime - cue.startTime));
            const timeInWord = currentTime - wordStart;
            const layoutT = clamp(timeInWord / layoutTransitionDur);
            const layoutEase = Easing.easeOut(layoutT);

            layoutRectX = lerp(prevBound.x, currentBound.x, layoutEase);
            layoutRectW = lerp(prevBound.w, currentBound.w, layoutEase);
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(globalRotate * Math.PI / 180);
        if (globalSkewX || globalSkewY) {
            ctx.transform(1, Math.tan(toRadians(globalSkewY)), Math.tan(toRadians(globalSkewX)), 1, 0, 0);
        }
        ctx.scale(globalScale * globalScaleX, globalScale * globalScaleY);
        ctx.translate(-x, -y);

        // 5a. Shared Layout Background Decoration (Moving highlight)
        if (activeIdx >= 0 && activeConfig?.type === 'wordDecorToggle') {
            const decorType = activeConfig.decor;
            if (decorType === 'pillBehind' || decorType === 'boxBehind') {
                const padX = (activeConfig.paddingX ?? 0) * canvasScale;
                const padY = (activeConfig.paddingY ?? 0) * canvasScale;
                const radius = (activeConfig.radius ?? 4) * canvasScale;
                const decorOpacity = (activeConfig.opacity ?? 1) * highlightAlpha * globalAlpha;

                const rectW = layoutRectW + padX * 2;
                const rectH = fontSize + padY * 2;

                ctx.save();
                ctx.translate(layoutRectX, y);
                ctx.globalAlpha = decorOpacity;
                ctx.fillStyle = highlightColor;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    if (decorType === 'pillBehind') {
                        ctx.roundRect(-rectW / 2, -rectH / 2, rectW, rectH, rectH / 2);
                    } else {
                        ctx.roundRect(-rectW / 2, -rectH / 2, rectW, rectH, radius);
                    }
                } else {
                    ctx.rect(-rectW / 2, -rectH / 2, rectW, rectH);
                }
                ctx.fill();
                ctx.restore();
            }
        }

        words.forEach((word, i) => {
            const bound = wordBounds[i];
            const wordX = bound.x;
            const wordWidth = bound.w;
            const isActive = i === activeIdx;
            const progressValue = isActive ? getWordProgress(i) : (i < activeIdx ? 1 : 0);

            ctx.save();
            ctx.translate(wordX, y);

            let wordOpacity = 1;
            let wordScaleX = 1;
            let wordScaleY = 1;
            let wordRotate = 0;
            let wordXOffset = 0;
            let wordYOffset = 0;
            let wordFilter: string | undefined;

            let wordLetterSpacing = 0;
            let wordSkewX = 0;
            let wordSkewY = 0;
            let wordTextShadow: ShadowSpec | undefined;

            // Base shadow from global style if present
            if (activeConfig?.type !== 'wordMotion' && style.shadowBlur) {
                wordTextShadow = {
                    offsetX: (style.shadowOffsetX || 0) * canvasScale,
                    offsetY: (style.shadowOffsetY || 2) * canvasScale,
                    blur: (style.shadowBlur || 0) * canvasScale,
                    color: style.shadowColor || 'rgba(0,0,0,0.5)'
                };
            }

            if (isActive && activeConfig?.type === 'wordMotion') {
                const ease = resolveEase(activeConfig.transition);
                const t = ease(progressValue);
                const motion = resolveMotionBetween(inactiveConfig || {}, activeConfig.animate || {}, t, fontSize);
                wordOpacity *= motion.opacity ?? 1;
                wordScaleX = motion.scaleX ?? motion.scale ?? 1;
                wordScaleY = motion.scaleY ?? motion.scale ?? 1;
                wordRotate = motion.rotate ?? 0;
                wordXOffset = (motion.x ?? 0) * canvasScale;
                wordYOffset = (motion.y ?? 0) * canvasScale;
                wordFilter = motion.filter;
                wordSkewX = motion.skewX ?? 0;
                wordSkewY = motion.skewY ?? 0;
                wordLetterSpacing = motion.letterSpacing ?? 0;
                wordTextShadow = motion.textShadow;
                if (motion.rotateX) wordScaleY *= to3dScale(motion.rotateX);
                if (motion.rotateY) wordScaleX *= to3dScale(motion.rotateY);
            } else if (!isActive && inactiveConfig) {
                const motion = resolveMotion(inactiveConfig, 1, fontSize);
                wordOpacity *= motion.opacity ?? 1;
                wordScaleX = motion.scaleX ?? motion.scale ?? 1;
                wordScaleY = motion.scaleY ?? motion.scale ?? 1;
                wordXOffset = (motion.x ?? 0) * canvasScale;
                wordYOffset = (motion.y ?? 0) * canvasScale;
                wordSkewX = motion.skewX ?? 0;
                wordSkewY = motion.skewY ?? 0;
                wordLetterSpacing = motion.letterSpacing ?? 0;
                wordTextShadow = motion.textShadow;
                if (motion.rotateX) wordScaleY *= to3dScale(motion.rotateX);
                if (motion.rotateY) wordScaleX *= to3dScale(motion.rotateY);
            }

            if (!isActive && activeConfig?.type === 'wordDecorToggle' && activeConfig.decor === 'dimOthers') {
                wordOpacity *= activeConfig.inactiveOpacity ?? 0.5;
            }

            const boundWidth = measureTextWithSpacing(ctx, word, wordLetterSpacing);

            ctx.translate(wordXOffset, wordYOffset);
            if (wordRotate) ctx.rotate(wordRotate * Math.PI / 180);
            if (wordSkewX || wordSkewY) {
                ctx.transform(1, Math.tan(toRadians(wordSkewY)), Math.tan(toRadians(wordSkewX)), 1, 0, 0);
            }
            ctx.scale(wordScaleX, wordScaleY);
            ctx.globalAlpha = baseAlpha * wordOpacity;
            if (wordFilter && ctx.filter) ctx.filter = wordFilter;

            // decorations (back)
            if (isActive && activeConfig?.type === 'wordDecorToggle') {
                const decorType = activeConfig.decor;
                const padX = (activeConfig.paddingX ?? 0) * canvasScale * SCALE_FACTOR;
                const padY = (activeConfig.paddingY ?? 0) * canvasScale * SCALE_FACTOR;
                const radius = (activeConfig.radius ?? 4) * canvasScale * SCALE_FACTOR;

                // Animation for decoration entry (for non-moving types)
                const decorT = Easing.spring(progressValue, 350, 25);
                const decorOpacity = (activeConfig.opacity ?? 1) * highlightAlpha * Math.min(1, decorT * 1.5);
                const decorScale = 0.8 + 0.2 * decorT;

                if (decorType === 'underlineStatic' || decorType === 'overlineStatic' || decorType === 'strikeStatic') {
                    const lineHeight = (activeConfig.height ?? 4) * canvasScale * SCALE_FACTOR;
                    const offsetY = (activeConfig.offsetY ?? (decorType === 'underlineStatic' ? 8 : (decorType === 'overlineStatic' ? -10 : 0))) * canvasScale * SCALE_FACTOR;
                    ctx.save();
                    ctx.scale(decorT, 1); // Expand from center
                    ctx.globalAlpha *= decorOpacity;
                    ctx.strokeStyle = highlightColor;
                    ctx.lineWidth = lineHeight;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(-wordWidth / 2, offsetY);
                    ctx.lineTo(wordWidth / 2, offsetY);
                    ctx.stroke();
                    ctx.restore();
                }

                if (decorType === 'brackets') {
                    const gap = (activeConfig.gap ?? 10) * canvasScale * SCALE_FACTOR;
                    const thickness = (activeConfig.thickness ?? 3) * canvasScale * SCALE_FACTOR;
                    const bLen = fontSize * 0.3;
                    ctx.save();
                    ctx.scale(decorScale, decorScale);
                    ctx.globalAlpha *= decorOpacity;
                    ctx.strokeStyle = highlightColor;
                    ctx.lineWidth = thickness;
                    // Left bracket
                    ctx.beginPath();
                    ctx.moveTo(-wordWidth / 2 - gap + bLen, -fontSize / 2);
                    ctx.lineTo(-wordWidth / 2 - gap, -fontSize / 2);
                    ctx.lineTo(-wordWidth / 2 - gap, fontSize / 2);
                    ctx.lineTo(-wordWidth / 2 - gap + bLen, fontSize / 2);
                    ctx.stroke();
                    // Right bracket
                    ctx.beginPath();
                    ctx.moveTo(wordWidth / 2 + gap - bLen, -fontSize / 2);
                    ctx.lineTo(wordWidth / 2 + gap, -fontSize / 2);
                    ctx.lineTo(wordWidth / 2 + gap, fontSize / 2);
                    ctx.lineTo(wordWidth / 2 + gap - bLen, fontSize / 2);
                    ctx.stroke();
                    ctx.restore();
                }

                if (decorType === 'quotes') {
                    const gap = (activeConfig.gap ?? 8) * canvasScale * SCALE_FACTOR;
                    ctx.save();
                    ctx.scale(decorScale, decorScale);
                    ctx.globalAlpha *= decorOpacity;
                    ctx.fillStyle = highlightColor;
                    ctx.font = `italic bold ${fontSize * 0.8}px serif`;
                    ctx.textAlign = 'right';
                    ctx.fillText('"', -wordWidth / 2 - gap, fontSize * 0.2);
                    ctx.textAlign = 'left';
                    ctx.fillText('"', wordWidth / 2 + gap, fontSize * 0.2);
                    ctx.restore();
                }
            }

            const isNeon = (style.effect as string) === 'neon' || (wordTextShadow && wordTextShadow.blur > 15);
            
            if (isNeon && wordTextShadow) {
                const neonShadows: ShadowSpec[] = [
                    { ...wordTextShadow, blur: wordTextShadow.blur * 0.4, color: '#FFFFFF' }, 
                    { ...wordTextShadow, blur: wordTextShadow.blur * 1.0 }, 
                    { ...wordTextShadow, blur: wordTextShadow.blur * 2.5 },
                    { ...wordTextShadow, blur: wordTextShadow.blur * 4.5 },
                ];
                // 1. Draw Shadows only (multiple layers)
                drawMultiLineText(ctx, word, 0, 0, fontSize * 1.2, wordLetterSpacing, 'fill', neonShadows, true);

                
                // 2. Draw Fill
                resetShadow(ctx);
                ctx.fillStyle = style.primaryColor || '#FFFFFF';
                drawTextWithSpacing(ctx, word, 0, 0, wordLetterSpacing, 'fill');

                // 3. Draw Stroke ON TOP
                if (style.strokeWidth) {
                    ctx.strokeStyle = style.strokeColor || '#FFFFFF';
                    ctx.lineWidth = style.strokeWidth * 2 * SCALE_FACTOR;
                    ctx.lineJoin = 'round';
                    drawTextWithSpacing(ctx, word, 0, 0, wordLetterSpacing, 'stroke');
                }
            } else {
                // Non-neon Word Stroke/Outline
                if (style.outlineWidth) {
                    ctx.strokeStyle = style.outlineColor || '#000000';
                    ctx.lineWidth = (style.outlineWidth + (style.strokeWidth || 0)) * 2 * SCALE_FACTOR;
                    ctx.lineJoin = 'round';
                    drawTextWithSpacing(ctx, word, 0, 0, wordLetterSpacing, 'stroke');
                }
                if (style.strokeWidth) {
                    ctx.strokeStyle = style.strokeColor || '#000000';
                    ctx.lineWidth = style.strokeWidth * 2 * SCALE_FACTOR;
                    ctx.lineJoin = 'round';
                    drawTextWithSpacing(ctx, word, 0, 0, wordLetterSpacing, 'stroke');
                }

                ctx.fillStyle = style.primaryColor || '#FFFFFF';
                drawTextWithSpacing(ctx, word, 0, 0, wordLetterSpacing, 'fill');
            }

            
            resetShadow(ctx);
            ctx.restore();
        });

        ctx.restore();
    }
    
    // Cleanup if needed
};
