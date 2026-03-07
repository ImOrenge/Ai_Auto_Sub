import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import { redirect } from 'next/navigation'

/**
 * Checks if the currently logged-in user is a super admin.
 * This should only be used in Server Components, Server Actions, or API Routes.
 */
export async function isAdmin(): Promise<boolean> {
  console.log("[isAdmin] Checking admin status...");
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error("[isAdmin] Auth error:", error);
      return false;
    }

    if (!user) {
      console.warn("[isAdmin] No user found in session");
      return false
    }

    console.log("[isAdmin] User found:", user.email);
    const isSuperAdmin = !!user.app_metadata?.is_super_admin;
    console.log("[isAdmin] isSuperAdmin:", isSuperAdmin);

    return isSuperAdmin;
  } catch (e: any) {
    console.error("[isAdmin] Crash:", e);
    throw e; // Rethrow to let API route catch it
  }
}

/**
 * Redirects to the dashboard if the user is not an admin.
 */
export async function requireAdmin() {
  const hasAdminAccess = await isAdmin()
  
  if (!hasAdminAccess) {
    redirect('/dashboard')
  }
}
