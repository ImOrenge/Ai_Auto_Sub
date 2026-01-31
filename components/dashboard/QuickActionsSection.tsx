"use client";

import { AlertCircle, Film, FileVideo, Users, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

interface QuickActionsSectionProps {
    onCreateProject: () => void;
}

export function QuickActionsSection({ onCreateProject }: QuickActionsSectionProps) {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={onCreateProject}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Plus className="size-6" />
                    </div>
                    <span className="font-medium">New Project</span>
                </button>

                <Link
                    href={routes.settings.usage()}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                        <AlertCircle className="size-6" />
                    </div>
                    <span className="font-medium">Check Usage</span>
                </Link>

                <Link
                    href={routes.settings.billing()}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-purple-500/10 text-purple-600 group-hover:scale-110 transition-transform">
                        <Settings className="size-6" />
                    </div>
                    <span className="font-medium">Manage Plan</span>
                </Link>

                <Link
                    href="https://docs.google.com" // Placeholder or real docs link
                    target="_blank"
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-orange-500/10 text-orange-600 group-hover:scale-110 transition-transform">
                        <FileVideo className="size-6" />
                    </div>
                    <span className="font-medium">Tutorials</span>
                </Link>
            </div>
        </section>
    );
}
