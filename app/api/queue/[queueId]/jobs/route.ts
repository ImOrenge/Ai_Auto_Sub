import { NextResponse } from "next/server";
import { listDraftJobs, createDraftJob } from "@/lib/queues/repository";
import { createClient } from "@/lib/supabase/server";

export async function getParams(params: Promise<{ queueId: string }>) {
    return await params;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { queueId } = await params;
    const jobs = await listDraftJobs(queueId);

    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { queueId } = await params;
    const body = await request.json();
    const { assetIds } = body;

    if (!Array.isArray(assetIds)) {
      return NextResponse.json({ error: "assetIds must be an array" }, { status: 400 });
    }

    // Add each asset as a job
    // Ideally this should be a bulk insert in the repo, but for now we loop
    // or we modify the repo to accept array. Repo currently supports single.
    // Let's loop here for MVP scope, or update repo? Loop is fine for <50 items.
    
    await Promise.all(assetIds.map(assetId => 
        createDraftJob({
            userId: user.id,
            queueId,
            assetId: assetId,
        })
    ));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
