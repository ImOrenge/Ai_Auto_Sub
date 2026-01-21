"use client";

import { AssetRecord } from "@/lib/assets/types";
import { cn } from "@/lib/utils";
import { FileVideo, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type AssetCardProps = {
    asset: AssetRecord; // or optimistic asset
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    uploadProgress?: number; // 0-100
};

export function AssetCard({ asset, isSelected, onToggleSelect, uploadProgress }: AssetCardProps) {
    const isUploading = asset.status === "uploading";
    const isFailed = asset.status === "failed";
    const thumbnailUrl = asset.meta?.thumbnailUrl as string | undefined;

    // Check if thumbnailUrl is a local blob URL (for video preview) or server-side image URL
    const isLocalBlobUrl = thumbnailUrl?.startsWith('blob:');

    return (
        <div
            onClick={() => onToggleSelect(asset.id)}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all cursor-pointer hover:shadow-md",
                isSelected ? "border-primary ring-1 ring-primary" : "border-border",
                isUploading && "opacity-90"
            )}
        >
            {/* Thumbnail / Video Preview */}
            <div className="aspect-video w-full bg-muted flex items-center justify-center relative overflow-hidden">
                {thumbnailUrl && isLocalBlobUrl ? (
                    // Local blob URL - use video element for preview
                    <video
                        src={thumbnailUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedData={(e) => {
                            // Seek to first frame for thumbnail
                            const video = e.currentTarget;
                            if (video.duration > 0) {
                                video.currentTime = 0.1;
                            }
                        }}
                    />
                ) : thumbnailUrl ? (
                    // Server-generated thumbnail image
                    <img
                        src={thumbnailUrl}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                    />
                ) : asset.status === 'uploaded' ? (
                    // Fallback if no thumbnail
                    <FileVideo className="size-10 text-muted-foreground/50" />
                ) : (
                    <FileVideo className="size-10 text-muted-foreground/30" />
                )}

                {/* Checkbox Overlay */}
                <div className={cn(
                    "absolute top-2 right-2 size-5 rounded-md border flex items-center justify-center transition-colors",
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background/80 border-muted-foreground/30 opacity-0 group-hover:opacity-100"
                )}>
                    {isSelected && <CheckCircle2 className="size-3.5" />}
                </div>
            </div>

            <div className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate leading-tight" title={asset.filename}>
                        {asset.filename}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground h-5">
                    {isUploading ? (
                        <div className="flex items-center gap-1.5 text-blue-500">
                            <Loader2 className="size-3 animate-spin" />
                            <span>업로드 중... {uploadProgress ? Math.round(uploadProgress) : 0}%</span>
                        </div>
                    ) : isFailed ? (
                        <div className="flex items-center gap-1.5 text-destructive">
                            <AlertCircle className="size-3" />
                            <span>실패</span>
                        </div>
                    ) : (
                        <span>{formatBytes(asset.meta.size || 0)}</span>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress || 0}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
