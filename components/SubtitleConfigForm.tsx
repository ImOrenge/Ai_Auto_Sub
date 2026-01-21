"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SubtitleConfig } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";

type SubtitleConfigFormProps = {
    value?: SubtitleConfig;
    onChange?: (config: SubtitleConfig) => void;
    className?: string;
};

const FONT_OPTIONS = [
    { value: "Arial", label: "Arial" },
    { value: "NanumGothic", label: "나눔고딕" },
    { value: "NanumBarunGothic", label: "나눔바른고딕" },
    { value: "Malgun Gothic", label: "맑은 고딕" },
    { value: "Noto Sans KR", label: "Noto Sans 한국어" },
];

const POSITION_OPTIONS = [
    { value: "bottom" as const, label: "하단" },
    { value: "center" as const, label: "중앙" },
    { value: "top" as const, label: "상단" },
];

export function SubtitleConfigForm({
    value = DEFAULT_SUBTITLE_CONFIG,
    onChange,
    className,
}: SubtitleConfigFormProps) {
    const [config, setConfig] = useState<SubtitleConfig>(value);

    const handleChange = <K extends keyof SubtitleConfig>(
        key: K,
        newValue: SubtitleConfig[K]
    ) => {
        const updated = { ...config, [key]: newValue };
        setConfig(updated);
        onChange?.(updated);
    };

    return (
        <div
            className={cn(
                "space-y-4 rounded-2xl border border-border bg-secondary/20 p-4",
                className
            )}
        >
            <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    자막 스타일 설정
                </p>
                <p className="text-xs text-muted-foreground">
                    FFmpeg 합성 시 적용될 자막 스타일을 설정합니다.
                </p>
            </div>

            {/* 자막 미리보기 */}
            <div
                className="relative flex h-24 items-end justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-700"
                style={{
                    paddingBottom: config.position === "bottom" ? `${config.marginV}px` : undefined,
                    paddingTop: config.position === "top" ? `${config.marginV}px` : undefined,
                }}
            >
                <div
                    className={cn(
                        "absolute left-1/2 -translate-x-1/2 px-3 py-1 text-center",
                        config.position === "top" && "top-0",
                        config.position === "center" && "top-1/2 -translate-y-1/2",
                        config.position === "bottom" && "bottom-0"
                    )}
                    style={{
                        fontFamily: config.fontName,
                        fontSize: `${Math.min(config.fontSize, 24)}px`,
                        color: config.primaryColor,
                        backgroundColor: config.backgroundColor,
                        textShadow: config.outlineWidth > 0
                            ? `${config.outlineWidth}px ${config.outlineWidth}px 0 ${config.outlineColor}, -${config.outlineWidth}px -${config.outlineWidth}px 0 ${config.outlineColor}, ${config.outlineWidth}px -${config.outlineWidth}px 0 ${config.outlineColor}, -${config.outlineWidth}px ${config.outlineWidth}px 0 ${config.outlineColor}`
                            : undefined,
                    }}
                >
                    {config.showBilingual ? (
                        <div className="space-y-0.5">
                            <p>Sample subtitle text</p>
                            <p style={{ fontSize: `${Math.min(config.fontSize, 24) * 0.85}px` }}>샘플 자막 텍스트</p>
                        </div>
                    ) : (
                        <p>샘플 자막 텍스트</p>
                    )}
                </div>
            </div>

            {/* 폰트 선택 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">폰트</label>
                    <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        value={config.fontName}
                        onChange={(e) => handleChange("fontName", e.target.value)}
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">폰트 크기</label>
                    <input
                        type="number"
                        min={12}
                        max={72}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        value={config.fontSize}
                        onChange={(e) => handleChange("fontSize", Number(e.target.value))}
                    />
                </div>
            </div>

            {/* 색상 설정 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">글자 색상</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-8 w-12 cursor-pointer rounded border border-border"
                            value={config.primaryColor}
                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">
                            {config.primaryColor}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">외곽선 색상</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-8 w-12 cursor-pointer rounded border border-border"
                            value={config.outlineColor}
                            onChange={(e) => handleChange("outlineColor", e.target.value)}
                        />
                        <span className="text-xs text-muted-foreground">
                            {config.outlineColor}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">배경 색상</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-8 w-12 cursor-pointer rounded border border-border"
                            value={config.backgroundColor.slice(0, 7)}
                            onChange={(e) =>
                                handleChange("backgroundColor", e.target.value + "80")
                            }
                        />
                        <span className="text-xs text-muted-foreground">
                            {config.backgroundColor}
                        </span>
                    </div>
                </div>
            </div>

            {/* 외곽선 및 위치 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">외곽선 두께</label>
                    <input
                        type="number"
                        min={0}
                        max={10}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        value={config.outlineWidth}
                        onChange={(e) =>
                            handleChange("outlineWidth", Number(e.target.value))
                        }
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">위치</label>
                    <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        value={config.position}
                        onChange={(e) =>
                            handleChange(
                                "position",
                                e.target.value as "top" | "center" | "bottom"
                            )
                        }
                    >
                        {POSITION_OPTIONS.map((pos) => (
                            <option key={pos.value} value={pos.value}>
                                {pos.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">마진 (px)</label>
                    <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        value={config.marginV}
                        onChange={(e) => handleChange("marginV", Number(e.target.value))}
                    />
                </div>
            </div>

            {/* 이중 자막 옵션 */}
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background/80 px-4 py-3 text-sm font-medium">
                <input
                    type="checkbox"
                    className="size-4 rounded border-border text-primary focus-visible:ring-primary"
                    checked={config.showBilingual}
                    onChange={(e) => handleChange("showBilingual", e.target.checked)}
                />
                이중 자막 표시 (원어 + 번역)
            </label>
        </div>
    );
}
