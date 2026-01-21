import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processJob } from "@/lib/jobs/processJob";
import { createJob } from "@/lib/jobs/service";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const maxDuration = 300;

type UploadInfo = {
  bucket: string;
  path: string;
  publicUrl: string;
  mimeType: string;
  size: number;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const autoStart = parseBoolean(formData.get("autoStart")) ?? true;
    const subtitleConfigRaw = formData.get("subtitleConfig");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "file is empty" }, { status: 400 });
    }

    // 자막 스타일 설정 파싱
    let subtitleConfig = null;
    if (typeof subtitleConfigRaw === "string" && subtitleConfigRaw.length > 0) {
      try {
        subtitleConfig = JSON.parse(subtitleConfigRaw);
      } catch {
        console.warn("[uploads] Failed to parse subtitleConfig, using default");
      }
    }

    const upload = await uploadFileToSupabase(file);
    const job = await createJob({
      url: upload.publicUrl,
      userId: null,
      subtitleConfig,
    });

    if (autoStart) {
      void processJob(job.id).catch((error) => {
        console.error(`Uploaded job ${job.id} failed`, error);
      });
    }

    return NextResponse.json(
      {
        job,
        upload,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    console.error("[uploads] request failed", error);
    if (message.includes("schema cache")) {
       console.error("CRITICAL: Schema cache is stale. Run 'NOTIFY pgrst, \"reload schema\";' in database.");
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function uploadFileToSupabase(file: File): Promise<UploadInfo> {
  const supabase = getSupabaseServer();
  await ensureBucketExists(supabase, env.uploadsBucket);
  const extension = inferExtension(file.name) ?? ".mp4";
  const safeBasename = sanitizeFilename(path.basename(file.name, extension)) || `upload-${Date.now()}`;
  const objectPath = `uploads/${safeBasename}-${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(env.uploadsBucket).upload(objectPath, buffer, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(env.uploadsBucket).getPublicUrl(objectPath);

  return {
    bucket: env.uploadsBucket,
    path: objectPath,
    publicUrl,
    mimeType: file.type,
    size: file.size,
  };
}

function sanitizeFilename(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
}

const ensuredBuckets = new Set<string>();

async function ensureBucketExists(client: SupabaseClient, bucket: string) {
  if (ensuredBuckets.has(bucket)) {
    return;
  }

  const { data, error } = await client.storage.getBucket(bucket);
  if (!error && data) {
    ensuredBuckets.add(bucket);
    return;
  }

  if (error && !/not found/i.test(error.message)) {
    throw new Error(`Unable to access bucket "${bucket}": ${error.message}`);
  }

  const { error: createError } = await client.storage.createBucket(bucket, {
    public: true,
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Unable to create bucket "${bucket}": ${createError.message}`);
  }

  ensuredBuckets.add(bucket);
}

function inferExtension(filename: string): string | null {
  const ext = path.extname(filename);
  if (ext) {
    return ext;
  }
  return null;
}

function parseBoolean(input: FormDataEntryValue | null): boolean | null {
  if (input === null) {
    return null;
  }
  if (typeof input === "string") {
    if (input === "true" || input === "1") {
      return true;
    }
    if (input === "false" || input === "0") {
      return false;
    }
  }
  return null;
}
