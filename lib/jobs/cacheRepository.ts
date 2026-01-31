import { getSupabaseServer } from "@/lib/supabaseServer";

export type MediaCacheKind = "trimmed_audio" | "sequence_video";

export type MediaCacheRecord = {
  kind: MediaCacheKind;
  hash: string;
  storageKey: string;
  mimeType: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
};

type MediaCacheRow = {
  kind: string;
  hash: string;
  storage_key: string;
  mime_type: string | null;
  duration_ms: number | null;
  size_bytes: number | null;
};

const TABLE = "media_cache";

export async function getMediaCache(
  kind: MediaCacheKind,
  hash: string,
): Promise<MediaCacheRecord | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from(TABLE)
    .select("kind, hash, storage_key, mime_type, duration_ms, size_bytes")
    .eq("kind", kind)
    .eq("hash", hash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch cache entry: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const row = data as MediaCacheRow;
  return {
    kind: row.kind as MediaCacheKind,
    hash: row.hash,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    durationMs: row.duration_ms,
    sizeBytes: row.size_bytes,
  };
}

export async function upsertMediaCache(entry: MediaCacheRecord): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from(TABLE).upsert(
    {
      kind: entry.kind,
      hash: entry.hash,
      storage_key: entry.storageKey,
      mime_type: entry.mimeType,
      duration_ms: entry.durationMs,
      size_bytes: entry.sizeBytes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "kind,hash" },
  );

  if (error) {
    throw new Error(`Failed to upsert cache entry: ${error.message}`);
  }
}
