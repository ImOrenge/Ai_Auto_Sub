"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { QueueRecord } from "@/lib/queues/types";

interface QueueQuickChipsProps {
    queues: (QueueRecord & { draftCount?: number; runningCount?: number })[];
    onSelectQueue: (queueId: string) => void;
    className?: string;
}

export function QueueQuickChips({
    queues,
    onSelectQueue,
    className,
}: QueueQuickChipsProps) {
    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none",
                className
            )}
        >
            {queues.map((queue) => {
                // Use realistic or mocked counts if available
                const drafts = queue.draftCount ?? 0;
                const running = queue.runningCount ?? 0;

                return (
                    <button
                        key={queue.id}
                        onClick={() => onSelectQueue(queue.id)}
                        className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                    >
                        <span className="max-w-[100px] truncate">{queue.name}</span>
                        {(drafts > 0 || running > 0) && (
                            <span className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-2 ml-0.5">
                                {drafts > 0 && (
                                    <span className="text-purple-600 dark:text-purple-400">
                                        {drafts} D
                                    </span>
                                )}
                                {running > 0 && (
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {running} R
                                    </span>
                                )}
                            </span>
                        )}
                    </button>
                );
            })}
            {queues.length === 0 && (
                <div className="text-xs text-muted-foreground p-1">No queues in this project</div>
            )}
        </div>
    );
}
