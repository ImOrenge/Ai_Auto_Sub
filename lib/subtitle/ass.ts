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
  lines.push("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, Strikeout, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding");
  lines.push(buildStyleLine("Default", defaultStyle));
  lines.push("");
  
  // Events section
  lines.push("[Events]");
  lines.push("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text");
  
  // Sort cues by start time
  const sortedCues = [...cues].sort((a, b) => a.startTime - b.startTime);
  
  // Process cues based on display mode
  const finalCues: SubtitleCue[] = [];
  if (defaultStyle.displayMode === 'single-word') {
    for (const cue of sortedCues) {
      if (cue.words && cue.words.length > 0) {
        // Use provided word timings
        cue.words.forEach((w, idx) => {
          finalCues.push({
            id: cue.id * 1000 + idx,
            startTime: w.start,
            endTime: w.end,
            text: w.word,
          });
        });
      } else {
        // Split text by words and distribute timing equally
        const words = cue.text.split(/\s+/).filter(Boolean);
        const durationPerWord = (cue.endTime - cue.startTime) / words.length;
        words.forEach((word, idx) => {
          finalCues.push({
            id: cue.id * 1000 + idx,
            startTime: cue.startTime + idx * durationPerWord,
            endTime: cue.startTime + (idx + 1) * durationPerWord,
            text: word,
          });
        });
      }
    }
  } else {
    finalCues.push(...sortedCues);
  }

  for (const cue of finalCues) {
    const startTime = formatAssTimestamp(cue.startTime);
    const endTime = formatAssTimestamp(cue.endTime);
    
    // Merge style override if present
    const cueStyle = { ...defaultStyle, ...cue.styleOverride };
    
    // Apply effect tags from the new mapper
    const effectTags = getAssTagsForEffect(cueStyle.effect);

    // Escape special characters and convert newlines to \N
    const text = effectTags + escapeAssText(cue.text);
    
    lines.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`);
  }
  
  return lines.join("\n");
}

/**
 * Maps subtitle effects (from SubtitleEffect type) to ASS animation tags.
 * Provides a best-effort translation from Framer Motion effects to ASS.
 */
function getAssTagsForEffect(effect: string | undefined): string {
  if (!effect) return "";
  
  const e = effect.toLowerCase();

  // 1. Entry / Fade Effects
  if (e === 'fade' || e === 'line_fade_up' || e === "line_fade_down" || e.includes('fade')) {
    return "{\\fad(200,200)}";
  }
  
  // 2. Pop / Scale Effects
  if (e === 'pop-in' || e.startsWith('word_pop') || e === 'impact' || e.includes('bounce')) {
    const startScale = e === 'impact' ? 140 : 80;
    return `{\\fscx${startScale}\\fscy${startScale}\\t(0,150,\\fscx100\\fscy100)}`;
  }

  // 3. Blur / Glow Effects
  if (e === 'glow' || e.includes('glow') || e === 'blur' || e.includes('blur')) {
    return "{\\blur5\\t(0,300,\\blur0)}";
  }

  // 4. Movement / Slide Effects
  if (e.includes('slide') || e.includes('stagger')) {
    return "{\\fad(150,0)}"; // Fallback to fade for now as \move requires absolute coordinates
  }

  // 5. Decor / Progress Style Effects (Native ASS tags)
  if (e === 'underline' || e.includes('under')) {
    return "{\\u1}";
  }
  if (e.includes('strike')) {
    return "{\\s1}";
  }

  // 6. Jitter / Shake Effects (Simulated via scale jitter or small blur)
  if (e === 'shake' || e.includes('jitter') || e.includes('wiggle')) {
    return "{\\t(0,50,\\fscx105)\\t(50,100,\\fscx100)\\t(100,150,\\fscy105)\\t(150,200,\\fscy100)}";
  }

  // 7. Special Effects
  if (e === 'typewriter') {
    return "{\\fad(100,0)}";
  }
  if (e.includes('zoom')) {
    return "{\\fscx120\\fscy120\\t(0,250,\\fscx100\\fscy100)}";
  }

  return "";
}

/**
 * Build ASS style line from SubtitleConfig
 */
function buildStyleLine(name: string, config: SubtitleConfig): string {
  const primaryColor = hexToAssColor(config.primaryColor);
  const outlineColor = hexToAssColor(config.outlineColor);
  
  // Map position to ASS alignment
  // ASS uses numpad-style alignment: 1-3 bottom, 4-6 middle, 7-9 top
  const alignment = getAssAlignment(config.position);
  
  // Scale font size for 1080p
  const fontSize = Math.round(config.fontSize * 1.5);
  
  // Calculate outline and shadow mapping
  // We use shadowOffsetX/Y as the primary shadow value if provided
  const outline = config.strokeWidth ?? config.outlineWidth;
  const shadowValue = Math.max(
    config.shadowOffsetX ?? 0, 
    config.shadowOffsetY ?? 0, 
    (config.shadowBlur ?? 0) > 0 ? 2 : 0
  );
  
  // Bold setting
  const boldValue = (config.fontWeight === 'bold' || config.fontWeight === '900' || parseInt(config.fontWeight || '400') >= 700) ? -1 : 0;

  // Use shadowColor if available, otherwise use backgroundColor
  const shadowColorHex = config.shadowColor || config.backgroundColor || "#000000";
  const backColor = hexToAssColor(shadowColorHex);

  // Font name (Standard ASS doesn't usually quote font names in Style line)
  const fontNameSafe = config.fontName;

  return `Style: ${name},${fontNameSafe},${fontSize},${primaryColor},${primaryColor},${outlineColor},${backColor},${boldValue},0,0,0,100,100,0,0,1,${outline},${shadowValue},${alignment},10,10,${config.marginV},1`;
}

/**
 * Convert hex color to ASS color format (&HAABBGGRR)
 * ASS uses AABBGGRR format (alpha, blue, green, red)
 */
export function hexToAssColor(hex?: string): string {
  // Remove # if present
  if (!hex) return "&H00FFFFFF";
  const cleaned = hex.replace("#", "");
  
  let r: string, g: string, b: string, a: string;
  
  if (cleaned.length === 6) {
    // #RRGGBB
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
    a = "00"; // Fully opaque in ASS (00 transparency)
  } else if (cleaned.length === 8) {
    // #RRGGBBAA where AA is opacity (hex)
    r = cleaned.slice(0, 2);
    g = cleaned.slice(2, 4);
    b = cleaned.slice(4, 6);
    
    // Web AA is opacity (00 transparent, FF opaque)
    // ASS AA is transparency (FF transparent, 00 opaque)
    // So andAssAlpha = 255 - webAlpha
    const webAlpha = parseInt(cleaned.slice(6, 8), 16);
    const transparency = Math.max(0, Math.min(255, 255 - webAlpha));
    a = transparency.toString(16).padStart(2, "0");
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
