import { NextResponse } from "next/server";
import { getOrCreateDefaultQueue } from "@/lib/queues/repository";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queue = await getOrCreateDefaultQueue(user.id);

    return NextResponse.json(queue);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
