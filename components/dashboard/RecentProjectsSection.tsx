"use client";

import Link from "next/link";
import { ArrowRight, MoreHorizontal, Folder } from "lucide-react";
import { routes } from "@/lib/routes";
import { Project } from "@/lib/projects/types";

interface RecentProjectsSectionProps {
    projects: Project[];
}

export function RecentProjectsSection({ projects }: RecentProjectsSectionProps) {
    if (projects.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
                <Link
                    href={routes.projects()}
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                >
                    View All <ArrowRight className="size-3" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.slice(0, 8).map((project) => (
                    <Link
                        key={project.id}
                        href={routes.project(project.id)}
                        className="group flex flex-col p-4 rounded-none border bg-card hover:border-primary/50 hover:shadow transition relative"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="size-10 rounded-none bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Folder className="size-5" />
                            </div>
                            {/* Option for menu */}
                            {/* <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground">
                                <MoreHorizontal className="size-4" />
                            </button> */}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base mb-1 truncate">{project.name}</h3>
                            <p className="text-xs text-muted-foreground">
                                Updated {new Date(project.updatedAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Status chips or quick stats could go here */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                            <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                Active
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
