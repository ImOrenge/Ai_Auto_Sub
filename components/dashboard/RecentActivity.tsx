"use client";

import React from 'react';
import { JobRecord } from '@/lib/jobs/types';
import { formatDistanceToNow } from 'date-fns';
import { FileVideo, CheckCircle2, AlertCircle, Clock, PlayCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RecentJobsProps {
    jobs: JobRecord[];
    onJobClick?: (jobId: string) => void;
    onDownload?: (jobId: string) => void;
    onRetry?: (jobId: string) => void;
    selectedJobIds?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
}

export function RecentActivity({ jobs, onJobClick, onDownload, onRetry, selectedJobIds = [], onSelectionChange }: RecentJobsProps) {
    const allSelected = jobs.length > 0 && jobs.every(j => selectedJobIds.includes(j.id));
    const isSelectionEnabled = !!onSelectionChange;

    const toggleSelectAll = () => {
        if (allSelected) {
            onSelectionChange?.([]);
        } else {
            onSelectionChange?.(jobs.map(j => j.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedJobIds.includes(id)) {
            onSelectionChange?.(selectedJobIds.filter(pid => pid !== id));
        } else {
            onSelectionChange?.([...selectedJobIds, id]);
        }
    };

    if (jobs.length === 0) {
        return (
            <div className="p-8 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-gray-400">
                <p>아직 실행한 작업이 없습니다.</p>
                <p className="text-sm mt-1">영상을 업로드하고 큐에서 실행해보세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-semibold">최근 작업</h3>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto py-1">
                    모두 보기
                </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 font-medium">
                            <tr>
                                {isSelectionEnabled && (
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="px-4 py-3 pl-6">File Name</th>
                                <th className="px-4 py-3">Queue</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Result</th>
                                <th className="px-4 py-3 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {jobs.map((job) => (
                                <tr
                                    key={job.id}
                                    className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    {isSelectionEnabled && (
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedJobIds.includes(job.id)}
                                                onChange={() => toggleSelect(job.id)}
                                            />
                                        </td>
                                    )}
                                    <td className="px-4 py-3 pl-6 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 overflow-hidden relative w-10 h-10 flex items-center justify-center">
                                                {job.asset?.thumbnailUrl ? (
                                                    <img
                                                        src={job.asset.thumbnailUrl}
                                                        alt="Thumbnail"
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <FileVideo className="size-4" />
                                                )}
                                            </div>
                                            <div className="truncate">
                                                {/* Using assetId as placeholder if filename not populated directly, usually need join */}
                                                {/* Assuming job.asset?.filename or similar structure if populated, otherwise ID */}
                                                <span className="block truncate">{job.asset?.filename || job.assetId || job.id.slice(0, 8)}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(() => {
                                                        const date = new Date(job.createdAt);
                                                        return isNaN(date.getTime())
                                                            ? '-'
                                                            : formatDistanceToNow(date, { addSuffix: true });
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs">
                                            {(job.queueId || 'No Queue').slice(0, 8)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {job.status === 'done' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="size-3.5" /> Done
                                                </span>
                                            )}
                                            {job.status === 'processing' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    <Clock className="size-3.5 animate-pulse" /> {job.progress ?? 0}%
                                                </span>
                                            )}
                                            {job.status === 'uploading' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                    <Clock className="size-3.5 animate-pulse" /> Uploading {Math.round(job.progress || 0)}%
                                                </span>
                                            )}
                                            {job.status === 'error' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <AlertCircle className="size-3.5" /> Failed
                                                </span>
                                            )}
                                            {job.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                    <Clock className="size-3.5" /> Queued
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {job.status === 'done' ? (
                                            <span>
                                                {(() => {
                                                    const date = new Date(job.updatedAt);
                                                    return isNaN(date.getTime())
                                                        ? '-'
                                                        : `${formatDistanceToNow(date)} ago`;
                                                })()}
                                            </span>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right pr-6">
                                        {job.status === 'done' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDownload?.(job.id)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Download className="size-4 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" />
                                            </Button>
                                        )}
                                        {job.status === 'error' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRetry?.(job.id)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <PlayCircle className="size-4 text-red-500 hover:text-red-700" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

