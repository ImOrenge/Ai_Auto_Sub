"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    autoFocus?: boolean;
    disabled?: boolean;
}

export function OTPInput({
    length = 6,
    value,
    onChange,
    onComplete,
    autoFocus = true,
    disabled = false,
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [localValues, setLocalValues] = useState<string[]>(
        Array(length).fill("").map((_, i) => value[i] || "")
    );

    const handleChange = (index: number, val: string) => {
        // Only allow single digit
        const digit = val.replace(/[^0-9]/g, "").slice(0, 1);

        const newValues = [...localValues];
        newValues[index] = digit;
        setLocalValues(newValues);

        const newValue = newValues.join("");
        onChange(newValue);

        // Auto-focus next input
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Call onComplete when all digits are filled
        if (newValues.every((v) => v !== "") && onComplete) {
            onComplete(newValue);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace
        if (e.key === "Backspace") {
            if (!localValues[index] && index > 0) {
                // If current input is empty, focus previous input
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                handleChange(index, "");
            }
        }
        // Handle left arrow
        else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Handle right arrow
        else if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain");
        const digits = pastedData.replace(/[^0-9]/g, "").slice(0, length);

        const newValues = Array(length).fill("");
        digits.split("").forEach((digit, i) => {
            if (i < length) {
                newValues[i] = digit;
            }
        });

        setLocalValues(newValues);
        const newValue = newValues.join("");
        onChange(newValue);

        // Focus the next empty input or the last input
        const nextEmptyIndex = newValues.findIndex((v) => v === "");
        const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
        inputRefs.current[focusIndex]?.focus();

        // Call onComplete if all filled
        if (newValues.every((v) => v !== "") && onComplete) {
            onComplete(newValue);
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {Array(length)
                .fill(0)
                .map((_, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={localValues[index]}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={disabled}
                        autoFocus={autoFocus && index === 0}
                        className="w-12 h-14 text-center text-2xl font-semibold rounded-xl border-2 border-border bg-background/70 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`OTP digit ${index + 1}`}
                    />
                ))}
        </div>
    );
}
