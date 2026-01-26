"use client";

import { use } from "react";
import { ProjectSidebar } from "@/components/sidebar/ProjectSidebar";
import { Header } from "@/components/Header";
import { useSidebar } from "@/components/SidebarContext";
import { cn } from "@/lib/utils";

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        id: string;
    }>;
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
    const { id } = use(params);
    const { isCollapsed } = useSidebar();

    return (
        <div className="relative flex min-h-screen flex-col">
            <Header isAuthenticated={true} />
            <div className="flex flex-1">
                <ProjectSidebar projectId={id} />
                <main className={cn(
                    "flex-1 transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:pl-16" : "md:pl-60"
                )}>
                    {children}
                </main>
            </div>
        </div>
    );
}
