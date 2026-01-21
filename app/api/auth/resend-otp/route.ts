import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json().catch(() => ({}));

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    const verificationType = type || "signup";

    const supabase = getSupabaseServer();

    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error("[resend-otp] Error:", error);
      
      // Handle rate limit error
      if (error.message?.includes("already been sent")) {
        return NextResponse.json(
          { error: "인증 메일은 60초마다 한 번씩만 전송할 수 있습니다." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: error.message || "이메일 재전송에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[resend-otp] Unexpected error:", error);
    return NextResponse.json(
      { error: "이메일 재전송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
