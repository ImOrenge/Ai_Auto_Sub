import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUploadSession } from "@/lib/assets/service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, sizeBytes, mimeType, projectId } = body;

    if (!filename || !sizeBytes || !mimeType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await createUploadSession({
      userId: user.id,
      projectId, // Pass projectId
      filename,
      sizeBytes,
      mimeType,
    });

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create upload session";
    console.error("[upload_session] Failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
