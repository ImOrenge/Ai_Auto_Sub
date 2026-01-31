"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientExportOverlayProps {
    progress: number;
    status: string;
    previewImageUrl?: string | null;
    onCancel: () => void;
}

export function ClientExportOverlay({ progress, status, previewImageUrl, onCancel }: ClientExportOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 bg-card border rounded-3xl shadow-2xl space-y-6">
                <div className="space-y-2 text-center">
                    <h3 className="text-2xl font-bold">Local Rendering</h3>
                    <p className="text-muted-foreground">{status}</p>
                </div>

                {previewImageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-inner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewImageUrl}
                            alt="Rendering preview"
                            className="h-full w-full object-contain"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-primary/80 text-[10px] text-white rounded-md font-bold uppercase tracking-wider">
                            Live
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="h-4 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>{Math.floor(progress * 100)}%</span>
                        <span>Do not close this tab</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button variant="outline" onClick={onCancel} className="rounded-xl">
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
