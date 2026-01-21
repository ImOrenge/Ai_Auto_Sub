import Link from "next/link";
import type { ReactNode } from "react";
import { PageContainer } from "@/components/PageContainer";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <PageContainer className="items-center justify-center gap-10">
      <div className="text-center">
        <Link className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground" href="/">
          AutoSubAI
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">자막 자동화를 시작하기 전에 로그인하세요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          하나의 계정으로 URL 업로드, 자막 생성, 번역 관리까지 모두 이어집니다.
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </PageContainer>
  );
}
