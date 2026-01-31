"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, FileEdit, ArrowRight, RotateCcw, Folder } from "lucide-react";
import { routes } from "@/lib/routes";
import { JobRecord } from "@/lib/jobs/types";
import { Project } from "@/lib/projects/types";

interface ActionNeededSectionProps {
    recentProject?: Project | null;
    loading?: boolean;
}

export function ActionNeededSection({ recentProject, loading = false }: ActionNeededSectionProps) {
    if (loading) {
        return <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-none border" />;
    }

    if (!recentProject) {
        return null; // Don't show the section if no recent project
    }

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Continue Working</h2>

            <Link
                href={routes.project(recentProject.id)}
                className="group relative flex flex-col md:flex-row items-center gap-6 p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 border border-indigo-200/50 dark:border-indigo-500/30 rounded-none hover:shadow-xl hover:shadow-indigo-500/10 transition-all overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Folder className="size-24 text-indigo-500" />
                </div>

                <div className="relative size-16 shrink-0 flex items-center justify-center bg-indigo-500 text-white rounded-none shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    <FileEdit className="size-8" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-none">
                            Recently Active
                        </span>
                    </div>
                    <h3 className="text-xl font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {recentProject.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Resume where you left off. Last updated {new Date(recentProject.updatedAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Editor</span>
                    <ArrowRight className="size-4" />
                </div>
            </Link>
        </section>
    );
}


