import { SupabaseClient } from "@supabase/supabase-js";
import { getAssetById, updateAsset } from "./repository";
import { 
  downloadAudioFromUrl, 
  callWhisper, 
  translateSegments, 
  generateSrt, 
  generateBilingualSrt,
  uploadToStorage,
} from "@/lib/jobs/operations";
import { parseSrt } from "@/lib/subtitle/srt";
import { DEFAULT_SUBTITLE_CONFIG, SubtitleConfig, CaptionData } from "@/lib/jobs/types";
import { BillingService } from "@/lib/billing/service";

export async function transcribeAsset(supabase: SupabaseClient, assetId: string, userId: string) {
  const asset = await getAssetById(supabase, assetId);
  if (!asset) throw new Error("Asset not found");

  await updateAsset(supabase, assetId, { 
    transcriptionStatus: 'transcribing',
    errorMessage: undefined 
  });

  let tempDir: string | undefined;

  try {
    // 1. Get source URL
    let targetUrl = asset.sourceUrl || "";
    if (asset.storageKey) {
      const { data, error } = await supabase.storage
        .from("uploads")
        .createSignedUrl(asset.storageKey, 3600);
      if (error || !data) throw new Error(`Failed to sign asset URL: ${error?.message}`);
      targetUrl = data.signedUrl;
    }

    if (!targetUrl) throw new Error("No source URL for asset");

    // 2. Download Media
    const audio = await downloadAudioFromUrl(targetUrl);
    tempDir = audio.tempDir;

    // 3. STT (Whisper)
    const transcription = await callWhisper(audio);

    // 4. Translate (to Korean by default)
    const translation = await translateSegments(transcription, "ko");

    // 5. Generate SRT
    const subtitleConfig: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG;
    let subtitles = await generateSrt(translation);
    
    if (subtitleConfig.showBilingual) {
      subtitles = await generateBilingualSrt(transcription, translation);
    }

    // 6. Upload SRT to Storage
    const uploadResult = await uploadToStorage(subtitles);

    // 7. Parse SRT to CaptionData for Editor
    const cues = parseSrt(subtitles.content);
    
    // Add original text if available
    for (let i = 0; i < cues.length && i < transcription.segments.length; i++) {
      cues[i].originalText = transcription.segments[i]?.text;
    }

    const captionData: CaptionData = {
      version: 1,
      cues,
      defaultStyle: subtitleConfig,
    };

    // 8. Update Asset
    await updateAsset(supabase, assetId, {
      transcriptionStatus: 'completed',
      captions: captionData,
      meta: {
        ...asset.meta,
        duration: audio.durationMs / 1000,
        size: audio.sizeBytes,
        mimeType: audio.mimeType || undefined,
        resultSrtUrl: uploadResult.publicUrl
      }
    });

    // 8. Record Billing
    if (audio.durationMs) {
      try {
        await BillingService.recordJobUsage(
          `asset-${assetId}`, 
          userId, 
          { 
            durationSec: audio.durationMs / 1000, 
            translationCount: 1 
          }
        );
      } catch (e) {
        console.error(`[billing] Failed to record usage for asset ${assetId}`, e);
      }
    }

    return captionData;

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown transcription error";
    console.error(`[transcribeAsset] Error for asset ${assetId}:`, error);
    await updateAsset(supabase, assetId, {
      transcriptionStatus: 'failed',
      errorMessage: message
    });
    throw error;
  } finally {
    if (tempDir) {
      const { rm } = await import("node:fs/promises");
      await rm(tempDir, { recursive: true, force: true }).catch(err => {
        console.warn(`[transcribeAsset] Cleanup failed: ${err.message}`);
      });
    }
  }
}
