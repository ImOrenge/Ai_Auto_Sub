"use client";

import React from 'react';
import { QueueRecord } from '@/lib/queues/types';
import { Play, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

interface QueueStatusCardProps {
    queue: QueueRecord & {
        draftCount?: number;
        runningCount?: number;
    };
    projectId: string;
}

export function QueueStatusCard({ queue, projectId }: QueueStatusCardProps) {
    const draftCount = queue.draftCount ?? 0;
    const runningCount = queue.runningCount ?? 0;

    return (
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{queue.name}</h4>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                            {queue.language || 'Multi-lang'}
                        </span>
                    </div>
                </div>
                <Link href={`/projects/${projectId}/queues/${queue.id}`}>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreHorizontal className="size-5" />
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                    <span className="block text-2xl font-bold text-purple-600 dark:text-purple-400">{draftCount}</span>
                    <span className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wide">Drafts</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                    <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">{runningCount}</span>
                    <span className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide">Running</span>
                </div>
            </div>

            <Link
                href={`/projects/${projectId}/queues/${queue.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:opacity-90 transition-opacity"
            >
                <Play className="size-4" />
                Open Queue
            </Link>
        </div>
    );
}
