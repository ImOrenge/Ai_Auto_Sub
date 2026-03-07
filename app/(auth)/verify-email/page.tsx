"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { OTPInput } from "@/components/auth/OTPInput";
import { ResendButton } from "@/components/auth/ResendButton";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Redirect if no email parameter
    useEffect(() => {
        if (!email) {
            router.push("/signup");
        }
    }, [email, router]);

    const handleVerify = async (code: string) => {
        setMessage(null);
        setIsVerifying(true);

        try {
            const response = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    token: code,
                    type: "signup",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "인증에 실패했습니다.");
            }

            setIsSuccess(true);
            setMessage({ type: "success", text: "이메일 인증이 완료되었습니다!" });

            // Redirect to projects after 1.5 seconds
            setTimeout(() => {
                router.push("/policy-accept?next=/projects&flow=signup");
                router.refresh();
            }, 1500);
        } catch (error) {
            console.error("Verification error:", error);
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "인증 중 오류가 발생했습니다.",
            });
            setOtp(""); // Clear OTP input on error
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        const response = await fetch("/api/auth/resend-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                type: "signup",
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "재전송에 실패했습니다.");
        }
    };

    if (!email) {
        return null;
    }

    return (
        <div className="border border-foreground/10 bg-background p-6 lg:p-10 shadow-lg">
            <div className="space-y-1 text-center mb-8">
                <div className="flex justify-center mb-8">
                    {isSuccess ? (
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                    ) : (
                        <Mail className="w-16 h-16 text-primary" />
                    )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Email Verification</p>
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                    {isSuccess ? "VERIFIED!" : "ENTER CODE"}
                </h2>
                <div className="pt-2">
                    {isSuccess ? (
                        <p className="text-[11px] text-muted-foreground uppercase opacity-70">Redirecting to projects...</p>
                    ) : (
                        <>
                            <p className="text-[11px] text-foreground font-bold uppercase tracking-widest">{email}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Please enter the 6-digit code sent to your email.</p>
                        </>
                    )}
                </div>
            </div>

            {!isSuccess && (
                <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <OTPInput
                            length={6}
                            value={otp}
                            onChange={setOtp}
                            onComplete={handleVerify}
                            disabled={isVerifying}
                            autoFocus
                        />

                        {message && (
                            <div
                                className={`border px-4 py-3 text-[11px] font-bold uppercase tracking-tight text-center ${message.type === "error"
                                    ? "border-destructive bg-destructive/10 text-destructive"
                                    : "border-foreground bg-foreground/10 text-foreground"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => handleVerify(otp)}
                            disabled={otp.length !== 6 || isVerifying}
                            className="flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                            VERIFY NOW
                        </button>

                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                Didn't receive the code?
                            </p>
                            <ResendButton onResend={handleResend} cooldownSeconds={60} disabled={isVerifying} />
                        </div>
                    </div>
                </div>
            )}

            <p className="mt-8 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Wrong email?{" "}
                <Link className="text-foreground hover:underline" href="/signup">
                    Re-signup
                </Link>
            </p>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[400px] border border-foreground/10 bg-background">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
