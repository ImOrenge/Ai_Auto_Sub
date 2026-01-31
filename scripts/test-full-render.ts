
import path from 'path';
import fs from 'fs';
import { renderSubtitleVideo } from '../lib/render/node-renderer';
import { SubtitleCue, SubtitleConfig } from '../lib/jobs/types';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    console.log(`Set ffmpeg path to: ${ffmpegStatic}`);
}

async function createDummyVideo(outputPath: string, duration: number) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg()
            .input('color=c=black:s=1280x720')
            .inputOptions(['-f', 'lavfi'])
            .outputOptions(['-t', String(duration), '-pix_fmt', 'yuv420p', '-r', '60'])
            .save(outputPath)
            .on('end', () => resolve())
            .on('error', reject);
    });
}

async function main() {
    const inputVideo = path.join(process.cwd(), 'dummy_input.mp4');
    const outputVideo = path.join(process.cwd(), 'test_output_canvas.mp4');

    try {
        console.log('Creating dummy input video...');
        if (!fs.existsSync(inputVideo)) {
            await createDummyVideo(inputVideo, 5); // 5 seconds
        }

        console.log('Starting Canvas Renderer...');
        
        const cues: SubtitleCue[] = [
            { id: 1, startTime: 0.5, endTime: 2.5, text: "Hello Canvas World!" },
            { id: 2, startTime: 3.0, endTime: 4.5, text: "Advanced Effects Here" },
        ];

        const style: SubtitleConfig = {
            fontName: "Anton",
            fontSize: 70,
            primaryColor: "#00FFFF",
            strokeColor: "#FFFFFF",
            strokeWidth: 1.5,
            shadowColor: "#00FFFF",
            shadowBlur: 20,
            outlineColor: "#000000",
            outlineWidth: 0,

            backgroundColor: "transparent",
            position: "center",
            marginV: 50,
            displayMode: "standard", 
            effect: "typewriter", // Testing typewriter + neon
            showBilingual: false,
        };


        await renderSubtitleVideo(inputVideo, outputVideo, cues, style, {
            fps: 60, // Forcing 60FPS for smoother animations
        });

        console.log(`Success! Video rendered to ${outputVideo}`);

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

main();
