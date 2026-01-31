"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Eye, EyeOff, Github, Loader2 } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type SocialProvider = Extract<Provider, "google" | "github">;

function LoginForm() {
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
            setMessage({ type: "error", text: "Please enter your email and password." });
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
            } catch { }

            if (!response.ok) {
                throw new Error(payload.error || "Login failed.");
            }

            setMessage({ type: "success", text: "Login successful! Redirecting..." });
            router.push(redirectedFrom);
            router.refresh();

        } catch (error) {
            console.error(error);
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "An error occurred during login.",
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
            if (error) throw error;
        } catch (error) {
            console.error(error);
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "An error occurred during social login.",
            });
            setSocialLoading(null);
        }
    };

    return (
        <div className="border border-foreground/10 bg-background p-6 lg:p-10">
            <div className="space-y-1 text-center mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Welcome Back</p>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Sign In</h2>
                <p className="text-[11px] text-muted-foreground uppercase opacity-70">
                    Access your dashboard and studio.
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
                        placeholder="email@example.com"
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
                            autoComplete="current-password"
                            placeholder="••••••••"
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

                {message ? (
                    <div
                        className={`border px-4 py-3 text-[11px] font-bold uppercase tracking-tight ${message.type === "error"
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-foreground bg-foreground/10 text-foreground"
                            }`}
                    >
                        {message.text}
                    </div>
                ) : null}

                <button
                    className="flex w-full items-center justify-center gap-2 bg-foreground px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-background transition hover:bg-foreground/90 disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    SIGN IN
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-foreground/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="bg-background px-2 text-muted-foreground">OR CONTINUE WITH</span>
                    </div>
                </div>

                <div className="grid gap-2 grid-cols-2">
                    <button
                        className="flex w-full items-center justify-center gap-2 border border-foreground/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition hover:bg-muted disabled:opacity-50"
                        type="button"
                        onClick={() => handleSocialSignup("google")}
                        disabled={Boolean(socialLoading) || isSubmitting}
                    >
                        {socialLoading === "google" ? <Loader2 className="size-4 animate-spin" /> : <Chrome className="size-4" />}
                        Google
                    </button>
                    <button
                        className="flex w-full items-center justify-center gap-2 border border-foreground/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition hover:bg-muted disabled:opacity-50"
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
                New here?{" "}
                <Link className="text-foreground hover:underline" href="/signup">
                    Create Account
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20 border border-foreground/10 bg-background">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
