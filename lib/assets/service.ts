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
  const supabase = getSupabaseServer();
  const asset = await createAsset(supabase, {
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
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storageKey, 3600);
  
  // Let's try createSignedUploadUrl if available in the type definition, otherwise standard fallback.
  let signedUrl = "";
  if ('createSignedUploadUrl' in supabase.storage.from(BUCKET_NAME)) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUploadUrl(storageKey);
      
      if (uploadError) throw uploadError;
      signedUrl = uploadData.signedUrl;
  } else {
       const { data: uploadData, error: uploadError } = await (supabase.storage
        .from(BUCKET_NAME) as any)
        .createSignedUploadUrl(storageKey);
       if (uploadError) throw uploadError;
       signedUrl = uploadData.signedUrl;
  }
  
  return { asset, signedUrl };
}

export async function completeUpload(userId: string, assetId: string): Promise<AssetRecord> {
  const supabase = getSupabaseServer();
  const asset = await getAssetById(supabase, assetId);
  if (!asset) throw new Error("Asset not found");
  if (asset.userId !== userId) throw new Error("Unauthorized");
  if (!asset.storageKey) throw new Error("Missing storage key");

  // Update status to 'processing'
  // 1. Download file to temp
  const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(asset.storageKey, 3600);
      
  if (signedUrlError || !data?.signedUrl) throw new Error("Failed to get signed URL for processing");
  const { signedUrl } = data;
      
  if (!signedUrl) throw new Error("Failed to get signed URL for processing");

  // Fire-and-forget processing
  processAssetInBackground(userId, assetId, asset, signedUrl).catch(err => {
      console.error("Background processing failed", err);
  });

  // Return immediately with uploaded status
  return await updateAsset(supabase, assetId, { status: 'uploaded' });
}

async function processAssetInBackground(userId: string, assetId: string, asset: AssetRecord, signedUrl: string) {
    const supabase = getSupabaseServer();
    let downloaded: { filePath: string; tempDir: string; } | null = null;

    try {
        const downloadResult = await downloadMediaToFile(signedUrl, {
            filenameHint: asset.filename,
            kind: 'direct',
            sourceUrl: signedUrl
        });
        const tempDir = path.dirname(downloadResult.filePath);
        downloaded = { filePath: downloadResult.filePath, tempDir };

      // 2. Extract Metadata
      const metadata = await extractMetadata(downloaded.filePath);
      
      // 3. Generate Thumbnail
      const storageKey = asset.storageKey!;
      const thumbFilename = `thumb-${path.basename(storageKey, path.extname(storageKey))}.png`;
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
      await updateAsset(supabase, assetId, {
          status: 'uploaded',
          meta: {
              ...asset.meta,
              mimeType: metadata.format || undefined, // Metadata has format, but meta expects mimeType or similar
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
       await updateAsset(supabase, assetId, {
          errorMessage: "Metadata extraction failed: " + (error instanceof Error ? error.message : String(error))
      });
  } finally {
      // Cleanup
      if (downloaded) {
        await rm(downloaded.tempDir, { recursive: true, force: true });
      }
  }
}
export async function startUrlDownload(userId: string, assetId: string, sourceUrl: string): Promise<void> {
    const supabase = getSupabaseServer();
    const asset = await getAssetById(supabase, assetId);
    if (!asset) throw new Error("Asset not found");

    // Update status to 'downloading'
    await updateAsset(supabase, assetId, { status: 'downloading' });

    // Fire-and-forget processing
    processUrlDownloadInBackground(userId, assetId, sourceUrl).catch(err => {
        console.error("URL background download failed", err);
    });
}

async function processUrlDownloadInBackground(userId: string, assetId: string, sourceUrl: string) {
    const supabase = getSupabaseServer();
    let downloaded: { filePath: string; tempDir: string; } | null = null;

    try {
        console.log(`[processUrlDownload] Starting download for asset ${assetId} from ${sourceUrl}`);
        
        // 1. Download from URL
        const downloadResult = await downloadMediaToFile(sourceUrl, {
            sourceUrl: sourceUrl
        });
        const tempDir = path.dirname(downloadResult.filePath);
        downloaded = { filePath: downloadResult.filePath, tempDir };

        // 2. Generate storage key
        const ext = path.extname(downloadResult.filePath) || '.mp4';
        const storageKey = `${userId}/${uuidv4()}${ext}`;

        // 3. Upload to Supabase Storage
        const fileBuffer = await readFile(downloaded.filePath);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storageKey, fileBuffer, {
                contentType: downloadResult.mimeType || 'video/mp4',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // 4. Extract Metadata & Thumbnail
        const metadata = await extractMetadata(downloaded.filePath);
        const thumbFilename = `thumb-${path.basename(storageKey, path.extname(storageKey))}.png`;
        const thumbPath = path.join(downloaded.tempDir, thumbFilename);
        
        await generateThumbnail(downloaded.filePath, thumbPath);
        
        const thumbBuffer = await readFile(thumbPath);
        const thumbKey = `thumbnails/${userId}/${thumbFilename}`;
        
        await supabase.storage.from(BUCKET_NAME).upload(thumbKey, thumbBuffer, {
            contentType: 'image/png',
            upsert: true
        });
        
        const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(thumbKey);

        // 5. Update Asset
        await updateAsset(supabase, assetId, {
            status: 'uploaded',
            storageKey,
            meta: {
                size: downloadResult.sizeBytes,
                mimeType: downloadResult.mimeType || undefined,
                duration: metadata.duration,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                thumbnailUrl: thumbnailUrl
            }
        });
        console.log(`[processUrlDownload] Completed for ${assetId}`);

    } catch (error) {
        console.error(`[processUrlDownload] Failed for ${assetId}:`, error);
        await updateAsset(supabase, assetId, {
            status: 'failed',
            errorMessage: "Download or processing failed: " + (error instanceof Error ? error.message : String(error))
        });
    } finally {
        if (downloaded) {
            await rm(downloaded.tempDir, { recursive: true, force: true });
        }
    }
}
