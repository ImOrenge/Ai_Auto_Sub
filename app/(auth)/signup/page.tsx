"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chrome, Eye, EyeOff, Github, Loader2 } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type SocialProvider = Extract<Provider, "google" | "github">;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!email || !password || !confirmPassword) {
      setMessage({ type: "error", text: "모든 필드를 빠짐없이 입력해주세요." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "비밀번호가 서로 일치하지 않습니다." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let payload: { error?: string; requiresEmailConfirmation?: boolean } = {};
      if (responseText) {
        try {
          payload = JSON.parse(responseText) as { error?: string; requiresEmailConfirmation?: boolean };
        } catch {
          payload = {};
        }
      }

      if (!response.ok) {
        const fallbackMessage =
          payload.error ?? response.statusText ?? "회원가입 중 알 수 없는 오류가 발생했습니다.";
        throw new Error(fallbackMessage);
      }

      if (payload.requiresEmailConfirmation) {
        setMessage({
          type: "success",
          text: "인증 메일이 발송되었습니다. 이메일을 확인하고 인증 코드를 입력해주세요.",
        });
        // Redirect to verification page
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setMessage({
          type: "success",
          text: "가입이 완료되었습니다. 잠시 후 프로젝트 목록으로 이동합니다.",
        });
        router.push("/projects");
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignup = async (provider: SocialProvider) => {
    setMessage(null);
    setSocialLoading(provider);
    try {
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/projects`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "소셜 가입 중 오류가 발생했습니다.",
      });
      setSocialLoading(null);
    }
  };

  return (
    <div className="rounded-3xl border bg-card/80 p-6 shadow-sm lg:p-8">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-primary">새 계정 만들기</p>
        <h2 className="text-2xl font-semibold tracking-tight">3분 만에 AutoSubAI 시작</h2>
        <p className="text-sm text-muted-foreground">
          이메일 인증만 완료하면 바로 번역, 자막 생성, 자막 삽입 영상 만들기를 체험할 수 있습니다.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm font-medium text-foreground">
          이메일 주소
          <input
            className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm outline-none ring-primary/20 transition focus:ring-2"
            type="email"
            autoComplete="email"
            placeholder="studio@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          비밀번호
          <div className="flex items-center rounded-2xl border border-border bg-background/70 px-4">
            <input
              className="w-full bg-transparent py-3 text-sm outline-none"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="최소 8자"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="p-2 text-muted-foreground transition hover:text-foreground"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          비밀번호 확인
          <div className="flex items-center rounded-2xl border border-border bg-background/70 px-4">
            <input
              className="w-full bg-transparent py-3 text-sm outline-none"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="한 번 더 입력해주세요"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <button
              className="p-2 text-muted-foreground transition hover:text-foreground"
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>
        <p className="text-xs text-muted-foreground">
          * 안전을 위해 특수문자/숫자를 포함한 8자 이상의 비밀번호를 권장합니다.
        </p>
        {message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${message.type === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-500"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              }`}
          >
            {message.text}
          </div>
        ) : null}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          계정 만들기
        </button>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => handleSocialSignup("google")}
            disabled={Boolean(socialLoading) || isSubmitting}
          >
            {socialLoading === "google" ? <Loader2 className="size-4 animate-spin" /> : <Chrome className="size-4" />}
            Google로 가입하기
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => handleSocialSignup("github")}
            disabled={Boolean(socialLoading) || isSubmitting}
          >
            {socialLoading === "github" ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
            GitHub로 가입하기
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/login">
          로그인하기
        </Link>
      </p>
    </div>
  );
}
