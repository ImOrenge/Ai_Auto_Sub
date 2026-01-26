import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAssetById, deleteAsset } from "@/lib/assets/repository";

export async function GET(
  request: NextRequest,
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

    const asset = await getAssetById(supabase, assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Ensure authorization
    if (asset.userId !== user.id) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(asset);

  } catch (error) {
    console.error("[api-asset-get] Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
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

    const asset = await getAssetById(supabase, assetId);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Ensure authorization
    if (asset.userId !== user.id) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle storage cleanup if needed (e.g. if it has a storageKey)
    if (asset.storageKey) {
      const { error: storageError } = await supabase.storage.from("media").remove([asset.storageKey]);
      if (storageError) {
        console.warn("[api-asset-delete] Storage removal warning:", storageError);
      }
    }

    await deleteAsset(supabase, assetId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[api-asset-delete] Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
