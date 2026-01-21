import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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
    const { name, auto_run, priority_mode } = body;

    // Update queue settings
    const { data, error } = await supabase
      .from('queues')
      .update({
        name: name || undefined,
        auto_run: auto_run !== undefined ? auto_run : undefined,
        priority_mode: priority_mode || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Queue Settings] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    return NextResponse.json({ queue: data });
  } catch (error) {
    console.error("[Queue Settings] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
