import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  console.log("[Admin API] Fetching users...");
  if (!(await isAdmin())) {
    console.warn("[Admin API] Users Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  try {
    // In a real Supabase setup, you might need to query auth.users via RPC or a view
    // if permissions on auth.users are restricted even to Service Role in some contexts.
    // Here we assume getSupabaseServer (Service Role) can pull from auth.users.
    
    // For this implementation, we will fetch users from auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) throw error;

    return NextResponse.json({ 
      users: users.users.map(u => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        isSuperAdmin: !!u.app_metadata?.is_super_admin
      }))
    });
  } catch (error: any) {
    console.error("[Admin API] Users Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
