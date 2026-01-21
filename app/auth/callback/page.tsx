"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">소셜 로그인 중 오류가 발생했습니다</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Link
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          href="/login"
        >
          로그인 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">소셜 로그인 세션을 준비하고 있습니다...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
