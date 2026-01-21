"use client";

import { use, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Project } from "@/lib/projects/types";
import { mapProject } from "@/lib/projects/mapper";

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) return;

        fetch(`/api/projects/${projectId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setProject(mapProject(data));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [projectId]);

    if (loading) return <div className="p-8">Loading settings...</div>;
    if (!project) return <div className="p-8">Project not found</div>;

    return (
        <PageContainer className="gap-8 py-8">
            <section className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Project Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage settings for {project.name}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border bg-card/70 shadow-sm p-6 space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-medium">General</h3>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Project Name</label>
                        <input
                            type="text"
                            defaultValue={project.name}
                            disabled
                            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground">Name change functionality coming soon.</p>
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">Actions here cannot be undone.</p>
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
                        Delete Project
                    </button>
                </div>
            </section>
        </PageContainer>
    );
}
