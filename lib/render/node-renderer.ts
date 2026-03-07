
import ffmpeg from 'fluent-ffmpeg';
import { SubtitleCue, SubtitleConfig } from '../jobs/types';
import { getEffectPreset } from '../subtitle-definitions';
import { renderSubtitleFrame } from '../subtitle/canvas-render-utils';
import { PassThrough } from 'stream';
import path from 'path';
import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

let progressUpdateUnavailableLogged = false;

async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (!progressUpdateUnavailableLogged) {
      console.info('[node-renderer] Supabase credentials unavailable. Skipping progress updates.');
      progressUpdateUnavailableLogged = true;
    }
    return;
  }

  try {
    const { getSupabaseServer } = await import('../supabaseServer');
    const { error } = await getSupabaseServer()
      .from("jobs")
      .update({ progress })
      .eq("id", jobId);

    if (error) {
      console.error('[node-renderer] Progress update error:', error);
    }
  } catch (error) {
    console.error('[node-renderer] Failed to update progress:', error);
  }
}

/**
 * Cache key for subtitle frame state to detect when frames can be reused
 */
function isTimeWithinCue(time: number, startTime: number, endTime: number): boolean {
  return time >= startTime && time < endTime;
}

function getActiveCuesAtTime(cues: any[], time: number): any[] {
  const activeCues = cues.filter((c: any) => isTimeWithinCue(time, c.startTime, c.endTime));
  if (activeCues.length <= 1) return activeCues;

  const latestCueByLayer = new Map<string, any>();
  for (const cue of activeCues) {
    const layerKey = cue.layerId ?? "__default__";
    const existing = latestCueByLayer.get(layerKey);
    if (!existing || cue.startTime >= existing.startTime) {
      latestCueByLayer.set(layerKey, cue);
    }
  }

  return Array.from(latestCueByLayer.values()).sort((a, b) => a.startTime - b.startTime);
}

