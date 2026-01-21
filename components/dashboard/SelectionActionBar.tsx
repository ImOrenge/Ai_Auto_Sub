"use client";

import { cn } from "@/lib/utils";
import { X, PlayCircle, PlusSquare } from "lucide-react";

type SelectionActionBarProps = {
    selectedCount: number;
    onClearSelection: () => void;
    onAddToQueue: () => void;
    onRunImmediately?: () => void;
};

export function SelectionActionBar({ selectedCount, onClearSelection, onAddToQueue, onRunImmediately }: SelectionActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
            <div className="flex items-center justify-between gap-4 rounded-full border border-border bg-foreground/90 p-2 pl-6 text-background shadow-xl backdrop-blur-sm transition-all animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{selectedCount}개 선택됨</span>
                    <div className="h-4 w-px bg-background/20" />
                    <button onClick={onClearSelection} className="text-xs hover:text-primary-foreground/80 underline-offset-4 hover:underline">
                        취소
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onAddToQueue}
                        className="inline-flex items-center gap-2 rounded-full bg-background/20 px-4 py-2 text-sm font-medium hover:bg-background/30 transition-colors"
                    >
                        <PlusSquare className="size-4" />
                        큐에 담기
                    </button>

                    {onRunImmediately && (
                        <button
                            onClick={onRunImmediately}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <PlayCircle className="size-4" />
                            바로 실행
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
