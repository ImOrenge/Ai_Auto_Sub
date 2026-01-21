'use client';

import { useState } from 'react';

interface QueueSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    queue: {
        id: string;
        name: string;
        auto_run?: boolean;
        priority_mode?: 'fifo' | 'manual' | 'priority';
        status?: 'active' | 'paused';
    };
    onSave: (settings: {
        name: string;
        auto_run: boolean;
        priority_mode: 'fifo' | 'manual' | 'priority';
    }) => Promise<void>;
}

export function QueueSettingsModal({ isOpen, onClose, queue, onSave }: QueueSettingsModalProps) {
    const [name, setName] = useState(queue.name || '');
    const [autoRun, setAutoRun] = useState(queue.auto_run || false);
    const [priorityMode, setPriorityMode] = useState<'fifo' | 'manual' | 'priority'>(
        queue.priority_mode || 'fifo'
    );
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({ name, auto_run: autoRun, priority_mode: priorityMode });
            onClose();
        } catch (error) {
            console.error('Failed to save queue settings:', error);
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Queue Settings
                </h3>

                <div className="space-y-4 mb-6">
                    {/* Queue Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Queue Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter queue name"
                        />
                    </div>

                    {/* Auto-run Toggle */}
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Auto-run
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Automatically start when drafts are added
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAutoRun(!autoRun)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRun ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRun ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Priority Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Priority Mode
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="priority"
                                    checked={priorityMode === 'fifo'}
                                    onChange={() => setPriorityMode('fifo')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    FIFO (First In, First Out)
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="priority"
                                    checked={priorityMode === 'manual'}
                                    onChange={() => setPriorityMode('manual')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Manual (Drag to reorder)
                                </span>
                            </label>
                            <label className="flex items-center cursor-pointer opacity-50 cursor-not-allowed">
                                <input
                                    type="radio"
                                    name="priority"
                                    checked={priorityMode === 'priority'}
                                    onChange={() => setPriorityMode('priority')}
                                    disabled
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">
                                    Priority (High/Normal/Low) - Coming soon
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
