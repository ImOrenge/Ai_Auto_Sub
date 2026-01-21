"use client";

import { useEffect, useRef } from "react";
import { SubtitleCue } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { Play, Pause, Clock, Search, RotateCcw } from "lucide-react";
import { formatTimestamp } from "@/lib/subtitle/srt"; // Ensure this import works or copy helper

type CaptionListProps = {
    cues: SubtitleCue[];
    currentTime: number;
    onCueClick: (time: number) => void;
    onCueUpdate: (id: number, text: string) => void;
};

export function CaptionList({ cues, currentTime, onCueClick, onCueUpdate }: CaptionListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active cue
    useEffect(() => {
        const activeIndex = cues.findIndex(c => currentTime >= c.startTime && currentTime <= c.endTime);
        if (activeIndex !== -1 && scrollRef.current) {
            const el = scrollRef.current.children[activeIndex] as HTMLElement;
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime, cues]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary/10 text-primary p-1 rounded"><RotateCcw className="size-4" /></span>
                    Subtitles ({cues.length})
                </h3>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {cues.map((cue) => {
                    const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;
                    return (
                        <div
                            key={cue.id}
                            className={cn(
                                "group relative p-3 rounded-lg border transition-all duration-200",
                                isActive
                                    ? "bg-primary/5 border-primary shadow-sm scale-[1.01]"
                                    : "bg-card border-border hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground font-mono">
                                <div
                                    className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                                    onClick={() => onCueClick(cue.startTime)}
                                >
                                    <Clock className="size-3" />
                                    {formatTimestamp(cue.startTime).split(',')[0]}
                                </div>
                                <span>→</span>
                                <div>{formatTimestamp(cue.endTime).split(',')[0]}</div>
                            </div>

                            <textarea
                                value={cue.text}
                                onChange={(e) => onCueUpdate(cue.id, e.target.value)}
                                className={cn(
                                    "w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed",
                                    isActive ? "text-foreground font-medium" : "text-muted-foreground"
                                )}
                                rows={Math.max(1, cue.text.split('\n').length)}
                            />

                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onCueClick(cue.startTime)}
                                    className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                >
                                    <Play className="size-3 fill-current" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
