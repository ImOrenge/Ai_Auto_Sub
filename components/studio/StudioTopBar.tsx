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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-foreground/10 pb-3">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-black uppercase tracking-tighter">Studio</h1>
                    <ProjectSwitcher
                        projects={allProjects}
                        selectedProjectId={project.id}
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
                    className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                    onClick={onNewQueueClick}
                >
                    <Plus className="size-3" />
                    New Queue
                </Button>
                <Button
                    size="sm"
                    className="gap-2 font-bold uppercase tracking-widest text-[10px]"
                    onClick={onUploadClick}
                >
                    <Upload className="size-3" />
                    Upload
                </Button>
            </div>
        </div>
    );
}
