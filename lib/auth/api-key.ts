import { createHash, randomBytes } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

const API_KEY_PREFIX = "as_"; // ai-sub prefix
const KEY_LENGTH = 32;

/**
 * Generates a new API key and its hash.
 * The raw key should ONLY be shown once to the user.
 */
export function generateApiKey() {
  const bytes = randomBytes(KEY_LENGTH);
  const rawKey = API_KEY_PREFIX + bytes.toString("hex");
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 8); // e.g., "as_abc12"

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hashes an API key for storage or comparison.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validates an API key and returns the associated user_id if valid.
 */
export async function validateApiKey(key: string): Promise<string | null> {
  const hash = hashApiKey(key);
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", hash)
    .single();

  if (error || !data) {
    return null;
  }

  // Update last used timestamp (async, don't wait)
  void supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", hash)
    .then();

  return data.user_id;
}
