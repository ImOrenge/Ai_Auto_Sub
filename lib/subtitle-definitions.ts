
 /**
 * Subtitle Effect Definitions
 * Based on user-provided JSON schema for "caption-presets-v1"
 */

export type AnimationProps = {
  opacity?: number | number[];
  scale?: number | number[];
  scaleX?: number | number[];
  scaleY?: number | number[];
  x?: number | number[];
  y?: number | number[];
  rotate?: number | number[];
  rotateX?: string | string[];
  rotateY?: string | string[];
  skewX?: string | string[];
  skewY?: string | string[];
  letterSpacing?: string | string[];
  filter?: string | string[];
  textShadow?: string | string[];
  clipPath?: string;
};

export type TransitionProps = {
  duration?: number;
  ease?: string;
  type?: "spring" | "tween" | "inertia" | "just" | "keyframes";
  stiffness?: number;
  damping?: number;
  mass?: number;
  delay?: number;
};

export type MotionConfig = {
  type: "lineMotion" | "wordMotion";
  initial?: AnimationProps;
  animate?: AnimationProps; // Used for line entry or word active
  inactive?: AnimationProps; // Used for word inactive
  exit?: AnimationProps;
  transition?: TransitionProps;
  // Specific for some effects
  filter?: string; 
};

export type LineClipRevealConfig = {
  type: "lineClipReveal";
  direction: "ltr" | "rtl" | "btt" | "ttb";
  duration: number;
};

export type WordProgressFillConfig = {
  type: "wordProgressFill";
  direction: "ltr" | "rtl" | "center" | "btt";
  mode: "clipInset";
};

export type WordProgressDecorConfig = {
  type: "wordProgressDecor";
  decor: "underline" | "overline" | "strike" | "marker" | "boxFill" | "shimmerText";
  height?: number;
  heightEm?: number;
  radius?: number;
  offsetY?: number;
  paddingX?: number;
  paddingY?: number;
  opacity?: number;
  bandWidth?: number;
};

export type WordDecorToggleConfig = {
  type: "wordDecorToggle";
  decor: "pillBehind" | "boxBehind" | "halo" | "brackets" | "quotes" | "caretDown" | "arrowLeft" | "tape" | "shadowPop" | "outline" | "underlineStatic" | "overlineStatic" | "strikeStatic" | "backdropBlurChip" | "dimOthers";
  paddingX?: number;
  paddingY?: number;
  radius?: number;
  opacity?: number;
  gap?: number;
  thickness?: number;
  size?: number;
  offsetY?: number;
  pattern?: string;
  strokeWidth?: number;
  blurPx?: number;
  inactiveOpacity?: number; // for dimOthers
  height?: number;
};

export type EffectPreset = {
  id: string;
  name: string;
  scope: "line" | "word";
  entry?: MotionConfig | LineClipRevealConfig; // For lines
  exit?: MotionConfig | LineClipRevealConfig; // For lines
  active?: MotionConfig | WordProgressFillConfig | WordProgressDecorConfig | WordDecorToggleConfig;  // For words
  inactive?: AnimationProps; // For words (idle state)
  tier?: "basic" | "premium" | "cinematic";
};

