"use client";

import { Plus } from "lucide-react";

interface EmptyDashboardStateProps {
    onCreateProject: () => void;
}

export function EmptyDashboardState({ onCreateProject }: EmptyDashboardStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-card border border-dashed rounded-none text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Plus className="size-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                Start by creating your first project to organize your videos and subtitles.
            </p>
            <button
                onClick={onCreateProject}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-none font-medium hover:bg-primary/90 transition-colors"
            >
                <Plus className="size-4" />
                Create Project
            </button>
        </div>
    );
}
