import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { POLICY_METADATA_VERSION_KEY, POLICY_VERSION } from '@/lib/policy'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected paths that require authentication
  const PROTECTED_PATHS = ["/dashboard", "/jobs", "/uploads", "/usage", "/billing", "/settings", "/glossary", "/projects", "/policy-accept"];

  // Auth paths (login, signup, verify-email) - redirect to dashboard if already logged in
  const AUTH_PATHS = ["/login", "/signup", "/verify-email"];

  const { pathname } = request.nextUrl;
  const isPolicyPath = pathname === "/policy-accept";

  const isProtectedPath = PROTECTED_PATHS.some(
    (protectedPath) => pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
  );

  const isAuthPath = AUTH_PATHS.some((authPath) => pathname === authPath);

  const policyVersion = user?.user_metadata?.[POLICY_METADATA_VERSION_KEY];
  const hasAcceptedPolicy = policyVersion === POLICY_VERSION;

  if (user && !hasAcceptedPolicy && !isPolicyPath) {
    const policyUrl = new URL("/policy-accept", request.url);
    const nextPath = `${pathname}${request.nextUrl.search}`;
    policyUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(policyUrl);
  }

  if (!user && isProtectedPath) {
     const loginUrl = new URL("/login", request.url);
     loginUrl.searchParams.set("redirectedFrom", pathname);
     return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // If user is accessing root, allow them to see the landing page
  // if (user && pathname === "/") {
  //     return NextResponse.redirect(new URL("/projects", request.url));
  // }

  return response
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/jobs/:path*",
    "/uploads/:path*",
    "/usage/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/glossary/:path*",
    "/login",
    "/signup",
    "/verify-email",
    "/policy-accept",
  ],
};
