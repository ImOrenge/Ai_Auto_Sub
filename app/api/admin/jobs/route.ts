import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  console.log("[Admin API] Fetching jobs...");
  if (!(await isAdmin())) {
    console.warn("[Admin API] Jobs Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ jobs: data || [] });
  } catch (error: any) {
    console.error("[Admin API] Jobs Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