export const CAPTION_PRESETS: EffectPreset[] = [
    /* -------------------- LINE ENTRY/EXIT (15) -------------------- */
    { id: "line_fade_up", name: "Line Fade Up", scope: "line", tier: "basic", entry: { type: "lineMotion", initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, y: 14 }, transition: { duration: 0.35 } } },
    { id: "line_fade_down", name: "Line Fade Down", scope: "line", tier: "basic", entry: { type: "lineMotion", initial: { opacity: 0, y: -14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, y: -14 }, transition: { duration: 0.35 } } },
    { id: "line_slide_left", name: "Line Slide From Left", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, x: -28 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.45, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, x: -28 }, transition: { duration: 0.35 } } },
    { id: "line_slide_right", name: "Line Slide From Right", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.45, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, x: 28 }, transition: { duration: 0.35 } } },
    { id: "line_zoom_in", name: "Line Zoom In", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.45, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, scale: 0.94 }, transition: { duration: 0.35 } } },
    { id: "line_blur_in", name: "Line Blur In", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, y: 10, filter: "blur(12px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: 0.55, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, y: 10, filter: "blur(12px)" }, transition: { duration: 0.35 } } },
    { id: "line_wipe_ltr", name: "Line Wipe LTR", scope: "line", tier: "cinematic", entry: { type: "lineClipReveal", direction: "ltr", duration: 0.5 }, exit: { type: "lineClipReveal", direction: "rtl", duration: 0.35 } },
    { id: "line_wipe_btt", name: "Line Wipe Bottom-Up", scope: "line", tier: "cinematic", entry: { type: "lineClipReveal", direction: "btt", duration: 0.5 }, exit: { type: "lineClipReveal", direction: "ttb", duration: 0.35 } },
    { id: "line_skew_in", name: "Line Skew In", scope: "line", tier: "cinematic", entry: { type: "lineMotion", initial: { opacity: 0, y: 10, skewX: "-12deg" }, animate: { opacity: 1, y: 0, skewX: "0deg" }, transition: { duration: 0.5, ease: "circOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, y: 10, skewX: "-10deg" }, transition: { duration: 0.35 } } },
    { id: "line_flip_hint", name: "Line Flip Hint", scope: "line", tier: "cinematic", entry: { type: "lineMotion", initial: { opacity: 0, rotateX: "24deg", y: 10 }, animate: { opacity: 1, rotateX: "0deg", y: 0 }, transition: { duration: 0.6, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, rotateX: "12deg", y: 8 }, transition: { duration: 0.35 } } },
    { id: "line_drop_spring", name: "Line Drop Spring", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, y: -24 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 280, damping: 30, mass: 1 } }, exit: { type: "lineMotion", animate: { opacity: 0, y: -12 }, transition: { duration: 0.35 } } },
    { id: "line_bounce_in", name: "Line Bounce In", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, scale: 0.85, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { type: "spring", stiffness: 350, damping: 28, mass: 1.2 } }, exit: { type: "lineMotion", animate: { opacity: 0, scale: 0.96, y: 8 }, transition: { duration: 0.35 } } },
    { id: "line_tracking_in", name: "Line Tracking In", scope: "line", tier: "premium", entry: { type: "lineMotion", initial: { opacity: 0, letterSpacing: "0.2em" }, animate: { opacity: 1, letterSpacing: "0em" }, transition: { duration: 0.6, ease: "easeOut" } }, exit: { type: "lineMotion", animate: { opacity: 0, letterSpacing: "0.10em" }, transition: { duration: 0.35 } } },
    { id: "line_cut_in", name: "Line Cut In", scope: "line", tier: "basic", entry: { type: "lineMotion", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.1 } }, exit: { type: "lineMotion", animate: { opacity: 0 }, transition: { duration: 0.1 } } },

    /* -------------------- WORD MOTION (20) -------------------- */
    { id: "word_pop_soft", name: "Word Pop Soft", scope: "word", tier: "basic", active: { type: "wordMotion", animate: { scale: 1.15, y: -3, opacity: 1 }, transition: { type: "spring", stiffness: 320, damping: 24, mass: 0.8 } }, inactive: { opacity: 0.75, scale: 1, y: 0 } },
    { id: "word_pop_hard", name: "Word Pop Hard", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { scale: 1.25, y: -5, opacity: 1 }, transition: { type: "spring", stiffness: 450, damping: 28, mass: 0.9 } }, inactive: { opacity: 0.72, scale: 1, y: 0 } },
    { id: "word_pulse", name: "Word Pulse", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { scale: [1, 1.15, 1] }, transition: { duration: 0.4, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_squash", name: "Word Squash", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { scaleX: [1, 1.25, 1], scaleY: [1, 0.85, 1] }, transition: { duration: 0.4, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_hop", name: "Word Hop", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { y: [0, -8, -3, 0] }, transition: { duration: 0.5, ease: "easeOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_wiggle", name: "Word Wiggle", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { rotate: [0, -3, 3, -1, 0] }, transition: { duration: 0.45, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_swing", name: "Word Swing", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { rotate: [0, 5, -4, 2, 0] }, transition: { duration: 0.55, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_skew_kick", name: "Word Skew Kick", scope: "word", tier: "cinematic", active: { type: "wordMotion", animate: { skewX: ["0deg", "-12deg", "0deg"], skewY: ["0deg", "5deg", "0deg"] }, transition: { duration: 0.4, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_flip_hint", name: "Word Flip Hint", scope: "word", tier: "cinematic", active: { type: "wordMotion", animate: { rotateY: ["0deg", "24deg", "0deg"], scale: [1, 1.05, 1] }, transition: { duration: 0.45, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_tilt", name: "Word Tilt", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { rotate: [-2, 3, 0], y: [-2, -4, 0] }, transition: { duration: 0.4, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_float", name: "Word Float", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { y: [-2, -6, -2] }, transition: { duration: 0.8, ease: "easeInOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_slam", name: "Word Slam", scope: "word", tier: "cinematic", active: { type: "wordMotion", animate: { scale: [1.4, 1], y: [-4, 0] }, transition: { duration: 0.3, ease: "circOut" } }, inactive: { opacity: 0.76 } },
    { id: "word_rubber", name: "Word Rubber", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { scaleX: [1, 1.25, 0.9, 1.05, 1], scaleY: [1, 0.8, 1.1, 0.95, 1] }, transition: { duration: 0.6, ease: "easeOut" } }, inactive: { opacity: 0.78 } },
    { id: "word_shake_x", name: "Word Shake X", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { x: [0, -2, 2, -2, 0] }, transition: { duration: 0.35 } }, inactive: { opacity: 0.78 } },
    { id: "word_shake_y", name: "Word Shake Y", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { y: [0, -2, 2, -2, 0] }, transition: { duration: 0.35 } }, inactive: { opacity: 0.78 } },
    { id: "word_jitter", name: "Word Jitter", scope: "word", tier: "cinematic", active: { type: "wordMotion", animate: { x: [0, -1, 1, -1, 1, 0], y: [0, 1, -1, 1, -1, 0] }, transition: { duration: 0.4 } }, inactive: { opacity: 0.78 } },
    { id: "word_blur_snap", name: "Word Blur Snap", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { filter: ["blur(8px)", "blur(0px)"], opacity: [0.6, 1] }, transition: { duration: 0.3, ease: "easeOut" } }, inactive: { opacity: 0.75 } },
    { id: "word_glow_pulse", name: "Word Glow Pulse", scope: "word", tier: "cinematic", active: { type: "wordMotion", animate: { textShadow: ["0 0 0 rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.7)", "0 0 0 rgba(255,255,255,0)"] }, transition: { duration: 0.5 } }, inactive: { opacity: 0.78 } },
    { id: "word_opacity_punch", name: "Word Opacity Punch", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { opacity: [0.6, 1] }, transition: { duration: 0.25 } }, inactive: { opacity: 0.70 } },
    { id: "word_tracking_tighten", name: "Word Tracking Tighten", scope: "word", tier: "premium", active: { type: "wordMotion", animate: { letterSpacing: ["0.08em", "0em"] }, transition: { duration: 0.35 } }, inactive: { opacity: 0.78 } },

    /* -------------------- WORD PROGRESS (10) -------------------- */
    { id: "prog_fill_ltr", name: "Karaoke Fill LTR", scope: "word", tier: "premium", active: { type: "wordProgressFill", direction: "ltr", mode: "clipInset" } },
    { id: "prog_fill_rtl", name: "Karaoke Fill RTL", scope: "word", tier: "premium", active: { type: "wordProgressFill", direction: "rtl", mode: "clipInset" } },
    { id: "prog_fill_center", name: "Karaoke Fill Center-Out", scope: "word", tier: "premium", active: { type: "wordProgressFill", direction: "center", mode: "clipInset" } },
    { id: "prog_fill_btt", name: "Karaoke Fill Bottom-Up", scope: "word", tier: "premium", active: { type: "wordProgressFill", direction: "btt", mode: "clipInset" } },
    { id: "prog_underline", name: "Underline Progress", scope: "word", tier: "premium", active: { type: "wordProgressDecor", decor: "underline", height: 4, radius: 999, offsetY: 8 } },
    { id: "prog_overline", name: "Overline Progress", scope: "word", tier: "premium", active: { type: "wordProgressDecor", decor: "overline", height: 4, radius: 999, offsetY: -10 } },
    { id: "prog_strike", name: "Strike Progress", scope: "word", tier: "premium", active: { type: "wordProgressDecor", decor: "strike", height: 4, radius: 999, offsetY: 0 } },
    { id: "prog_marker", name: "Marker Swipe", scope: "word", tier: "premium", active: { type: "wordProgressDecor", decor: "marker", heightEm: 0.6, radius: 12, opacity: 0.65 } },
    { id: "prog_box_fill", name: "Box Fill Progress", scope: "word", tier: "premium", active: { type: "wordProgressDecor", decor: "boxFill", paddingX: 12, paddingY: 6, radius: 10, opacity: 0.55 } },
    { id: "prog_shimmer", name: "Text Shimmer Sweep", scope: "word", tier: "cinematic", active: { type: "wordProgressDecor", decor: "shimmerText", bandWidth: 0.30 } },

    /* -------------------- WORD DECOR TOGGLE (15) -------------------- */
    { id: "decor_pill", name: "Pill Behind", scope: "word", tier: "premium", active: { type: "wordDecorToggle", decor: "pillBehind", paddingX: 14, paddingY: 6, radius: 999, opacity: 0.55 } },
    { id: "decor_box", name: "Box Behind", scope: "word", tier: "premium", active: { type: "wordDecorToggle", decor: "boxBehind", paddingX: 12, paddingY: 6, radius: 10, opacity: 0.55 } },
    { id: "decor_halo", name: "Halo", scope: "word", tier: "cinematic", active: { type: "wordDecorToggle", decor: "halo", paddingX: 18, paddingY: 10, radius: 999, opacity: 0.35 } },
    { id: "decor_brackets", name: "Brackets", scope: "word", tier: "cinematic", active: { type: "wordDecorToggle", decor: "brackets", gap: 10, thickness: 3, opacity: 0.9 } },
    { id: "decor_quotes", name: "Quotes", scope: "word", tier: "cinematic", active: { type: "wordDecorToggle", decor: "quotes", gap: 8, opacity: 0.9 } },
    { id: "decor_caret", name: "Caret Indicator", scope: "word", tier: "premium", active: { type: "wordDecorToggle", decor: "caretDown", size: 10, offsetY: 16, opacity: 0.9 } },
    { id: "decor_arrow", name: "Arrow Pointer", scope: "word", tier: "premium", active: { type: "wordDecorToggle", decor: "arrowLeft", size: 12, gap: 8, opacity: 0.9 } },
    { id: "decor_tape", name: "Highlight Tape", scope: "word", tier: "cinematic", active: { type: "wordDecorToggle", decor: "tape", paddingX: 14, paddingY: 6, radius: 8, opacity: 0.5, pattern: "diagonal" } },
    { id: "decor_shadow_pop", name: "Shadow Pop", scope: "word", tier: "cinematic", active: { type: "wordDecorToggle", decor: "shadowPop", opacity: 1 } },
    { id: "decor_outline_toggle", name: "Outline Toggle", scope: "word", tier: "premium", active: { type: "wordDecorToggle", decor: "outline", strokeWidth: 6, opacity: 1 } },
    { id: "decor_under_static", name: "Underline Static", scope: "word", tier: "basic", active: { type: "wordDecorToggle", decor: "underlineStatic", height: 4, radius: 999, offsetY: 8, opacity: 0.9 } },
    { id: "decor_over_static", name: "Overline Static", scope: "word", tier: "basic", active: { type: "wordDecorToggle", decor: "overlineStatic", height: 4, radius: 999, offsetY: -10, opacity: 0.9 } },
    { id: "decor_strike_static", name: "Strike Static", scope: "word", tier: "basic", active: { type: "wordDecorToggle", decor: "strikeStatic", height: 4, radius: 999, offsetY: 0, opacity: 0.9 } },
    { id: "decor_backdrop_blur", name: "Backdrop Blur Chip", scope: "word", tier: "cinematic", active: { type: "wordDecorToggle", decor: "backdropBlurChip", paddingX: 14, paddingY: 6, radius: 999, blurPx: 10, opacity: 0.45 } },
    { id: "decor_focus_dim_others", name: "Focus Dim Others (Line)", scope: "line", tier: "premium", active: { type: "wordDecorToggle", decor: "dimOthers", inactiveOpacity: 0.55 } },

    /* -------------------- LEGACY ALIASES / COMMON (5) -------------------- */
    { id: "fade", name: "Fade", scope: "line", entry: { type: "lineMotion", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }, exit: { type: "lineMotion", animate: { opacity: 0 }, transition: { duration: 0.3 } } },
    { id: "pop-in", name: "Pop In", scope: "word", active: { type: "wordMotion", animate: { scale: 1.2, opacity: 1 }, transition: { type: "spring", stiffness: 400, damping: 20 } }, inactive: { opacity: 0.8, scale: 1 } },
    { id: "highlight", name: "Highlight", scope: "word", active: { type: "wordDecorToggle", decor: "pillBehind", paddingX: 10, paddingY: 4, radius: 8, opacity: 1 } },
    { id: "typewriter", name: "Typewriter", scope: "line" }, // Handled specially in renderer
    { id: "karaoke", name: "Karaoke", scope: "word", active: { type: "wordProgressFill", direction: "ltr", mode: "clipInset" } }
];

export const LEGACY_EFFECT_MAPPING: Record<string, string> = {
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

export function resolvePresetId(effectName: string | undefined): string {
    const rawEffect = effectName || 'none';
    return LEGACY_EFFECT_MAPPING[rawEffect] || rawEffect;
}

export function getEffectPreset(id: string): EffectPreset | undefined {
  const resolvedId = resolvePresetId(id);
  return CAPTION_PRESETS.find(p => p.id === resolvedId);
}

// Helper to get all effect IDs
export const ALL_EFFECT_IDS = CAPTION_PRESETS.map(p => p.id);
