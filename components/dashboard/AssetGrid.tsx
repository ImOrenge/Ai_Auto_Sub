"use client";

import { AssetRecord } from "@/lib/assets/types";
import { AssetCard } from "./AssetCard";

type AssetGridProps = {
    assets: AssetRecord[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    uploadingProgress: Record<string, number>;
};

export function AssetGrid({ assets, selectedIds, onToggleSelect, uploadingProgress }: AssetGridProps) {
    if (assets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-foreground/20 bg-muted/5">
                <p className="text-xs font-bold uppercase tracking-tight text-muted-foreground">No assets found</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">Upload a video to get started.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {assets.map((asset) => (
                <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedIds.has(asset.id)}
                    onToggleSelect={onToggleSelect}
                    uploadProgress={uploadingProgress[asset.id]}
                />
            ))}
        </div>
    );
}
