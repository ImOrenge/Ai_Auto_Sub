import { AssetRecord } from "./types";

export function mapAsset(row: any): AssetRecord {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    filename: row.filename,
    storageKey: row.storage_key,
    sourceUrl: row.source_url,
    status: row.status,
    meta: row.meta || {},
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
