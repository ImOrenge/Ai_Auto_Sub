"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { POLICY_LINK } from "@/lib/policy";

const DEFAULT_NEXT_PATH = "/projects";

export function PolicyAcceptClient({
    nextParam,
    flow
}: {
    nextParam: string | null,
    flow: string | null
}) {
    const router = useRouter();
    const [hasAgreed, setHasAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const nextPath = nextParam?.startsWith("/") ? nextParam : DEFAULT_NEXT_PATH;
    const isSignupFlow = flow === "signup";

    const handleAccept = async () => {
        if (!hasAgreed || isSubmitting) {
            return;
        }

        setMessage(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/accept-policy", {
                method: "POST",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || "Policy acceptance failed.");
            }

            router.replace(nextPath);
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Policy acceptance failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (isCancelling) {
            return;
        }

        setMessage(null);
        setIsCancelling(true);

        try {
            const response = await fetch(isSignupFlow ? "/api/auth/cancel-signup" : "/api/auth/logout", {
                method: "POST",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.error || "Request failed.");
            }

            router.replace(isSignupFlow ? "/signup" : "/login");
            router.refresh();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Request failed.");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <PageContainer className="items-center justify-center">
            <Dialog open>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Policy Agreement Required</DialogTitle>
                        <DialogDescription>
                            Please review the policy and agree before continuing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <label className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-4 text-sm">
                            <input
                                className="mt-1 size-4"
                                type="checkbox"
                                checked={hasAgreed}
                                onChange={(event) => setHasAgreed(event.target.checked)}
                            />
                            <span>
                                I have read and agree to the policy.{" "}
                                <Link
                                    className="font-semibold text-primary underline-offset-4 hover:underline"
                                    href={POLICY_LINK}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View policy
                                </Link>
                                .
                            </span>
                        </label>

                        {message ? (
                            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                                {message}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-3">
                        <button
                            className="flex w-full items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting || isCancelling}
                        >
                            {isSignupFlow ? "Cancel signup" : "Log out"}
                        </button>
                        <button
                            className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            type="button"
                            onClick={handleAccept}
                            disabled={!hasAgreed || isSubmitting || isCancelling}
                        >
                            Agree and continue
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
