"use client";

import Link from "next/link";
import { ArrowRight, Clock, Play } from "lucide-react";
import { routes } from "@/lib/routes";

interface ContinueCardProps {
    lastProject?: {
        id: string;
        name: string;
        lastActivity?: string; // e.g., "Updated 2h ago"
    };
}

export function ContinueCard({ lastProject }: ContinueCardProps) {
    if (!lastProject) {
        return (
            <div className="w-full rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-100 dark:border-blue-900/50">
                <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Welcome to Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You haven't worked on any projects recently.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href={routes.projects()}
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-foreground font-medium rounded-lg text-sm border shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Create Project
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full rounded-2xl bg-white dark:bg-card border shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <Play className="size-6 fill-current" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Continue Working</span>
                        {lastProject.lastActivity && (
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 flex items-center gap-1">
                                <Clock className="size-3" /> {lastProject.lastActivity}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-md">
                        {lastProject.name}
                    </h3>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <Link
                    href={routes.projectEditor(lastProject.id)}
                    className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg text-sm shadow hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                    Open Studio
                    <ArrowRight className="size-4" />
                </Link>
                {/* Secondary Actions could go here */}
            </div>
        </div>
    );
}
