"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

interface Project {
    id: string;
    name: string;
}

interface ProjectSwitcherProps {
    projects?: Project[];
    selectedProjectId?: string;
    // Optional now because we might just navigate
    onSelectProject?: (projectId: string) => void;
    onCreateProject?: () => void;
    className?: string;
}

export function ProjectSwitcher({
    projects = [],
    selectedProjectId,
    onSelectProject,
    onCreateProject,
    className,
}: ProjectSwitcherProps) {
    const router = useRouter();
    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    const handleSelect = (projectId: string) => {
        if (onSelectProject) {
            onSelectProject(projectId);
        } else {
            // Default behavior: Navigate to Studio
            router.push(routes.studio(projectId));
        }
    };

    const handleCreate = () => {
        if (onCreateProject) {
            onCreateProject();
        } else {
            router.push(routes.projects()); // Fallback if no modal handler
        }
    };

    return (
        <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={cn("w-[250px] justify-between", className)}
                >
                    {selectedProject ? selectedProject.name : "Select project..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuPrimitive.Trigger>

            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    className="w-[250px] p-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md shadow-md z-50 animate-in fade-in-0 zoom-in-95"
                    align="start"
                    sideOffset={5}
                >
                    <div className="max-h-[300px] overflow-y-auto">
                        <DropdownMenuPrimitive.Label className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            Projects
                        </DropdownMenuPrimitive.Label>
                        {projects.length === 0 && (
                            <div className="px-2 py-1.5 text-sm text-gray-400">No projects found.</div>
                        )}
                        {projects.map((project) => (
                            <DropdownMenuPrimitive.Item
                                key={project.id}
                                onSelect={() => handleSelect(project.id)}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {project.name}
                            </DropdownMenuPrimitive.Item>
                        ))}
                    </div>
                    <DropdownMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <DropdownMenuPrimitive.Item
                        onSelect={handleCreate}
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-gray-50 cursor-pointer text-primary"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Project
                    </DropdownMenuPrimitive.Item>
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
}
