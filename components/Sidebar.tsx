"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { routes, buildSidebarNav } from "@/lib/routes";
import { LayoutDashboard, Folder, Mic2, ListVideo, Settings } from "lucide-react"; // Icons

export function Sidebar({ projectId }: { projectId?: string }) {
    const pathname = usePathname();
    const navItems = buildSidebarNav({ lastProjectId: projectId });

    const icons = {
        dashboard: LayoutDashboard,
        projects: Folder,
        studio: Mic2,
        jobs: ListVideo,
    };

    return (
        <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 md:top-[65px] md:border-r md:bg-sidebar">
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
                    {navItems.map((item) => {
                        const Icon = icons[item.key as keyof typeof icons] || Folder;
                        const isActive = pathname === item.href || (item.key !== 'dashboard' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-2",
                                    isActive
                                        ? "bg-muted text-foreground border-foreground"
                                        : "text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
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
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground border-l-2 border-transparent hover:bg-muted/50 hover:text-foreground"
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
