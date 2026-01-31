"use client";

import { JobRecord } from "@/lib/jobs/types";
import {
    Download,
    Edit2,
    MoreVertical,
    Play,
    Share2,
    Trash2,
    Calendar,
    FileVideo
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { routes } from "@/lib/routes";

interface ExportGalleryProps {
    jobs: JobRecord[];
    projectId: string;
    onDelete?: (jobId: string) => Promise<void>;
}

export function ExportGallery({ jobs, projectId, onDelete }: ExportGalleryProps) {
    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border border-dashed bg-card/50">
                <div className="size-16 bg-muted rounded-full flex items-center justify-center">
                    <FileVideo className="size-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">내보낸 영상이 없습니다</h3>
                    <p className="text-sm text-muted-foreground">에디터에서 편집을 마치고 영상을 내보내 보세요.</p>
                </div>
                <Link
                    href={routes.projectEditor(projectId)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                    <Play className="size-4 fill-current" />
                    에디터에서 시작하기
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
                <div
                    key={job.id}
                    className="group relative flex flex-col bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                    {/* Thumbnail Section */}
                    <div className="aspect-video bg-black relative overflow-hidden">
                        {job.asset?.thumbnailUrl ? (
                            <img
                                src={job.asset.thumbnailUrl}
                                alt={job.asset.filename}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                                <Play className="size-12 text-white/20 fill-white/10" />
                            </div>
                        )}

                        {/* Status Overlay */}
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                MP4 · 1080P
                            </span>
                        </div>

                        {/* Hover Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                            <button className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="size-5 fill-current ml-0.5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-sm truncate" title={job.asset?.filename || "Untitled Video"}>
                                {job.asset?.filename || "Untitled Video"}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {new Date(job.createdAt).toLocaleDateString()}
                                </div>
                                <div className="size-1 bg-muted-foreground/30 rounded-full" />
                                <div className="font-mono">{job.id.slice(0, 8)}</div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <button
                                    className="p-2 hover:bg-secondary rounded-lg transition text-muted-foreground hover:text-foreground"
                                    title="Download"
                                    onClick={() => job.resultVideoUrl && window.open(job.resultVideoUrl, '_blank')}
                                >
                                    <Download className="size-4" />
                                </button>
                                <Link
                                    href={routes.editor(projectId, job.id)}
                                    className="p-2 hover:bg-secondary rounded-lg transition text-muted-foreground hover:text-foreground"
                                    title="Edit"
                                >
                                    <Edit2 className="size-4" />
                                </Link>
                                <button
                                    className="p-2 hover:bg-secondary rounded-lg transition text-muted-foreground hover:text-foreground"
                                    title="Share"
                                >
                                    <Share2 className="size-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => onDelete && onDelete(job.id)}
                                className="p-2 hover:bg-destructive/10 rounded-lg transition text-muted-foreground hover:text-destructive"
                                title="Delete"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
