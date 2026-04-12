import { useCallback, useEffect, useRef, useState } from 'react';
import { useResumeStore } from '../stores/resumeStore';
import { usePublicResumeStore } from '../stores/publicResumeStore';
import { fetchResumesFull, syncResumesToBackend } from '../utils/api';
import type { PublicResumeConfig } from '../types/resume';

const SYNC_DEBOUNCE_MS = 8000;
const INIT_RETRY_DELAY = 3000;
const INIT_MAX_RETRIES = 5;

/** True when running as a pure-frontend static build (GitHub Pages etc.) */
const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true';

/**
 * Two-way sync between Zustand (localStorage) store and the backend API.
 *
 * - On mount: if localStorage is empty, pull resumes from backend first.
 * - On mount: pushes local resumes to backend (localStorage is source of truth).
 * - On store changes: debounced push to backend.
 * - Also syncs publicResumeStore (redaction config) to backend.
 * - If initial push fails, retries up to INIT_MAX_RETRIES times.
 * - In STATIC_MODE: skips all backend interaction; localStorage is the only storage.
 */
export function useBackendSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(STATIC_MODE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build publicConfig map from the store
  const buildPublicConfigMap = useCallback((): Record<string, PublicResumeConfig> => {
    const publicStore = usePublicResumeStore.getState();
    const { resumes, activeResumeId } = useResumeStore.getState();

    // Save current active config to map first
    if (activeResumeId) {
      publicStore.saveCurrentToMap(activeResumeId);
    }

    const map: Record<string, PublicResumeConfig> = { ...publicStore.getConfigMap() };

    // Ensure all resume IDs have an entry (even if null/empty)
    for (const r of resumes) {
      if (!(r.id in map)) {
        map[r.id] = { enabled: false, redactedItems: [], defaultStyle: 'mosaic', defaultSolidColor: '#333333' };
      }
    }

    return map;
  }, []);

  // Push current store state to backend
  const pushToBackend = useCallback(async () => {
    const { resumes, activeResumeId } = useResumeStore.getState();
    if (resumes.length === 0) return; // Nothing to sync
    setSyncing(true);
    setLastSyncError(null);
    try {
      const publicConfigMap = buildPublicConfigMap();
      await syncResumesToBackend(resumes, activeResumeId, publicConfigMap);
      console.log('[BackendSync] pushed', resumes.length, 'resumes to backend');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setLastSyncError(msg);
      console.warn('[BackendSync] push failed:', msg);
    } finally {
      setSyncing(false);
    }
  }, [buildPublicConfigMap]);

  // Debounced push
  const debouncedPush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pushToBackend();
    }, SYNC_DEBOUNCE_MS);
  }, [pushToBackend]);

  // Initial sync with retry ~ wait for both stores to finish hydration first
  useEffect(() => {
    if (STATIC_MODE) return; // Pure frontend: skip backend entirely

    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    /** Wait for publicResumeStore persist hydration to complete. */
    function waitPublicHydrated(): Promise<void> {
      return new Promise((resolve) => {
        if (usePublicResumeStore.persist.hasHydrated()) {
          resolve();
          return;
        }
        const unsub = usePublicResumeStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }

    /** Try to pull resumes from backend when local store is empty. */
    async function tryPullFromBackend(): Promise<boolean> {
      try {
        const backendResumes = await fetchResumesFull();
        if (cancelled) return false;
        if (backendResumes.length > 0) {
          useResumeStore.getState().loadFromBackend(backendResumes);

          // Load public configs from backend data (uses merge — won't overwrite local)
          const publicStore = usePublicResumeStore.getState();
          for (const r of backendResumes) {
            const pc = (r as Record<string, unknown>).public_config as PublicResumeConfig | null;
            if (pc && pc.redactedItems && pc.redactedItems.length > 0) {
              publicStore.loadFromBackend(r.id, pc);
            }
          }

          // Load the active resume's config
          const activeId = useResumeStore.getState().activeResumeId;
          if (activeId) {
            publicStore.switchResume(activeId);
          }

          console.log('[BackendSync] pulled', backendResumes.length, 'resumes from backend');
          return true;
        }
        console.log('[BackendSync] backend has no resumes either');
        return true; // Nothing on backend is fine
      } catch (err) {
        console.warn('[BackendSync] pull from backend failed:', err);
        return false;
      }
    }

    /** Merge backend public_config for resumes we already have locally. */
    async function mergeBackendPublicConfigs(): Promise<void> {
      try {
        const backendResumes = await fetchResumesFull();
        if (cancelled) return;
        const publicStore = usePublicResumeStore.getState();
        for (const r of backendResumes) {
          const pc = (r as Record<string, unknown>).public_config as PublicResumeConfig | null;
          if (pc && pc.redactedItems && pc.redactedItems.length > 0) {
            publicStore.loadFromBackend(r.id, pc);
          }
        }
      } catch {
        // Non-critical: local data still works
        console.warn('[BackendSync] failed to merge backend public configs');
      }
    }

    async function tryInitialSync(): Promise<boolean> {
      const { resumes, activeResumeId } = useResumeStore.getState();

      // If local store is empty, try to pull from backend first
      if (resumes.length === 0) {
        console.log('[BackendSync] local store empty, pulling from backend...');
        return tryPullFromBackend();
      }

      // Local has data → merge any backend public_config we don't have locally,
      // then push to backend (local is source of truth)
      await mergeBackendPublicConfigs();

      try {
        const publicConfigMap = buildPublicConfigMap();
        await syncResumesToBackend(resumes, activeResumeId, publicConfigMap);
        console.log('[BackendSync] initial sync success:', resumes.length, 'resumes');
        return true;
      } catch (err) {
        console.warn('[BackendSync] initial sync attempt failed:', err);
        return false;
      }
    }

    async function init() {
      // Wait for publicResumeStore to finish hydrating from localStorage
      await waitPublicHydrated();
      if (cancelled) return;

      const success = await tryInitialSync();
      if (cancelled) return;

      if (success) {
        setInitialized(true);
      } else if (retryCount < INIT_MAX_RETRIES) {
        retryCount++;
        console.log(`[BackendSync] retrying initial sync (${retryCount}/${INIT_MAX_RETRIES}) in ${INIT_RETRY_DELAY}ms...`);
        retryTimer = setTimeout(() => {
          if (!cancelled) init();
        }, INIT_RETRY_DELAY);
      } else {
        console.warn('[BackendSync] gave up after', INIT_MAX_RETRIES, 'retries');
        setLastSyncError('Backend unreachable after retries');
        setInitialized(true); // Still mark initialized so store subscription works
      }
    }

    init();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to store changes → debounced push
  useEffect(() => {
    if (!initialized || STATIC_MODE) return;

    const unsub1 = useResumeStore.subscribe(() => {
      debouncedPush();
    });

    const unsub2 = usePublicResumeStore.subscribe(() => {
      debouncedPush();
    });

    return () => {
      unsub1();
      unsub2();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [initialized, debouncedPush]);

  return { syncing, lastSyncError, initialized, pushToBackend };
}
