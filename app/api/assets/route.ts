import { NextResponse } from "next/server";
import { listAssets, createAsset } from "@/lib/assets/repository";
import { createClient } from "@/lib/supabase/server";
import { CreateAssetParams } from "@/lib/assets/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const cursor = searchParams.get("cursor") ?? undefined;
    const projectId = searchParams.get("projectId") ?? undefined;

    const result = await listAssets(supabase, user.id, projectId, limit, cursor);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list assets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields: either storageKey (upload) or sourceUrl (URL)
    if (!body.storageKey && !body.sourceUrl) {
      return NextResponse.json({ error: "Missing required fields: storageKey or sourceUrl" }, { status: 400 });
    }

    let filename = body.filename;
    let meta = body.meta || {};
    let status = body.status || 'uploaded';

    // If sourceUrl is provided, resolve metadata
    if (body.sourceUrl) {
      try {
        const { resolveMediaSource } = await import("@/lib/media/resolveMediaSource");
        const resolution = await resolveMediaSource(body.sourceUrl);
        
        filename = filename || resolution.filename || "Untitled Video";
        meta = {
          ...meta,
          duration: resolution.durationMs ? resolution.durationMs / 1000 : undefined,
          mimeType: resolution.mimeType,
          kind: resolution.kind,
          title: resolution.metadata?.title,
        };
        status = 'uploaded'; // For URL assets, we consider them 'uploaded' (registered) immediately
      } catch (err) {
        console.error("[Assets] URL resolution failed:", err);
        // We can still create the asset even if resolution fails, or fail the request
        return NextResponse.json({ error: "Failed to resolve media URL: " + (err instanceof Error ? err.message : "Unknown error") }, { status: 400 });
      }
    }

    const params: CreateAssetParams = {
      userId: user.id,
      projectId: body.projectId,
      filename: filename || "Untitled",
      storageKey: body.storageKey || null,
      sourceUrl: body.sourceUrl,
      status: status as any,
      meta,
    };

    const asset = await createAsset(supabase, params);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("[Assets] Create failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
