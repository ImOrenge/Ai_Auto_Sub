"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SubtitleCue, SubtitleConfig, CueProblem, CaptionData } from "@/lib/jobs/types";
import { DEFAULT_SUBTITLE_CONFIG } from "@/lib/jobs/types";
import { validateAllCues } from "@/lib/subtitle/validation";

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

    // Revalidate problems when cues change
    const updateProblems = useCallback((newCues: SubtitleCue[]) => {
        setProblems(validateAllCues(newCues));
    }, []);

    const setCues = useCallback((newCues: SubtitleCue[]) => {
        setCuesInternal(newCues);
        updateProblems(newCues);
        setIsDirty(true);
    }, [updateProblems]);

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

    const loadCaptionData = useCallback((data: CaptionData) => {
        setCuesInternal(data.cues);
        setDefaultStyleInternal(data.defaultStyle);
        updateProblems(data.cues);
        setIsDirty(false);
    }, [updateProblems]);

    const getCaptionData = useCallback((): CaptionData => {
        return {
            version: 1,
            cues,
            defaultStyle,
        };
    }, [cues, defaultStyle]);

    const markSaved = useCallback(() => {
        setIsDirty(false);
    }, []);

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
