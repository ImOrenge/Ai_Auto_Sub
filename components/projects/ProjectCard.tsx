'use client';

import React from 'react';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { Project } from '@/lib/projects/types';

interface ProjectCardProps {
    project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <Link href={routes.project(project.id)}>
            <div className="group relative block h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                    </div>
                    {/* Optional: Add menu/settings icon here */}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {project.name}
                </h3>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {project.description || 'No description'}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    {/* Add more stats if available, e.g., default queue, active jobs */}
                </div>
            </div>
        </Link>
    );
}
