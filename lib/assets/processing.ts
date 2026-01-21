import { existsSync } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Resolve FFmpeg path similar to jobs/operations.ts
const resolveFfmpegBinary = (staticPath: string | null | undefined): string | null => {
    const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const candidates = new Set<string>();

    if (typeof staticPath === "string" && staticPath.length > 0) {
        candidates.add(staticPath);
        const normalized = normalizeRootPlaceholder(staticPath);
        if (normalized) {
            candidates.add(normalized);
        }
    }

    candidates.add(path.join(process.cwd(), "node_modules", "ffmpeg-static", binaryName));

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
};

const normalizeRootPlaceholder = (candidate: string): string | null => {
    const match = candidate.match(/^[\\/]+ROOT([\\/].*)$/);
    if (!match) {
        return null;
    }
    return path.join(process.cwd(), match[1]);
};

const ffmpegPath = resolveFfmpegBinary(ffmpegStatic);
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

export type MediaMetadata = {
    duration: number; // in seconds
    width: number;
    height: number;
    format: string;
};

export async function extractMetadata(filePath: string): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath).ffprobe((err, data) => {
            if (err) return reject(err);
            
            const stream = data.streams.find(s => s.codec_type === 'video');
            const format = data.format;

            resolve({
                duration: format.duration || 0,
                width: stream?.width || 0,
                height: stream?.height || 0,
                format: format.format_name || 'unknown'
            });
        });
    });
}

export async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .screenshots({
                timestamps: ['10%'], // Capture at 10% of video
                filename: path.basename(outputPath),
                folder: path.dirname(outputPath),
                size: '320x?', // Resize width to 320, keep aspect ratio
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
}
