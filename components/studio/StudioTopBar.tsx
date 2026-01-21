"use client";

import { useState } from "react";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectSwitcher } from "@/components/dashboard/ProjectSwitcher";
import { Project } from "@/lib/projects/types";

interface StudioTopBarProps {
    project: Project;
    allProjects: Project[]; // For switcher
    onUploadClick: () => void;
    onNewQueueClick: () => void;
}

export function StudioTopBar({
    project,
    allProjects,
    onUploadClick,
    onNewQueueClick,
}: StudioTopBarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">Studio</h1>
                    <ProjectSwitcher
                        projects={allProjects}
                        selectedProjectId={project.id}
                    // Default navigation is fine, but if we wanted to block navigation we could pass handler
                    />
                </div>
                {/* 
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        Running: <b>{project.stats?.jobsRunning || 0}</b>
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        Queued: <b>{project.stats?.jobsQueued || 0}</b>
                    </span>
                </div>
                */}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={onNewQueueClick}
                >
                    <Plus className="size-4" />
                    New Queue
                </Button>
                <Button
                    size="sm"
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={onUploadClick}
                >
                    <Upload className="size-4" />
                    Upload
                </Button>
            </div>
        </div>
    );
}
