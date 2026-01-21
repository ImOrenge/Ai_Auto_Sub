"use client";

import { useState } from "react";
import { Play, Trash2, Settings2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetRecord } from "@/lib/assets/types";

interface DraftQueuePanelProps {
    items: AssetRecord[]; // In reality, queue items wrapper
    onRemoveItem: (id: string) => void;
    onRunQueue: () => void;
    onClearQueue: () => void;
}

export function DraftQueuePanel({
    items,
    onRemoveItem,
    onRunQueue,
    onClearQueue
}: DraftQueuePanelProps) {
    if (items.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground border-l border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 rounded-l-none rounded-xl md:rounded-l-none">
                <div className="size-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Settings2 className="size-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Draft Queue Empty</h3>
                <p className="text-sm mb-4">Select assets to add to queue.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Draft Queue</span>
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {items.length}
                    </span>
                </div>
                <Button variant="ghost" size="xs" onClick={onClearQueue} className="text-muted-foreground hover:text-red-500 h-7 text-xs">
                    Clear
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {items.map((item) => (
                    <div key={item.id} className="group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                        <GripVertical className="size-4 text-gray-300 mt-1 cursor-grab" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate leading-tight mb-1">
                                {item.filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{(item.meta?.size ? (item.meta.size / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown size')}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3 bg-gray-50/30 dark:bg-gray-900/10">
                {/* Minimal Config Summary could go here */}

                <Button
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md border-0"
                    size="lg"
                    onClick={onRunQueue}
                >
                    <Play className="size-4 fill-white" />
                    Run Queue
                </Button>
            </div>
        </div>
    );
}
