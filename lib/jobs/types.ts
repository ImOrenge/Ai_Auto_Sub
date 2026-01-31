import type { UsageLedgerItem } from "../billing/types";

/**
 * 소스 타입 분류
 * 파이프라인에서 로컬 업로드인지 외부 URL인지 구분
 */
export const SOURCE_TYPES = ["url", "upload", "youtube", "sequence"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * URL에서 소스 타입을 자동 분류
 */
export function classifySourceType(url: string): SourceType {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    
    // YouTube URL 체크
    if (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.endsWith("youtube-nocookie.com")
    ) {
      return "youtube";
    }
    
    // Supabase Storage URL 체크 (로컬 업로드)
    if (
      host.includes("supabase.co") ||
      host.includes("supabase.in") ||
      parsed.pathname.includes("/storage/")
    ) {
      return "upload";
    }
    
    // 기타 외부 URL
    return "url";
  } catch {
    // URL 파싱 실패 시 기본값
    return "url";
  }
}

/**
 * 지원 언어 목록
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ไทย' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

/**
 * 언어 설정 타입
 */
export type LanguageConfig = {
  /** 원본 언어 코드 */
  sourceLanguage: LanguageCode;
  /** 번역 대상 언어 코드 */
  targetLanguage: LanguageCode;
  /** 이중 자막 표시 여부 */
  showBilingual: boolean;
};

export const DEFAULT_LANGUAGE_CONFIG: LanguageConfig = {
  sourceLanguage: 'ko',
  targetLanguage: 'en',
  showBilingual: false,
};

/**
 * Video Crop Area (percentages 0-100)
 */
export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * 자막 효과 타입
 */
export const SUBTITLE_EFFECTS = [
  'none', 
  'fade', 
  'typewriter', 
  'highlight', 
  'karaoke', 
  'pop-in',
  'neon',

  // Active Word Effects
  'color-flip',
  'glow',
  'pill-follow',
  'underline',
  'marker',
  // Block Entry Effects
  'blur',
  'wipe',
  'stagger',
  // Special
  'shake',
  'impact',
  // New JSON-based Effects - Line Entry/Exit
  'line_fade_up', 'line_fade_down', 'line_slide_left', 'line_slide_right', 'line_zoom_in', 
  'line_blur_in', 'line_wipe_ltr', 'line_wipe_btt', 'line_skew_in', 'line_flip_hint', 
  'line_drop_spring', 'line_bounce_in', 'line_tracking_in', 'line_cut_in',
  // Word Motion
  'word_pop_soft', 'word_pop_hard', 'word_pulse', 'word_squash', 'word_hop', 'word_wiggle', 
  'word_swing', 'word_skew_kick', 'word_flip_hint', 'word_tilt', 'word_float', 'word_slam', 
  'word_rubber', 'word_shake_x', 'word_shake_y', 'word_jitter', 'word_blur_snap', 
  'word_glow_pulse', 'word_opacity_punch', 'word_tracking_tighten',
  // Word Progress
  'prog_fill_ltr', 'prog_fill_rtl', 'prog_fill_center', 'prog_fill_btt', 'prog_underline', 
  'prog_overline', 'prog_strike', 'prog_marker', 'prog_box_fill', 'prog_shimmer',
  // Word Decor Toggle
  'decor_pill', 'decor_box', 'decor_halo', 'decor_brackets', 'decor_quotes', 'decor_caret', 
  'decor_arrow', 'decor_tape', 'decor_shadow_pop', 'decor_outline_toggle', 'decor_under_static', 
  'decor_over_static', 'decor_strike_static', 'decor_backdrop_blur', 'decor_focus_dim_others'
] as const;
export type SubtitleEffect = typeof SUBTITLE_EFFECTS[number];

/**
 * 재생 속도 옵션
 */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number];

/**
 * 자막 스타일 설정 타입
 * FFmpeg 자막 합성 시 적용되는 커스텀 스타일 옵션
 */
