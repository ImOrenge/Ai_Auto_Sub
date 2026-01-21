"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Eye, EyeOff, Github, Loader2 } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type SocialProvider = Extract<Provider, "google" | "github">;

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const redirectedFrom = searchParams.get("redirectedFrom") || "/projects";

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);

        if (!email || !password) {
            setMessage({ type: "error", text: "이메일과 비밀번호를 입력해주세요." });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const responseText = await response.text();
            let payload: { error?: string } = {};
            try {
                payload = JSON.parse(responseText);
            } catch {
                // failed to parse
            }

            if (!response.ok) {
                throw new Error(payload.error || "로그인에 실패했습니다.");
            }

            setMessage({ type: "success", text: "로그인 성공! 이동 중..." });
            router.push(redirectedFrom);
            router.refresh();

        } catch (error) {
            console.error(error);
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialSignup = async (provider: SocialProvider) => {
        setMessage(null);
        setSocialLoading(provider);
        try {
            const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectedFrom)}`;
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
                text: error instanceof Error ? error.message : "소셜 로그인 중 오류가 발생했습니다.",
            });
            setSocialLoading(null);
        }
    };

    return (
        <div className="rounded-3xl border bg-card/80 p-6 shadow-sm lg:p-8">
            <div className="space-y-1 text-center">
                <p className="text-sm font-semibold text-primary">돌아오신 것을 환영합니다</p>
                <h2 className="text-2xl font-semibold tracking-tight">로그인</h2>
                <p className="text-sm text-muted-foreground">
                    계정 정보를 입력하고 대시보드로 이동하세요.
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
                            autoComplete="current-password"
                            placeholder=""
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
                    로그인
                </button>

                <div className="grid gap-3 md:grid-cols-2">
                    <button
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => handleSocialSignup("google")}
                        disabled={Boolean(socialLoading) || isSubmitting}
                    >
                        {socialLoading === "google" ? <Loader2 className="size-4 animate-spin" /> : <Chrome className="size-4" />}
                        Google
                    </button>
                    <button
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        onClick={() => handleSocialSignup("github")}
                        disabled={Boolean(socialLoading) || isSubmitting}
                    >
                        {socialLoading === "github" ? <Loader2 className="size-4 animate-spin" /> : <Github className="size-4" />}
                        GitHub
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                계정이 없으신가요?{" "}
                <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/signup">
                    회원가입하기
                </Link>
            </p>
        </div>
    );
}
