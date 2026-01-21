"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buildProjectNav, routes } from "@/lib/routes";
import {
    Mic2,
    UploadCloud,
    FileEdit,
    ListVideo,
    Book,
    Settings,
    Layers,
    ArrowLeft
} from "lucide-react";

interface ProjectSidebarProps {
    projectId: string;
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
    const pathname = usePathname();
    const navItems = buildProjectNav(projectId);

    const icons = {
        studio: Mic2,
        uploads: UploadCloud,
        editor: FileEdit,
        queue: Layers,
        jobs: ListVideo,
        glossary: Book,
        settings: Settings,
    };

    return (
        <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 md:top-[65px] md:border-r md:bg-sidebar">
            <div className="flex px-4 py-3 border-b border-sidebar-border/50">
                <Link href={routes.projects()} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="size-3" />
                    Back to Projects
                </Link>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                <nav className="flex flex-1 flex-col gap-1" aria-label="Project navigation">
                    {navItems.map((item) => {
                        const Icon = icons[item.key as keyof typeof icons] || Layers;
                        const isActive = pathname === item.href || (item.key !== 'studio' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                                )}
                            >
                                <Icon className="size-5 shrink-0" aria-hidden="true" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
