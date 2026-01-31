
import { renderSubtitleVideo } from '../lib/render/node-renderer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { SubtitleCue, SubtitleConfig } from '../lib/jobs/types';

// Setup ffmpeg
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function verifyAspectCrop() {
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const sourcePath = path.join(outputDir, 'source_16_9.mp4');
    const outputPath = path.join(outputDir, 'output_9_16.mp4');

    // 1. Create Source Video (16:9, 1920x1080, solid red)
    console.log('Creating source video...');
    await new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input('color=c=red:s=1920x1080:d=2')
            .inputFormat('lavfi')
            .output(sourcePath)
            .outputOptions(['-c:v', 'libx264', '-pix_fmt', 'yuv420p'])
            .on('end', () => resolve())
            .on('error', reject)
            .run();
    });

    // 2. Render to 9:16 (1080x1920) using node-renderer
    console.log('Rendering to 9:16...');
    const matchConfig: SubtitleConfig = {
        fontName: 'Arial',
        fontSize: 30,
        primaryColor: '&HFFFFFF',
        outlineColor: '&H000000',
        backColor: '&H00000080',
        bold: 0,
        italic: 0,
        underline: 0,
        strikeout: 0,
        alignment: 2,
        outline: 2,
        shadow: 2,
        spacing: 0,
        angle: 0,
        scaleX: 100,
        scaleY: 100,
        marginL: 10,
        marginR: 10,
        marginV: 10,
        encoding: 1,
        effect: undefined
    };

    // Testing with empty cues
    const cues: SubtitleCue[] = [];

    try {
        await renderSubtitleVideo(
            sourcePath,
            outputPath,
            cues,
            matchConfig,
            {
                aspectRatio: '9:16', 
                duration: 2,
                fps: 30,
                width: 1920, // Original dims hints
                height: 1080 
            }
        );
        console.log('Render finished.');

        // 3. Verify Output Dimensions
        ffmpeg.ffprobe(outputPath, (err, metadata) => {
            if (err) {
                console.error('Probe error:', err);
                return;
            }
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            if (videoStream) {
                console.log(`Output Dimensions: ${videoStream.width}x${videoStream.height}`);
                if (videoStream.width === 1080 && videoStream.height === 1920) {
                    console.log('SUCCESS: Aspect Ratio correct.');
                } else {
                    console.error('FAILURE: Dimensions wrong.');
                    process.exit(1);
                }
            } else {
                console.error('No video stream found.');
                process.exit(1);
            }
        });

    } catch (e) {
        console.error('Render failed:', e);
        process.exit(1);
    }
}

verifyAspectCrop().catch(console.error);
