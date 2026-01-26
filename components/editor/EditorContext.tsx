"use client";

import { createContext, useContext, useState, useCallback, type ReactNode, type Dispatch, type SetStateAction } from "react";
import type {
    SubtitleCue,
    SubtitleConfig,
    CueProblem,
    CaptionData,
    LanguageConfig,
    PlaybackSpeed,
    SequenceClip
} from "@/lib/jobs/types";
import type { AssetRecord } from "@/lib/assets/types";
import { DEFAULT_SUBTITLE_CONFIG, DEFAULT_LANGUAGE_CONFIG } from "@/lib/jobs/types";
import { validateAllCues } from "@/lib/subtitle/validation";

// ============================================================================
// Editor Types
// ============================================================================

export type EditorLayer = {
    id: string;
    name: string;
    clips: {
        id: string;
        asset: AssetRecord;
        startTime: number;
        endTime: number;
        order: number;
        speed?: PlaybackSpeed;
    }[];
    cues: SubtitleCue[];
};

export type ClipClipboard = {
    asset: AssetRecord;
    startTime: number;
    endTime: number;
    speed?: PlaybackSpeed;
};

// ============================================================================
// Editor State
// ============================================================================

type EditorState = {
    /** All subtitle cues */
    cues: SubtitleCue[];
    /** Currently selected cue ID */
    selectedCueId: number | null;
    /** Default style configuration */
    defaultStyle: SubtitleConfig;
    /** Current playback time in seconds */
    currentTime: number;
    /** Whether video is playing */
    isPlaying: boolean;
    /** Detected problems */
    problems: CueProblem[];
    /** Whether there are unsaved changes */
    isDirty: boolean;
    /** Whether save is in progress */
    isSaving: boolean;
    /** Language configuration */
    language: LanguageConfig;
    /** Current playback speed */
    playbackSpeed: PlaybackSpeed;
    /** Whether the AI pipeline is running */
    isPipelineRunning: boolean;
    /** Current pipeline progress (0 to 1) */
    pipelineProgress: number;
    /** Current pipeline status message */
    pipelineStatus: string;
    /** Current job ID */
    currentJobId: string | null;
    /** Total media duration in seconds */
    duration: number;
    /** Sequence of clips */
    clips: {
        id: string;
        asset: AssetRecord;
        startTime: number;
        endTime: number;
        order: number;
        speed?: PlaybackSpeed;
    }[];
    /** ID of currently selected clip */
    activeClipId: string | null;
    /** In point for marking (seconds) */
    inPoint: number | null;
    /** Out point for marking (seconds) */
    outPoint: number | null;
    /** Video display fit mode */
    videoFit: 'contain' | 'cover';
    /** Video display aspect ratio */
    videoAspectRatio: 'original' | '9:16' | '1:1' | '16:9';
    /** Whether cropping mode is active */
    isCropping: boolean;
    /** Current crop area (percent 0-100) */
    cropArea: { x: number; y: number; width: number; height: number };
    /** All sequence layers */
    layers: EditorLayer[];
    /** Currently active layer ID */
    activeLayerId: string | null;
    /** Clipboard for copy/paste */
    clipboard: ClipClipboard | null;
};

