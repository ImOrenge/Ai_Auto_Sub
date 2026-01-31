"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
    LayoutTemplate,
    Trash2,
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
    PRESET_TEMPLATES,
} from "@/lib/jobs/types";
import { formatTimestamp } from "@/lib/subtitle/srt";
import { CAPTION_PRESETS, getEffectPreset } from "@/lib/subtitle-definitions";

// ============================================================================
// Types
// ============================================================================

type TabId = "captions" | "language" | "style" | "effects" | "playback" | "templates";

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
    { id: "templates", label: "템플릿", icon: LayoutTemplate },
    { id: "playback", label: "재생", icon: Gauge },
];

const FONT_OPTIONS = [
    { value: "Arial", label: "Arial" },
    { value: "NanumGothic", label: "나눔고딕" },
    { value: "NanumBarunGothic", label: "나눔바른고딕" },
    { value: "Malgun Gothic", label: "맑은 고딕" },
    { value: "Noto Sans KR", label: "Noto Sans 한국어" },
    { value: "Anton", label: "Anton (Highlight Bold)" },
    { value: "Impact", label: "Impact (Classic Bold)" },
];

const POSITION_OPTIONS = [
    { value: "bottom" as const, label: "하단", icon: AlignLeft },
    { value: "center" as const, label: "중앙", icon: AlignCenter },
    { value: "top" as const, label: "상단", icon: AlignRight },
];

const PRESET_COLORS = [
    "#FFFFFF", "#FFFF00", "#00FF00", "#00FFFF", "#FF00FF", "#FF0000",
];

// Essential Legacy Effects without JSON equivalents yet
const ESSENTIAL_LEGACY_EFFECTS: { value: SubtitleEffect; label: string; description: string }[] = [
    { value: "none", label: "없음", description: "효과 없이 표시" },
    { value: "fade", label: "페이드 (기본)", description: "부드럽게 나타나고 사라짐" },
    { value: "typewriter", label: "타자기", description: "한 글자씩 타이핑 효과" },
    { value: "stagger", label: "스태거 (Stagger)", description: "단어가 순차적으로 등장" }, // Keeping as requested
];

// Helper to filter presets by start of ID
const getPresetsByPrefix = (prefix: string) =>
    CAPTION_PRESETS
        .filter(p => p.id.startsWith(prefix))
        .map(p => ({
            value: p.id as SubtitleEffect,
            label: p.name,
            description: p.scope === 'line' ? '줄 단위 애니메이션' : '단어 강조 애니메이션'
        }));

const EFFECT_CATEGORIES = [
    {
        id: "basic",
        label: "기본 효과",
        options: ESSENTIAL_LEGACY_EFFECTS
    },
    {
        id: "line",
        label: "등장 효과 (Line Entry)",
        options: getPresetsByPrefix('line_')
    },
    {
        id: "decor",
        label: "단어 꾸미기 (Decoration)",
        options: getPresetsByPrefix('decor_')
    },
    {
        id: "progress",
        label: "진행 효과 (Progress)",
        options: getPresetsByPrefix('prog_')
    },
    {
        id: "motion",
        label: "단어 모션 (Word Motion)",
        options: getPresetsByPrefix('word_')
    }
];

// Flat list for validation if needed, though mostly using categories now
const EFFECT_OPTIONS = [
    ...ESSENTIAL_LEGACY_EFFECTS,
    ...getPresetsByPrefix(''), // All
];


// ============================================================================
// Main Component
// ============================================================================

