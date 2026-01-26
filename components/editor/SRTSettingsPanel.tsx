"use client";

import { useState } from "react";
import { useEditor } from "./EditorContext";
import {
    Languages,
    Palette,
    Sparkles,
    Gauge,
    Subtitles,
    Type,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Clock,
    Play,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SubtitleCue } from "@/lib/jobs/types";
import {
    SUPPORTED_LANGUAGES,
    SUBTITLE_EFFECTS,
    PLAYBACK_SPEEDS,
    type SubtitleConfig,
    type LanguageConfig,
    type PlaybackSpeed,
    type SubtitleEffect,
    DEFAULT_LANGUAGE_CONFIG,
} from "@/lib/jobs/types";
import { formatTimestamp } from "@/lib/subtitle/srt";

// ============================================================================
// Types
// ============================================================================

type TabId = "captions" | "language" | "style" | "effects" | "playback";

type SRTSettingsPanelProps = {
    // Basic captions/time props can stay for now, or move to context too 
    // but the original plan was to integrate into MainEditor
    // so moving most to context is better.
};

// ============================================================================
// Constants
// ============================================================================

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "captions", label: "자막", icon: Subtitles },
    { id: "language", label: "언어", icon: Languages },
    { id: "style", label: "스타일", icon: Palette },
    { id: "effects", label: "효과", icon: Sparkles },
    { id: "playback", label: "재생", icon: Gauge },
];

const FONT_OPTIONS = [
    { value: "Arial", label: "Arial" },
    { value: "NanumGothic", label: "나눔고딕" },
    { value: "NanumBarunGothic", label: "나눔바른고딕" },
    { value: "Malgun Gothic", label: "맑은 고딕" },
    { value: "Noto Sans KR", label: "Noto Sans 한국어" },
];

const POSITION_OPTIONS = [
    { value: "bottom" as const, label: "하단", icon: AlignLeft },
    { value: "center" as const, label: "중앙", icon: AlignCenter },
    { value: "top" as const, label: "상단", icon: AlignRight },
];

const PRESET_COLORS = [
    "#FFFFFF", "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF", "#FF0000",
];

const EFFECT_OPTIONS: { value: SubtitleEffect; label: string; description: string }[] = [
    { value: "none", label: "없음", description: "효과 없이 표시" },
    { value: "fade", label: "페이드", description: "부드럽게 나타나고 사라짐" },
    { value: "typewriter", label: "타자기", description: "한 글자씩 타이핑 효과" },
    { value: "highlight", label: "하이라이트", description: "현재 단어 강조" },
    { value: "karaoke", label: "가라오케", description: "노래방 스타일" },
];

// ============================================================================
// Main Component
// ============================================================================

