import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

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
  const PROTECTED_PATHS = ["/jobs", "/uploads", "/usage", "/billing", "/settings", "/glossary", "/projects"];

  // Auth paths (login, signup, verify-email) - redirect to dashboard if already logged in
  const AUTH_PATHS = ["/login", "/signup", "/verify-email"];

  const { pathname } = request.nextUrl;

  const isProtectedPath = PROTECTED_PATHS.some(
    (protectedPath) => pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
  );

  const isAuthPath = AUTH_PATHS.some((authPath) => pathname === authPath);

  if (!user && isProtectedPath) {
     const loginUrl = new URL("/login", request.url);
     loginUrl.searchParams.set("redirectedFrom", pathname);
     return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath) {
    return NextResponse.redirect(new URL("/projects", request.url));
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
  ],
};
