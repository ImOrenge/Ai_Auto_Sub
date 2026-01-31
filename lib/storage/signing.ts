import { env } from "@/lib/env";
import type { JobRecord } from "@/lib/jobs/types";
import { getSupabaseServer } from "@/lib/supabaseServer";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SUPABASE_PUBLIC_PREFIX = "/storage/v1/object/public/";
const SUPABASE_SIGNED_PREFIX = "/storage/v1/object/sign/";

type StorageObjectRef = {
  bucket: string;
  objectPath: string;
};

const supabaseHost = (() => {
  try {
    const projectUrl = new URL(env.supabaseUrl);
    return projectUrl.host;
  } catch {
    return null;
  }
})();

function extractStorageRef(rawUrl: string): StorageObjectRef | null {
  if (!supabaseHost) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.host !== supabaseHost) {
    return null;
  }

  if (parsed.pathname.startsWith(SUPABASE_PUBLIC_PREFIX)) {
    const ref = parseBucketAndPath(parsed.pathname.slice(SUPABASE_PUBLIC_PREFIX.length));
    console.debug(`[storage] Extracted public ref: ${ref?.bucket}/${ref?.objectPath}`);
    return ref;
  }

  if (parsed.pathname.startsWith(SUPABASE_SIGNED_PREFIX)) {
    const ref = parseBucketAndPath(parsed.pathname.slice(SUPABASE_SIGNED_PREFIX.length));
    console.debug(`[storage] Extracted signed ref: ${ref?.bucket}/${ref?.objectPath}`);
    return ref;
  }

  console.debug(`[storage] URL does not match Supabase storage pattern: ${rawUrl}`);
  return null;
}

function parseBucketAndPath(segment: string): StorageObjectRef | null {
  const divider = segment.indexOf("/");
  if (divider === -1) {
    return null;
  }
  return {
    bucket: segment.slice(0, divider),
    objectPath: decodeURIComponent(segment.slice(divider + 1)),
  };
}

async function ensureSignedUrl(input: string | null): Promise<string | null> {
  if (!input) {
    return null;
  }

  const ref = extractStorageRef(input);
  if (!ref) {
    return input;
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage
      .from(ref.bucket)
      .createSignedUrl(ref.objectPath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.warn(
        `[storage] Failed to sign ${ref.bucket}/${ref.objectPath}: ${error?.message ?? "missing signed url"}`,
      );
      return input;
    }

    const signedUrl = data.signedUrl.startsWith("http")
      ? data.signedUrl
      : new URL(data.signedUrl, env.supabaseUrl).toString();
      
    console.debug(`[storage] Signed URL successfully: ${signedUrl.slice(0, 50)}...`);
    return signedUrl;
  } catch (error) {
    console.warn(`[storage] Unexpected error while signing ${ref.bucket}/${ref.objectPath}`, error);
    return input;
  }
}

export async function withSignedJobAssets(job: JobRecord): Promise<JobRecord> {
  const supabase = getSupabaseServer();
  
  // Sign asset's storageKey directly (it's a path, not a URL)
  let assetSignedUrl: string | null = null;
  if (job.asset?.storageKey) {
    try {
      const { data, error } = await supabase.storage
        .from("uploads") // Assets are stored in "uploads" bucket
        .createSignedUrl(job.asset.storageKey, SIGNED_URL_TTL_SECONDS);
      
      if (!error && data?.signedUrl) {
        assetSignedUrl = data.signedUrl.startsWith("http")
          ? data.signedUrl
          : new URL(data.signedUrl, env.supabaseUrl).toString();
      } else {
        console.warn(`[storage] Failed to sign asset ${job.asset.storageKey}: ${error?.message}`);
      }
    } catch (e) {
      console.warn(`[storage] Error signing asset: ${e}`);
    }
  } else if (job.asset?.sourceUrl) {
    // Fallback to sourceUrl if no storage key exists (URL-based asset)
    assetSignedUrl = job.asset.sourceUrl;
  }

  const [srtUrl, videoUrl] = await Promise.all([
    ensureSignedUrl(job.resultSrtUrl),
    ensureSignedUrl(job.resultVideoUrl),
  ]);

  if (srtUrl === job.resultSrtUrl && videoUrl === job.resultVideoUrl && !assetSignedUrl) {
    return job;
  }

  return {
    ...job,
    resultSrtUrl: srtUrl,
    resultVideoUrl: videoUrl,
    asset: job.asset ? {
      ...job.asset,
      signedUrl: assetSignedUrl ?? undefined
    } : null
  };
}