export type SubtitleConfig = {
  /** 폰트 이름 (예: 'Arial', 'NanumGothic') */
  fontName: string;
  /** 폰트 크기 (pt 단위) */
  fontSize: number;
  /** 글자 굵기 (예: 'normal', 'bold', '700') */
  fontWeight?: string;
  /** 글자 색상 (hex 형식, 예: '#FFFFFF') */
  primaryColor: string;
  /** 외곽선 색상 */
  outlineColor: string;
  /** 배경 색상 (투명도 포함 가능) */
  backgroundColor: string;
  /** 외곽선 두께 */
  outlineWidth: number;
  /** 자막 위치: 'top' | 'center' | 'bottom' */
  position: 'top' | 'center' | 'bottom';
  /** 이중 자막 (원어+번역) 표시 여부 */
  showBilingual: boolean;
  /** 마진 (px 단위) */
  marginV: number;
  /** 자막 효과 */
  effect?: SubtitleEffect;
  /** 애니메이션 설정 */
  animation?: {
    fadeIn?: number;  // ms
    fadeOut?: number; // ms
  };
  /** Video crop area */
  cropArea?: CropArea | null;
  /** Highlight padding (px) */
  highlightPadding?: number;
  /** Highlight gap (px) */
  highlightGap?: number;
  /** Highlight color (hex) */
  highlightColor?: string;
  /** Highlight opacity (0-1) */
  highlightOpacity?: number;
  /** Text shadow settings */
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  /** Text stroke width (px) */
  strokeWidth?: number;
  /** Text stroke color */
  strokeColor?: string;
  /** Display mode: 'standard' (multiple lines) or 'single-word' */
  displayMode?: 'standard' | 'single-word';
  /** Remotion specific: video fit */
  videoFit?: 'contain' | 'cover';
  /** Remotion specific: aspect ratio */
  videoAspectRatio?: 'original' | '9:16' | '1:1' | '16:9';
};

// --- Pipeline Component Types ---

export interface DownloadedAudio {
  audioFile: string;
  durationMs: number;
  sourceUrl: string;
  sizeBytes: number;
  mimeType: string | null;
  filename: string | null;
  tempDir: string;
  metadata?: Record<string, unknown>;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: {
    word: string;
    start: number;
    end: number;
  }[];
}

export interface TranscriptionResult {
  language: string;
  segments: TranscriptSegment[];
}

export interface SubtitleResult {
  fileName: string;
  content: string;
}

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

export interface CaptionedVideoResult {
  sourceUrl: string;
  subtitlesFile: string;
  publicUrl: string | null;
  storagePath: string | null;
}

/** 기본 자막 스타일 설정 */
export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  fontName: 'Arial',
  fontSize: 24,
  fontWeight: 'normal',
  primaryColor: '#FFFFFF',
  outlineColor: '#000000',
  backgroundColor: '#00000080',
  outlineWidth: 2,
  position: 'bottom',
  showBilingual: false,
  marginV: 100,
  effect: 'none',
  highlightPadding: 10,
  highlightGap: 16, // Increased default gap to prevent scale overlap
  highlightColor: '#FFFFFF',
  highlightOpacity: 0.25,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  strokeWidth: 0,
  strokeColor: '#000000',
  displayMode: 'standard',
};

// ============================================================================
// Subtitle Editor Types
// ============================================================================

/**
 * Word timing for granular highlighting
 */
export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

/**
 * Individual subtitle cue (entry)
 * Represents a single subtitle line with timing and optional style override
 */
export type SubtitleCue = {
  /** Unique identifier within the caption set */
  id: number;
  /** Layer identifier this cue belongs to (for uniqueness) */
  layerId?: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Subtitle text (may contain line breaks) */
  text: string;
  /** Original text for bilingual display */
  originalText?: string;
  /** Per-cue style override (merged with default) */
  styleOverride?: Partial<SubtitleConfig>;
  /** Word-level timing data for granular effects */
  words?: WordTiming[];
  /** Whether this cue's problems are ignored by user */
  ignoreProblems?: boolean;
};

/**
 * Complete caption data structure
 * Stored in caption_source and caption_edit columns
 */
