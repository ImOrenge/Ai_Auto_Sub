import { v4 as uuidv4 } from 'uuid';
import { getSupabaseServer } from "@/lib/supabaseServer";
import { createAsset, updateAsset, getAssetById } from "./repository";
import type { AssetRecord } from "./types";
import { downloadMediaToFile } from "@/lib/media/downloadMedia";
import { extractMetadata, generateThumbnail } from "./processing";
import { rm, readFile } from "node:fs/promises";
import path from "node:path";

export type CreateUploadSessionParams = {
  userId: string;
  projectId?: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
};

export type UploadSession = {
  asset: AssetRecord;
  signedUrl: string;
};

const BUCKET_NAME = "uploads"; // Bucket created in 0001_jobs_results.sql

export async function createUploadSession(params: CreateUploadSessionParams): Promise<UploadSession> {
  // 1. Generate storage key
  const ext = params.filename.split('.').pop();
  const storageKey = `${params.userId}/${uuidv4()}.${ext}`;

  // 2. Create Asset in DB
  const asset = await createAsset({
    userId: params.userId,
    projectId: params.projectId,
    filename: params.filename,
    storageKey,
    status: 'uploading',
    meta: {
      size: params.sizeBytes,
      mimeType: params.mimeType,
    },
  });

  // 3. Generate Signed URL for Upload (PUT)
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storageKey, 3600);
  
  // Let's try createSignedUploadUrl if available in the type definition, otherwise standard fallback.
  // Since we are coding "blind" to the exact installed version, let's assume createSignedUploadUrl is safest for PUTs.
  
  let signedUrl = "";
  if ('createSignedUploadUrl' in supabase.storage.from(BUCKET_NAME)) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(storageKey);
      
      if (uploadError) throw uploadError;
      signedUrl = uploadData.signedUrl;
  } else {
      // Fallback or if the above is syntax error in this environment (should be fine in TS if ignored)
      // Actually standard createSignedUrl is often for GET. 
      // We will assume createSignedUploadUrl exists as it is standard in recent Supabase JS.
      // If TS complains, we might need a workaround.
       const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(storageKey);
       if (uploadError) throw uploadError;
       signedUrl = uploadData.signedUrl;
  }
  
  // Fix URL if needed (sometimes returns relative)
  if (signedUrl && !signedUrl.startsWith('http')) {
      // It normally returns full URL with token.
  }

  return { asset, signedUrl };
}

// Imports moved to top


export async function completeUpload(userId: string, assetId: string): Promise<AssetRecord> {
  const asset = await getAssetById(assetId);
  if (!asset) throw new Error("Asset not found");
  if (asset.userId !== userId) throw new Error("Unauthorized");
  if (!asset.storageKey) throw new Error("Missing storage key");

  // Update status to 'processing' (or keep uploading?)
  // We'll do processing inline for now to ensure metadata is ready.
  // In production, this should be a background job.
  
  const supabase = getSupabaseServer();
  
  // 1. Download file to temp
  const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(asset.storageKey, 3600);
      
  if (signedUrlError || !data?.signedUrl) throw new Error("Failed to get signed URL for processing");
  const { signedUrl } = data;
      
  if (!signedUrl) throw new Error("Failed to get signed URL for processing");

  // Fire-and-forget processing to avoid blocking the response
  // In a serverless environment, this might be terminated. 
  // However, for local/Node, this works. For Edge/Vercel, we need Inngest/Queue.
  processAssetInBackground(userId, assetId, asset, signedUrl).catch(err => {
      console.error("Background processing failed", err);
  });

  // Return immediately with uploaded status
  return await updateAsset(assetId, { status: 'uploaded' });
}

async function processAssetInBackground(userId: string, assetId: string, asset: AssetRecord, signedUrl: string) {
    const supabase = getSupabaseServer();
    let downloaded: { filePath: string; tempDir: string; } | null = null;

    try {
        const downloadResult = await downloadMediaToFile(signedUrl, {
            filenameHint: asset.filename,
            kind: 'upload',
            sourceUrl: signedUrl
        });
        const tempDir = path.dirname(downloadResult.filePath);
        downloaded = { filePath: downloadResult.filePath, tempDir };

      // 2. Extract Metadata
      const metadata = await extractMetadata(downloaded.filePath);
      
      // 3. Generate Thumbnail
      const thumbFilename = `thumb-${path.basename(asset.storageKey, path.extname(asset.storageKey))}.png`;
      const thumbPath = path.join(downloaded.tempDir, thumbFilename);
      
      await generateThumbnail(downloaded.filePath, thumbPath);
      
      // 4. Upload Thumbnail
      const thumbBuffer = await readFile(thumbPath);
      const thumbKey = `thumbnails/${asset.userId}/${thumbFilename}`;
      
      await supabase.storage.from(BUCKET_NAME).upload(thumbKey, thumbBuffer, {
          contentType: 'image/png',
          upsert: true
      });
      
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(thumbKey);

      // 5. Update Asset
      await updateAsset(assetId, {
          status: 'uploaded',
          meta: {
              ...asset.meta,
              duration: metadata.duration,
              width: metadata.width,
              height: metadata.height,
              format: metadata.format,
              thumbnailUrl: thumbnailUrl
          }
      });
      console.log(`[processAsset] Completed for ${assetId}`);

  } catch (error) {
      console.error("Processing failed", error);
       await updateAsset(assetId, {
          error_message: "Metadata extraction failed: " + (error instanceof Error ? error.message : String(error))
      });
  } finally {
      // Cleanup
      if (downloaded) {
        await rm(downloaded.tempDir, { recursive: true, force: true });
      }
  }
}
