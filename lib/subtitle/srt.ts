/**
 * SRT Parsing and Generation Utilities
 * Handles conversion between SRT format and SubtitleCue objects
 */

import type { SubtitleCue } from "@/lib/jobs/types";

/**
 * Parse SRT content into an array of SubtitleCue objects
 * 
 * SRT Format:
 * 1
 * 00:00:00,000 --> 00:00:02,500
 * First subtitle line
 * Second line (optional)
 * 
 * 2
 * 00:00:03,000 --> 00:00:05,000
 * Next subtitle
 */
export function parseSrt(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  
  // Normalize line endings and split into blocks
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\n+/).filter(block => block.trim());
  
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;
    
    // First line should be the cue number (may have BOM on first cue)
    const indexLine = lines[0].replace(/^\uFEFF/, "").trim();
    const id = parseInt(indexLine, 10);
    if (Number.isNaN(id)) continue;
    
    // Second line should be the timecode
    const timecodeMatch = lines[1].match(
      /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!timecodeMatch) continue;
    
    const startTime = parseTimestamp(
      timecodeMatch[1],
      timecodeMatch[2],
      timecodeMatch[3],
      timecodeMatch[4]
    );
    const endTime = parseTimestamp(
      timecodeMatch[5],
      timecodeMatch[6],
      timecodeMatch[7],
      timecodeMatch[8]
    );
    
    // Remaining lines are the subtitle text
    const text = lines.slice(2).join("\n").trim();
    
    if (text) {
      cues.push({
        id,
        startTime,
        endTime,
        text,
      });
    }
  }
  
  return cues;
}

/**
 * Parse timestamp components into seconds
 */
function parseTimestamp(
  hours: string,
  minutes: string,
  seconds: string,
  milliseconds: string
): number {
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(seconds, 10) +
    parseInt(milliseconds, 10) / 1000
  );
}

/**
 * Generate SRT content from an array of SubtitleCue objects
 */
export function generateSrt(cues: SubtitleCue[]): string {
  const lines: string[] = [];
  
  // Sort by start time and re-index
  const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
  
  for (let i = 0; i < sortedCues.length; i++) {
    const cue = sortedCues[i];
    const index = i + 1;
    
    lines.push(String(index));
    lines.push(`${formatTimestamp(cue.startTime)} --> ${formatTimestamp(cue.endTime)}`);
    lines.push(cue.text);
    lines.push(""); // Empty line between cues
  }
  
  return lines.join("\n");
}

/**
 * Format seconds into SRT timestamp format (HH:MM:SS,mmm)
 */
export function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);
  
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
}

/**
 * Pad a number with leading zeros
 */
function pad(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

/**
 * Validate SRT content and return error message if invalid
 */
export function validateSrtContent(content: string): string | null {
  if (!content.trim()) {
    return "Empty SRT content";
  }
  
  const cues = parseSrt(content);
  if (cues.length === 0) {
    return "No valid subtitle cues found";
  }
  
  return null;
}
