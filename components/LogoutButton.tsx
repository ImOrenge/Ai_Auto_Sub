"use client";

import { useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";

type LogoutButtonProps = {
  isAuthenticated: boolean;
};

export function LogoutButton({ isAuthenticated }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        window.location.href = "/";
      }
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-secondary"
      disabled={isPending}
      onClick={handleClick}
      type="button"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
      로그아웃
    </button>
  );
}
