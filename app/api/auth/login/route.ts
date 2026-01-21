import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";
const COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json().catch(() => ({}));

    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 모두 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? "로그인을 완료할 수 없습니다. 다시 시도해주세요." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set({
      name: ACCESS_COOKIE,
      value: data.session.access_token,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: data.session.expires_in,
    });
    response.cookies.set({
      name: REFRESH_COOKIE,
      value: data.session.refresh_token,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: COOKIE_MAX_AGE_REFRESH,
    });

    return response;
  } catch (error) {
    console.error("[api/auth/login] unexpected error", error);
    return NextResponse.json(
      { error: "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
