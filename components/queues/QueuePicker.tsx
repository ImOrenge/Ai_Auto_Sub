'use client';

import React, { useEffect, useState } from 'react';
import { QueueRecord } from '@/lib/queues/types';
import { createClient } from '@/lib/supabase/client';

interface QueuePickerProps {
    projectId: string;
    onSelect: (queueId: string) => void;
    className?: string;
}

export function QueuePicker({ projectId, onSelect, className = '' }: QueuePickerProps) {
    const [queues, setQueues] = useState<QueueRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchQueues() {
            setLoading(true);
            const { data, error } = await supabase
                .from('queues')
                .select('*')
                .eq('project_id', projectId) // Note: using snake_case for DB column
                .order('name');

            if (data) {
                setQueues(data as any);
            }
            setLoading(false);
        }

        if (projectId) {
            fetchQueues();
        }
    }, [projectId, supabase]);

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Queue
            </label>
            <select
                onChange={(e) => onSelect(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                disabled={loading}
            >
                <option value="">Select a queue...</option>
                {queues.map((q) => (
                    <option key={q.id} value={q.id}>
                        {q.name}
                    </option>
                ))}
                {/* <option value="new">+ Create New Queue</option> */}
            </select>
        </div>
    );
}