function getFrameCacheKey(cues: any[], style: any, time: number): string {
  const activeCues = getActiveCuesAtTime(cues, time);
  if (activeCues.length === 0) return 'empty';
  
  return JSON.stringify({
    texts: activeCues.map((c: any) => ({ text: c.text, original: c.originalText })),
    styles: [style.primaryColor, style.fontSize, style.effect, style.showBilingual]
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
      // Font list: [filename, family name]
      const fontsToRegister = [
        // English fonts
        ['Anton-Regular.ttf', 'Anton'],
        
        // Korean fonts - Gothic (고딕체)
        ['NotoSansKR-Variable.ttf', 'Noto Sans KR'],
        ['NanumGothic-Regular.ttf', 'Nanum Gothic'],
        ['IBMPlexSansKR-Regular.ttf', 'IBM Plex Sans KR'],
        ['DoHyeon-Regular.ttf', 'Do Hyeon'],
        ['Jua-Regular.ttf', 'Jua'],
        ['BlackHanSans-Regular.ttf', 'Black Han Sans'],
        
        // Korean fonts - Serif (명조체)
        ['NotoSerifKR-Variable.ttf', 'Noto Serif KR'],
        ['NanumMyeongjo-Regular.ttf', 'Nanum Myeongjo'],
        ['GowunBatang-Regular.ttf', 'Gowun Batang'],
        
        // Korean fonts - Decorative (장식체/손글씨)
        ['GamjaFlower-Regular.ttf', 'Gamja Flower'],
        ['Sunflower-Medium.ttf', 'Sunflower'],
        
        // Japanese fonts
        ['NotoSansJP-Variable.ttf', 'Noto Sans JP'],
        ['NotoSerifJP-Variable.ttf', 'Noto Serif JP'],
        ['ZenMaruGothic-Medium.ttf', 'Zen Maru Gothic'],
        ['RocknRollOne-Regular.ttf', 'RocknRoll One'],
        ['HachiMaruPop-Regular.ttf', 'Hachi Maru Pop'],
        ['DotGothic16-Regular.ttf', 'DotGothic16'],
        ['DelaGothicOne-Regular.ttf', 'Dela Gothic One'],
      ];

      for (const [filename, familyName] of fontsToRegister) {
        const fontPath = path.join(process.cwd(), 'lib/render/fonts', filename);
        try {
          GlobalFonts.registerFromPath(fontPath, familyName);
        } catch (err) {
          console.warn(`[Worker] Failed to register ${familyName}:`, err);
        }
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

        const activeCues = getActiveCuesAtTime(cues, time);

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
  aspectRatio?: 'original' | '9:16' | '1:1' | '16:9' | '4:5';
  watermarkText?: string;
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
  "4:5": { width: 1080, height: 1350 },
};

/**
 * Detects available hardware encoders and returns the best one with recommended options.
 * Falls back to libx264 (CPU) if none found or in Railway.
 */
async function getBestEncoder(): Promise<{ encoder: string; options: string[]; hwaccel?: string }> {

    return new Promise((resolve) => {
        ffmpeg.getAvailableEncoders((err, encoders) => {
            if (err) {
                resolve({ encoder: 'libx264', options: [] });
                return;
            }

            // Priority list for H.264 hardware encoders
            if (encoders['h264_nvenc']) {
                console.info(`[node-renderer] Detected NVIDIA NVENC encoder`);
                return resolve({ 
                    encoder: 'h264_nvenc', 
                    options: ['-preset p4', '-tune hq', '-rc vbr', '-cq 23', '-pix_fmt yuv420p'],
                    hwaccel: 'cuda'
                });
            }
            if (encoders['h264_qsv']) {
                console.info(`[node-renderer] Detected Intel QSV encoder`);
                return resolve({ 
                    encoder: 'h264_qsv', 
                    options: ['-preset fast', '-global_quality 23', '-look_ahead 1', '-pix_fmt nv12'],
                    hwaccel: 'qsv'
                });
            }
            if (encoders['h264_amf']) {
                console.info(`[node-renderer] Detected AMD AMF encoder`);
                return resolve({ 
                    encoder: 'h264_amf', 
                    options: ['-quality speed', '-rc vbr_latency', '-pix_fmt yuv420p'],
                    hwaccel: 'amf'
                });
            }
            if (encoders['h264_videotoolbox']) {
                console.info(`[node-renderer] Detected Apple VideoToolbox encoder`);
                return resolve({ 
                    encoder: 'h264_videotoolbox', 
                    options: ['-realtime true', '-pix_fmt yuv420p'],
                    hwaccel: 'videotoolbox'
                });
            }
            if (encoders['h264_vaapi']) {
                console.info(`[node-renderer] Detected VAAPI encoder`);
                return resolve({ 
                    encoder: 'h264_vaapi', 
                    options: ['-vaapi_device /dev/dri/renderD128', '-pix_fmt vaapi'],
                    hwaccel: 'vaapi'
                });
            }

            resolve({ encoder: 'libx264', options: [] });
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

  // 1. Always probe source metadata to ensure we have duration and orientation info
  const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(sourceVideoPath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
  if (!videoStream) throw new Error('No video stream found in source');

  const sourceWidth = videoStream.width || 1920;
  const sourceHeight = videoStream.height || 1080;
  const isSourcePortrait = sourceHeight > sourceWidth;

  // 2. Determine target dimensions
  if (aspectRatio && aspectRatio !== 'original' && ASPECT_RATIO_MAP[aspectRatio]) {
    const target = ASPECT_RATIO_MAP[aspectRatio];
    width = target.width;
    height = target.height;
  } else if (resolution && RESOLUTION_MAP[resolution.toLowerCase()]) {
    const target = RESOLUTION_MAP[resolution.toLowerCase()];
    width = target.width;
    height = target.height;

    // If "original" aspect ratio, respect source orientation
    if ((!aspectRatio || aspectRatio === 'original') && isSourcePortrait) {
      // Swap width/height if target is landscape but source is portrait
      if (width > height) {
        [width, height] = [height, width];
        console.info(`[node-renderer] Detected portrait source. Fixed resolution to ${width}x${height}`);
      }
    }
  } else {
    // Fallback to source dimensions if not explicitly set
    width = width || sourceWidth;
    height = height || sourceHeight;
  }

  // 3. Finalize specs
  fps = fps || 30;
  duration = duration || (videoStream.duration ? parseFloat(videoStream.duration) : Number(metadata.format.duration || 0));

  if (!duration) throw new Error('Could not determine video duration');

  const totalFrames = Math.ceil(duration * fps);
  console.info(`[node-renderer] Specs: ${width}x${height} @ ${fps}fps, ${duration}s, ${totalFrames} frames`);

  const { encoder, options: encoderOptions, hwaccel } = await getBestEncoder();
  
  // 3. Setup Stream
  const subtitleStream = new PassThrough();
  subtitleStream.setMaxListeners(0); // Unlimited for parallel rendering backpressure
  
  // 4. Setup FFmpeg Command
    // Initialize with first input (source video) to avoid "No input specified" when adding options
    const command = ffmpeg(sourceVideoPath.replaceAll("\\", "/"));
    
    // Add hardware acceleration for decoding if available
    if (hwaccel) {
        console.info(`[node-renderer] Enabling hardware acceleration: ${hwaccel}`);
        command.inputOptions([`-hwaccel ${hwaccel}`]);
    }

    // Subtitle stream input - raw video
    command.input(subtitleStream)
    .inputOptions([
        `-f rawvideo`,
        `-pixel_format rgba`, 
        `-video_size ${width}x${height}`,
        `-framerate ${fps}`
    ]);
    const watermarkFontPath = path.join(process.cwd(), 'lib/render/fonts/BlackHanSans-Regular.ttf').replaceAll("\\", "/");
    const filters = [
        `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}[bg]`,
        `[bg][1:v]overlay=0:0${options.watermarkText ? '[wm_bg]' : '[outv]'}`
    ];

    if (options.watermarkText) {
        filters.push(`[wm_bg]drawtext=text='${options.watermarkText}':fontfile='${watermarkFontPath}':fontcolor=white@0.15:fontsize=54:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.1:shadowx=2:shadowy=2[outv]`);
    }

    command.complexFilter(filters)
    .outputOptions([
        '-map [outv]',
        '-map 0:a?',
        `-c:v ${encoder}`,
        ...encoderOptions,
        ...(encoder === 'libx264' ? [
            '-preset veryfast',  // Better compression than superfast
            '-crf 23',
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
                  void updateJobProgress(jobId, progress);
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
              // Font list: [filename, family name]
              const fontsToRegister = [
                // English fonts
                ['Anton-Regular.ttf', 'Anton'],
                
                // Korean fonts - Gothic (고딕체)
                ['NotoSansKR-Variable.ttf', 'Noto Sans KR'],
                ['NanumGothic-Regular.ttf', 'Nanum Gothic'],
                ['IBMPlexSansKR-Regular.ttf', 'IBM Plex Sans KR'],
                ['DoHyeon-Regular.ttf', 'Do Hyeon'],
                ['Jua-Regular.ttf', 'Jua'],
                ['BlackHanSans-Regular.ttf', 'Black Han Sans'],
                
                // Korean fonts - Serif (명조체)
                ['NotoSerifKR-Variable.ttf', 'Noto Serif KR'],
                ['NanumMyeongjo-Regular.ttf', 'Nanum Myeongjo'],
                ['GowunBatang-Regular.ttf', 'Gowun Batang'],
                
                // Korean fonts - Decorative (장식체/손글씨)
                ['GamjaFlower-Regular.ttf', 'Gamja Flower'],
                ['Sunflower-Medium.ttf', 'Sunflower'],
                
                // Japanese fonts
                ['NotoSansJP-Variable.ttf', 'Noto Sans JP'],
                ['NotoSerifJP-Variable.ttf', 'Noto Serif JP'],
                ['ZenMaruGothic-Medium.ttf', 'Zen Maru Gothic'],
                ['RocknRollOne-Regular.ttf', 'RocknRoll One'],
                ['HachiMaruPop-Regular.ttf', 'Hachi Maru Pop'],
                ['DotGothic16-Regular.ttf', 'DotGothic16'],
                ['DelaGothicOne-Regular.ttf', 'Dela Gothic One'],
              ];

              for (const [filename, familyName] of fontsToRegister) {
                const fontPath = path.join(process.cwd(), 'lib/render/fonts', filename);
                try { canvasModule.GlobalFonts.registerFromPath(fontPath, familyName); } catch (e) {}
              }
          }

          const presetId = style.effect;
          const preset = presetId ? getEffectPreset(presetId) : undefined;

          for (let i = framesProcessed; i < totalFrames; i++) {
              const time = i / fps;
              ctx.clearRect(0, 0, width, height);
              const activeCues = getActiveCuesAtTime(cues, time);
              for (const cue of activeCues) {
                  renderSubtitleFrame(ctx, cue, style, time, preset, width, height);
              }
              const imageData = ctx.getImageData(0, 0, width, height);
              const buffer = Buffer.from(imageData.data);
              const canWrite = subtitleStream.write(buffer);
              if (!canWrite) await new Promise(res => subtitleStream.once('drain', res));
              
              if (i % (fps * 10) === 0) {
                  const ratio = (i + 1) / totalFrames;
                  if (jobId) {
                    void updateJobProgress(jobId, Math.min(0.99, ratio));
                  }
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
