"use client";

import { Upload, FileVideo, Settings, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { useLanguage } from "@/lib/i18n";

interface ProjectQuickActionsProps {
    projectId: string;
}

export function ProjectQuickActions({ projectId }: ProjectQuickActionsProps) {
    const { t } = useLanguage();
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">{t("dashboard.project.overview.quickActions.title")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href={routes.assetsHub(projectId)}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                        <Upload className="size-6" />
                    </div>
                    <span className="font-medium">{t("dashboard.project.overview.quickActions.upload")}</span>
                </Link>

                <Link
                    href={routes.projectEditor(projectId)}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                        <Zap className="size-6" />
                    </div>
                    <span className="font-medium">{t("dashboard.project.overview.quickActions.editor")}</span>
                </Link>

                <Link
                    href={routes.exports(projectId)}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-green-500/10 text-green-600 group-hover:scale-110 transition-transform">
                        <FileVideo className="size-6" />
                    </div>
                    <span className="font-medium">{t("dashboard.project.overview.quickActions.exports")}</span>
                </Link>

                <Link
                    href={`/projects/${projectId}/settings`}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-card border rounded-none hover:border-primary hover:shadow-lg transition-all group"
                >
                    <div className="p-3 rounded-full bg-gray-500/10 text-gray-600 group-hover:scale-110 transition-transform">
                        <Settings className="size-6" />
                    </div>
                    <span className="font-medium">{t("dashboard.project.overview.quickActions.settings")}</span>
                </Link>
            </div>
        </section>
    );
}
