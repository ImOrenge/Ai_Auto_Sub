"use client";

import { useState, useRef } from "react";
import {
    Link as LinkIcon,
    Loader2,
    Plus,
    X,
    CloudUpload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AssetRecord } from "@/lib/assets/types";
import { uploadFileToSignedUrl } from "@/lib/uploadClient";

interface AssetUploadZoneProps {
    projectId: string;
    onAssetsChange: (assets: AssetRecord[]) => void;
}

export function AssetUploadZone({ projectId, onAssetsChange }: AssetUploadZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isAddingUrl, setIsAddingUrl] = useState(false);
    const [url, setUrl] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files?.length || isUploading) return;
        const file = files[0];

        setIsUploading(true);
        setUploadProgress(0);

        try {
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

            await uploadFileToSignedUrl(file, signedUrl, (progress) => {
                setUploadProgress(progress);
            });

            const completeRes = await fetch("/api/uploads/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assetId: asset.id }),
            });

            if (completeRes.ok) {
                const { asset: finalAsset } = await completeRes.json();
                onAssetsChange([finalAsset]);
            }
        } catch (err) {
            console.error("Upload process failed", err);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
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
                onAssetsChange([newAsset]);
                setUrl("");
                setIsAddingUrl(false);
            }
        } catch (err) {
            console.error("URL resolution failed", err);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); }}
                className={cn(
                    "relative group h-48 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 px-6",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[0.99]"
                        : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
                )}
            >
                {isUploading ? (
                    <div className="w-full max-w-xs space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-primary flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Uploading Media...
                            </span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={cn(
                            "size-14 rounded-2xl bg-muted flex items-center justify-center transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary",
                            isDragging && "scale-110 bg-primary text-primary-foreground"
                        )}>
                            <CloudUpload className="size-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">동영상 또는 오디오를 드래그하세요</h3>
                            <p className="text-sm text-muted-foreground">
                                MP4, MOV, MP3, WAV 등 다양한 미디어 타입을 지원합니다.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="secondary"
                                className="rounded-full px-5 h-9 text-xs font-bold"
                            >
                                <Plus className="size-3.5 mr-2" />
                                파일 선택
                            </Button>
                            <Button
                                onClick={() => setIsAddingUrl(true)}
                                variant="outline"
                                className="rounded-full px-5 h-9 text-xs font-bold"
                            >
                                <LinkIcon className="size-3.5 mr-2" />
                                URL 추가
                            </Button>
                        </div>
                    </>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    accept="video/*,audio/*"
                />
            </div>

            {isAddingUrl && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                    <form
                        onSubmit={handleUrlSubmit}
                        className="bg-card border rounded-2xl p-4 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                    >
                        <LinkIcon className="size-4 text-muted-foreground shrink-0" />
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="YouTube 또는 영상 링크를 입력하세요..."
                            className="border-none bg-transparent h-8 focus-visible:ring-0 text-sm flex-1 p-0"
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <Button
                                type="submit"
                                disabled={isResolving || !url}
                                size="sm"
                                className="rounded-lg h-8 px-4 font-bold text-xs"
                            >
                                {isResolving ? <Loader2 className="size-3.5 animate-spin" /> : "확인"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddingUrl(false)}
                                size="sm"
                                className="rounded-lg size-8 p-0"
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