export function SRTSettingsPanel({ }: SRTSettingsPanelProps) {
    const {
        cues: captions,
        setCues,
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
        clips,
        allCues,
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
            {/* Tab Navigation - Scrollable with Buttons */}
            <div className="relative border-b bg-muted/20 shrink-0 group">
                <div
                    id="srt-tabs-container"
                    className="flex overflow-x-auto no-scrollbar scroll-smooth"
                >
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-shrink-0 flex items-center gap-2 py-3 px-4 text-[11px] font-bold transition-all border-b-2 uppercase tracking-tight",
                                    activeTab === tab.id
                                        ? "text-primary border-primary bg-background shadow-[inset_0_-1px_0_rgba(var(--primary),0.1)]"
                                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Icon className="size-3.5" />
                                <span>{tab.label}</span>
                                {tab.id === 'captions' && allCues.length > 0 && (
                                    <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[9px] font-black">
                                        {allCues.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Optional: Add gradient fade for overflow indicator if needed */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "captions" && (() => {
                    // Always show all project captions for a unified view regardless of active layer
                    const displayCaptions = allCues;

                    return (
                        <CaptionsTab
                            captions={displayCaptions}
                            currentTime={currentTime}
                            onCueClick={onCueClick}
                            onCueUpdate={onCueUpdate}
                            onClearCues={() => {
                                if (confirm("정말로 모든 자막을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                                    setCues([]);
                                }
                            }}
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
                {activeTab === "templates" && (
                    <TemplatesTab
                        onApplyPreset={(presetConfig) => onStyleChange({ ...style, ...presetConfig })}
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
    onClearCues,
}: {
    captions: SubtitleCue[];
    currentTime: number;
    onCueClick: (time: number) => void;
    onCueUpdate: (id: number, text: string) => void;
    onClearCues: () => void;
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
                {captions.length > 0 && (
                    <button
                        onClick={onClearCues}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="모든 자막 삭제"
                    >
                        <Trash2 className="size-4" />
                    </button>
                )}
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
                                key={`${cue.layerId}-${cue.id}`}
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

            {/* Display Mode */}
            <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground">노출 모드</h3>
                    <div className="flex gap-2">
                        {['standard', 'single-word'].map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => onStyleChange("displayMode", mode as any)}
                                className={cn(
                                    "flex-1 rounded-lg border px-3 py-2 text-[10px] font-bold transition uppercase tracking-tighter",
                                    style.displayMode === mode
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-secondary"
                                )}
                            >
                                {mode === 'standard' ? '일반 (여러단어)' : '숏폼용 (한단어)'}
                            </button>
                        ))}
                    </div>
                </div>
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

            {/* Stroke and Shadow Section */}
            <div className="space-y-4 pt-4 border-t">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">외곽선 및 그림자</h3>

                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>외곽선 굵기</span>
                            <span className="font-mono">{style.strokeWidth ?? 0}px</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={10}
                            step={0.5}
                            value={style.strokeWidth ?? 0}
                            onChange={(e) => onStyleChange("strokeWidth", parseFloat(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>그림자 흐림 (Blur)</span>
                            <span className="font-mono">{style.shadowBlur ?? 0}px</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={20}
                            value={style.shadowBlur ?? 0}
                            onChange={(e) => onStyleChange("shadowBlur", parseInt(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">그림자 색상</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={style.shadowColor ?? "#000000"}
                                onChange={(e) => onStyleChange("shadowColor", e.target.value)}
                                className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                            />
                            <input
                                type="text"
                                value={style.shadowColor ?? "#000000"}
                                onChange={(e) => onStyleChange("shadowColor", e.target.value)}
                                className="flex-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
                            />
                        </div>
                    </div>
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
                    max={200}
                    value={style.marginV}
                    onChange={(e) => onStyleChange("marginV", parseInt(e.target.value))}
                    className="w-full accent-primary"
                />
            </div>
        </div>
    );
}

// ============================================================================
// Templates Tab
// ============================================================================

function TemplatesTab({
    onApplyPreset,
}: {
    onApplyPreset: (presetConfig: Partial<SubtitleConfig>) => void;
}) {
    return (
        <div className="p-4">
            <div className="space-y-2 mb-4">
                <h3 className="text-sm font-semibold">스타일 템플릿</h3>
                <p className="text-xs text-muted-foreground">클릭 한 번으로 전문가 스타일을 적용하세요</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {PRESET_TEMPLATES.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => onApplyPreset(preset.config)}
                        className="relative group flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all text-center overflow-hidden"
                    >
                        {/* Preview Circle */}
                        <div
                            className="size-12 rounded-full mb-1 shadow-lg flex items-center justify-center font-bold text-black border-2 border-white/20"
                            style={{
                                backgroundColor: preset.previewColor,
                                fontFamily: preset.config.fontName?.includes(" ") ? `'${preset.config.fontName}'` : preset.config.fontName,
                                fontSize: '14px',
                            }}
                        >
                            Aa
                        </div>
                        <div className="space-y-0.5 z-10 w-full">
                            <p className="text-sm font-medium text-foreground truncate">{preset.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 h-7">{preset.description}</p>
                        </div>
                    </button>
                ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 text-center">
                템플릿을 선택하면 현재 스타일 설정이 덮어씌워집니다.
            </p>
        </div>
    );
}

// ============================================================================
// Effects Tab
// ============================================================================

function EffectPreview({ effect, isHovered }: { effect: SubtitleEffect; isHovered: boolean }) {
    const baseStyle = "text-xl font-bold select-none whitespace-nowrap";
    const preset = getEffectPreset(effect);

    // Dynamic Animation Logic
    if (preset) {
        // Line Scope - Entry Animation
        if (preset.scope === 'line' && preset.entry?.type === 'lineMotion') {
            const entry = preset.entry;
            return (
                <motion.div
                    className={baseStyle}
                    initial={entry.initial || { opacity: 1 }} // Default to visible if no initial
                    animate={isHovered ? entry.animate : (entry.initial || { opacity: 1 })}
                    transition={{
                        ...(entry.transition as any),
                        repeat: isHovered ? Infinity : 0,
                        repeatDelay: 1,
                        duration: 0.5 // Speed up for preview
                    }}
                >
                    Aa
                </motion.div>
            );
        }

        // Word Active Animation (Motion)
        if (preset.active?.type === 'wordMotion') {
            const active = preset.active;
            return (
                <motion.div
                    className={baseStyle}
                    animate={isHovered ? active.animate : (preset.inactive || {})}
                    transition={{
                        ...(active.transition as any),
                        repeat: isHovered ? Infinity : 0,
                        repeatDelay: 0.5
                    }}
                >
                    Aa
                </motion.div>
            );
        }

        // Static identification for other types
        if (preset.id.includes('highlight') || preset.id.includes('box') || preset.id.includes('pill')) {
            return <motion.span
                className={cn(baseStyle, "bg-primary/20 px-2 rounded")}
                animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
            >
                Aa
            </motion.span>;
        }
        if (preset.id.includes('color')) {
            return <motion.span
                className={cn(baseStyle, "text-primary")}
                animate={isHovered ? { opacity: [1, 0.5, 1] } : {}}
            >
                Aa
            </motion.span>;
        }

        // Fallback for unhandled presets
        return <motion.div className={cn(baseStyle, "opacity-75")} animate={isHovered ? { scale: 1.1 } : {}}>Aa</motion.div>;
    }

    // Legacy Effects
    switch (effect) {
        case "none":
            return <span className={baseStyle}>Aa</span>;
        case "fade":
            return (
                <motion.span
                    className={baseStyle}
                    animate={isHovered ? { opacity: [0, 1] } : { opacity: 1 }}
                    transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0, repeatDelay: 0.5 }}
                >
                    Aa
                </motion.span>
            );
        case "typewriter":
            return (
                <div className="flex items-center">
                    <span className={baseStyle}>A</span>
                    <motion.span
                        className={baseStyle}
                        initial={{ opacity: 0 }}
                        animate={isHovered ? { opacity: [0, 1, 1, 0] } : { opacity: 1 }}
                        transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0, times: [0, 0.1, 0.9, 1] }}
                    >
                        a
                    </motion.span>
                    {isHovered && <motion.span className="ml-0.5 w-0.5 h-4 bg-current" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />}
                </div>
            );
        case "stagger":
            return (
                <div className="flex items-baseline">
                    <motion.span
                        className={baseStyle}
                        animate={isHovered ? { y: [0, -4, 0] } : { y: 0 }}
                        transition={{ delay: 0, repeat: isHovered ? Infinity : 0, repeatDelay: 1 }}
                    >
                        A
                    </motion.span>
                    <motion.span
                        className={baseStyle}
                        animate={isHovered ? { y: [0, -4, 0] } : { y: 0 }}
                        transition={{ delay: 0.1, repeat: isHovered ? Infinity : 0, repeatDelay: 1 }}
                    >
                        a
                    </motion.span>
                </div>
            );
        default:
            return <span className={baseStyle}>Aa</span>;
    }
}

function EffectsTab({
    style,
    onStyleChange,
}: {
    style: SubtitleConfig;
    onStyleChange: <K extends keyof SubtitleConfig>(key: K, value: SubtitleConfig[K]) => void;
}) {
    // Local state for hover preview
    const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);

    return (
        <div className="p-4 space-y-6">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">자막 효과</h3>
                <p className="text-xs text-muted-foreground">자막 표시 애니메이션을 선택하세요</p>
            </div>

            {/* Effect Selection Categories */}
            <div className="space-y-6">
                {EFFECT_CATEGORIES.map((category) => (
                    <div key={category.id} className="space-y-3">
                        <h4 className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pb-1 border-b border-border/50">
                            <span className="w-1 h-1 rounded-full bg-primary/50" />
                            {category.label}
                        </h4>

                        <div className="grid grid-cols-4 gap-2">
                            {category.options.map((effect) => {
                                const isSelected = style.effect === effect.value;
                                return (
                                    <button
                                        key={effect.value}
                                        type="button"
                                        onClick={() => onStyleChange("effect", effect.value)}
                                        onMouseEnter={() => setHoveredEffect(effect.value)}
                                        onMouseLeave={() => setHoveredEffect(null)}
                                        className={cn(
                                            "relative group flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center gap-2 h-full",
                                            isSelected
                                                ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)]"
                                                : "border-border hover:border-primary/50 hover:bg-secondary/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center w-full h-10 rounded-md bg-muted/20 overflow-hidden transition-colors",
                                            isSelected && "bg-background"
                                        )}>
                                            <div className="scale-75 origin-center">
                                                <EffectPreview
                                                    effect={effect.value}
                                                    isHovered={hoveredEffect === effect.value}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-0.5 w-full">
                                            <p className={cn("text-[10px] font-semibold truncate px-1", isSelected ? "text-primary" : "text-foreground")}>
                                                {effect.label.split(' (')[0]}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary shadow-sm" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
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

            {/* Pop-in Settings */}
            {style.effect === "pop-in" && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <h4 className="text-xs font-semibold text-muted-foreground">팝인 상세 설정</h4>
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>단어 간격</span>
                            <span className="font-mono">{style.highlightGap ?? 16}px</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={40}
                            value={style.highlightGap ?? 16}
                            onChange={(e) => onStyleChange("highlightGap", parseInt(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Framer Motion 스프링 효과가 적용됩니다.</p>
                </div>
            )}

            {/* Highlight Settings (shown when highlight effect is selected) */}
            {style.effect === "highlight" && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                    <h4 className="text-xs font-semibold text-muted-foreground">하이라이트 상세 설정</h4>

                    {/* Padding */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>백그라운드 넓이 (패딩)</span>
                            <span className="font-mono">{style.highlightPadding ?? 12}px</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={30}
                            value={style.highlightPadding ?? 12}
                            onChange={(e) => onStyleChange("highlightPadding", parseInt(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    {/* Gap */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>단어 간격</span>
                            <span className="font-mono">{style.highlightGap ?? 8}px</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={20}
                            value={style.highlightGap ?? 8}
                            onChange={(e) => onStyleChange("highlightGap", parseInt(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">하이라이트 색상</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={style.highlightColor ?? "#FFFFFF"}
                                onChange={(e) => onStyleChange("highlightColor", e.target.value)}
                                className="h-8 w-8 cursor-pointer rounded border bg-transparent"
                            />
                            <input
                                type="text"
                                value={style.highlightColor ?? "#FFFFFF"}
                                onChange={(e) => onStyleChange("highlightColor", e.target.value)}
                                className="flex-1 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs"
                            />
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>투명도</span>
                            <span className="font-mono">{Math.round((style.highlightOpacity ?? 0.25) * 100)}%</span>
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={style.highlightOpacity ?? 0.25}
                            onChange={(e) => onStyleChange("highlightOpacity", parseFloat(e.target.value))}
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
