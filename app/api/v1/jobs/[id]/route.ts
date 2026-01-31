import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const { id: jobId } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
  }

  const { id: jobId } = await params;

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
