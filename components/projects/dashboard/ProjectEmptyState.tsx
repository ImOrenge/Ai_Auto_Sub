"use client";

import { Upload, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { useLanguage } from "@/lib/i18n";

interface ProjectEmptyStateProps {
    projectId: string;
}

export function ProjectEmptyState({ projectId }: ProjectEmptyStateProps) {
    const { t } = useLanguage();
    return (
        <div className="py-16 px-4 bg-white dark:bg-card border border-dashed rounded-none text-center">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("dashboard.project.empty.title")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
                {t("dashboard.project.empty.description")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                    href={routes.assetsHub(projectId)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-none font-medium hover:bg-primary/90 transition-colors"
                >
                    <Upload className="size-4" />
                    {t("dashboard.project.empty.upload")}
                </Link>
                <Link
                    href={routes.projectEditor(projectId)}
                    className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-none font-medium hover:bg-secondary/80 transition-colors"
                >
                    <Plus className="size-4" />
                    {t("dashboard.project.empty.openEditor")}
                </Link>
            </div>
        </div>
    );
}
