import { NextResponse } from "next/server";
import { processJob } from "@/lib/jobs/processJob";
import { requireJob } from "@/lib/jobs/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const job = await requireJob(id);

    if (job.status !== "pending") {
      return NextResponse.json(
        { error: "이미 처리 중이거나 완료된 작업입니다." },
        { status: 400 },
      );
    }

    void processJob(id).catch((error) => {
      console.error(`[job:start] Failed to start job ${id}`, error);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "작업을 시작할 수 없습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
