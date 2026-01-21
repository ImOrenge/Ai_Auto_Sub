import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";
const COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  try {
    const { email, token, type } = await request.json().catch(() => ({}));

    if (!email || !token || !type) {
      return NextResponse.json(
        { error: "이메일, 토큰, 타입을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // Validate type
    if (!["signup", "email", "recovery"].includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 인증 타입입니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type as "signup" | "email" | "recovery",
    });

    if (error || !data.session) {
      console.error("[verify-otp] Error:", error);
      return NextResponse.json(
        {
          error:
            error?.message === "Token has expired or is invalid"
              ? "인증 코드가 만료되었거나 유효하지 않습니다."
              : error?.message || "인증에 실패했습니다.",
        },
        { status: 401 }
      );
    }

    // Set session cookies
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
    console.error("[verify-otp] Unexpected error:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
