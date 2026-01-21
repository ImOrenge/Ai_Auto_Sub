"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadButtonProps = {
    onUploadStart: (files: File[]) => void;
    className?: string;
};

export function UploadButton({ onUploadStart, className }: UploadButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            onUploadStart(files);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className={cn("", className)}>
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*,audio/*"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                <Upload className="size-4" />
                <span>업로드</span>
            </button>
        </div>
    );
}