type EditorActions = {
    /** Set all cues */
    setCues: (cues: SubtitleCue[]) => void;
    /** Select a cue by ID */
    selectCue: (id: number | null) => void;
    /** Update a specific cue */
    updateCue: (id: number, updates: Partial<SubtitleCue>) => void;
    /** Delete a cue */
    deleteCue: (id: number) => void;
    /** Add a new cue */
    addCue: (cue: SubtitleCue) => void;
    /** Split a cue at the current time */
    splitCue: (id: number, splitTime: number) => void;
    /** Set default style */
    setDefaultStyle: (style: SubtitleConfig) => void;
    /** Set current playback time */
    setCurrentTime: (time: number) => void;
    /** Set playing state */
    setIsPlaying: (playing: boolean) => void;
    /** Load caption data */
    loadCaptionData: (data: CaptionData) => void;
    /** Get current caption data */
    getCaptionData: () => CaptionData;
    /** Mark as saved */
    markSaved: () => void;
    /** Set saving state */
    setIsSaving: (saving: boolean) => void;
    /** Set language config */
    setLanguage: (config: LanguageConfig) => void;
    /** Set playback speed */
    setPlaybackSpeed: (speed: PlaybackSpeed) => void;
    /** Set pipeline running state */
    setIsPipelineRunning: (running: boolean) => void;
    /** Set pipeline progress */
    setPipelineProgress: (progress: number) => void;
    /** Set pipeline status message */
    setPipelineStatus: (status: string) => void;
    /** Set current job ID */
    setCurrentJobId: (id: string | null) => void;
    /** Set total media duration */
    setDuration: Dispatch<SetStateAction<number>>;
    /** Set sequence clips */
    setClips: Dispatch<SetStateAction<{
        id: string;
        asset: AssetRecord;
        startTime: number;
        endTime: number;
        order: number;
        speed?: PlaybackSpeed;
    }[]>>;
    /** Update active clip speed and adjust duration */
    updateActiveClipSpeed: (speed: PlaybackSpeed) => void;
    /** Set active clip ID */
    setActiveClipId: Dispatch<SetStateAction<string | null>>;
    /** Set In point */
    setInPoint: Dispatch<SetStateAction<number | null>>;
    /** Set Out point */
    setOutPoint: Dispatch<SetStateAction<number | null>>;
    /** Set Video Fit */
    setVideoFit: (fit: 'contain' | 'cover') => void;
    /** Set Video Aspect Ratio */
    setVideoAspectRatio: (ratio: 'original' | '9:16' | '1:1' | '16:9') => void;
    /** Set cropping mode */
    setIsCropping: (cropping: boolean) => void;
    /** Set crop area */
    setCropArea: (area: { x: number; y: number; width: number; height: number }) => void;
    /** Add a new layer */
    addLayer: (name?: string, initialAsset?: AssetRecord) => void;
    /** Duplicate an existing layer */
    duplicateLayer: (id: string) => void;
    /** Delete a layer */
    deleteLayer: (id: string) => void;
    /** Switch to a different layer */
    switchLayer: (id: string) => void;
    /** Update layer name */
    updateLayerName: (id: string, name: string) => void;
    /** Load full sequence stack */
    loadLayers: (layers: EditorLayer[], activeId?: string) => void;
    /** Add a clip to a specific layer */
    addClipToLayer: (layerId: string, asset: AssetRecord, insertIndex?: number) => void;
    /** Delete a specific clip from its layer */
    deleteClip: (clipId: string) => void;
    /** Duplicate a specific clip */
    duplicateClip: (clipId: string) => void;
    /** Copy a clip to clipboard */
    copyClip: (clipId: string) => void;
    /** Cut a clip to clipboard */
    cutClip: (clipId: string) => void;
    /** Paste clip from clipboard */
    pasteClip: (layerId: string, timestamp?: number) => void;
};

type EditorContextValue = EditorState & EditorActions;

const EditorContext = createContext<EditorContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

type EditorProviderProps = {
    children: ReactNode;
    initialData?: CaptionData;
};

