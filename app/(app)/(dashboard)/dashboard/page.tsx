"use client";

import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Play, Activity } from "lucide-react";

import { PageContainer } from "@/components/PageContainer";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ContinueCard } from "@/components/dashboard/ContinueCard";
import { RecentProjectsSection } from "@/components/dashboard/RecentProjectsSection";
import { ActionNeededSection } from "@/components/dashboard/ActionNeededSection";
import { Project } from "@/lib/projects/types";
import { JobRecord } from "@/lib/jobs/types";

// Mock stats
const dashboardStats = [
    { label: "Subtitle Jobs", value: "12", change: "+3 today", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Minutes Processed", value: "48m", detail: "Last 7 days", icon: Activity, color: "text-blue-500" },
    { label: "Credits Left", value: "47", detail: "/ 50 (Free)", icon: CreditCard, color: "text-primary" },
];

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [recentJobs, setRecentJobs] = useState<JobRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Projects
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                if (data.projects) setProjects(data.projects);
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Fetch Recent Activity (Global)
        fetch('/api/jobs?limit=5')
            .then(res => res.json())
            .then(data => {
                if (data.jobs) setRecentJobs(data.jobs);
            })
            .catch(console.error);
    }, []);

    // Derive "Last Project" for Continue Card
    const lastProject = projects.length > 0 ? {
        id: projects[0].id,
        name: projects[0].name,
        lastActivity: "Recently updated"
    } : undefined;

    return (
        <PageContainer className="gap-8 py-8 pb-32 max-w-7xl mx-auto">
            {/* 1. Welcome & Continue */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your subtitle projects and activity.</p>
                </div>

                <ContinueCard lastProject={lastProject} />
            </div>

            {/* 2. Stats Row */}
            <section className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
                {dashboardStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="rounded-xl border bg-card p-4 flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                                <Icon className={`size-4 ${stat.color}`} />
                            </div>
                            <div className="mt-2">
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-[10px] text-muted-foreground">{stat.detail || stat.change}</p>
                            </div>
                        </div>
                    )
                })}
            </section>

            {/* 3. Action Needed Section (Dynamic) */}
            <ActionNeededSection />

            {/* 4. Main Content: Projects & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Recent Projects (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    <RecentProjectsSection projects={projects} />
                </div>

                {/* Right: Activity Timeline (1/3) */}
                <aside className="space-y-4">
                    <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
                    <RecentActivity jobs={recentJobs} />
                </aside>
            </div>
        </PageContainer>
    );
}