export function SRTSettingsPanel({ }: SRTSettingsPanelProps) {
    const {
        cues: captions,
        currentTime,
        setCurrentTime,
        updateCue,
        defaultStyle: style,
        setDefaultStyle: onStyleChange,
        language,
        setLanguage: onLanguageChange,
        playbackSpeed,
        updateActiveClipSpeed,
        activeClipId,
    } = useEditor();

    // Use updateActiveClipSpeed which updates both clip speed and playback speed
    const onPlaybackSpeedChange = (speed: PlaybackSpeed) => {
        updateActiveClipSpeed(speed);
    };

    const [activeTab, setActiveTab] = useState<TabId>("captions");

    const onCueClick = (time: number) => {
        setCurrentTime(time);
    };

    const handleStyleChange = <K extends keyof SubtitleConfig>(
        key: K,
        value: SubtitleConfig[K]
    ) => {
        onStyleChange({ ...style, [key]: value });
    };

    const handleLanguageChange = <K extends keyof LanguageConfig>(
        key: K,
        value: LanguageConfig[K]
    ) => {
        onLanguageChange({ ...language, [key]: value });
    };

    const onCueUpdate = (id: number, text: string) => {
        updateCue(id, { text });
    };

    return (
        <div className="flex flex-col h-full bg-card">
            {/* Tab Navigation */}
            <div className="flex border-b bg-muted/30 shrink-0">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-1 py-3 px-2 text-xs font-medium transition-all",
                                activeTab === tab.id
                                    ? "text-primary border-b-2 border-primary bg-background"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <Icon className="size-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "captions" && (() => {
                    const activeClip = activeClipId ? (useEditor().clips.find(c => c.id === activeClipId)) : null;
                    const filteredCaptions = activeClip
                        ? captions.filter(c => c.endTime >= activeClip.startTime && c.startTime <= activeClip.endTime)
                        : captions;
                    return (
                        <CaptionsTab
                            captions={filteredCaptions}
                            currentTime={currentTime}
                            onCueClick={onCueClick}
                            onCueUpdate={onCueUpdate}
                        />
                    );
                })()}
                {activeTab === "language" && (
                    <LanguageTab
                        language={language}
                        onLanguageChange={handleLanguageChange}
                    />
                )}
                {activeTab === "style" && (
                    <StyleTab
                        style={style}
                        onStyleChange={handleStyleChange}
                    />
                )}
                {activeTab === "effects" && (
                    <EffectsTab
                        style={style}
                        onStyleChange={handleStyleChange}
                    />
                )}
                {activeTab === "playback" && (
                    <PlaybackTab
                        playbackSpeed={playbackSpeed}
                        onPlaybackSpeedChange={onPlaybackSpeedChange}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Captions Tab
// ============================================================================

function CaptionsTab({
    captions,
    currentTime,
    onCueClick,
    onCueUpdate,
}: {
    captions: SubtitleCue[];
    currentTime: number;
    onCueClick: (time: number) => void;
    onCueUpdate: (id: number, text: string) => void;
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary/10 text-primary p-1 rounded">
                        <RotateCcw className="size-4" />
                    </span>
                    자막 ({captions.length})
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {captions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Subtitles className="size-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">자막이 없습니다</p>
                        <p className="text-xs mt-1">AI 캡션 생성을 실행하세요</p>
                    </div>
                ) : (
                    captions.map((cue) => {
                        const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;
                        return (
                            <div
                                key={cue.id}
                                className={cn(
                                    "group relative p-3 rounded-lg border transition-all duration-200",
                                    isActive
                                        ? "bg-primary/5 border-primary shadow-sm scale-[1.01]"
                                        : "bg-card border-border hover:border-primary/50"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground font-mono">
                                    <div
                                        className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                                        onClick={() => onCueClick(cue.startTime)}
                                    >
                                        <Clock className="size-3" />
                                        {formatTimestamp(cue.startTime).split(',')[0]}
                                    </div>
                                    <span>→</span>
                                    <div>{formatTimestamp(cue.endTime).split(',')[0]}</div>
                                </div>

                                <textarea
                                    value={cue.text}
                                    onChange={(e) => onCueUpdate(cue.id, e.target.value)}
                                    className={cn(
                                        "w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed",
                                        isActive ? "text-foreground font-medium" : "text-muted-foreground"
                                    )}
                                    rows={Math.max(1, cue.text.split('\n').length)}
                                />

                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onCueClick(cue.startTime)}
                                        className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                    >
                                        <Play className="size-3 fill-current" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Language Tab
// ============================================================================

function LanguageTab({
    language,
    onLanguageChange,
}: {
    language: LanguageConfig;
    onLanguageChange: <K extends keyof LanguageConfig>(key: K, value: LanguageConfig[K]) => void;
}) {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">언어 설정</h3>
                <p className="text-xs text-muted-foreground">원본 및 번역 언어를 선택하세요</p>
            </div>

            {/* Source Language */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Languages className="size-3.5" />
                    원본 언어
                </label>
                <select
                    value={language.sourceLanguage}
                    onChange={(e) => onLanguageChange("sourceLanguage", e.target.value as any)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Target Language */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Languages className="size-3.5" />
                    번역 언어
                </label>
                <select
                    value={language.targetLanguage}
                    onChange={(e) => onLanguageChange("targetLanguage", e.target.value as any)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Bilingual Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                    <p className="text-sm font-medium">이중 자막</p>
                    <p className="text-xs text-muted-foreground">원어+번역 동시 표시</p>
                </div>
                <button
                    type="button"
                    onClick={() => onLanguageChange("showBilingual", !language.showBilingual)}
                    className={cn(
                        "relative h-6 w-11 rounded-full transition",
                        language.showBilingual ? "bg-primary" : "bg-muted"
                    )}
                >
                    <span
                        className={cn(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                            language.showBilingual ? "left-5" : "left-0.5"
                        )}
                    />
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// Style Tab
// ============================================================================

function StyleTab({
    style,
    onStyleChange,
}: {
    style: SubtitleConfig;
    onStyleChange: <K extends keyof SubtitleConfig>(key: K, value: SubtitleConfig[K]) => void;
}) {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">스타일 설정</h3>
                <p className="text-xs text-muted-foreground">모든 자막에 적용됩니다</p>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Type className="size-3.5" />
                    폰트
                </label>
                <select
                    value={style.fontName}
                    onChange={(e) => onStyleChange("fontName", e.target.value)}
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
                    <span className="font-mono">{style.fontSize}px</span>
                </label>
                <input
                    type="range"
                    min={12}
                    max={48}
                    value={style.fontSize}
                    onChange={(e) => onStyleChange("fontSize", parseInt(e.target.value))}
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
                        value={style.primaryColor}
                        onChange={(e) => onStyleChange("primaryColor", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                    />
                    <div className="flex gap-1">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => onStyleChange("primaryColor", color)}
                                className={cn(
                                    "h-6 w-6 rounded border-2",
                                    style.primaryColor === color
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
                        value={style.outlineColor}
                        onChange={(e) => onStyleChange("outlineColor", e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                    />
                    <input
                        type="text"
                        value={style.outlineColor}
                        onChange={(e) => onStyleChange("outlineColor", e.target.value)}
                        className="flex-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
                    />
                </div>
            </div>

            {/* Outline Width */}
            <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>외곽선 두께</span>
                    <span className="font-mono">{style.outlineWidth}px</span>
                </label>
                <input
                    type="range"
                    min={0}
                    max={5}
                    value={style.outlineWidth}
                    onChange={(e) => onStyleChange("outlineWidth", parseInt(e.target.value))}
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
                            onClick={() => onStyleChange("position", pos.value)}
                            className={cn(
                                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
                                style.position === pos.value
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
                    <span className="font-mono">{style.marginV}px</span>
                </label>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={style.marginV}
                    onChange={(e) => onStyleChange("marginV", parseInt(e.target.value))}
                    className="w-full accent-primary"
                />
            </div>
        </div>
    );
}

// ============================================================================
// Effects Tab
// ============================================================================

function EffectsTab({
    style,
    onStyleChange,
}: {
    style: SubtitleConfig;
    onStyleChange: <K extends keyof SubtitleConfig>(key: K, value: SubtitleConfig[K]) => void;
}) {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">자막 효과</h3>
                <p className="text-xs text-muted-foreground">자막 표시 애니메이션을 선택하세요</p>
            </div>

            {/* Effect Selection */}
            <div className="space-y-2">
                {EFFECT_OPTIONS.map((effect) => (
                    <button
                        key={effect.value}
                        type="button"
                        onClick={() => onStyleChange("effect", effect.value)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                            style.effect === effect.value
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/50"
                        )}
                    >
                        <div className={cn(
                            "size-4 rounded-full border-2 flex items-center justify-center",
                            style.effect === effect.value
                                ? "border-primary"
                                : "border-muted-foreground/30"
                        )}>
                            {style.effect === effect.value && (
                                <div className="size-2 rounded-full bg-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{effect.label}</p>
                            <p className="text-xs text-muted-foreground">{effect.description}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Fade Settings (shown when fade effect is selected) */}
            {style.effect === "fade" && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <h4 className="text-xs font-semibold text-muted-foreground">페이드 설정</h4>
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>페이드 인</span>
                            <span className="font-mono">{style.animation?.fadeIn ?? 300}ms</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            step={50}
                            value={style.animation?.fadeIn ?? 300}
                            onChange={(e) => onStyleChange("animation", {
                                ...style.animation,
                                fadeIn: parseInt(e.target.value),
                            })}
                            className="w-full accent-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>페이드 아웃</span>
                            <span className="font-mono">{style.animation?.fadeOut ?? 300}ms</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            step={50}
                            value={style.animation?.fadeOut ?? 300}
                            onChange={(e) => onStyleChange("animation", {
                                ...style.animation,
                                fadeOut: parseInt(e.target.value),
                            })}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Playback Tab
// ============================================================================

function PlaybackTab({
    playbackSpeed,
    onPlaybackSpeedChange,
}: {
    playbackSpeed: PlaybackSpeed;
    onPlaybackSpeedChange: (speed: PlaybackSpeed) => void;
}) {
    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">재생 설정</h3>
                <p className="text-xs text-muted-foreground">영상 재생 속도를 조절하세요</p>
            </div>

            {/* Speed Selection */}
            <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Gauge className="size-3.5" />
                    재생 속도
                </label>

                <div className="grid grid-cols-3 gap-2">
                    {PLAYBACK_SPEEDS.map((speed) => (
                        <button
                            key={speed}
                            type="button"
                            onClick={() => onPlaybackSpeedChange(speed)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                                playbackSpeed === speed
                                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <span className="text-lg font-bold">{speed}x</span>
                            <span className="text-[10px] text-muted-foreground">
                                {speed === 1 ? "기본" : speed < 1 ? "느리게" : "빠르게"}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Info */}
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                    <Gauge className="size-4 text-primary" />
                    <span className="font-medium">현재 속도: {playbackSpeed}x</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {playbackSpeed === 1
                        ? "원본 속도로 재생됩니다."
                        : playbackSpeed < 1
                            ? `영상이 ${Math.round((1 - playbackSpeed) * 100)}% 느리게 재생됩니다.`
                            : `영상이 ${Math.round((playbackSpeed - 1) * 100)}% 빠르게 재생됩니다.`}
                </p>
            </div>
        </div>
    );
}
