/**
 * ASS (Advanced SubStation Alpha) Generation Utilities
 * Creates ASS format subtitles with styling support
 */

import type { SubtitleCue, SubtitleConfig } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";

/**
 * Generate ASS subtitle file content with styling
 */
export function generateAss(
  cues: SubtitleCue[],
  defaultStyle: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG
): string {
  const lines: string[] = [];
  
  // Script Info section
  lines.push("[Script Info]");
  lines.push("ScriptType: v4.00+");
  lines.push("PlayResX: 1920");
  lines.push("PlayResY: 1080");
  lines.push("Collisions: Normal");
  lines.push("");
  
  // Styles section
  lines.push("[V4+ Styles]");
  lines.push("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding");
  lines.push(buildStyleLine("Default", defaultStyle));
  lines.push("");
  
  // Events section
  lines.push("[Events]");
  lines.push("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text");
  
  // Sort cues by start time
  const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
  
  for (const cue of sortedCues) {
    const startTime = formatAssTimestamp(cue.startTime);
    const endTime = formatAssTimestamp(cue.endTime);
    // Escape special characters and convert newlines to \N
    const text = escapeAssText(cue.text);
    
    lines.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`);
  }
  
  return lines.join("\n");
}

/**
 * Build ASS style line from SubtitleConfig
 */
function buildStyleLine(name: string, config: SubtitleConfig): string {
  const primaryColor = hexToAssColor(config.primaryColor);
  const outlineColor = hexToAssColor(config.outlineColor);
  const backColor = hexToAssColor(config.backgroundColor);
  
  // Map position to ASS alignment
  // ASS uses numpad-style alignment: 1-3 bottom, 4-6 middle, 7-9 top
  const alignment = getAssAlignment(config.position);
  
  // Scale font size for 1080p
  const fontSize = Math.round(config.fontSize * 1.5);
  
  return `Style: ${name},${config.fontName},${fontSize},${primaryColor},${primaryColor},${outlineColor},${backColor},0,0,0,0,100,100,0,0,1,${config.outlineWidth},0,${alignment},10,10,${config.marginV},1`;
}

/**
 * Convert hex color to ASS color format (&HAABBGGRR)
 * ASS uses AABBGGRR format (alpha, blue, green, red)
 */
export function hexToAssColor(hex: string): string {
  // Remove # if present
  const cleaned = hex.replace("#", "");
  
  let r: string, g: string, b: string, a: string;
  
  if (cleaned.length === 6) {
    // #RRGGBB
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
    a = "00"; // Fully opaque
  } else if (cleaned.length === 8) {
    // #RRGGBBAA
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
    a = cleaned.slice(6, 8);
  } else {
    // Invalid, return white
    return "&H00FFFFFF";
  }
  
  // Convert to ASS format (AABBGGRR, reversed)
  return `&H${a}${b}${g}${r}`.toUpperCase();
}

/**
 * Map position to ASS alignment number
 */
function getAssAlignment(position: "top" | "center" | "bottom"): number {
  switch (position) {
    case "top":
      return 8; // Top center
    case "center":
      return 5; // Middle center
    case "bottom":
    default:
      return 2; // Bottom center
  }
}

/**
 * Format timestamp for ASS format (H:MM:SS.cc)
 */
function formatAssTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.round((totalSeconds % 1) * 100);
  
  return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Escape special characters for ASS format
 */
function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\N")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}
