"use client";

import { RotateCcw, Trash2, XCircle } from "lucide-react";

type JobBulkActionBarProps = {
    selectedCount: number;
    onClearSelection: () => void;
    onRetry: () => void;
    onCancel: () => void;
    onDelete: () => void;
    loadingAction?: string | null;
};

export function JobBulkActionBar({
    selectedCount,
    onClearSelection,
    onRetry,
    onCancel,
    onDelete,
    loadingAction
}: JobBulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
            <div className="flex items-center justify-between gap-4 rounded-full border border-border bg-foreground/90 p-2 pl-6 text-background shadow-xl backdrop-blur-sm transition-all animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{selectedCount} Selected</span>
                    <div className="h-4 w-px bg-background/20" />
                    <button onClick={onClearSelection} className="text-xs hover:text-primary-foreground/80 underline-offset-4 hover:underline">
                        Cancel
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onRetry}
                        className="p-2 hover:bg-background/20 rounded-full transition-colors tooltip"
                        title="Retry Selected"
                    >
                        <RotateCcw className="size-4" />
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-background/20 rounded-full transition-colors"
                        title="Cancel Selected"
                    >
                        <XCircle className="size-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-500/20 text-red-300 rounded-full transition-colors"
                        title="Delete Selected"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
