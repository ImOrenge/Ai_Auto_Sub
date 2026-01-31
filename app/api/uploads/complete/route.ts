import { NextResponse } from "next/server";
import { completeUpload } from "@/lib/assets/service";
import { createClient } from "@/lib/supabase/server";
import { MOCK_USER_ID } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const effectiveUserId = user?.id ?? MOCK_USER_ID;

    const body = await request.json();
    const { assetId } = body;

    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    const asset = await completeUpload(effectiveUserId, assetId);

    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