export function EditorProvider({ children, initialData }: EditorProviderProps) {
    const [cues, setCuesInternal] = useState<SubtitleCue[]>(initialData?.cues ?? []);
    const [selectedCueId, setSelectedCueId] = useState<number | null>(null);
    const [defaultStyle, setDefaultStyleInternal] = useState<SubtitleConfig>(
        initialData?.defaultStyle ?? DEFAULT_SUBTITLE_CONFIG
    );
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [problems, setProblems] = useState<CueProblem[]>([]);
    const [language, setLanguageInternal] = useState<LanguageConfig>(DEFAULT_LANGUAGE_CONFIG);
    const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
    const [isPipelineRunning, setIsPipelineRunning] = useState(false);
    const [pipelineProgress, setPipelineProgress] = useState(0);
    const [pipelineStatus, setPipelineStatus] = useState("");
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [clips, setClips] = useState<{
        id: string;
        asset: AssetRecord;
        startTime: number;
        endTime: number;
        order: number;
    }[]>([]);
    const [activeClipId, setActiveClipId] = useState<string | null>(null);
    const [inPoint, setInPoint] = useState<number | null>(null);
    const [outPoint, setOutPoint] = useState<number | null>(null);
    const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'original' | '9:16' | '1:1' | '16:9'>('original');
    const [isCropping, setIsCropping] = useState(false);
    const [cropArea, setCropAreaInternal] = useState(initialData?.defaultStyle?.cropArea ?? { x: 0, y: 0, width: 100, height: 100 });
    const [layers, setLayers] = useState<EditorLayer[]>([
        { id: 'layer-1', name: 'Main Timeline', clips: [], cues: [] }
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>('layer-1');
    const [clipboard, setClipboard] = useState<ClipClipboard | null>(null);

    const setCropArea = useCallback((area: { x: number; y: number; width: number; height: number }) => {
        setCropAreaInternal(area);
        setIsDirty(true);
    }, []);

    // Revalidate problems when cues change
    const updateProblems = useCallback((newCues: SubtitleCue[]) => {
        setProblems(validateAllCues(newCues));
    }, []);

    const setCues = useCallback((newCues: SubtitleCue[] | ((prev: SubtitleCue[]) => SubtitleCue[])) => {
        setCuesInternal(prev => {
            const next = typeof newCues === 'function' ? newCues(prev) : newCues;
            updateProblems(next);
            // Sync to layers
            setLayers(lPrev => lPrev.map(l => l.id === activeLayerId ? { ...l, cues: next } : l));
            return next;
        });
        setIsDirty(true);
    }, [activeLayerId, updateProblems]);

    const selectCue = useCallback((id: number | null) => {
        setSelectedCueId(id);
    }, []);

    const updateCue = useCallback((id: number, updates: Partial<SubtitleCue>) => {
        setCuesInternal(prev => {
            const newCues = prev.map(cue =>
                cue.id === id ? { ...cue, ...updates } : cue
            );
            updateProblems(newCues);
            return newCues;
        });
        setIsDirty(true);
    }, [updateProblems]);

    const deleteCue = useCallback((id: number) => {
        setCuesInternal(prev => {
            const newCues = prev.filter(cue => cue.id !== id);
            updateProblems(newCues);
            return newCues;
        });
        if (selectedCueId === id) {
            setSelectedCueId(null);
        }
        setIsDirty(true);
    }, [selectedCueId, updateProblems]);

    const addCue = useCallback((cue: SubtitleCue) => {
        setCuesInternal(prev => {
            const newCues = [...prev, cue].sort((a, b) => a.startTime - b.startTime);
            updateProblems(newCues);
            return newCues;
        });
        setIsDirty(true);
    }, [updateProblems]);

    const splitCue = useCallback((id: number, splitTime: number) => {
        setCuesInternal(prev => {
            const cueIndex = prev.findIndex(c => c.id === id);
            if (cueIndex === -1) return prev;

            const cue = prev[cueIndex];
            if (splitTime <= cue.startTime || splitTime >= cue.endTime) return prev;

            const maxId = Math.max(...prev.map(c => c.id));
            const newCue: SubtitleCue = {
                id: maxId + 1,
                startTime: splitTime,
                endTime: cue.endTime,
                text: "",
            };

            const updatedCue = { ...cue, endTime: splitTime };

            const newCues = [
                ...prev.slice(0, cueIndex),
                updatedCue,
                newCue,
                ...prev.slice(cueIndex + 1),
            ];

            updateProblems(newCues);
            return newCues;
        });
        setIsDirty(true);
    }, [updateProblems]);

    const setDefaultStyle = useCallback((style: SubtitleConfig) => {
        setDefaultStyleInternal(style);
        setIsDirty(true);
    }, []);

    const setLanguage = useCallback((config: LanguageConfig) => {
        setLanguageInternal(config);
        setIsDirty(true);
    }, []);

    const loadCaptionData = useCallback((data: CaptionData) => {
        setCuesInternal(data.cues);
        setDefaultStyleInternal(data.defaultStyle);
        if (data.defaultStyle?.cropArea) {
            setCropAreaInternal(data.defaultStyle.cropArea);
        }
        updateProblems(data.cues);
        setIsDirty(false);
    }, [updateProblems]);

    const getCaptionData = useCallback((): CaptionData => {
        return {
            version: 1,
            cues,
            defaultStyle: {
                ...defaultStyle,
                cropArea
            },
            // Note: We might want to expand CaptionData in types.ts to include languageConfig
        };
    }, [cues, defaultStyle, cropArea]);

    const markSaved = useCallback(() => {
        setIsDirty(false);
    }, []);

    const addLayer = useCallback((name?: string, initialAsset?: AssetRecord) => {
        const newLayer: EditorLayer = {
            id: crypto.randomUUID(),
            name: name || `Sequence ${layers.length + 1}`,
            clips: initialAsset ? [
                {
                    id: crypto.randomUUID(),
                    asset: initialAsset,
                    startTime: 0,
                    endTime: initialAsset.meta?.duration || 10,
                    order: 0
                }
            ] : [],
            cues: [],
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        setClips(newLayer.clips);
        setCuesInternal([]);
        setDuration(initialAsset?.meta?.duration || 10);
        updateProblems([]);
        setIsDirty(true);
    }, [layers.length, updateProblems]);

    const switchLayer = useCallback((id: string) => {
        if (id === activeLayerId) return;

        setLayers(prev => {
            // Save current state to the active layer before switching
            return prev.map(layer => {
                if (layer.id === activeLayerId) {
                    return { ...layer, clips, cues };
                }
                return layer;
            });
        });

        const targetLayer = layers.find(l => l.id === id);
        if (targetLayer) {
            setActiveLayerId(id);
            setClips(targetLayer.clips);
            setCuesInternal(targetLayer.cues);
            updateProblems(targetLayer.cues);
        }
    }, [activeLayerId, clips, cues, layers, updateProblems]);

    const duplicateLayer = useCallback((id: string) => {
        const sourceLayer = layers.find(l => l.id === id) || (id === activeLayerId ? { id, name: "Current", clips, cues } : null);
        if (!sourceLayer) return;

        const newLayer: EditorLayer = {
            id: crypto.randomUUID(),
            name: `${sourceLayer.name} (Copy)`,
            clips: [...sourceLayer.clips.map(c => ({ ...c, id: crypto.randomUUID() }))],
            cues: [...sourceLayer.cues.map(c => ({ ...c, id: Math.random() }))], // Simple ID generation for copy
        };

        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newLayer.id);
        setClips(newLayer.clips);
        setCuesInternal(newLayer.cues);
        updateProblems(newLayer.cues);
        setIsDirty(true);
    }, [activeLayerId, clips, cues, layers, updateProblems]);

    const deleteLayer = useCallback((id: string) => {
        if (layers.length <= 1) return;

        setLayers(prev => prev.filter(l => l.id !== id));
        if (activeLayerId === id) {
            const remaining = layers.filter(l => l.id !== id);
            const nextLayer = remaining[0];
            setActiveLayerId(nextLayer.id);
            setClips(nextLayer.clips);
            setCuesInternal(nextLayer.cues);
            updateProblems(nextLayer.cues);
        }
        setIsDirty(true);
    }, [activeLayerId, layers, updateProblems]);

    const updateLayerName = useCallback((id: string, name: string) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, name } : l));
        setIsDirty(true);
    }, []);

    const addClipToLayer = useCallback((layerId: string, asset: AssetRecord, insertIndex?: number) => {
        setLayers(prev => {
            const layerIndex = prev.findIndex(l => l.id === layerId);
            if (layerIndex === -1) return prev;

            const layer = prev[layerIndex];
            const newClip = {
                id: crypto.randomUUID(),
                asset,
                startTime: 0,
                endTime: asset.meta?.duration || 10,
                order: insertIndex ?? layer.clips.length
            };

            const newClips = [...layer.clips];
            if (insertIndex !== undefined) {
                newClips.splice(insertIndex, 0, newClip);
                // Reorder
                newClips.forEach((c, i) => c.order = i);
            } else {
                newClips.push(newClip);
            }

            const newLayers = [...prev];
            newLayers[layerIndex] = { ...layer, clips: newClips };

            // If it's the active layer, sync the local clips state too
            if (layerId === activeLayerId) {
                setClips(newClips);
                const newDuration = newClips.reduce((acc, c) => {
                    const clipDuration = c.endTime - c.startTime;
                    const effectiveSpeed = c.speed || 1;
                    return acc + (clipDuration / effectiveSpeed);
                }, 0);
                setDuration(newDuration);
            }

            return newLayers;
        });
        setIsDirty(true);
    }, [activeLayerId]);

    const deleteClip = useCallback((clipId: string) => {
        setLayers(prev => {
            const newLayers = prev.map(layer => {
                const clipIndex = layer.clips.findIndex(c => c.id === clipId);
                if (clipIndex === -1) return layer;

                const newClips = layer.clips.filter(c => c.id !== clipId);
                // Reorder
                newClips.forEach((c, i) => c.order = i);

                // If it's the active layer, sync clips too
                if (layer.id === activeLayerId) {
                    setClips(newClips);
                    if (activeClipId === clipId) setActiveClipId(null);
                }

                return { ...layer, clips: newClips };
            });
            return newLayers;
        });
        setIsDirty(true);
    }, [activeLayerId, activeClipId]);

    const duplicateClip = useCallback((clipId: string) => {
        setLayers(prev => {
            const newLayers = prev.map(layer => {
                const clipIndex = layer.clips.findIndex(c => c.id === clipId);
                if (clipIndex === -1) return layer;

                const sourceClip = layer.clips[clipIndex];
                const newClip = {
                    ...sourceClip,
                    id: crypto.randomUUID(),
                    order: clipIndex + 1
                };

                const newClips = [...layer.clips];
                newClips.splice(clipIndex + 1, 0, newClip);
                // Reorder
                newClips.forEach((c, i) => c.order = i);

                if (layer.id === activeLayerId) {
                    setClips(newClips);
                }

                return { ...layer, clips: newClips };
            });
            return newLayers;
        });
        setIsDirty(true);
    }, [activeLayerId]);

    const copyClip = useCallback((clipId: string) => {
        const layer = layers.find(l => l.clips.some(c => c.id === clipId));
        if (!layer) return;
        const clip = layer.clips.find(c => c.id === clipId);
        if (!clip) return;

        setClipboard({
            asset: clip.asset,
            startTime: clip.startTime,
            endTime: clip.endTime,
            speed: clip.speed
        });
    }, [layers]);

    const cutClip = useCallback((clipId: string) => {
        copyClip(clipId);
        deleteClip(clipId);
    }, [copyClip, deleteClip]);

    const pasteClip = useCallback((layerId: string, timestamp?: number) => {
        if (!clipboard) return;

        setLayers(prev => {
            const layerIndex = prev.findIndex(l => l.id === layerId);
            if (layerIndex === -1) return prev;

            const layer = prev[layerIndex];

            // For now, paste at the end of the layer or at timestamp if we track it
            // In a more complex timeline we'd use the timestamp
            const newClip = {
                id: crypto.randomUUID(),
                asset: clipboard.asset,
                startTime: clipboard.startTime,
                endTime: clipboard.endTime,
                speed: clipboard.speed,
                order: layer.clips.length
            };

            const newClips = [...layer.clips, newClip];
            const newLayers = [...prev];
            newLayers[layerIndex] = { ...layer, clips: newClips };

            if (layer.id === activeLayerId) {
                setClips(newClips);
            }

            return newLayers;
        });
        setIsDirty(true);
    }, [clipboard, activeLayerId]);

    const loadLayers = useCallback((newLayers: EditorLayer[], activeId?: string) => {
        setLayers(newLayers);
        const targetId = activeId || newLayers[0]?.id;
        if (targetId) {
            const target = newLayers.find(l => l.id === targetId) || newLayers[0];
            setActiveLayerId(target.id);
            setClips(target.clips);
            setCuesInternal(target.cues);
            updateProblems(target.cues);
        }
        setIsDirty(false);
    }, [updateProblems]);

    const value: EditorContextValue = {
        // State
        cues,
        selectedCueId,
        defaultStyle,
        currentTime,
        isPlaying,
        problems,
        isDirty,
        isSaving,
        language,
        playbackSpeed,
        isPipelineRunning,
        currentJobId,
        duration,
        clips,
        activeClipId,
        inPoint,
        outPoint,
        videoFit,
        videoAspectRatio,
        isCropping,
        cropArea,
        pipelineProgress,
        pipelineStatus,
        layers,
        activeLayerId,
        clipboard,
        // Actions
        setCues,
        selectCue,
        updateCue,
        deleteCue,
        addCue,
        splitCue,
        setDefaultStyle,
        setCurrentTime,
        setIsPlaying,
        loadCaptionData,
        getCaptionData,
        markSaved,
        setIsSaving,
        setLanguage,
        setPlaybackSpeed,
        setIsPipelineRunning,
        setPipelineProgress,
        setPipelineStatus,
        setCurrentJobId,
        setDuration,
        setClips: (update: any) => {
            setClips(prev => {
                const next = typeof update === 'function' ? update(prev) : update;
                // Sync to layers
                setLayers(lPrev => lPrev.map(l => l.id === activeLayerId ? { ...l, clips: next } : l));
                // Update total duration based on new clips (accounting for speed)
                const newDuration = (next as SequenceClip[]).reduce((acc: number, c: SequenceClip) => {
                    const clipDuration = c.endTime - c.startTime;
                    const effectiveSpeed = c.speed || 1;
                    return acc + (clipDuration / effectiveSpeed);
                }, 0);
                setDuration(newDuration);
                return next;
            });
            setIsDirty(true);
        },
        updateActiveClipSpeed: (speed: PlaybackSpeed) => {
            if (!activeClipId) return;

            setClips(prev => {
                const updatedClips = prev.map(clip => {
                    if (clip.id === activeClipId) {
                        return { ...clip, speed };
                    }
                    return clip;
                });

                // Sync to layers
                setLayers(lPrev => lPrev.map(l => l.id === activeLayerId ? { ...l, clips: updatedClips } : l));

                // Recalculate total duration accounting for speed
                const newDuration = updatedClips.reduce((acc, c) => {
                    const clipDuration = c.endTime - c.startTime;
                    const effectiveSpeed = ('speed' in c && c.speed) ? c.speed : 1;
                    return acc + (clipDuration / effectiveSpeed);
                }, 0);
                setDuration(newDuration);

                return updatedClips;
            });

            // Also update the global playback speed
            setPlaybackSpeed(speed);
            setIsDirty(true);
        },
        setActiveClipId,
        setInPoint,
        setOutPoint,
        setVideoFit,
        setVideoAspectRatio,
        setIsCropping,
        setCropArea,
        addLayer,
        duplicateLayer,
        deleteLayer,
        switchLayer,
        updateLayerName,
        loadLayers,
        addClipToLayer,
        deleteClip,
        duplicateClip,
        copyClip,
        cutClip,
        pasteClip,
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useEditor(): EditorContextValue {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}

// Get selected cue helper
export function useSelectedCue(): SubtitleCue | null {
    const { cues, selectedCueId } = useEditor();
    return cues.find(cue => cue.id === selectedCueId) ?? null;
}

// Get problems for a specific cue
export function useCueProblems(cueId: number): CueProblem[] {
    const { problems } = useEditor();
    return problems.filter(p => p.cueId === cueId);
}
