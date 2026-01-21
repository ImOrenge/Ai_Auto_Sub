import { NextResponse } from "next/server";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";
const COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  const { accessToken, refreshToken, expiresIn } = await request.json().catch(() => ({}));

  if (!accessToken || !refreshToken || !expiresIn) {
    return NextResponse.json({ error: "토큰 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: ACCESS_COOKIE,
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: Number(expiresIn),
  });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: COOKIE_MAX_AGE_REFRESH,
  });

  return response;
}
