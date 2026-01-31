
// import { MP4Box } from 'mp4box'; 
// MP4Box type definitions or library passed dynamically

import { 
    SubtitleCue, 
    SubtitleConfig, 
    DEFAULT_SUBTITLE_CONFIG 
} from "@/lib/jobs/types";
import { getEffectPreset } from "@/lib/subtitle-definitions";

const LEGACY_EFFECT_MAPPING: Record<string, string> = {
    'karaoke': 'prog_fill_ltr',
    'pop-in': 'word_pop_soft',
    'highlight': 'decor_box',
    'pill-follow': 'decor_pill',
    'underline': 'decor_under_static',
    'marker': 'prog_marker',
    'shake': 'word_shake_x',
    'impact': 'word_slam',
    'blur': 'line_blur_in',
    'wipe': 'line_wipe_ltr',
    'glow': 'word_glow_pulse',
    'color-flip': 'word_flip_hint',
};

export type CodecPreference =
  | "auto"
  | "source"
  | "h264-baseline"
  | "h264-main"
  | "h264-high"
  | "hevc";

// Easing Functions
const Easing = {
    easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
    spring: (t: number) => {
        // Simple spring approximation: dampening sine wave
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    linear: (t: number) => t,
};

const interpolate = (start: number, end: number, t: number) => start + (end - start) * t;
const interpolateArray = (arr: number[], t: number) => {
    if (arr.length === 0) return 0;
    if (arr.length === 1) return arr[0];
    const segment = 1 / (arr.length - 1);
    const i = Math.min(Math.floor(t / segment), arr.length - 2);
    const localT = (t - i * segment) / segment;
    return interpolate(arr[i], arr[i + 1], localT);
};

export interface RenderOptions {
  width?: number;
  height?: number;
  bitrate?: number;
  framerate?: number;
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
  onFrame?: (frameDataUrl: string) => void;
  cues?: SubtitleCue[];
  style?: SubtitleConfig;
  codecPreference?: CodecPreference;
  fit?: 'contain' | 'cover';
}

export class ClientRenderer {
  private file: File;
  private options: RenderOptions;
  private mp4box: any;
  private cancelled = false;
  private cues: SubtitleCue[] = [];
  private style: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG;
  private muxer: any = null;

  constructor(file: File, options: RenderOptions = {}, mp4boxLib: any) {
    this.file = file;
    this.options = {
      bitrate: 5_000_000,
      framerate: 30,
      ...options
    };
    this.mp4box = mp4boxLib;
    this.cues = options.cues || [];
    this.style = options.style || DEFAULT_SUBTITLE_CONFIG;
  }

  cancel() {
    this.cancelled = true;
  }

  async start(): Promise<any> {
    this.options.onStatus?.("Starting Analysis...");
    
    // 1. Demux & Get Info
    const demuxer = new MP4Demuxer(this.file, this.mp4box);
    const info = await demuxer.getInfo();
    
    const videoTrack = info.tracks.find((t: any) => t.video);
    if (!videoTrack) throw new Error("No video track found");
    
    this.options.onStatus?.("Initializing Pipeline...");
    
    // 2. Setup Canvas
    const width = this.options.width || videoTrack.video.width;
    const height = this.options.height || videoTrack.video.height;
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext("2d", { alpha: false, desynchronized: true }) as OffscreenCanvasRenderingContext2D;
    
    if (!ctx) throw new Error("Could not create OffscreenCanvas context");

    // 3. Setup Muxer (Output)
    const muxer = this.mp4box.createFile();
    // Set brands for better compatibility
    // 'isom' - ISO Base Media file
    // 'avc1' - AVC extensions
    // 'mp41' - MP4 version 1
    // @ts-ignore
    if (muxer.setBrands) muxer.setBrands("mp42", ["mp42", "isom", "avc1"]);

    let outputTrackId: number | null = null;
    let frameCount = 0;

    // 4. Setup Encoder
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        // Create track on first chunk when we have description (AVCC/HEVCC)
        if (outputTrackId === null && meta?.decoderConfig?.description) {
            console.log("[ClientRenderer] Encoder meta available. Creating Track.");
            console.log("[ClientRenderer] Description size:", (meta.decoderConfig.description as ArrayBuffer).byteLength);
            
            const codec = meta.decoderConfig.codec || videoTrack.codec;
            const description = meta.decoderConfig.description;
            const isHEVC = codec.startsWith('hvc') || codec.startsWith('hev');
            
            // Map description to MP4Box option key
            const options: any = {
                timescale: videoTrack.timescale,
                width: width,
                height: height,
                codec: codec,
                video: { width, height },
            };
            
            if (isHEVC) {
                console.log("[ClientRenderer] Using HEVC Track Config");
                options.hevcDecoderConfigRecord = description;
            } else {
                console.log("[ClientRenderer] Using AVC Track Config");
                options.avcDecoderConfigRecord = description;
            }
             
            outputTrackId = muxer.addTrack(options);
            console.log(`[ClientRenderer] Track created with ID: ${outputTrackId}`);
        }
        
        if (outputTrackId !== null) {
            const buffer = new ArrayBuffer(chunk.byteLength);
            chunk.copyTo(buffer);
            
            // DTS/CTS handling:
            // For Baseline profile (no B-frames), DTS = CTS.
            // MP4Box allows passing just 'dts' or 'cts'. 
            // We use 'cts' from chunk.timestamp.
            // If we have B-frames, we might need real DTS, but VideoEncoder doesn't expose it easily in all browsers.
            // Force Baseline avoids this headache.
            
            muxer.addSample(outputTrackId, buffer, {
              duration: chunk.duration ? (chunk.duration * videoTrack.timescale) / 1e6 : 0,
              dts: (chunk.timestamp * videoTrack.timescale) / 1e6,
              cts: (chunk.timestamp * videoTrack.timescale) / 1e6,
              is_sync: chunk.type === 'key'
            });
            frameCount++;
        } else {
            console.warn("[ClientRenderer] Dropping chunk - Track not yet initialized (missing description?)");
        }
      },
      error: (e) => console.error("Encoder Error", e)
    });

    // 4.5. Setup Audio Pass-through
    const audioTrack = info.tracks.find((t: any) => t.audio);
    let audioOutputTrackId: number | null = null;
    if (audioTrack) {
        console.log("[ClientRenderer] Audio track found, enabling pass-through");
        const audioDesc = await demuxer.getTrackDescription(audioTrack.id);
        console.log(`[ClientRenderer] Audio Codec: ${audioTrack.codec}, Description Size: ${audioDesc?.byteLength || 0}`);
        
        audioOutputTrackId = muxer.addTrack({
            timescale: audioTrack.timescale,
            samplerate: audioTrack.audio.sample_rate,
            channel_count: audioTrack.audio.channel_count,
            hdlr: 'soun',
            type: 'audio',
            codec: audioTrack.codec,
            description: audioDesc
        });
    }
    
    // Configure Encoder with robust check
    const baseConfig = {
      width,
      height,
      bitrate: this.options.bitrate,
      framerate: this.options.framerate,
    };
    
    const validConfig = await this.getSupportedCodecConfig(
      baseConfig,
      videoTrack.codec,
      this.options.codecPreference ?? "source"
    );
    console.log(`[ClientRenderer] Selected Encoder Config:`, validConfig);
    
    // Force Keyframe interval
    // @ts-ignore
    // validConfig.keyFrameInterval = 30; // 1 second roughly
    // keyFrameInterval might not be in standard type yet but works in Chrome
    
    await encoder.configure({
        ...validConfig,
        // @ts-ignore
        latencyMode: "quality",
        // @ts-ignore
        keyFrameInterval: 60,
    });

    // 5. Setup Decoder
    const decoder = new VideoDecoder({
      output: async (frame) => {
        if (this.cancelled) {
            frame.close();
            return;
        }
        
        // DRAW
        // Clear canvas first
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        this.drawVideoFrame(ctx, frame, width, height, this.options.fit || 'contain');
        
        // COMPOSITE SUBTITLES
        if (this.cues.length > 0) {
            this.drawSubtitles(ctx, frame.timestamp / 1e6, width, height);
        }
        
        // ENCODE
        const newFrame = new VideoFrame(offscreen, {
           timestamp: frame.timestamp,
           duration: frame.duration ?? undefined
        });
        
        // PREVIEW (Every 30 frames)
        if (this.options.onFrame && frameCount % 30 === 0) {
            // We'll send a small data URL for simplicity in the UI preview
            // OffscreenCanvas doesn't have toDataURL, so we use a temporary canvas in the main thread?
            // No, we are in the main thread (ClientRenderer is just a class in the app).
            const previewCanvas = new OffscreenCanvas(width / 4, height / 4);
            const pCtx = previewCanvas.getContext('2d');
            if (pCtx) {
                pCtx.drawImage(offscreen, 0, 0, width / 4, height / 4);
                previewCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.5 }).then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        this.options.onFrame?.(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                });
            }
        }

        encoder.encode(newFrame); // Keyframe logic omitted for brevity
        
        frame.close();
        newFrame.close();
        
        // Progress (Approximate)
        if (info.duration > 0) {
           const prog = (frame.timestamp / 1e6) / (info.duration / info.timescale);
           this.options.onProgress?.(prog);
        }
      },
      error: (e) => console.error("Decoder Error", e)
    });
    
    // Get Description (AVCC)
    const description = await demuxer.getTrackDescription(videoTrack.id);
    
    decoder.configure({
      codec: videoTrack.codec,
      codedWidth: videoTrack.video.width,
      codedHeight: videoTrack.video.height,
      description: description
    });
    
    // 6. Start Loop
    this.options.onStatus?.("Rendering...");
    const tracksToExtract = [videoTrack.id];
    if (audioTrack) tracksToExtract.push(audioTrack.id);

    let videoSamplesIn = 0;
    let audioSamplesIn = 0;

    await demuxer.startExtraction(tracksToExtract, (id, sample) => {
        if (id === videoTrack.id) {
            const chunk = new EncodedVideoChunk({
                type: sample.is_sync ? "key" : "delta",
                timestamp: (1e6 * sample.cts) / sample.timescale,
                duration: (1e6 * sample.duration) / sample.timescale,
                data: sample.data
            });
            decoder.decode(chunk);
            videoSamplesIn++;
        } else if (id === audioTrack.id && audioOutputTrackId !== null) {
            muxer.addSample(audioOutputTrackId, sample.data, {
                duration: sample.duration,
                dts: sample.dts,
                cts: sample.cts,
                is_sync: sample.is_sync
            });
            audioSamplesIn++;
        }
    });

    console.log(`[ClientRenderer] Extraction finished. Video: ${videoSamplesIn}, Audio: ${audioSamplesIn}`);
    
    // Wait for encoder and decoder to finish
    this.options.onStatus?.("Flushing...");
    await decoder.flush();
    await encoder.flush();
    muxer.flush();
    
     this.muxer = muxer;
     return muxer; 
  }

  async getBuffer(): Promise<ArrayBuffer> {
    if (!this.muxer) throw new Error("Renderer not started or failed");
    // MP4Box.js requires a DataStream to write out the file
    const stream = new this.mp4box.DataStream(undefined, 0, this.mp4box.DataStream.BIG_ENDIAN);
    this.muxer.write(stream);
    return stream.buffer;
  }

  async getBlob(): Promise<Blob> {
    const buffer = await this.getBuffer();
    return new Blob([buffer], { type: 'video/mp4' });
  }

  async download(filename: string) {
    const blob = await this.getBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private drawSubtitles(ctx: OffscreenCanvasRenderingContext2D, timeSeconds: number, width: number, height: number) {
      const activeCues = this.cues.filter(cue => timeSeconds >= (cue.startTime - 1) && timeSeconds < (cue.endTime + 1)); // Buffer for animations
      
      const filteredCues = activeCues.filter(cue => timeSeconds >= cue.startTime && timeSeconds < cue.endTime);
      if (filteredCues.length === 0) return;

      const style = this.style;
      const scale = height / 1080;
      const fontSize = (style.fontSize || 24) * scale * 2.5;
      
      ctx.font = `${style.fontWeight || 'normal'} ${fontSize}px ${style.fontName || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const cue of filteredCues) {
          const rawEffect = style.effect || 'none';
          const effectId = LEGACY_EFFECT_MAPPING[rawEffect] || rawEffect;
          const preset = getEffectPreset(effectId);
          
          const duration = cue.endTime - cue.startTime;
          const elapsed = timeSeconds - cue.startTime;
          const progress = Math.max(0, Math.min(1, elapsed / duration));

          ctx.save();

          // 1. Line Scope Animations (Entry/Exit)
          if (preset?.scope === 'line') {
              this.applyLineMotion(ctx, preset, elapsed, duration, width, height, scale);
          }

          // 2. Base Positioning
          const x = width / 2;
          let y = height - ((style.marginV || 50) * scale);
          if (style.position === 'top') y = ((style.marginV || 50) * scale) + fontSize;
          if (style.position === 'center') y = height / 2;

          // 3. Word Rendering Loop
          const words = cue.text.split(/\s+/).filter(Boolean);
          const activeWordIndex = cue.words 
              ? cue.words.findIndex(w => timeSeconds >= w.start && timeSeconds <= w.end)
              : Math.floor(progress * words.length);

          if (preset?.scope === 'word' || style.displayMode === 'single-word' || preset?.id === 'decor_focus_dim_others') {
              this.drawWordLevelSubtitles(ctx, words, activeWordIndex, cue, timeSeconds, preset, x, y, fontSize, scale);
          } else if (rawEffect === 'typewriter') {
              const visibleChars = Math.floor(progress * cue.text.length);
              this.drawTextLine(ctx, cue.text.slice(0, visibleChars), x, y, fontSize, scale);
          } else {
              // Standard Block Rendering
              this.drawTextLine(ctx, cue.text, x, y, fontSize, scale);
          }

          ctx.restore();
      }
  }

  private applyLineMotion(ctx: OffscreenCanvasRenderingContext2D, preset: any, elapsed: number, duration: number, width: number, height: number, scale: number) {
      const entry = preset.entry;
      const exit = preset.exit;
      const entryDur = (entry?.transition?.duration || 0.3);
      const exitDur = (exit?.transition?.duration || 0.3);

      let alpha = 1;
      let tx = 0, ty = 0, ts = 1, tr = 0;
      let filter = 'none';

      // 1. Line Motion
      if (elapsed < entryDur && entry?.type === 'lineMotion') {
          const t = Easing.easeOut(elapsed / entryDur);
          const init = entry.initial || { opacity: 0, y: 0 };
          alpha = interpolate(init.opacity ?? 0, 1, t);
          ty = interpolate(init.y ?? 0, 0, t) * scale;
          tx = interpolate(init.x ?? 0, 0, t) * scale;
          ts = interpolate(init.scale ?? 1, 1, t);
          
          if (init.rotate) {
              const rVal = typeof init.rotate === 'string' ? parseFloat(init.rotate) : init.rotate;
              tr = interpolate(rVal, 0, t);
          }
          if (init.filter && init.filter.includes('blur')) {
              const blurVal = parseFloat(init.filter.match(/\d+/) || '0');
              const currentBlur = interpolate(blurVal, 0, t);
              filter = `blur(${currentBlur}px)`;
          }
      } else if (elapsed > (duration - exitDur) && exit?.type === 'lineMotion') {
          const t = Easing.easeOut((duration - elapsed) / exitDur);
          const anim = exit.animate || { opacity: 0, y: 0 };
          alpha = interpolate(anim.opacity ?? 0, 1, t);
          ty = interpolate(anim.y ?? 0, 0, t) * scale;
          tx = interpolate(anim.x ?? 0, 0, t) * scale;
          ts = interpolate(anim.scale ?? 1, 1, t);
          
          if (anim.rotate) {
              const rVal = typeof anim.rotate === 'string' ? parseFloat(anim.rotate) : anim.rotate;
              tr = interpolate(rVal, 0, t);
          }
          if (anim.filter && anim.filter.includes('blur')) {
              const blurVal = parseFloat(anim.filter.match(/\d+/) || '0');
              const currentBlur = interpolate(blurVal, 0, t);
              filter = `blur(${currentBlur}px)`;
          }
      }

      // 2. Line Clip Reveal (Wipes)
      if (elapsed < entryDur && entry?.type === 'lineClipReveal') {
          const t = elapsed / entryDur;
          this.applyClipPath(ctx, entry.direction, t, width, height);
      } else if (elapsed > (duration - exitDur) && exit?.type === 'lineClipReveal') {
          const t = (duration - elapsed) / exitDur;
          this.applyClipPath(ctx, exit.direction, t, width, height, true);
      }

      ctx.globalAlpha *= alpha;
      ctx.filter = filter;
      ctx.translate(width / 2 + tx, height / 2 + ty); 
      ctx.rotate(tr * Math.PI / 180);
      ctx.scale(ts, ts);
      ctx.translate(-width / 2, -height / 2);
  }

  private applyClipPath(ctx: OffscreenCanvasRenderingContext2D, direction: string, t: number, width: number, height: number, isExit = false) {
      ctx.beginPath();
      // Simple rect clipping for wipes
      if (direction === 'ltr') {
          ctx.rect(0, 0, width * t, height);
      } else if (direction === 'rtl') {
          ctx.rect(width * (1-t), 0, width * t, height);
      } else if (direction === 'btt') {
          ctx.rect(0, height * (1-t), width, height * t);
      } else if (direction === 'ttb') {
          ctx.rect(0, 0, width, height * t);
      }
      ctx.clip();
  }

  private drawWordLevelSubtitles(
      ctx: OffscreenCanvasRenderingContext2D, 
      words: string[], 
      activeIndex: number, 
      cue: SubtitleCue,
      currentTime: number,
      preset: any,
      centerX: number,
      y: number,
      fontSize: number,
      scale: number
  ) {
      const style = this.style;
      const gap = (style.highlightGap ?? 12) * scale;
      
      // Measure all words to center accurately
      const wordWidths = words.map(w => ctx.measureText(w).width);
      const totalWidth = wordWidths.reduce((a, b) => a + b, 0) + (words.length - 1) * gap;
      let currentX = centerX - totalWidth / 2;

      words.forEach((word, i) => {
          const isActive = i === activeIndex;
          const wWidth = wordWidths[i];
          const midX = currentX + wWidth / 2;
          
          ctx.save();
          
          // Apply Word-specific preset logic
          if (preset?.scope === 'word' && preset.active) {
               this.applyWordAnimation(ctx, preset, isActive, cue, i, currentTime, scale, midX, y);
          } else if (preset?.id === 'decor_focus_dim_others') {
               ctx.globalAlpha *= isActive ? 1 : (preset.active.inactiveOpacity || 0.5);
          }

          // Highlight/Decor
          if (isActive && preset?.active?.type === 'wordDecorToggle') {
              this.drawWordDecor(ctx, preset.active, midX, y, wWidth, fontSize, scale);
          }

          // Karaoke Fill
          if (preset?.active?.type === 'wordProgressFill') {
              this.drawKaraokeWord(ctx, word, currentX, y, isActive, cue, i, currentTime, preset.active, scale);
          } else {
              this.drawTextLine(ctx, word, midX, y, fontSize, scale);
          }

          ctx.restore();
          currentX += wWidth + gap;
      });
  }

  private applyWordAnimation(ctx: OffscreenCanvasRenderingContext2D, preset: any, isActive: boolean, cue: SubtitleCue, index: number, currentTime: number, scale: number, x: number, y: number) {
      const activeConfig = preset.active;
      const inactiveConfig = preset.inactive;
      
      if (activeConfig.type === 'wordMotion' && isActive) {
          const w = cue.words?.[index];
          if (w) {
              const dur = w.end - w.start;
              const t = Easing.spring(Math.max(0, Math.min(1, (currentTime - w.start) / dur)));
              const anim = activeConfig.animate;
              
              if (anim.scale || anim.scaleX || anim.scaleY || anim.rotate) {
                  const s = anim.scale ? (typeof anim.scale === 'number' ? interpolate(1, anim.scale, t) : interpolateArray(anim.scale, t)) : 1;
                  const sx = anim.scaleX ? (typeof anim.scaleX === 'number' ? interpolate(1, anim.scaleX, t) : interpolateArray(anim.scaleX, t)) : s;
                  const sy = anim.scaleY ? (typeof anim.scaleY === 'number' ? interpolate(1, anim.scaleY, t) : interpolateArray(anim.scaleY, t)) : s;
                  const r = anim.rotate ? (typeof anim.rotate === 'number' ? interpolate(0, anim.rotate, t) : interpolateArray(anim.rotate, t)) : 0;
                  
                  ctx.translate(x, y);
                  ctx.rotate(r * Math.PI / 180);
                  ctx.scale(sx, sy);
                  ctx.translate(-x, -y);
              }
              
              if (anim.y || anim.x) {
                  const ty = (anim.y ? (typeof anim.y === 'number' ? interpolate(0, anim.y, t) : interpolateArray(anim.y, t)) : 0) * scale;
                  const tx = (anim.x ? (typeof anim.x === 'number' ? interpolate(0, anim.x, t) : interpolateArray(anim.x, t)) : 0) * scale;
                  ctx.translate(tx, ty);
              }

              if (anim.opacity !== undefined) {
                  ctx.globalAlpha *= typeof anim.opacity === 'number' ? interpolate(0.7, anim.opacity, t) : interpolateArray(anim.opacity, t);
              }
              
              if (anim.filter && anim.filter.includes('blur')) {
                  const blurVal = parseFloat(anim.filter.match(/\d+/) || '0');
                  const currentBlur = interpolate(blurVal, 0, 1-t); // Snap from blur to clear
                  ctx.filter = `blur(${currentBlur}px)`;
              }
          }
      } else if (inactiveConfig && !isActive) {
          ctx.globalAlpha *= inactiveConfig.opacity ?? 0.7;
          if (inactiveConfig.scale) {
              ctx.translate(x, y);
              ctx.scale(inactiveConfig.scale, inactiveConfig.scale);
              ctx.translate(-x, -y);
          }
      }
  }

  private drawWordDecor(ctx: OffscreenCanvasRenderingContext2D, config: any, x: number, y: number, w: number, h: number, scale: number) {
      ctx.save();
      const px = (config.paddingX || 4) * scale;
      const py = (config.paddingY || 0) * scale;
      const r = (config.radius || 4) * scale;
      const color = this.style.highlightColor || '#FFFF00';
      
      ctx.fillStyle = color;
      ctx.globalAlpha *= config.opacity || 1;
      
      if (config.decor === 'pillBehind' || config.decor === 'boxBehind') {
          this.roundRect(ctx, x - w/2 - px, y - h/2 - py, w + px*2, h + py*2, r);
          ctx.fill();
      }
      ctx.restore();
  }

  private drawKaraokeWord(ctx: OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, isActive: boolean, cue: SubtitleCue, index: number, currentTime: number, config: any, scale: number) {
      const wWidth = ctx.measureText(text).width;
      const midX = x + wWidth / 2;
      
      // 1. Draw Background (Original Color)
      this.drawTextLine(ctx, text, midX, y, (this.style.fontSize || 24) * scale * 2.5, scale);
      
      if (isActive) {
          const w = cue.words?.[index];
          let p = 0;
          if (w) p = Math.max(0, Math.min(1, (currentTime - w.start) / (w.end - w.start)));
          
          ctx.save();
          // Clipping
          ctx.beginPath();
          ctx.rect(x, y - 100, wWidth * p, 200); // Rough vertical clip
          ctx.clip();
          
          // 2. Draw Highlight Color Overlay
          const oldFill = ctx.fillStyle;
          ctx.fillStyle = this.style.highlightColor || '#FFFF00';
          // Temporarily disable shadow for highlight fill to keep it clean
          const oldShadow = ctx.shadowBlur;
          ctx.shadowBlur = 0;
          
          this.drawTextLine(ctx, text, midX, y, (this.style.fontSize || 24) * scale * 2.5, scale, true);
          
          ctx.fillStyle = oldFill;
          ctx.shadowBlur = oldShadow;
          ctx.restore();
      } else if (index < (cue.words?.length || 0) && currentTime > (cue.words?.[index]?.end || 0)) {
           // Fully filled
           ctx.save();
           ctx.fillStyle = this.style.highlightColor || '#FFFF00';
           this.drawTextLine(ctx, text, midX, y, (this.style.fontSize || 24) * scale * 2.5, scale, true);
           ctx.restore();
      }
  }

  private drawTextLine(ctx: OffscreenCanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, scale: number, skipStroke = false) {
      const style = this.style;
      
      // Outline/Stroke
      if (!skipStroke && style.outlineWidth && style.outlineWidth > 0) {
          ctx.lineWidth = (style.outlineWidth * scale) * 2;
          ctx.strokeStyle = style.outlineColor || '#000000';
          ctx.lineJoin = 'round';
          ctx.strokeText(text, x, y);
      }
      
      // Shadow
      if (style.shadowBlur) {
          ctx.shadowColor = style.shadowColor || 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = style.shadowBlur * scale;
          ctx.shadowOffsetX = (style.shadowOffsetX || 0) * scale;
          ctx.shadowOffsetY = (style.shadowOffsetY || 0) * scale;
      }

      // Fill
      ctx.fillStyle = style.primaryColor || '#FFFFFF';
      ctx.fillText(text, x, y);
      
      // Reset Shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
  }

  private roundRect(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
  }

  private drawVideoFrame(
      ctx: OffscreenCanvasRenderingContext2D,
      frame: VideoFrame,
      targetWidth: number,
      targetHeight: number,
      fit: 'contain' | 'cover'
  ) {
      const srcWidth = frame.displayWidth;
      const srcHeight = frame.displayHeight;
      const srcRatio = srcWidth / srcHeight;
      const targetRatio = targetWidth / targetHeight;

      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (fit === 'contain') {
          if (srcRatio > targetRatio) {
              // Video is wider than target: Fit width, adjust height
              drawHeight = targetWidth / srcRatio;
              offsetY = (targetHeight - drawHeight) / 2;
          } else {
              // Video is taller than target: Fit height, adjust width
              drawWidth = targetHeight * srcRatio;
              offsetX = (targetWidth - drawWidth) / 2;
          }
      } else {
          // cover
          if (srcRatio > targetRatio) {
               // Video is wider: Fit height, crop width
               drawWidth = targetHeight * srcRatio;
               offsetX = (targetWidth - drawWidth) / 2;
          } else {
               // Video is taller: Fit width, crop height
               drawHeight = targetWidth / srcRatio;
               offsetY = (targetHeight - drawHeight) / 2;
          }
      }

      ctx.drawImage(frame, offsetX, offsetY, drawWidth, drawHeight);
  }

  private async getSupportedCodecConfig(
    baseConfig: any,
    preferredCodec: string,
    codecPreference: CodecPreference
  ): Promise<VideoEncoderConfig> {
      // H.264/HEVC requires dimensions to be multiples of 2
      const width = baseConfig.width % 2 === 0 ? baseConfig.width : baseConfig.width - 1;
      const height = baseConfig.height % 2 === 0 ? baseConfig.height : baseConfig.height - 1;
      
      const adjustedConfig = { ...baseConfig, width, height };
      
      const candidates: VideoEncoderConfig[] = [];

      const addPreferred = () => {
        if (!preferredCodec) return;
        const isHEVC = preferredCodec.startsWith("hvc") || preferredCodec.startsWith("hev");
        const isAVC = preferredCodec.startsWith("avc");

        if (isAVC) {
          candidates.push({ ...adjustedConfig, codec: preferredCodec, avc: { format: "avc" } });
        } else if (isHEVC) {
          candidates.push({ ...adjustedConfig, codec: preferredCodec, hevc: { format: "hev" } });
        } else {
          candidates.push({ ...adjustedConfig, codec: preferredCodec });
        }
      };

      const addH264Baseline = () => {
        candidates.push({ ...adjustedConfig, codec: "avc1.42001f", avc: { format: "avc" } }); // Level 3.1
        candidates.push({ ...adjustedConfig, codec: "avc1.42001e", avc: { format: "avc" } }); // Level 3.0
      };

      const addH264Main = () => {
        candidates.push({ ...adjustedConfig, codec: "avc1.4d0028", avc: { format: "avc" } }); // Level 4.0
        candidates.push({ ...adjustedConfig, codec: "avc1.4d0029", avc: { format: "avc" } }); // Level 4.1
      };

      const addH264High = () => {
        candidates.push({ ...adjustedConfig, codec: "avc1.640028", avc: { format: "avc" } }); // Level 4.0
        candidates.push({ ...adjustedConfig, codec: "avc1.640029", avc: { format: "avc" } }); // Level 4.1
      };

      const addHevc = () => {
        candidates.push({ ...adjustedConfig, codec: "hvc1.1.6.L93.B0", hevc: { format: "hev" } });
      };

      switch (codecPreference) {
        case "source":
          addPreferred();
          addH264Baseline();
          addH264Main();
          addH264High();
          addHevc();
          break;
        case "h264-baseline":
          addH264Baseline();
          break;
        case "h264-main":
          addH264Main();
          break;
        case "h264-high":
          addH264High();
          break;
        case "hevc":
          addHevc();
          break;
        case "auto":
        default:
          addH264Baseline();
          addH264Main();
          addH264High();
          addHevc();
          addPreferred();
          break;
      }

      console.log(
        `[ClientRenderer] Searching for supported codec. Preferred: ${preferredCodec || "none"}, Mode: ${codecPreference}`
      );

      for (const config of candidates) {
          try {
              const support = await VideoEncoder.isConfigSupported(config);
              if (support.supported) {
                  console.log(`[ClientRenderer] Using Supported Codec: ${config.codec}`);
                  return config;
              }
          } catch (e) {
              // Silently try next
          }
      }
      
      throw new Error(`No supported video encoding format found for ${width}x${height} using ${codecPreference}.`);
  }
}

class MP4Demuxer {
  private file: File;
  private mp4box: any;
  private mp4boxFile: any;

  constructor(file: File, mp4boxLib: any) {
    this.file = file;
    this.mp4box = mp4boxLib;
    this.mp4boxFile = mp4boxLib.createFile();
  }


  async getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mp4boxFile.onReady = (info: any) => resolve(info);
      this.mp4boxFile.onError = (e: any) => reject(e);
      
      this.loadFile();
    });
  }
  
  private loadFile() {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        // @ts-ignore
        buffer.fileStart = 0;
        this.mp4boxFile.appendBuffer(buffer);
        this.mp4boxFile.flush();
      };
      reader.readAsArrayBuffer(this.file);
  }

   async getTrackDescription(trackId: number): Promise<Uint8Array | undefined> {
     const track = this.mp4boxFile.getTrackById(trackId);
     if (!track) return undefined;
     
     const entries = track.mdia?.minf?.stbl?.stsd?.entries;
     if (!entries) return undefined;
     
     for (const entry of entries) {
        // Video: avcC, hvcC, vpcC, av1C
        const videoBox = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
        if (videoBox) {
           const stream = new this.mp4box.DataStream(undefined, 0, this.mp4box.DataStream.BIG_ENDIAN);
           videoBox.write(stream);
           return new Uint8Array(stream.buffer.slice(8));
        }
        
        // Audio: AAC (esds)
        if (entry.esds) {
           const esd = entry.esds.esd;
           if (esd && esd.descs) {
              // The AudioSpecificConfig is inside the DecoderConfigDescriptor
              const decoderConfig = esd.descs.find((d: any) => d.tag === 4); // DecoderConfigDescriptor
              if (decoderConfig && decoderConfig.descs) {
                 const decoderSpecific = decoderConfig.descs.find((d: any) => d.tag === 5); // DecoderSpecificInfo
                 if (decoderSpecific) {
                    return new Uint8Array(decoderSpecific.data);
                 }
              }
           }
           // Fallback: write the whole esds but this usually fails in WebCodecs
           const stream = new this.mp4box.DataStream(undefined, 0, this.mp4box.DataStream.BIG_ENDIAN);
           entry.esds.write(stream);
           return new Uint8Array(stream.buffer.slice(8));
        }
     }
     return undefined;
   }

   async startExtraction(trackIds: number[], onSample: (id: number, sample: any) => void) {
       const extractFile = this.mp4box.createFile();
       
       // Calculate total samples to expect
       let totalExpected = 0;
       const trackSampleCounts = new Map<number, number>();

       return new Promise<void>((resolve, reject) => {
           let samplesProcessed = 0;
           
           extractFile.onReady = (info: any) => {
               for (const tid of trackIds) {
                   const track = info.tracks.find((t: any) => t.id === tid);
                   if (track) {
                       totalExpected += track.nb_samples;
                       trackSampleCounts.set(tid, track.nb_samples);
                   }
                   extractFile.setExtractionOptions(tid, undefined, { nbSamples: 100000 });
               }
               console.log(`[MP4Demuxer] Starting extraction. Total samples expected: ${totalExpected}`);
               extractFile.start();
           };
           
           extractFile.onSamples = (id: number, user: any, samples: any[]) => {
               for (const sample of samples) {
                   onSample(id, sample);
                   samplesProcessed++;
               }
               
               if (samplesProcessed >= totalExpected) {
                   console.log(`[MP4Demuxer] All ${samplesProcessed} samples processed. Resolving.`);
                   resolve();
               }
           };
          
           extractFile.onError = (e: any) => reject(e);
           
           // Use arrayBuffer() for potentially better memory handling than FileReader
           this.file.arrayBuffer().then(buffer => {
               // @ts-ignore
               buffer.fileStart = 0;
               extractFile.appendBuffer(buffer);
               extractFile.flush();
               
               // If for some reason nb_samples was wrong or process finished
               setTimeout(() => {
                   if (samplesProcessed < totalExpected) {
                       console.warn(`[MP4Demuxer] Timed out waiting for samples (${samplesProcessed}/${totalExpected}). Forced resolve.`);
                       resolve();
                   }
               }, 5000);
           }).catch(reject);
       });
   }
}
