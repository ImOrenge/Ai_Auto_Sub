"use client";

import { useState } from "react";
import { AssetRecord } from "@/lib/assets/types";
import { AssetHubGrid } from "./AssetHubGrid";
import { AssetUploadZone } from "./AssetUploadZone";
import { formatBytes } from "@/lib/utils";
import {
    HardDrive,
    FileVideo,
    FileAudio,
    Search,
    Filter,
    LayoutGrid,
    List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AssetsHubClientProps {
    initialAssets: AssetRecord[];
    projectId: string;
}

export function AssetsHubClient({ initialAssets, projectId }: AssetsHubClientProps) {
    const [assets, setAssets] = useState<AssetRecord[]>(initialAssets);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'audio'>('all');

    const handleDelete = async (assetId: string) => {
        if (!confirm("정말 이 에셋을 삭제하시겠습니까? 프로젝트에서 제거됩니다.")) return;

        try {
            const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
            if (res.ok) {
                setAssets(prev => prev.filter(a => a.id !== assetId));
            } else {
                alert("삭제에 실패했습니다.");
            }
        } catch (err) {
            console.error("Failed to delete asset", err);
            alert("오류가 발생했습니다.");
        }
    };

    const handleNewAssets = (newAssets: AssetRecord[]) => {
        setAssets(prev => [...newAssets, ...prev]);
    };

    // Derived State
    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.filename.toLowerCase().includes(searchQuery.toLowerCase());
        const isAudio = a.meta?.mimeType?.startsWith('audio/');
        const matchesType = typeFilter === 'all'
            ? true
            : typeFilter === 'audio' ? isAudio : !isAudio;
        return matchesSearch && matchesType;
    });

    const totalSize = assets.reduce((acc, a) => acc + (a.meta?.size || 0), 0);
    const videoCount = assets.filter(a => !a.meta?.mimeType?.startsWith('audio/')).length;
    const audioCount = assets.filter(a => a.meta?.mimeType?.startsWith('audio/')).length;
    const failedCount = assets.filter(a => a.status === 'failed').length;

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Storage</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold">{formatBytes(totalSize)}</span>
                        <span className="text-xs text-muted-foreground mb-1">/ 10GB</span>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-card border shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Video Assets</p>
                    <div className="flex items-center gap-2">
                        <FileVideo className="size-5 text-primary" />
                        <span className="text-2xl font-bold">{videoCount}</span>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-card border shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Audio Assets</p>
                    <div className="flex items-center gap-2">
                        <FileAudio className="size-5 text-primary" />
                        <span className="text-2xl font-bold">{audioCount}</span>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-card border shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        {failedCount > 0 ? (
                            <span className="text-destructive font-bold">{failedCount} Failed</span>
                        ) : (
                            <span className="text-emerald-500 font-bold">All Good</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <AssetUploadZone
                projectId={projectId}
                onAssetsChange={handleNewAssets}
            />

            <Separator />

            {/* Assets List Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                    <Button
                        variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs font-bold"
                        onClick={() => setTypeFilter('all')}
                    >
                        전체
                    </Button>
                    <Button
                        variant={typeFilter === 'video' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs font-bold"
                        onClick={() => setTypeFilter('video')}
                    >
                        동영상
                    </Button>
                    <Button
                        variant={typeFilter === 'audio' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs font-bold"
                        onClick={() => setTypeFilter('audio')}
                    >
                        오디오
                    </Button>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="이름으로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="min-h-[200px]">
                {filteredAssets.length > 0 ? (
                    <AssetHubGrid
                        assets={filteredAssets}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                        <HardDrive className="size-10 mb-2" />
                        <p className="text-sm font-medium">No assets found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
