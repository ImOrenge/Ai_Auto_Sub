import { resolveMediaSource } from "../lib/media/resolveMediaSource";

async function test() {
    const urls = [
        "https://www.youtube.com/watch?v=aqz-KE-bpKQ", // Big Buck Bunny (YouTube)
        "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4", // Direct MP4
    ];

    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);
        try {
            const resolution = await resolveMediaSource(url);
            console.log("Resolution Result:", JSON.stringify({
                kind: resolution.kind,
                filename: resolution.filename,
                mimeType: resolution.mimeType,
                durationMs: resolution.durationMs,
                title: resolution.metadata?.title,
            }, null, 2));
        } catch (err) {
            console.error("Resolution Failed:", err instanceof Error ? err.message : err);
        }
    }
}

test();
