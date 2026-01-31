"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome, Github, Loader2, X } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type SocialProvider = Extract<Provider, "google" | "github">;

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);

        if (!email || !password) {
            setMessage({ type: "error", text: "이메일과 비밀번호를 입력해주세요." });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            setMessage({ type: "success", text: "로그인되었습니다." });
            onOpenChange(false);
            router.push("/projects");
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage({
                type: "error",
                text: "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialLogin = async (provider: SocialProvider) => {
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
                text: "소셜 로그인 중 오류가 발생했습니다.",
            });
            setSocialLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-card border-none shadow-2xl">
                <div className="p-6 space-y-4">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl font-bold tracking-tight">로그인</DialogTitle>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-1 hover:bg-muted/50 transition-colors"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            AutoSubAI에 오신 것을 환영합니다.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                이메일
                            </label>
                            <input
                                type="email"
                                placeholder="studio@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex h-10 w-full border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    비밀번호
                                </label>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="flex h-10 w-full border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        {message && (
                            <div
                                className={`p-3 text-sm ${message.type === "error"
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-emerald-500/10 text-emerald-500"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            로그인
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                또는
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin("google")}
                            disabled={Boolean(socialLoading) || isSubmitting}
                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            {socialLoading === "google" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Chrome className="mr-2 h-4 w-4" />
                            )}
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin("github")}
                            disabled={Boolean(socialLoading) || isSubmitting}
                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                        >
                            {socialLoading === "github" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Github className="mr-2 h-4 w-4" />
                            )}
                            GitHub
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
