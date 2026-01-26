"use client";

import { useEffect, useRef, useCallback } from 'react';

interface AutoSaveConfig {
  projectId: string;
  jobId: string | null;
  isDirty: boolean;
  getData: () => any;
  onSave: () => Promise<void>;
  autoSaveDelayMs?: number;
  localStorageDelayMs?: number;
}

interface RecoveryData {
  timestamp: number;
  jobId: string | null;
  data: any;
}

/**
 * Hook for auto-saving editor state to server and localStorage backup
 * 
 * Features:
 * - Debounced auto-save to server when changes are detected
 * - LocalStorage backup for crash recovery
 * - beforeunload warning when there are unsaved changes
 */
export function useAutoSave(config: AutoSaveConfig) {
  const {
    projectId,
    jobId,
    isDirty,
    getData,
    onSave,
    autoSaveDelayMs = 5000,
    localStorageDelayMs = 2000
  } = config;

  const storageKey = `editor-draft-${projectId}`;
  const localStorageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Save to localStorage (debounced)
  const saveToLocalStorage = useCallback(() => {
    if (localStorageTimerRef.current) {
      clearTimeout(localStorageTimerRef.current);
    }

    localStorageTimerRef.current = setTimeout(() => {
      if (!isDirty) return;
      try {
        const data = getData();
        const recoveryData: RecoveryData = {
          timestamp: Date.now(),
          jobId,
          data
        };
        localStorage.setItem(storageKey, JSON.stringify(recoveryData));
        console.log('[AutoSave] Saved to localStorage');
      } catch (err) {
        console.error('[AutoSave] Failed to save to localStorage:', err);
      }
    }, localStorageDelayMs);
  }, [isDirty, jobId, getData, storageKey, localStorageDelayMs]);

  // Auto-save to server (debounced)
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!isDirty || !jobId || isSavingRef.current) return;
      
      isSavingRef.current = true;
      try {
        await onSave();
        // Clear localStorage on successful save
        localStorage.removeItem(storageKey);
        console.log('[AutoSave] Auto-saved to server');
      } catch (err) {
        console.error('[AutoSave] Failed to auto-save:', err);
      } finally {
        isSavingRef.current = false;
      }
    }, autoSaveDelayMs);
  }, [isDirty, jobId, onSave, storageKey, autoSaveDelayMs]);

  // Trigger saves when isDirty changes
  useEffect(() => {
    if (isDirty) {
      saveToLocalStorage();
      triggerAutoSave();
    }
  }, [isDirty, saveToLocalStorage, triggerAutoSave]);

  // beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (localStorageTimerRef.current) clearTimeout(localStorageTimerRef.current);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Get recovery data from localStorage
  const getRecoveryData = useCallback((): RecoveryData | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as RecoveryData;
        // Only return if less than 24 hours old
        if (parsed.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
          return parsed;
        } else {
          // Clear stale data
          localStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      console.error('[AutoSave] Failed to get recovery data:', err);
    }
    return null;
  }, [storageKey]);

  // Clear recovery data
  const clearRecoveryData = useCallback(() => {
    localStorage.removeItem(storageKey);
    console.log('[AutoSave] Cleared recovery data');
  }, [storageKey]);

  return { getRecoveryData, clearRecoveryData };
}
