import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct uploads are deprecated. Use /api/uploads/session and /api/uploads/complete.",
    },
    { status: 410 },
  );
}