export type CaptionData = {
  /** Schema version for future migrations */
  version: 1;
  /** Array of subtitle cues */
  cues: SubtitleCue[];
  /** Default style applied to all cues */
  defaultStyle: SubtitleConfig;
  /** Language configuration */
  language?: LanguageConfig;
  /** Video aspect ratio */
  videoAspectRatio?: 'original' | '9:16' | '1:1' | '16:9';
  /** Video fit mode */
  videoFit?: 'contain' | 'cover';
  /** Global playback speed */
  playbackSpeed?: PlaybackSpeed;
};

/**
 * Saved style preset
 */
export type StylePreset = {
  id: string;
  userId: string;
  name: string;
  config: SubtitleConfig;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Problem types detected in cues
 */
export type CueProblemType = 
  | 'too_many_lines'    // > 2 lines
  | 'too_long'          // > 5 seconds duration
  | 'too_fast'          // Reading speed exceeds threshold
  | 'overlap'           // Overlaps with another cue
  | 'too_wide';         // May exceed screen width

/**
 * Detected problem in a cue
 */
export type CueProblem = {
  cueId: number;
  type: CueProblemType;
  message: string;
  autoFixable: boolean;
};

/** 
 * Represents a video segment to KEEP
 */
export type VideoCut = {
  id: string;
  start: number;
  end: number;
};

/**
 * Represents a clip in a sequence
 */
export type SequenceClip = {
  id: string;
  assetId: string;
  /** Start time within the asset (seconds) */
  startTime: number;
  /** End time within the asset (seconds) */
  endTime: number;
  /** Order in the sequence */
  order: number;
  /** Playback speed multiplier (default: 1) */
  speed?: PlaybackSpeed;
};

/**
 * Represents a single layer (timeline) in a sequence
 */
export type SequenceLayerType = 'video' | 'audio' | 'caption';

export type SequenceLayer = {
  id: string;
  name: string;
  type: SequenceLayerType;
  clips: SequenceClip[];
  /** Layer-specific caption data (if different from global) */
  captionEdit?: CaptionData | null;
  /** Whether this layer is currently visible/active */
  isVisible?: boolean;
};

/**
 * Root structure for multi-layer sequences
 */
export type SequenceData = {
  version: 2;
  activeLayerId: string;
  layers: SequenceLayer[];
};


export const JOB_STATUSES = [
  "pending",
  "uploading",       // 1. Supabase Uploads
  "preprocessing",   // 2. FFmpeg 전처리 (자막 스타일 설정)
  "downloading",
  "processing",
  "stt",             // 3. Whisper STT
  "translating",     // 4. 영한 번역
  "subtitle",
  "compositing",     // 5. SRT 자막 합성
  "awaiting_edit",   // 6. 편집 대기 (Editor 진입 전)
  "editing",         // 7. 편집 중
  "ready_to_export", // 8. 내보내기 준비 완료
  "exporting",       // 9. 내보내기 중
  "done",
  "error",
  "canceled",        // 사용자 취소
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STEPS = ["upload", "prepare", "download", "transcribe", "translate", "subtitle", "deliver"] as const;
export type JobStep = (typeof JOB_STEPS)[number];

export type JobRecord = {
  id: string;
  userId: string | null;
  projectId?: string | null;
  assetId?: string | null;
  asset?: { 
    filename: string;
    storageKey?: string;
    signedUrl?: string;
    thumbnailUrl?: string;
    sourceUrl?: string;
  } | null;
  queueId?: string | null;
  url: string;
  sourceType: SourceType;
  status: JobStatus;
  step: JobStep | string | null;
  progress: number;
  resultSrtUrl: string | null;
  resultVideoUrl: string | null;
  errorMessage: string | null;
  subtitleConfig: SubtitleConfig | null;
  /** Original caption data from STT/translation pipeline */
  captionSource: CaptionData | null;
  /** User-edited caption data */
  captionEdit: CaptionData | null;
  /** Timestamp of last edit */
  editedAt: string | null;
  /** Video segments to KEEP (defaults to one segment for the whole video) */
  cuts: VideoCut[] | null;
  /** Sequence of multiple asset clips (replaces assetId for multi-source) */
  sequence: SequenceClip[] | SequenceData | null;
  createdAt: string;
  updatedAt: string;
  
  // Cost & Usage Snapshot (Updated for Pricing Model)
  cost?: number; // Total billed amount for this job
  usageLogs?: UsageLedgerItem[]; // Detailed usage records
  usageMetrics?: {
    sttMinutes: number;
    translationLanguages: number;
  };
};

export type JobCreateInput = {
  url: string;
  userId?: string | null;
  projectId?: string | null;
  assetId?: string | null;
  sourceType?: SourceType;
  subtitleConfig?: SubtitleConfig | null;
};

export type JobUpdateInput = {
  status?: JobStatus;
  step?: JobStep | string | null;
  progress?: number | null;
  resultSrtUrl?: string | null;
  resultVideoUrl?: string | null;
  errorMessage?: string | null;
  sourceType?: SourceType;
  subtitleConfig?: SubtitleConfig | null;
  captionSource?: CaptionData | null;
  captionEdit?: CaptionData | null;
  editedAt?: string | null;
  cuts?: VideoCut[] | null;
  sequence?: SequenceClip[] | SequenceData | null;
  cost?: number;
};
export type PresetTemplate = {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  config: Partial<SubtitleConfig>;
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "youtuber",
    name: "Standard YouTuber",
    description: "높은 가독성, 두꺼운 외곽선",
    previewColor: "#FFFF00",
    config: {
      fontName: "NanumGothic",
      fontSize: 24,
      fontWeight: "bold",
      primaryColor: "#FFFF00",
      outlineColor: "#000000",
      outlineWidth: 3,
      backgroundColor: "transparent",
      shadowBlur: 0,
      effect: "none",
      displayMode: "standard",
      position: "bottom",
    },
  },
  {
    id: "shorts",
    name: "Viral Shorts",
    description: "싱글 워드, 팝인 효과",
    previewColor: "#00FF00",
    config: {
      fontName: "Impact",
      fontSize: 48,
      fontWeight: "900",
      primaryColor: "#FFFFFF",
      strokeColor: "#000000",
      strokeWidth: 4,
      outlineWidth: 0,
      backgroundColor: "transparent",
      shadowColor: "rgba(0,0,0,0.8)",
      shadowOffsetY: 10,
      shadowBlur: 20,
      effect: "pop-in",
      displayMode: "single-word",
      position: "center",
      highlightColor: "#FFFF00",
    },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "영화 자막 스타일",
    previewColor: "#FFFFFF",
    config: {
      fontName: "Noto Sans KR",
      fontSize: 18,
      fontWeight: "normal",
      primaryColor: "#FFFFFF",
      outlineWidth: 0,
      backgroundColor: "transparent",
      shadowColor: "rgba(0,0,0,0.8)",
      shadowBlur: 2,
      shadowOffsetY: 1,
      effect: "fade",
      displayMode: "standard",
      position: "bottom",
      marginV: 40,
    },
  },
  {
    id: "cute",
    name: "Cute Vlog",
    description: "부드러운 색상, 귀여운 느낌",
    previewColor: "#FF99CC",
    config: {
      fontName: "NanumBarunGothic",
      fontSize: 28,
      fontWeight: "bold",
      primaryColor: "#FFFFFF",
      outlineColor: "#FF99CC",
      outlineWidth: 4,
      backgroundColor: "transparent",
      shadowColor: "#FF66AA",
      shadowOffsetY: 4,
      shadowBlur: 0,
      effect: "highlight",
      highlightColor: "#FFDDEE",
      highlightOpacity: 1,
      highlightPadding: 8,
      displayMode: "standard",
      position: "bottom",
    },
  },
  {
    id: "neon",
    name: "Neon Night",
    description: "글로우 효과, 사이버펑크",
    previewColor: "#00FFFF",
    config: {
      fontName: "Anton",
      fontSize: 32,
      fontWeight: "normal",
      primaryColor: "#00FFFF",
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
      outlineWidth: 0,
      backgroundColor: "transparent",
      shadowColor: "#00FFFF",
      shadowBlur: 20,
      shadowOffsetY: 0,
      effect: "typewriter",
      displayMode: "standard",
      position: "bottom",
    },
  },
];
