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
    const sourceUrl = asset.sourceUrl;

    // Check if thumbnailUrl is a local blob URL (for video preview) or server-side image URL
    const isLocalBlobUrl = thumbnailUrl?.startsWith('blob:');

    // For URL-based assets, check if sourceUrl is a playable video URL (not YouTube)
    const isPlayableUrl = sourceUrl && !sourceUrl.includes('youtube.com') && !sourceUrl.includes('youtu.be');

    return (
        <div
            onClick={() => onToggleSelect(asset.id)}
            className={cn(
                "group relative flex flex-col overflow-hidden border bg-card transition-all cursor-pointer",
                isSelected ? "border-foreground ring-1 ring-foreground" : "border-foreground/10",
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
                ) : isPlayableUrl ? (
                    // URL-based asset - use sourceUrl for preview
                    <video
                        src={sourceUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedData={(e) => {
                            const video = e.currentTarget;
                            if (video.duration > 0) {
                                video.currentTime = 0.1;
                            }
                        }}
                        onError={(e) => {
                            // Hide video on error, show fallback icon
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : sourceUrl?.includes('youtube') || sourceUrl?.includes('youtu.be') ? (
                    // YouTube URL - show YouTube icon indicator
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-red-500">
                            <svg className="size-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">YouTube</span>
                    </div>
                ) : asset.status === 'uploaded' ? (
                    // Fallback if no thumbnail
                    <FileVideo className="size-10 text-muted-foreground/50" />
                ) : (
                    <FileVideo className="size-10 text-muted-foreground/30" />
                )}

                {/* Checkbox Overlay */}
                <div className={cn(
                    "absolute top-2 right-2 size-4 border flex items-center justify-center transition-colors",
                    isSelected ? "bg-foreground border-foreground text-background" : "bg-background/80 border-foreground/30 opacity-0 group-hover:opacity-100"
                )}>
                    {isSelected && <CheckCircle2 className="size-3" />}
                </div>
            </div>

            <div className="p-2 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-[11px] truncate leading-tight uppercase tracking-tight" title={asset.filename}>
                        {asset.filename}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground h-4">
                    {isUploading ? (
                        <div className="flex items-center gap-1.5 text-foreground font-bold">
                            <Loader2 className="size-3 animate-spin" />
                            <span>UPDATING... {uploadProgress ? Math.round(uploadProgress) : 0}%</span>
                        </div>
                    ) : isFailed ? (
                        <div className="flex items-center gap-1.5 text-destructive font-bold">
                            <AlertCircle className="size-3" />
                            <span>FAILED</span>
                        </div>
                    ) : (
                        <span className="opacity-70">{formatBytes(asset.meta.size || 0)}</span>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/50">
                    <div
                        className="h-full bg-foreground transition-all duration-300"
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
