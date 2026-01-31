/**
 * Subtitle Validation Utilities
 * Detects problems in subtitle cues (too long, too many lines, overlaps, etc.)
 */

import type { SubtitleCue, CueProblem, CueProblemType } from "../jobs/types";

// Validation thresholds
const MAX_LINES = 2;
const MAX_DURATION_SECONDS = 5;
const MAX_CHARS_PER_SECOND = 25; // Reading speed threshold
const MAX_CHARS_PER_LINE = 42; // Approximate for standard 16:9 video

/**
 * Validate a single cue and return detected problems
 */
export function validateCue(cue: SubtitleCue): CueProblem[] {
  const problems: CueProblem[] = [];
  
  // Check line count
  const lineCount = cue.text.split("\n").length;
  if (lineCount > MAX_LINES) {
    problems.push({
      cueId: cue.id,
      type: "too_many_lines",
      message: `${lineCount}줄 (최대 ${MAX_LINES}줄 권장)`,
      autoFixable: true,
    });
  }
  
  // Check duration
  const duration = cue.endTime - cue.startTime;
  if (duration > MAX_DURATION_SECONDS) {
    problems.push({
      cueId: cue.id,
      type: "too_long",
      message: `${duration.toFixed(1)}초 (최대 ${MAX_DURATION_SECONDS}초 권장)`,
      autoFixable: false,
    });
  }
  
  // Check reading speed
  const charCount = cue.text.replace(/\s/g, "").length;
  const charsPerSecond = duration > 0 ? charCount / duration : 0;
  if (charsPerSecond > MAX_CHARS_PER_SECOND) {
    problems.push({
      cueId: cue.id,
      type: "too_fast",
      message: `${charsPerSecond.toFixed(1)}자/초 (${MAX_CHARS_PER_SECOND}자/초 이하 권장)`,
      autoFixable: false,
    });
  }
  
  // Check line width
  const lines = cue.text.split("\n");
  const maxLineLength = Math.max(...lines.map(line => line.length));
  if (maxLineLength > MAX_CHARS_PER_LINE) {
    problems.push({
      cueId: cue.id,
      type: "too_wide",
      message: `${maxLineLength}자 (${MAX_CHARS_PER_LINE}자 이하 권장)`,
      autoFixable: true,
    });
  }
  
  return problems;
}

/**
 * Detect overlapping cues
 */
export function detectOverlaps(cues: SubtitleCue[]): CueProblem[] {
  const problems: CueProblem[] = [];
  const sorted = [...cues].sort((a, b) => a.startTime - b.startTime);
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    if (current.endTime > next.startTime) {
      problems.push({
        cueId: current.id,
        type: "overlap",
        message: `자막 ${next.id}번과 겹침`,
        autoFixable: true,
      });
    }
  }
  
  return problems;
}

/**
 * Validate all cues and return all detected problems
 */
export function validateAllCues(cues: SubtitleCue[]): CueProblem[] {
  const problems: CueProblem[] = [];
  
  // Individual cue validation
  for (const cue of cues) {
    if (!cue.ignoreProblems) {
      problems.push(...validateCue(cue));
    }
  }
  
  // Overlap detection
  problems.push(...detectOverlaps(cues));
  
  return problems;
}

/**
 * Get summary of problems by type
 */
export function getProblemSummary(problems: CueProblem[]): Record<CueProblemType, number> {
  const summary: Record<CueProblemType, number> = {
    too_many_lines: 0,
    too_long: 0,
    too_fast: 0,
    overlap: 0,
    too_wide: 0,
  };
  
  for (const problem of problems) {
    summary[problem.type]++;
  }
  
  return summary;
}

/**
 * Auto-fix: wrap long lines
 */
export function autoWrapLines(text: string, maxChars: number = MAX_CHARS_PER_LINE): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  // Limit to MAX_LINES
  return lines.slice(0, MAX_LINES).join("\n");
}

/**
 * Auto-fix: resolve overlap by adjusting end time
 */
export function fixOverlap(current: SubtitleCue, next: SubtitleCue): SubtitleCue {
  if (current.endTime > next.startTime) {
    return {
      ...current,
      endTime: next.startTime - 0.001, // 1ms gap
    };
  }
  return current;
}

/**
 * Calculate reading statistics for a cue
 */
export function getCueStats(cue: SubtitleCue): {
  charCount: number;
  lineCount: number;
  duration: number;
  charsPerSecond: number;
} {
  const charCount = cue.text.replace(/\s/g, "").length;
  const lineCount = cue.text.split("\n").length;
  const duration = cue.endTime - cue.startTime;
  const charsPerSecond = duration > 0 ? charCount / duration : 0;
  
  return { charCount, lineCount, duration, charsPerSecond };
}
