import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";
const COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 모두 입력해주세요." }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const session = data.session;
  const requiresEmailConfirmation = !session;
  const response = NextResponse.json({ success: true, requiresEmailConfirmation });

  if (session) {
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: ACCESS_COOKIE,
      value: session.access_token,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: session.expires_in,
    });
    response.cookies.set({
      name: REFRESH_COOKIE,
      value: session.refresh_token,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: COOKIE_MAX_AGE_REFRESH,
    });
  }

  return response;
}
