"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ResendButtonProps {
    onResend: () => Promise<void>;
    cooldownSeconds?: number;
    disabled?: boolean;
}

export function ResendButton({
    onResend,
    cooldownSeconds = 60,
    disabled = false,
}: ResendButtonProps) {
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const canResend = countdown === 0 && !isResending && !disabled;

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResend = async () => {
        if (!canResend) return;

        setMessage(null);
        setIsResending(true);

        try {
            await onResend();
            setCountdown(cooldownSeconds);
            setMessage({ type: "success", text: "인증 메일이 재전송되었습니다." });

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "재전송 중 오류가 발생했습니다.",
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className="text-sm font-medium text-primary hover:underline underline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline transition-opacity flex items-center gap-2"
            >
                {isResending && <Loader2 className="w-3 h-3 animate-spin" />}
                {countdown > 0 ? `재전송 (${countdown}초 후)` : "인증 메일 재전송"}
            </button>

            {message && (
                <p
                    className={`text-xs ${message.type === "error" ? "text-red-500" : "text-emerald-600"
                        }`}
                >
                    {message.text}
                </p>
            )}
        </div>
    );
}
