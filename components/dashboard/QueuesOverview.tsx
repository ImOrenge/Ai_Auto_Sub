"use client";

import React from 'react';
import { QueueRecord } from '@/lib/queues/types';
import { QueueStatusCard } from './QueueStatusCard';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface QueuesOverviewProps {
    queues: (QueueRecord & { draftCount?: number, runningCount?: number })[];
    projectId: string;
    onAddQueue: () => void;
}

export function QueuesOverview({ queues, projectId, onAddQueue }: QueuesOverviewProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold">내 큐 현황</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-auto py-1"
                    onClick={onAddQueue}
                >
                    + 새 큐
                </Button>
            </div>

            <div className="space-y-3">
                {queues.slice(0, 3).map(queue => (
                    <QueueStatusCard
                        key={queue.id}
                        queue={queue}
                        projectId={projectId}
                    />
                ))}

                {queues.length === 0 && (
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-sm text-gray-500 mb-3">생성된 큐가 없습니다.</p>
                        <Button size="sm" onClick={onAddQueue}>큐 만들기</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
