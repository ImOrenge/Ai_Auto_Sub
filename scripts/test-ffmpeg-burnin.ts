
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "node:path";
import { writeFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

async function testBurnIn() {
    const workDir = path.join(tmpdir(), "ffmpeg-test-" + Date.now());
    await mkdir(workDir, { recursive: true });
    
    const subPath = path.join(workDir, "test.ass");
    const outputPath = path.join(workDir, "output.mp4");
    
    const assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, Strikeout, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,72,&H0000FFFF,&H0000FFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,{\\fscx150\\fscy150\\t(0,500,\\fscx100\\fscy100)}BURN-IN TEST SUCCESSFUL
`;

    await writeFile(subPath, assContent, "utf-8");
    
    // Create a dummy video if none exists, or use a short one.
    // Let's use color filter to generate a 5-second black video
    console.log("Generating test video and burning subtitles...");
    
    const normalizedSubPath = subPath.replace(/\\/g, "/").replace(/:/g, "\\:");
    console.log(`Original Path: ${subPath}`);
    console.log(`Escaped Path: ${normalizedSubPath}`);

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input("color=c=black:s=1280x720:d=5")
            .inputFormat("lavfi")
            .outputOptions([
                "-vf", `subtitles='${normalizedSubPath}'`,
                "-c:v", "libx264",
                "-t", "5"
            ])
            .output(outputPath)
            .on("start", (cmd) => console.log("Command:", cmd))
            .on("error", (err) => {
                console.error("Error:", err);
                reject(err);
            })
            .on("end", () => {
                console.log("Success! Output at:", outputPath);
                resolve(outputPath);
            })
            .run();
    });
}

testBurnIn().catch(console.error);
