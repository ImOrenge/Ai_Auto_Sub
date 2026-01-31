
// import { createCanvas } from '@napi-rs/canvas'; // Changed to dynamic import to prevent top-level crash
import ffmpeg from 'fluent-ffmpeg';
import { SubtitleCue, SubtitleConfig } from '../jobs/types';
import { EffectPreset, getEffectPreset } from '../subtitle-definitions';
import { renderSubtitleFrame } from '../subtitle/canvas-render-utils';
import { PassThrough } from 'stream';
import path from 'path';

interface RenderOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number; // seconds
  jobId?: string; // For progress updates
  resolution?: string; // e.g. 'sd', 'hd', 'fhd', 'uhd'
}

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  sd: { width: 854, height: 480 },
  hd: { width: 1280, height: 720 },
  fhd: { width: 1920, height: 1080 },
  uhd: { width: 3840, height: 2160 },
  "720p": { width: 1280, height: 720 }, // Backward compatibility
  "1080p": { width: 1920, height: 1080 }, // Backward compatibility
  "4k": { width: 3840, height: 2160 }, // Backward compatibility
};

import { getSupabaseServer } from '../supabaseServer';

export async function renderSubtitleVideo(
  sourceVideoPath: string,
  outputVideoPath: string,
  cues: SubtitleCue[],
  style: SubtitleConfig,
  options: RenderOptions = {}
): Promise<void> {
  // 1. Determine Video Specs (if not provided)
  let { width, height, fps, duration, resolution } = options;

  if (resolution && RESOLUTION_MAP[resolution.toLowerCase()]) {
    const target = RESOLUTION_MAP[resolution.toLowerCase()];
    width = target.width;
    height = target.height;
  }

  if (!width || !height || !fps || !duration) {
    const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
      ffmpeg.ffprobe(sourceVideoPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
    if (!videoStream) throw new Error('No video stream found in source');

    if (!width || !height) {
      width = width || videoStream.width || 1920;
      height = height || videoStream.height || 1080;
    }
    
    // FPS parsing (e.g. "30/1" or "30")
    if (!fps) {
        if (videoStream.r_frame_rate) {
            const parts = videoStream.r_frame_rate.split('/');
            fps = parts.length === 2 ? parseInt(parts[0]) / parseInt(parts[1]) : Number(videoStream.r_frame_rate);
        } else {
            fps = 60;
        }
    }

    // Force 60fps for animations as requested by user
    fps = 60;
    
    // Duration
    if (!duration) {
        duration = videoStream.duration ? parseFloat(videoStream.duration) : 0;
        if (!duration && metadata.format.duration) {
            duration = Number(metadata.format.duration);
        }
    }
  }

  if (!duration) throw new Error('Could not determine video duration');

  console.info(`[node-renderer] Specs: ${String(width)}x${String(height)} @ ${String(fps)}fps, ${String(duration)}s`);

  // 2. Setup Canvas (Dynamic Import)
  let createCanvas: any;
  let GlobalFonts: any;
  try {
     const canvasModule = await import('@napi-rs/canvas');
     createCanvas = canvasModule.createCanvas;
     GlobalFonts = canvasModule.GlobalFonts;
     
     // Attempt to load system fonts for Windows (Malgun Gothic)
     // Skia generally finds them, but we can be explicit if we find a path.
     // For now, Skia's default font manager should handle system fonts.
     console.log("[node-renderer] GlobalFonts available:", !!GlobalFonts);
  } catch (e: any) {
     console.error("Failed to load @napi-rs/canvas", e);
     throw new Error(`Failed to load Canvas rendering engine: ${e.message}`);
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Register Fonts
  if (GlobalFonts) {
    const fontPath = path.join(process.cwd(), 'lib/render/fonts/Anton-Regular.ttf');
    try {
      const success = GlobalFonts.registerFromPath(fontPath, 'Anton');
      console.log(`[node-renderer] Font registration 'Anton': ${String(success)}`);
    } catch (err) {
      console.warn(`[node-renderer] Could not register font at ${fontPath}`, err);
    }
  }

  // 3. Setup Stream
  const subtitleStream = new PassThrough();
  
  // 4. Setup FFmpeg Command
  const command = ffmpeg()
    .input(sourceVideoPath.replaceAll("\\", "/"))
    .input(subtitleStream)
    .inputOptions([
        `-f rawvideo`,
        `-pixel_format rgba`, 
        `-video_size ${width}x${height}`,
        `-framerate ${fps}`
    ])
    .complexFilter([
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}[bg]`,
        `[bg][1:v]overlay=0:0[outv]`
    ])
    .outputOptions([
        '-map [outv]',
        '-map 0:a?',
        '-c:v libx264',
        '-preset veryfast',
        '-crf 18',
        '-pix_fmt yuv420p',
        '-r 60',
        '-movflags +faststart'
    ])
    .output(outputVideoPath.replaceAll("\\", "/"));

  // 5. Start FFmpeg
  const ffmpegPromise = new Promise<void>((resolve, reject) => {
    command
      .on('start', (cmdLine) => console.log('Spawned Ffmpeg with command: ' + cmdLine))
      .on('error', (err) => {
          console.error('Ffmpeg error:', err);
          reject(err);
      })
      .on('end', () => {
          console.log('Ffmpeg finished');
          resolve();
      })
      .run();
  });

  // 6. Generate Frames Loop
  const totalFrames = Math.ceil(duration * fps);
  
  // We need to resolve style effect preset
  const presetId = style.effect;
  const preset = presetId ? getEffectPreset(presetId) : undefined;
  
  console.log(`[node-renderer] Rendering ${totalFrames} frames...`);

  const generateFrames = async () => {
    let lastProgressUpdate = 0;
    const { jobId } = options;
    console.log(`[node-renderer] starting frame generation. jobId: ${jobId}, totalFrames: ${totalFrames}`);

    try {
        for (let i = 0; i < totalFrames; i++) {
            const time = i / fps;
            
            // Render Frame
            ctx.clearRect(0, 0, width, height);

            const activeCues = cues.filter(c => time >= c.startTime && time <= c.endTime);

            for (const cue of activeCues) {
                renderSubtitleFrame(ctx, cue, style, time, preset, width, height);
            }

            // Memory Optimization: Use getImageData which is faster than PNG encoding
            // though still involves a copy. 
            const imageData = ctx.getImageData(0, 0, width, height);
            const buffer = Buffer.from(imageData.data.buffer);
            
            // Write to stream
            const canContinue = subtitleStream.write(buffer);
            
            if (!canContinue) {
                // Backpressure handling
                await new Promise<void>(resolve => subtitleStream.once('drain', resolve));
            }

            // Yield to event loop periodically to prevent freezing and allow heartbeats
            if (i % 30 === 0) {
                await new Promise(resolve => setImmediate(resolve));
            }

            // Progress tracking
            const ratio = (i + 1) / totalFrames;
            if (jobId && (ratio - lastProgressUpdate >= 0.01 || i === totalFrames - 1)) {
                lastProgressUpdate = ratio;
                const progress = Math.min(0.99, ratio);
                
                try {
                    const { error } = await getSupabaseServer()
                        .from("jobs")
                        .update({ progress })
                        .eq("id", jobId);
                    
                    if (error) {
                        console.error(`[node-renderer] Failed to update DB progress:`, error);
                    }
                } catch (err) {
                    console.error(`[node-renderer] Exception during DB progress update:`, err);
                }
            }

            if (i % (fps * 5) === 0 || i === totalFrames - 1) {
               console.log(`[node-renderer] Progress: ${((i / totalFrames) * 100).toFixed(1)}%`);
            }
        }
        subtitleStream.end();
    } catch (err) {
        console.error('Error in frame generation loop:', err);
        subtitleStream.destroy(err as Error);
    }
  };

  // Run generation and ffmpeg in parallel
  await Promise.all([ffmpegPromise, generateFrames()]);
}
