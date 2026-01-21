"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buildDashboardNav, routes } from "@/lib/routes";
import { LayoutDashboard, Folder, LineChart, Code, Settings } from "lucide-react";

export function DashboardSidebar() {
    const pathname = usePathname();
    const navItems = buildDashboardNav();

    const icons = {
        dashboard: LayoutDashboard,
        projects: Folder,
        stats: LineChart,
        api: Code,
    };

    return (
        <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 md:top-[65px] md:border-r md:bg-sidebar">
            <div className="flex px-4 py-3 border-b border-sidebar-border/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Global Workspace
                </span>
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

                {/* Settings Link at Bottom */}
                <div className="mt-auto border-t border-sidebar-border pt-4">
                    <Link
                        href={routes.settings.profile()}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            pathname.startsWith("/settings") && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                    >
                        <Settings className="size-5 shrink-0" aria-hidden="true" />
                        Settings
                    </Link>
                </div>
            </div>
        </aside>
    );
}
