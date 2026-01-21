import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!supabaseServerClient) {
    supabaseServerClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseServerClient;
}
