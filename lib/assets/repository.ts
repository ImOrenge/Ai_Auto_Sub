import { SupabaseClient } from "@supabase/supabase-js";
import type { AssetRecord, CreateAssetParams, UpdateAssetParams } from "./types";
import { mapAsset } from "./mapper";

export async function createAsset(supabase: SupabaseClient, params: CreateAssetParams): Promise<AssetRecord> {
  const { data, error } = await supabase
    .from("assets")
    .insert({
      user_id: params.userId,
      project_id: params.projectId,
      filename: params.filename,
      storage_key: params.storageKey,
      source_url: params.sourceUrl,
      status: params.status || 'uploading',
      meta: params.meta || {},
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create asset");

  return mapAsset(data);
}

export async function getAssetById(supabase: SupabaseClient, id: string): Promise<AssetRecord | null> {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return mapAsset(data);
}

export async function updateAsset(supabase: SupabaseClient, id: string, params: UpdateAssetParams): Promise<AssetRecord> {
  const updates: any = { updated_at: new Date().toISOString() };
  if (params.status) updates.status = params.status;
  if (params.transcriptionStatus) updates.transcription_status = params.transcriptionStatus;
  if (params.meta) updates.meta = params.meta; 
  if (params.captions !== undefined) updates.captions = params.captions;
  if (params.errorMessage !== undefined) updates.error_message = params.errorMessage;
  if (params.storageKey !== undefined) updates.storage_key = params.storageKey;

  const { data, error } = await supabase
    .from("assets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapAsset(data);
}

export async function listAssets(supabase: SupabaseClient, userId: string, projectId?: string, limit = 20, cursor?: string): Promise<{ assets: AssetRecord[], nextCursor?: string }> {
  let query = supabase
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const assets = (data || []).map(mapAsset);
  const nextCursor = assets.length === limit ? assets[assets.length - 1].createdAt : undefined;

  return { assets, nextCursor };
}

export async function deleteAsset(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
