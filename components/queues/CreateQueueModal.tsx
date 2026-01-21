'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess?: (queueId: string) => void;
}

export function CreateQueueModal({ isOpen, onClose, projectId, onSuccess }: CreateQueueModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Need a backend endpoint for creating queues
            // Assuming POST /api/queues or /api/projects/:id/queues
            // For now using /api/queues with body including projectId
            const res = await fetch('/api/queues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, projectId }),
            });

            if (!res.ok) {
                throw new Error('Failed to create queue');
            }

            const queue = await res.json();

            setName('');
            onSuccess?.(queue.id);
            onClose();
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl dark:bg-gray-900">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Queue</h3>

                {error && (
                    <div className="mt-2 text-sm text-red-600">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800"
                            placeholder="e.g. Translation Queue"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
