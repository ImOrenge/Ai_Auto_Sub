"use client";

import { DashboardSidebar } from "@/components/sidebar/DashboardSidebar";
import { Header } from "@/components/Header";
import { useSidebar } from "@/components/SidebarContext";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Auth state assumed handled by middleware or root layout
    const isAuthenticated = true;
    const { isCollapsed } = useSidebar();

    return (
        <div className="relative flex min-h-screen flex-col">
            <Header
                isAuthenticated={isAuthenticated}
                title={
                    <span className="hidden rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
                        Console
                    </span>
                }
            />
            <div className="flex flex-1">
                <DashboardSidebar />
                <main className={cn(
                    "flex-1 transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:pl-16" : "md:pl-60"
                )}>
                    {children}
                </main>
            </div>
            <footer className={cn(
                "border-t bg-background/80 transition-all duration-300 ease-in-out",
                isCollapsed ? "md:pl-16" : "md:pl-60"
            )}>
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
                    <p>© {new Date().getFullYear()} AutoSubAI · Dashboard</p>
                </div>
            </footer>
        </div>
    );
}
