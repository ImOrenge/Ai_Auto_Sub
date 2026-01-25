"use client";

import { useState, useRef } from "react";
import {
    FileVideo,
    Plus,
    Link as LinkIcon,
    Upload,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AssetRecord } from "@/lib/assets/types";

interface SourcePanelProps {
    projectId: string;
    assets: AssetRecord[];
    selectedAssetId?: string;
    onSelectAsset: (asset: AssetRecord) => void;
    onAssetsChange: (assets: AssetRecord[]) => void;
}

export function SourcePanel({
    projectId,
    assets,
    selectedAssetId,
    onSelectAsset,
    onAssetsChange
}: SourcePanelProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingUrl, setIsAddingUrl] = useState(false);
    const [url, setUrl] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const filteredAssets = assets.filter(a =>
        a.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || isUploading) return;
        const file = e.target.files[0];

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // 1. Create upload session
            const sessionRes = await fetch("/api/uploads/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    sizeBytes: file.size,
                    mimeType: file.type || "application/octet-stream",
                    projectId,
                }),
            });

            if (!sessionRes.ok) throw new Error("Failed to create upload session");
            const { asset, signedUrl } = await sessionRes.json();

            // 2. Upload file directly to Supabase Storage
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", signedUrl);
                xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(Math.round((event.loaded / event.total) * 100));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
                    else reject(new Error(`Upload failed with status ${xhr.status}`));
                };
                xhr.onerror = () => reject(new Error("Network error during upload"));
                xhr.send(file);
            });

            // 3. Complete upload
            const completeRes = await fetch("/api/uploads/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assetId: asset.id }),
            });

            if (completeRes.ok) {
                const { asset: finalAsset } = await completeRes.json();
                onAssetsChange([finalAsset, ...assets]);
            }
        } catch (err) {
            console.error("Upload process failed", err);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || isResolving) return;

        setIsResolving(true);
        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sourceUrl: url,
                })
            });

            if (res.ok) {
                const newAsset = await res.json();
                onAssetsChange([newAsset, ...assets]);
                setUrl("");
                setIsAddingUrl(false);
            }
        } catch (err) {
            console.error("URL failed", err);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Header / Actions */}
            <div className="p-4 border-b space-y-4 bg-muted/10">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sources</h3>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Plus className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-full"
                            onClick={() => setIsAddingUrl(!isAddingUrl)}
                        >
                            <LinkIcon className="size-4" />
                        </Button>
                    </div>
                </div>

                {isAddingUrl && (
                    <form onSubmit={handleUrlSubmit} className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste YouTube or Video URL..."
                            className="text-xs h-8 border-primary/20 focus-visible:ring-primary/20"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                className="h-7 text-[10px] flex-1 font-bold uppercase"
                                disabled={isResolving}
                            >
                                {isResolving ? "Resolving..." : "Add Source"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] px-3 font-bold uppercase"
                                onClick={() => setIsAddingUrl(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search assets..."
                        className="pl-9 text-xs h-9 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />

                    {/* Progress bar for active upload */}
                    {isUploading && (
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
                                <span className="text-primary flex items-center gap-1.5">
                                    <Loader2 className="size-3 animate-spin" />
                                    Uploading Media...
                                </span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                {filteredAssets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                        {filteredAssets.map((asset) => (
                            <button
                                key={asset.id}
                                onClick={() => onSelectAsset(asset)}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData("application/json", JSON.stringify(asset));
                                    e.dataTransfer.effectAllowed = "copy";
                                    // Add drag image styling
                                    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                                    dragImage.style.opacity = "0.8";
                                    dragImage.style.transform = "scale(0.9)";
                                    document.body.appendChild(dragImage);
                                    e.dataTransfer.setDragImage(dragImage, 0, 0);
                                    setTimeout(() => document.body.removeChild(dragImage), 0);
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-xl border text-left transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing",
                                    selectedAssetId === asset.id
                                        ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                                        : "hover:bg-muted border-transparent"
                                )}
                            >
                                {/* Thumbnail Placeholder / Preview */}
                                <div className="size-12 rounded-lg bg-black flex items-center justify-center relative shrink-0 overflow-hidden shadow-inner">
                                    {asset.meta?.thumbnailUrl ? (
                                        <img src={asset.meta.thumbnailUrl} alt="" className="size-full object-cover" />
                                    ) : (
                                        <FileVideo className="size-6 text-muted-foreground/30" />
                                    )}
                                    {(asset.status === 'downloading' || asset.status === 'processing' || asset.status === 'uploading') && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="size-4 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <h4 className="text-[11px] font-bold truncate">{asset.filename}</h4>
                                        {asset.status === 'uploaded' && (
                                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-muted-foreground/60 font-mono">
                                            {asset.meta?.duration ? `${Math.round(asset.meta.duration)}s` :
                                                asset.status === 'failed' ? 'Error' : 'Processing...'}
                                        </span>
                                        {asset.status === 'failed' && (
                                            <span className="text-[8px] text-destructive font-black uppercase tracking-tighter flex items-center gap-0.5">
                                                <AlertCircle className="size-2" /> Fail
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute -right-8 group-hover:right-2 transition-all opacity-0 group-hover:opacity-100 flex gap-1">
                                    <div className="size-6 rounded-lg bg-background border flex items-center justify-center">
                                        <Plus className="size-3" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                        <FileVideo className="size-8 opacity-10 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">No sources found</p>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="video/*"
            />
        </div>
    );
}

function formatSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

