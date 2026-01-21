import type { UsageLedgerItem } from "@/lib/billing/types";

/**
 * 소스 타입 분류
 * 파이프라인에서 로컬 업로드인지 외부 URL인지 구분
 */
export const SOURCE_TYPES = ["url", "upload", "youtube"] as const;
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
 * 자막 스타일 설정 타입
 * FFmpeg 자막 합성 시 적용되는 커스텀 스타일 옵션
 */
export type SubtitleConfig = {
  /** 폰트 이름 (예: 'Arial', 'NanumGothic') */
  fontName: string;
  /** 폰트 크기 (pt 단위) */
  fontSize: number;
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
};

/** 기본 자막 스타일 설정 */
export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  fontName: 'Arial',
  fontSize: 24,
  primaryColor: '#FFFFFF',
  outlineColor: '#000000',
  backgroundColor: '#00000080',
  outlineWidth: 2,
  position: 'bottom',
  showBilingual: false,
  marginV: 20,
};

// ============================================================================
// Subtitle Editor Types
// ============================================================================

/**
 * Individual subtitle cue (entry)
 * Represents a single subtitle line with timing and optional style override
 */
export type SubtitleCue = {
  /** Unique identifier within the caption set */
  id: number;
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
  cost?: number;
};
