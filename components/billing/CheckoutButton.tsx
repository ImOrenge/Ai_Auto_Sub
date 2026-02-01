"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutButtonProps {
    planId: string;
    isCurrent: boolean;
    className?: string;
    children?: React.ReactNode;
}

export function CheckoutButton({ planId, isCurrent, className, children }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        if (isCurrent || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/checkout/polar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                const errorMsg = data.detail
                    ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
                    : (data.error || "Failed to initiate checkout");

                alert(`Checkout Error: ${errorMsg}`);
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            className={cn(className)}
            disabled={isCurrent || isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                </>
            ) : (
                children || (
                    <>
                        {isCurrent ? "Current Plan" : "Subscribe"}
                        {!isCurrent && <ArrowRight className="size-4" />}
                    </>
                )
            )}
        </button>
    );
}
