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
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-2xl border-dashed bg-muted/10">
                <p className="text-muted-foreground">아직 업로드된 영상이 없습니다.</p>
                <p className="text-sm text-muted-foreground/70">새 영상을 업로드해보세요.</p>
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
