import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * POST /api/auth/delete-account
 * Permanently deletes the currently logged-in user's account
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = getSupabaseServer();

  try {
    // Delete user's related data first (optional: cascade delete via DB)
    // Projects, assets, jobs will be deleted by cascade if foreign keys are set up
    
    // Delete the user from Supabase Auth
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("[delete-account] Failed to delete user:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Sign out the user's current session
    await supabase.auth.signOut();

    console.info(`[delete-account] User ${user.id} account deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[delete-account] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
