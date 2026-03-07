import { createWriteStream } from "node:fs";
import { openAsBlob } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { renderSubtitleVideo } from "@/lib/render/node-renderer";
import type {
  LocalRenderAspectRatio,
  LocalRenderResolution,
  LocalRenderTask,
} from "@/lib/render/local-agent-contract";

type Args = {
  baseUrl: string;
  apiKey: string;
  jobId: string;
  resolution?: LocalRenderResolution;
  aspectRatio?: LocalRenderAspectRatio;
};

function parseArgs(argv: string[]): Args {
  const args: Record<string, string> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const [rawKey, inlineValue] = token.slice(2).split("=");
    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
      continue;
    }

    const nextValue = argv[i + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for --${rawKey}`);
    }

    args[rawKey] = nextValue;
    i += 1;
  }

  const baseUrl = args["base-url"] || args["baseUrl"];
  const apiKey = args["api-key"] || args["apiKey"];
  const jobId = args["job-id"] || args["jobId"];

  if (!baseUrl || !apiKey || !jobId) {
    throw new Error(
      "Usage: npm run render:local -- --base-url <url> --api-key <key> --job-id <jobId> [--resolution fhd] [--aspect-ratio 9:16]"
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    jobId,
    resolution: args["resolution"] as LocalRenderResolution | undefined,
    aspectRatio: (args["aspect-ratio"] || args["aspectRatio"]) as LocalRenderAspectRatio | undefined,
  };
}

async function downloadToFile(url: string, outPath: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download source video (${response.status})`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(outPath));
}

async function requestTask(args: Args): Promise<LocalRenderTask> {
  const endpoint = new URL(`/api/v1/jobs/${args.jobId}/render-local`, args.baseUrl);
  if (args.resolution) endpoint.searchParams.set("resolution", args.resolution);
  if (args.aspectRatio) endpoint.searchParams.set("aspectRatio", args.aspectRatio);

  const response = await fetch(endpoint, {
    headers: { "X-API-Key": args.apiKey },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to request local render task (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as { task: LocalRenderTask };
  if (!payload?.task?.sourceUrl) {
    throw new Error("Invalid task payload: missing sourceUrl");
  }

  return payload.task;
}

async function uploadRenderedFile(
  baseUrl: string,
  apiKey: string,
  task: LocalRenderTask,
  outputPath: string
) {
  const fileBlob = await openAsBlob(outputPath, { type: "video/mp4" });
  const formData = new FormData();
  formData.append("file", fileBlob, `${task.jobId}-local-render.mp4`);

  const uploadUrl = new URL(task.uploadPath, baseUrl);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload rendered output (${response.status}): ${text}`);
  }

  return response.json();
}

export async function runLocalRenderJob(args: Args) {
  const task = await requestTask(args);

  const workDir = await mkdtemp(path.join(tmpdir(), "ai-subauto-local-render-"));
  const sourcePath = path.join(workDir, "source.mp4");
  const outputPath = path.join(workDir, "output.mp4");

  console.log(`[local-render] Job ${task.jobId} task received.`);
  console.log(`[local-render] Downloading source: ${task.sourceUrl}`);

  try {
    await downloadToFile(task.sourceUrl, sourcePath);

    console.log("[local-render] Source download completed.");
    console.log("[local-render] Rendering on this device (FFmpeg + local CPU/GPU)...");

    await renderSubtitleVideo(sourcePath, outputPath, task.cues, task.style, {
      resolution: task.resolution,
      aspectRatio: task.aspectRatio,
      watermarkText: task.watermarkText,
    });

    console.log("[local-render] Render completed.");
    const uploadResponse = await uploadRenderedFile(args.baseUrl, args.apiKey, task, outputPath);
    console.log("[local-render] Upload completed.");
    console.log(uploadResponse);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await runLocalRenderJob(args);
}

const isDirectExecution = process.argv[1]?.includes("local-render-agent");

if (isDirectExecution) {
  main().catch((error) => {
    console.error("[local-render] Failed:", error);
    process.exitCode = 1;
  });
}
