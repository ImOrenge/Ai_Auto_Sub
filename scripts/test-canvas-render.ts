
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

// --- MOCKED TYPES for POC ---
type ShadowSpec = {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
};

type SubtitleConfig = {
    fontName: string;
    fontSize: number;
    fontWeight?: string;
    primaryColor: string;
    outlineColor: string;
    backgroundColor: string;
    outlineWidth: number;
    position: 'top' | 'center' | 'bottom';
    marginV: number;
    displayMode?: 'standard' | 'single-word';
    effect?: string;
    highlightPadding?: number;
    highlightGap?: number;
    highlightColor?: string;
    highlightOpacity?: number;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowColor?: string;
};

type SubtitleCue = {
    text: string;
    startTime: number;
    endTime: number;
    words?: { word: string; start: number; end: number }[];
};

type EffectPreset = {
    scope: "line" | "word";
    entry?: any;
    exit?: any;
    active?: any;
    inactive?: any;
};

// --- HELPER FUNCTIONS (Inlined) ---
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const measureTextWithSpacing = (ctx: any, text: string, letterSpacing: number) => {
    if (!letterSpacing) return ctx.measureText(text).width;
    const chars = Array.from(text);
    const baseWidth = chars.reduce((acc, char) => acc + ctx.measureText(char as string).width, 0);
    return baseWidth + Math.max(0, chars.length - 1) * letterSpacing;
};

const drawTextWithSpacing = (
    ctx: any,
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

const renderSubtitleFrame = (
    ctx: any,
    cue: SubtitleCue,
    style: SubtitleConfig,
    currentTime: number,
    preset?: EffectPreset,
    width = 1920,
    height = 1080
) => {
    // Basic implementation for POC - just to prove it writes text to canvas
    const fontSize = style.fontSize || 48;
    const fontWeight = style.fontWeight || 'bold';
    const fontName = style.fontName || 'Arial';
    
    // Explicitly set font string for node-canvas
    ctx.font = `${fontWeight} ${fontSize}px "${fontName}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate Position
    const x = width / 2;
    let y = height - (style.marginV || 100);
    if (style.position === 'center') y = height / 2;

    // Draw Background (Simple Box)
    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
        const textWidth = ctx.measureText(cue.text).width;
        const boxWidth = textWidth + 40;
        const boxHeight = fontSize + 20;
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
    }

    // Draw Outline
    if (style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = style.outlineWidth * 2;
        ctx.strokeText(cue.text, x, y);
    }

    // Draw Text
    ctx.fillStyle = style.primaryColor;
    ctx.fillText(cue.text, x, y);
};


async function main() {
  console.log('Starting Self-Contained Canvas POC Test...');

  const width = 1920;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const cue = {
    startTime: 0,
    endTime: 3,
    text: "Hello Node.js Canvas!",
  };

  const style: SubtitleConfig = {
    fontName: "Arial",
    fontSize: 80,
    fontWeight: "bold",
    primaryColor: "#FF0000",
    outlineColor: "#FFFFFF",
    backgroundColor: "#00000088",
    outlineWidth: 4,
    position: "bottom",
    marginV: 150,
  };

  // 1. Fill Background
  ctx.fillStyle = "#222222";
  ctx.fillRect(0, 0, width, height);
  
  // 2. Render Subtitle
  console.log('Rendering subtitle...');
  renderSubtitleFrame(ctx, cue, style, 1.5, undefined, width, height);

  // 3. Save
  const buffer = await canvas.encode('png');
  fs.writeFileSync('test-poc.png', buffer);
  console.log('Success! Saved to test-poc.png');
}

main().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
