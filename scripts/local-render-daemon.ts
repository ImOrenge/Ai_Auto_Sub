import { runLocalRenderJob } from "./local-render-agent";

type DaemonArgs = {
  baseUrl: string;
  apiKey: string;
  pollSec: number;
};

type RemoteJob = {
  id: string;
  status: string;
  result_video_url: string | null;
  export_settings?: {
    renderer?: string;
  } | null;
};

function parseArgs(argv: string[]): DaemonArgs {
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
  const pollSecRaw = args["poll-sec"] || args["pollSec"] || "10";
  const pollSec = Number.parseInt(pollSecRaw, 10);

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Usage: npm run render:daemon -- --base-url <url> --api-key <key> [--poll-sec 10]"
    );
  }

  if (!Number.isFinite(pollSec) || pollSec < 2) {
    throw new Error("--poll-sec must be at least 2");
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    pollSec,
  };
}

async function fetchJobs(args: DaemonArgs): Promise<RemoteJob[]> {
  const endpoint = new URL("/api/v1/jobs?limit=50", args.baseUrl);
  const response = await fetch(endpoint, {
    headers: {
      "X-API-Key": args.apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load jobs (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as { jobs?: RemoteJob[] };
  return payload.jobs ?? [];
}

function pickQueuedJob(jobs: RemoteJob[]): RemoteJob | null {
  const queued = jobs.find((job) => {
    if (job.status !== "exporting") return false;
    if (job.result_video_url) return false;
    return job.export_settings?.renderer === "local-agent";
  });

  return queued ?? null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[daemon] Started. Polling every ${args.pollSec}s at ${args.baseUrl}`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const jobs = await fetchJobs(args);
      const target = pickQueuedJob(jobs);

      if (!target) {
        await sleep(args.pollSec * 1000);
        continue;
      }

      console.log(`[daemon] Picked job ${target.id}. Starting on-device render...`);
      await runLocalRenderJob({
        baseUrl: args.baseUrl,
        apiKey: args.apiKey,
        jobId: target.id,
      });
      console.log(`[daemon] Completed job ${target.id}.`);
    } catch (error) {
      console.error("[daemon] Error:", error);
      await sleep(args.pollSec * 1000);
    }
  }
}

main().catch((error) => {
  console.error("[daemon] Failed:", error);
  process.exitCode = 1;
});
