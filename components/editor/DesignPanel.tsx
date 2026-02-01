"use client";

import { useState } from "react";
import { Palette, Type, AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor } from "./EditorContext";
import type { SubtitleConfig } from "@/lib/jobs/types";

// ============================================================================
// Design Panel
// ============================================================================

const FONT_OPTIONS = [
    // 고딕체 (Gothic/Sans-serif)
    { value: "Noto Sans KR", label: "Noto Sans 한국어" },
    { value: "Nanum Gothic", label: "나눔고딕" },
    { value: "IBM Plex Sans KR", label: "IBM Plex 한국어" },
    { value: "Do Hyeon", label: "도현체" },
    { value: "Jua", label: "주아체" },
    { value: "Black Han Sans", label: "검은고딕체" },

    // 명조체 (Serif)
    { value: "Noto Serif KR", label: "Noto 명조체" },
    { value: "Nanum Myeongjo", label: "나눔명조" },
    { value: "Gowun Batang", label: "고운바탕" },

    // 손글씨/장식체 (Decorative/Handwriting)
    { value: "Gamja Flower", label: "감자꽃체 (귀여움)" },
    { value: "Sunflower", label: "해바라기체" },

    // 영문
    { value: "Arial", label: "Arial (영문)" },
];

const POSITION_OPTIONS = [
    { value: "bottom" as const, label: "하단", icon: AlignLeft },
    { value: "center" as const, label: "중앙", icon: AlignCenter },
    { value: "top" as const, label: "상단", icon: AlignRight },
];

const PRESET_COLORS = [
    "#FFFFFF", "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF", "#FF0000",
];

export function DesignPanel() {
    const { defaultStyle, setDefaultStyle } = useEditor();

    const handleChange = <K extends keyof SubtitleConfig>(
        key: K,
        value: SubtitleConfig[K]
    ) => {
        setDefaultStyle({ ...defaultStyle, [key]: value });
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">디자인 설정</h3>
                <p className="text-xs text-muted-foreground">모든 자막에 적용됩니다</p>
            </div>

            <div className="flex-1 space-y-6 p-4">
                {/* Font Family */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Type className="size-3.5" />
                        폰트
                    </label>
                    <select
                        value={defaultStyle.fontName}
                        onChange={(e) => handleChange("fontName", e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>폰트 크기</span>
                        <span className="font-mono">{defaultStyle.fontSize}px</span>
                    </label>
                    <input
                        type="range"
                        min={12}
                        max={48}
                        value={defaultStyle.fontSize}
                        onChange={(e) => handleChange("fontSize", parseInt(e.target.value))}
                        className="w-full accent-primary"
                    />
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Palette className="size-3.5" />
                        글자 색상
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={defaultStyle.primaryColor}
                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                        />
                        <div className="flex gap-1">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleChange("primaryColor", color)}
                                    className={cn(
                                        "h-6 w-6 rounded border-2",
                                        defaultStyle.primaryColor === color
                                            ? "border-primary"
                                            : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Outline Color */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">외곽선 색상</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={defaultStyle.outlineColor}
                            onChange={(e) => handleChange("outlineColor", e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                        />
                        <input
                            type="text"
                            value={defaultStyle.outlineColor}
                            onChange={(e) => handleChange("outlineColor", e.target.value)}
                            className="flex-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
                        />
                    </div>
                </div>

                {/* Outline Width */}
                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>외곽선 두께</span>
                        <span className="font-mono">{defaultStyle.outlineWidth}px</span>
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={5}
                        value={defaultStyle.outlineWidth}
                        onChange={(e) => handleChange("outlineWidth", parseInt(e.target.value))}
                        className="w-full accent-primary"
                    />
                </div>

                {/* Position */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">위치</label>
                    <div className="flex gap-2">
                        {POSITION_OPTIONS.map((pos) => (
                            <button
                                key={pos.value}
                                type="button"
                                onClick={() => handleChange("position", pos.value)}
                                className={cn(
                                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
                                    defaultStyle.position === pos.value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-secondary"
                                )}
                            >
                                {pos.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Margin */}
                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>세로 여백</span>
                        <span className="font-mono">{defaultStyle.marginV}px</span>
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={200}
                        value={defaultStyle.marginV}
                        onChange={(e) => handleChange("marginV", parseInt(e.target.value))}
                        className="w-full accent-primary"
                    />
                </div>

                {/* Bilingual Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium">이중 자막</p>
                        <p className="text-xs text-muted-foreground">원어+번역 표시</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleChange("showBilingual", !defaultStyle.showBilingual)}
                        className={cn(
                            "relative h-6 w-11 rounded-full transition",
                            defaultStyle.showBilingual ? "bg-primary" : "bg-muted"
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                                defaultStyle.showBilingual ? "left-5" : "left-0.5"
                            )}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}
