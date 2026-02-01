
import ffmpeg from 'fluent-ffmpeg';
import { SubtitleCue, SubtitleConfig } from '../jobs/types';
import { getEffectPreset } from '../subtitle-definitions';
import { renderSubtitleFrame } from '../subtitle/canvas-render-utils';
import { PassThrough } from 'stream';
import path from 'path';
import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { getSupabaseServer } from '../supabaseServer';

/**
 * Cache key for subtitle frame state to detect when frames can be reused
 */
function getFrameCacheKey(cues: any[], style: any, time: number): string {
  const activeCues = cues.filter((c: any) => time >= c.startTime && time <= c.endTime);
  if (activeCues.length === 0) return 'empty';
  
  return JSON.stringify({
    texts: activeCues.map((c: any) => c.text),
    styles: [style.primaryColor, style.fontSize, style.effect]
  });
}

// Worker Logic
if (!isMainThread) {
  const runWorker = async () => {
    const {
      cues,
      style,
      width,
      height,
      fps,
      startFrame,
      endFrame,
    } = workerData;

    let createCanvas: any;
    let GlobalFonts: any;
    
    try {
      const canvasModule = await import('@napi-rs/canvas');
      createCanvas = canvasModule.createCanvas;
      GlobalFonts = canvasModule.GlobalFonts;
    } catch (e: any) {
      parentPort?.postMessage({ type: 'error', error: `Failed to load Canvas in worker: ${e.message}` });
      return;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Register Fonts
    if (GlobalFonts) {
      // Register Anton font
      const antonFontPath = path.join(process.cwd(), 'lib/render/fonts/Anton-Regular.ttf');
      try {
        GlobalFonts.registerFromPath(antonFontPath, 'Anton');
      } catch (err) {
          console.warn('[Worker] Failed to register Anton font:', err);
      }

      // Register Korean fonts (Noto Sans KR) for proper Korean character rendering
      // Using variable font which supports all weights (Regular, Bold, etc.)
      const koreanFontPath = path.join(process.cwd(), 'lib/render/fonts/NotoSansKR-Variable.ttf');
      try {
        GlobalFonts.registerFromPath(koreanFontPath, 'Noto Sans KR');
      } catch (err) {
        console.warn('[Worker] Failed to register Noto Sans KR:', err);
      }
    }

    const presetId = style.effect;
    const preset = presetId ? getEffectPreset(presetId) : undefined;
    let lastFrameKey: string | null = null;
    let lastFrameBuffer: Buffer | null = null;

    for (let i = startFrame; i < endFrame; i++) {
        const time = i / fps;
        
        // Skip rendering if subtitle state hasn't changed (frame caching)
        const frameKey = getFrameCacheKey(cues, style, time);
        if (frameKey === lastFrameKey && lastFrameBuffer) {
            parentPort?.postMessage({ type: 'frame', frameIndex: i, buffer: lastFrameBuffer });
            continue;
        }
        
        ctx.clearRect(0, 0, width, height);

        const activeCues = cues.filter((c: any) => time >= c.startTime && time <= c.endTime);

        for (const cue of activeCues) {
            renderSubtitleFrame(ctx, cue, style, time, preset, width, height);
        }

        const imageData = ctx.getImageData(0, 0, width, height);
        // Copy the data as a Buffer to avoid issues with native memory transfer
        const buffer = Buffer.from(imageData.data);
        lastFrameKey = frameKey;
        lastFrameBuffer = buffer;
        
        parentPort?.postMessage({ type: 'frame', frameIndex: i, buffer });
    }

    parentPort?.postMessage({ type: 'done' });
  };

  runWorker().catch(err => {
    parentPort?.postMessage({ type: 'error', error: err.message });
  });
}

// Main Thread Logic
interface RenderOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  jobId?: string;
  resolution?: string;
  aspectRatio?: 'original' | '9:16' | '1:1' | '16:9';
}

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  sd: { width: 854, height: 480 },
  hd: { width: 1280, height: 720 },
  fhd: { width: 1920, height: 1080 },
  uhd: { width: 3840, height: 2160 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

const ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

/**
 * Detects available hardware encoders and returns the best one.
 * Falls back to libx264 (CPU) if none found or in Railway.
 */
async function getBestEncoder(): Promise<string> {
    // Railway check - typically no GPU available
    if (process.env.RAILWAY_ENVIRONMENT) {
        return 'libx264';
    }

    return new Promise((resolve) => {
        ffmpeg.getAvailableEncoders((err, encoders) => {
            if (err) {
                resolve('libx264');
                return;
            }

            // Priority list for H.264 harware encoders
            const priority = ['h264_nvenc', 'h264_qsv', 'h264_amf', 'h264_vaapi', 'h264_videotoolbox'];
            for (const name of priority) {
                if (encoders[name]) {
                    console.info(`[node-renderer] Detected hardware encoder: ${name}`);
                    return resolve(name);
                }
            }
            resolve('libx264');
        });
    });
}

export async function renderSubtitleVideo(
  sourceVideoPath: string,
  outputVideoPath: string,
  cues: SubtitleCue[],
  style: SubtitleConfig,
  options: RenderOptions = {}
): Promise<void> {
  let { width, height, fps, duration, resolution, aspectRatio } = options;

  if (aspectRatio && aspectRatio !== 'original' && ASPECT_RATIO_MAP[aspectRatio]) {
    const target = ASPECT_RATIO_MAP[aspectRatio];
    width = target.width;
    height = target.height;
  } else if (resolution && RESOLUTION_MAP[resolution.toLowerCase()]) {
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

    width = width || videoStream.width || 1920;
    height = height || videoStream.height || 1080;
    fps = fps || 30; // Optimized for short-form content (2x faster rendering)
    duration = duration || (videoStream.duration ? parseFloat(videoStream.duration) : Number(metadata.format.duration || 0));
  }

  if (!duration) throw new Error('Could not determine video duration');

  const totalFrames = Math.ceil(duration * fps);
  console.info(`[node-renderer] Specs: ${width}x${height} @ ${fps}fps, ${duration}s, ${totalFrames} frames`);

  const encoder = await getBestEncoder();
  
  // 3. Setup Stream
  const subtitleStream = new PassThrough();
  subtitleStream.setMaxListeners(0); // Unlimited for parallel rendering backpressure
  
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
        `-c:v ${encoder}`,
        ...(encoder === 'libx264' ? [
            '-preset veryfast',  // Better compression than superfast
            '-crf 23',           // Standard quality for web video
            '-tune zerolatency', // Optimize for streaming
            '-threads 0'         // Use all available CPU cores
        ] : []),
        '-pix_fmt yuv420p',
        `-r ${fps}`,
        '-movflags +faststart'
    ])
    .output(outputVideoPath.replaceAll("\\", "/"));

  const ffmpegPromise = new Promise<void>((resolve, reject) => {
    command
      .on('start', (cmdLine) => console.log('[node-renderer] FFmpeg command: ' + cmdLine))
      .on('error', (err) => {
          console.error('[node-renderer] FFmpeg error:', err);
          reject(err);
      })
      .on('end', () => {
          console.log('[node-renderer] FFmpeg finished');
          resolve();
      })
      .run();
  });

  // 6. Parallel Frame Generation
  const generateFramesParallel = async () => {
    // For short videos, fewer workers = less overhead
    const optimalWorkers = duration < 60 ? Math.min(2, os.cpus().length) : Math.min(4, os.cpus().length);
    const numWorkers = Math.max(1, optimalWorkers);
    console.info(`[node-renderer] Spawning ${numWorkers} workers...`);

    const frameBuffers: (Buffer | null)[] = new Array(totalFrames).fill(null);
    let nextFrameToWrite = 0;
    let framesProcessed = 0;
    let lastProgressUpdate = 0;
    const { jobId } = options;

    const workers: Worker[] = [];
    const framesPerWorker = Math.ceil(totalFrames / numWorkers);

    const workerPromises = Array.from({ length: numWorkers }).map((_, i) => {
      const startFrame = i * framesPerWorker;
      const endFrame = Math.min(startFrame + framesPerWorker, totalFrames);

      if (startFrame >= totalFrames) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        const useTsx = __filename.endsWith('.ts');
        const workerCode = useTsx 
            ? `require('tsx/cjs'); require('${__filename.replaceAll('\\', '/')}');`
            : __filename;
        
        const worker = new Worker(workerCode, {
          eval: useTsx,
          workerData: { cues, style, width, height, fps, startFrame, endFrame },
          execArgv: process.execArgv 
        });

        worker.on('message', async (msg) => {
          if (msg.type === 'frame') {
            frameBuffers[msg.frameIndex] = msg.buffer;
            
            // Push frames to FFmpeg as they become available in order
            while (nextFrameToWrite < totalFrames && frameBuffers[nextFrameToWrite]) {
              const buffer = frameBuffers[nextFrameToWrite]!;
              const canContinue = subtitleStream.write(buffer);
              frameBuffers[nextFrameToWrite] = null; // Memory management
              nextFrameToWrite++;
              framesProcessed++;

              if (!canContinue) {
                await new Promise<void>(res => subtitleStream.once('drain', res));
              }

              // Update progress periodically
              const ratio = framesProcessed / totalFrames;
              if (jobId && (ratio - lastProgressUpdate >= 0.05 || framesProcessed === totalFrames)) {
                  lastProgressUpdate = ratio;
                  const progress = Math.min(0.99, ratio);
                  getSupabaseServer().from("jobs").update({ progress }).eq("id", jobId)
                      .then(({ error }) => error && console.error(`[node-renderer] Progress update error:`, error));
              }

              if (framesProcessed % (fps * 10) === 0 || framesProcessed === totalFrames) {
                 console.log(`[node-renderer] Render Progress: ${(ratio * 100).toFixed(1)}%`);
              }
            }
          } else if (msg.type === 'error') {
            reject(new Error(msg.error));
          } else if (msg.type === 'done') {
            resolve();
          }
        });

        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });

        workers.push(worker);
      });
    });

    try {
      await Promise.all(workerPromises);
      subtitleStream.end();
    } catch (err) {
      console.warn('[node-renderer] Worker pool failed, falling back to sequential rendering:', err);
      workers.forEach(w => w.terminate());
      
      // FALLBACK: Sequential Rendering
      try {
          // Re-initialize canvas for main thread
          const canvasModule = await import('@napi-rs/canvas');
          const canvas = canvasModule.createCanvas(width, height);
          const ctx = canvas.getContext('2d');
          
          if (canvasModule.GlobalFonts) {
              // Register Anton font
              const antonFontPath = path.join(process.cwd(), 'lib/render/fonts/Anton-Regular.ttf');
              try { canvasModule.GlobalFonts.registerFromPath(antonFontPath, 'Anton'); } catch (e) {}
              
              // Register Korean fonts (Noto Sans KR) - Variable font
              const koreanFontPath = path.join(process.cwd(), 'lib/render/fonts/NotoSansKR-Variable.ttf');
              try { canvasModule.GlobalFonts.registerFromPath(koreanFontPath, 'Noto Sans KR'); } catch (e) {}
          }

          const presetId = style.effect;
          const preset = presetId ? getEffectPreset(presetId) : undefined;

          for (let i = framesProcessed; i < totalFrames; i++) {
              const time = i / fps;
              ctx.clearRect(0, 0, width, height);
              const activeCues = cues.filter(c => time >= c.startTime && time <= c.endTime);
              for (const cue of activeCues) {
                  renderSubtitleFrame(ctx, cue, style, time, preset, width, height);
              }
              const imageData = ctx.getImageData(0, 0, width, height);
              const buffer = Buffer.from(imageData.data);
              const canWrite = subtitleStream.write(buffer);
              if (!canWrite) await new Promise(res => subtitleStream.once('drain', res));
              
              if (i % (fps * 10) === 0) {
                  const ratio = (i + 1) / totalFrames;
                  if (jobId) getSupabaseServer().from("jobs").update({ progress: Math.min(0.99, ratio) }).eq("id", jobId).then(() => {});
                  console.log(`[node-renderer] Fallback Progress: ${(ratio * 100).toFixed(1)}%`);
              }
          }
          subtitleStream.end();
      } catch (fallbackErr) {
          console.error('[node-renderer] Fallback also failed:', fallbackErr);
          subtitleStream.destroy(fallbackErr as Error);
          throw fallbackErr;
      }
    }
  };

  await Promise.all([ffmpegPromise, generateFramesParallel()]);
}
