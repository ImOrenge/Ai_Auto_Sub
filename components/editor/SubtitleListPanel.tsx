"use client";

import { memo, useCallback, useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor, useCueProblems } from "./EditorContext";
import type { SubtitleCue } from "@/lib/jobs/types";

// ============================================================================
// Subtitle List Panel
// ============================================================================

export function SubtitleListPanel() {
    const { cues, selectedCueId, selectCue, setCurrentTime, setIsPlaying } = useEditor();
    const listRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to selected cue
    useEffect(() => {
        if (selectedCueId === null || !listRef.current) return;

        const element = listRef.current.querySelector(`[data-cue-id="${selectedCueId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [selectedCueId]);

    const handleCueClick = useCallback((cue: SubtitleCue) => {
        selectCue(cue.id);
        setCurrentTime(cue.startTime);
        setIsPlaying(false);
    }, [selectCue, setCurrentTime, setIsPlaying]);

    return (
        <div className="flex h-full flex-col border-r bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold">자막 목록</h3>
                    <p className="text-xs text-muted-foreground">{cues.length}개 자막</p>
                </div>
            </div>

            {/* Cue List */}
            <div ref={listRef} className="flex-1 overflow-y-auto">
                {cues.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                        자막이 없습니다
                    </div>
                ) : (
                    <div className="divide-y">
                        {cues.map((cue) => (
                            <CueListItem
                                key={cue.id}
                                cue={cue}
                                isSelected={cue.id === selectedCueId}
                                onClick={() => handleCueClick(cue)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Cue List Item
// ============================================================================

type CueListItemProps = {
    cue: SubtitleCue;
    isSelected: boolean;
    onClick: () => void;
};

const CueListItem = memo(function CueListItem({ cue, isSelected, onClick }: CueListItemProps) {
    const problems = useCueProblems(cue.id);
    const hasProblems = problems.length > 0 && !cue.ignoreProblems;

    return (
        <button
            type="button"
            data-cue-id={cue.id}
            onClick={onClick}
            className={cn(
                "w-full px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                isSelected && "bg-primary/10 hover:bg-primary/15"
            )}
        >
            <div className="flex items-start gap-2">
                {/* Index and Time */}
                <div className="flex-shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">
                        {cue.id}
                    </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                            {formatTime(cue.startTime)} → {formatTime(cue.endTime)}
                        </span>
                        {hasProblems && (
                            <AlertTriangle className="size-3.5 flex-shrink-0 text-amber-500" />
                        )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm">
                        {cue.text || <span className="text-muted-foreground italic">빈 자막</span>}
                    </p>
                </div>
            </div>
        </button>
    );
});

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
}
