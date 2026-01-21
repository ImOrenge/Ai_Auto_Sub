"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { AlertTriangle, Scissors, WrapText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor, useSelectedCue, useCueProblems } from "./EditorContext";
import { getCueStats, autoWrapLines } from "@/lib/subtitle/validation";

// ============================================================================
// Text Edit Panel
// ============================================================================

export function TextEditPanel() {
    const { updateCue, currentTime, splitCue } = useEditor();
    const selectedCue = useSelectedCue();
    const problems = useCueProblems(selectedCue?.id ?? -1);

    const [localText, setLocalText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync local text with selected cue
    useEffect(() => {
        if (selectedCue) {
            setLocalText(selectedCue.text);
        } else {
            setLocalText("");
        }
    }, [selectedCue?.id, selectedCue?.text]);

    // Handle text change with debounce
    const handleTextChange = useCallback((text: string) => {
        setLocalText(text);
        if (selectedCue) {
            updateCue(selectedCue.id, { text });
        }
    }, [selectedCue, updateCue]);

    // Auto-wrap text
    const handleAutoWrap = useCallback(() => {
        if (!selectedCue) return;
        const wrapped = autoWrapLines(localText);
        setLocalText(wrapped);
        updateCue(selectedCue.id, { text: wrapped });
    }, [selectedCue, localText, updateCue]);

    // Split cue at current time
    const handleSplit = useCallback(() => {
        if (!selectedCue) return;
        if (currentTime > selectedCue.startTime && currentTime < selectedCue.endTime) {
            splitCue(selectedCue.id, currentTime);
        }
    }, [selectedCue, currentTime, splitCue]);

    // Calculate stats
    const stats = selectedCue ? getCueStats(selectedCue) : null;

    if (!selectedCue) {
        return (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                자막을 선택하세요
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">텍스트 편집</h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleAutoWrap}
                        className="rounded p-1.5 hover:bg-secondary"
                        title="자동 줄바꿈"
                    >
                        <WrapText className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleSplit}
                        disabled={currentTime <= selectedCue.startTime || currentTime >= selectedCue.endTime}
                        className={cn(
                            "rounded p-1.5 hover:bg-secondary",
                            (currentTime <= selectedCue.startTime || currentTime >= selectedCue.endTime) &&
                            "opacity-50 cursor-not-allowed"
                        )}
                        title="현재 위치에서 분할"
                    >
                        <Scissors className="size-4" />
                    </button>
                </div>
            </div>

            {/* Timing Info */}
            <div className="border-b px-4 py-2">
                <div className="flex items-center gap-4 text-xs">
                    <div>
                        <span className="text-muted-foreground">시작:</span>{" "}
                        <span className="font-mono">{formatTime(selectedCue.startTime)}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">종료:</span>{" "}
                        <span className="font-mono">{formatTime(selectedCue.endTime)}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">길이:</span>{" "}
                        <span className="font-mono">{stats?.duration.toFixed(1)}초</span>
                    </div>
                </div>
            </div>

            {/* Text Editor */}
            <div className="flex-1 p-4">
                <textarea
                    ref={textareaRef}
                    value={localText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="h-full w-full resize-none rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="자막 텍스트를 입력하세요..."
                />
            </div>

            {/* Stats */}
            <div className="border-t px-4 py-3">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                        <span className="text-muted-foreground">글자 수:</span>{" "}
                        <span className={cn(stats && stats.charCount > 84 && "text-amber-500")}>
                            {stats?.charCount ?? 0}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">줄 수:</span>{" "}
                        <span className={cn(stats && stats.lineCount > 2 && "text-amber-500")}>
                            {stats?.lineCount ?? 0}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">읽기 속도:</span>{" "}
                        <span className={cn(stats && stats.charsPerSecond > 25 && "text-amber-500")}>
                            {stats?.charsPerSecond.toFixed(1) ?? 0}자/초
                        </span>
                    </div>
                </div>

                {/* Problems */}
                {problems.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {problems.map((problem, i) => (
                            <div
                                key={`${problem.type}-${i}`}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            >
                                <AlertTriangle className="size-3" />
                                {problem.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}
