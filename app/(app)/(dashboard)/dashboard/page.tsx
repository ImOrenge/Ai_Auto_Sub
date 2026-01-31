"use client";

import { useEffect, useState, useCallback } from "react";
import { RecentProjectsSection } from "@/components/dashboard/RecentProjectsSection";
import { ActionNeededSection } from "@/components/dashboard/ActionNeededSection";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActionsSection } from "@/components/dashboard/QuickActionsSection";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { TipsSection } from "@/components/dashboard/TipsSection";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { Project } from "@/lib/projects/types";
import { mapProject } from "@/lib/projects/mapper";

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        try {
            const projectsRes = await fetch('/api/projects?limit=8');
            const projectsData = await projectsRes.json();

            if (projectsData.projects) {
                setProjects(projectsData.projects.map(mapProject));
            }
        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-none"></div>)}
                </div>
                <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-none"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-none"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
                    <p className="text-muted-foreground mt-1 text-sm uppercase font-semibold tracking-wider">Main Console Overview</p>
                </div>
            </div>

            {/* Quick Stats & Billing Overview */}
            <DashboardStats />

            {/* Quick Actions */}
            <QuickActionsSection onCreateProject={() => setIsCreateModalOpen(true)} />

            {/* Recent/Actionable Items or Empty State */}
            {projects.length > 0 ? (
                <>
                    <ActionNeededSection recentProject={projects[0]} />
                    <RecentProjectsSection projects={projects} />
                </>
            ) : (
                <EmptyDashboardState onCreateProject={() => setIsCreateModalOpen(true)} />
            )}

            {/* Tips & Updates */}
            <TipsSection />

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchDashboardData();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
}
