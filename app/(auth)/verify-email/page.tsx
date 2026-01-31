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
        <div className="rounded-3xl border bg-card/80 p-6 shadow-sm lg:p-8">
            <div className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    {isSuccess ? (
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                    ) : (
                        <Mail className="w-16 h-16 text-primary" />
                    )}
                </div>
                <p className="text-sm font-semibold text-primary">이메일 인증</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                    {isSuccess ? "인증 완료!" : "인증 코드를 입력하세요"}
                </h2>
                <p className="text-sm text-muted-foreground pt-2">
                    {isSuccess ? (
                        "잠시 후 프로젝트 페이지로 이동합니다..."
                    ) : (
                        <>
                            <span className="font-medium text-foreground">{email}</span>
                            <br />
                            위 이메일로 전송된 6자리 인증 코드를 입력해주세요.
                        </>
                    )}
                </p>
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
                                className={`rounded-2xl border px-4 py-3 text-sm text-center ${message.type === "error"
                                        ? "border-red-500/40 bg-red-500/10 text-red-500"
                                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
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
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                            인증하기
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                인증 메일을 받지 못하셨나요?
                            </p>
                            <ResendButton onResend={handleResend} cooldownSeconds={60} disabled={isVerifying} />
                        </div>
                    </div>
                </div>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
                다른 이메일로 가입하셨나요?{" "}
                <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/signup">
                    회원가입 다시하기
                </Link>
            </p>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
