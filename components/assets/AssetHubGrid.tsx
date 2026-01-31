"use client";

import { AssetRecord } from "@/lib/assets/types";
import {
    FileVideo,
    FileAudio,
    MoreVertical,
    Play,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Calendar,
    HardDrive
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssetHubGridProps {
    assets: AssetRecord[];
    onDelete?: (assetId: string) => Promise<void>;
}

export function AssetHubGrid({ assets, onDelete }: AssetHubGridProps) {
    if (assets.length === 0) return null;

    const getStatusIcon = (asset: AssetRecord) => {
        if (asset.status === 'uploaded' && asset.transcriptionStatus === 'completed') {
            return <CheckCircle2 className="size-3.5 text-emerald-500" />;
        }
        if (asset.status === 'failed') {
            return <AlertCircle className="size-3.5 text-destructive" />;
        }
        return <Loader2 className="size-3.5 text-primary animate-spin" />;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => {
                const isAudio = asset.meta?.mimeType?.startsWith('audio/');
                const Icon = isAudio ? FileAudio : FileVideo;

                return (
                    <div
                        key={asset.id}
                        className="group relative flex flex-col bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
                    >
                        {/* Preview Section */}
                        <div className="aspect-video bg-muted relative overflow-hidden">
                            {asset.meta?.thumbnailUrl ? (
                                <img
                                    src={asset.meta.thumbnailUrl}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                                    <Icon className="size-10 text-muted-foreground/20" />
                                </div>
                            )}

                            {/* Duration Badge */}
                            {asset.meta?.duration && (
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                                    {Math.round(asset.meta.duration)}s
                                </div>
                            )}

                            {/* Type Indicator */}
                            <div className="absolute top-2 left-2">
                                <div className="px-1.5 py-0.5 rounded bg-white/90 dark:bg-black/60 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider border shadow-sm">
                                    {isAudio ? "Audio" : "Video"}
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-3.5 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h4 className="text-sm font-semibold truncate leading-none mb-1.5" title={asset.filename}>
                                        {asset.filename}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                        <div className="flex items-center gap-1">
                                            <HardDrive className="size-3" />
                                            {formatBytes(asset.meta?.size || 0)}
                                        </div>
                                        <div className="size-1 bg-muted-foreground/30 rounded-full" />
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(asset)}
                                            {asset.status}
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                                            <MoreVertical className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                        <DropdownMenuItem className="gap-2">
                                            <Play className="size-3.5" /> 미리보기
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2">
                                            <Calendar className="size-3.5" /> 상세 정보
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                            onClick={() => onDelete && onDelete(asset.id)}
                                        >
                                            <Trash2 className="size-3.5" /> 삭제하기
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
