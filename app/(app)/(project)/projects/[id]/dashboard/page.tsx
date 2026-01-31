"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

export default function ProjectDashboardRedirect() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    useEffect(() => {
        if (projectId) {
            router.replace(routes.projectEditor(projectId));
        }
    }, [projectId, router]);

    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-2">
                <div className="size-6 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Entering Editor...</p>
            </div>
        </div>
    );
}
