import { NextResponse } from "next/server";
import { getAssetById } from "@/lib/assets/repository";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch asset details
    const asset = await getAssetById(supabase, assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Ensure the asset belongs to the user
    if (asset.userId !== user.id) {
       return NextResponse.json({ error: "Unauthorized access to asset" }, { status: 403 });
    }

    if (!asset.storageKey) {
       // If no storage key, maybe it's a direct URL asset? 
       // MainEditor should ideally handle this, but as a fallback:
       if (asset.sourceUrl) {
         return NextResponse.redirect(asset.sourceUrl);
       }
       return NextResponse.json({ error: "Asset has no media source" }, { status: 400 });
    }

    // Generate signed URL from Supabase Storage
    console.log(`[Asset View] Generating signed URL for key: ${asset.storageKey}`);
    const { data, error } = await supabase.storage
      .from("uploads") // Consistent with BUCKET_NAME in lib/assets/service.ts
      .createSignedUrl(asset.storageKey, 3600);

    if (error || !data?.signedUrl) {
      console.error("[Asset View] Signed URL generation failed:", error);
      return NextResponse.json({ error: "Failed to access video storage", details: error }, { status: 500 });
    }

    console.log(`[Asset View] Success, redirecting to signed URL`);
    // Redirect to the signed URL to stream the video. 
    // Using 307 Temporary Redirect to ensure the method and body are preserved (though it's a GET)
    return NextResponse.redirect(data.signedUrl, { status: 307 });
  } catch (error) {
    console.error("[Asset View] Failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
