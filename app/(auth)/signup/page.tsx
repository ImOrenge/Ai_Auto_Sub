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
        router.push("/policy-accept?next=/projects&flow=signup");
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
      const nextPath = "/policy-accept?next=/projects&flow=signup";
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
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
    <div className="border border-foreground/10 bg-background p-6 lg:p-10 shadow-lg">
      <div className="space-y-1 text-center mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">New Account</p>
        <h2 className="text-2xl font-black uppercase tracking-tighter">Start AutoSubAI</h2>
        <p className="text-[11px] text-muted-foreground uppercase opacity-70">
          Try translation and caption generation in 3 minutes.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
            Email Address
          </label>
          <input
            className="w-full border border-foreground/10 bg-background px-4 py-3 text-sm outline-none transition focus:border-foreground"
            type="email"
            autoComplete="email"
            placeholder="studio@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
            Password
          </label>
          <div className="flex items-center border border-foreground/10 bg-background px-4">
            <input
              className="w-full bg-transparent py-3 text-sm outline-none"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 chars"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="p-2 text-muted-foreground transition hover:text-foreground"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
            Confirm Password
          </label>
          <div className="flex items-center border border-foreground/10 bg-background px-4">
            <input
              className="w-full bg-transparent py-3 text-sm outline-none"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <button
              className="p-2 text-muted-foreground transition hover:text-foreground"
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
          * At least 8 characters with numbers & symbols recommended.
        </p>
        {message ? (
          <div
            className={`border px-4 py-3 text-[11px] font-bold uppercase tracking-tight ${message.type === "error"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
              }`}
          >
            {message.text}
          </div>
        ) : null}
        <button
          className="flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Create Account
        </button>
        <div className="grid gap-2 md:grid-cols-2">
          <button
            className="flex w-full items-center justify-center gap-2 border border-foreground/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => handleSocialSignup("google")}
            disabled={Boolean(socialLoading) || isSubmitting}
          >
            {socialLoading === "google" ? <Loader2 className="size-4 animate-spin" /> : <Chrome className="size-4" />}
            Google
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 border border-foreground/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={() => handleSocialSignup("github")}
            disabled={Boolean(socialLoading) || isSubmitting}
          >
            {socialLoading === "github" ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
            GitHub
          </button>
        </div>
      </form>
      <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Already have an account?{" "}
        <Link className="text-foreground hover:underline" href="/login">
          Sign In
        </Link>
      </p>
    </div>
  );
}
