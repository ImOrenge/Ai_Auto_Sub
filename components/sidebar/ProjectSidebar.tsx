"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buildProjectNav, routes } from "@/lib/routes";
import {
    LayoutDashboard,
    Zap,
    Library,
    FileVideo,
    Settings,
    ChevronLeft,
    FileText,
    History
} from "lucide-react";
import { useSidebar } from "../SidebarContext";

export function ProjectSidebar({ projectId }: { projectId: string }) {
    const pathname = usePathname();
    const navItems = buildProjectNav(projectId);
    const { isCollapsed } = useSidebar();

    const icons = {
        overview: LayoutDashboard,
        editor: Zap,
        assets: Library,
        exports: FileVideo,
        settings: Settings,
    };

    return (
        <aside
            className={cn(
                "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-[65px] md:border-r md:bg-sidebar transition-all duration-300 ease-in-out z-40",
                isCollapsed ? "md:w-16" : "md:w-60"
            )}
        >
            <div className={cn(
                "flex items-center gap-3 p-4 border-b border-sidebar-border/50 overflow-hidden whitespace-nowrap",
                isCollapsed ? "justify-center px-0" : "px-4"
            )}>
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                    <ChevronLeft className="size-5" />
                </Link>
                {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">Project Admin</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Main Console</span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                <nav className="flex flex-1 flex-col gap-1" aria-label="Project navigation">
                    {navItems.map((item) => {
                        const Icon = icons[item.key as keyof typeof icons] || FileVideo;
                        const isActive = pathname === item.href || (item.key !== 'overview' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
                                    isCollapsed ? "px-2 justify-center" : "px-3",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className="size-5 shrink-0" aria-hidden="true" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="mt-auto border-t border-sidebar-border pt-4">
                    <Link
                        href={`/projects/${projectId}/settings`}
                        className={cn(
                            "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            isCollapsed ? "px-2 justify-center" : "px-3",
                            pathname.includes("/settings") && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                        title={isCollapsed ? "Settings" : undefined}
                    >
                        <Settings className="size-5 shrink-0" aria-hidden="true" />
                        {!isCollapsed && <span>Settings</span>}
                    </Link>
                </div>
            </div>
        </aside>
    );
}
