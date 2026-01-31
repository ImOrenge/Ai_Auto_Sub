import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUploadSession } from "@/lib/assets/service";
import { MOCK_USER_ID } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { filename, sizeBytes, mimeType, projectId } = body;

    if (!filename || !sizeBytes || !mimeType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const effectiveUserId = user?.id ?? MOCK_USER_ID;
    const effectiveProjectId = user ? projectId : undefined;

    const session = await createUploadSession({
      userId: effectiveUserId,
      projectId: effectiveProjectId, // Prevent linking anonymous uploads to real projects
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
