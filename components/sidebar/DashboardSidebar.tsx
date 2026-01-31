"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buildDashboardNav, routes } from "@/lib/routes";
import { LayoutDashboard, Folder, LineChart, Code, Settings } from "lucide-react";
import { useSidebar } from "../SidebarContext";

export function DashboardSidebar() {
    const pathname = usePathname();
    const navItems = buildDashboardNav();
    const { isCollapsed } = useSidebar();

    const icons = {
        dashboard: LayoutDashboard,
        projects: Folder,
        stats: LineChart,
        api: Code,
    };

    return (
        <aside
            className={cn(
                "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:top-[65px] md:border-r md:bg-sidebar transition-all duration-300 ease-in-out z-40",
                isCollapsed ? "md:w-16" : "md:w-60"
            )}
        >
            <div className={cn(
                "flex px-4 py-3 border-b border-sidebar-border/50 overflow-hidden whitespace-nowrap",
                isCollapsed ? "justify-center px-0" : "px-4"
            )}>
                {isCollapsed ? (
                    <span className="text-[10px] font-bold text-primary">WS</span>
                ) : (
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Global Workspace
                    </span>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard navigation">
                    {navItems.map((item) => {
                        const Icon = icons[item.key as keyof typeof icons] || Folder;
                        const isActive = pathname === item.href || (item.key !== 'dashboard' && pathname.startsWith(item.href));

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

                {/* Settings Link at Bottom */}
                <div className="mt-auto border-t border-sidebar-border pt-4">
                    <Link
                        href={routes.settings.profile()}
                        className={cn(
                            "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            isCollapsed ? "px-2 justify-center" : "px-3",
                            pathname.startsWith("/settings") && "bg-sidebar-accent text-sidebar-accent-foreground"
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
