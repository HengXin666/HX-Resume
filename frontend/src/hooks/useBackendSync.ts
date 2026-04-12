import { useCallback, useEffect, useRef, useState } from 'react';
import { useResumeStore } from '../stores/resumeStore';
import { fetchResumesFull, syncResumesToBackend } from '../utils/api';

const SYNC_DEBOUNCE_MS = 2000;
const INIT_RETRY_DELAY = 3000;
const INIT_MAX_RETRIES = 5;

/**
 * Two-way sync between Zustand (localStorage) store and the backend API.
 *
 * - On mount: if localStorage is empty, pull resumes from backend first.
 * - On mount: pushes local resumes to backend (localStorage is source of truth).
 * - On store changes: debounced push to backend.
 * - If initial push fails, retries up to INIT_MAX_RETRIES times.
 */
export function useBackendSync() {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push current store state to backend
  const pushToBackend = useCallback(async () => {
    const { resumes, activeResumeId } = useResumeStore.getState();
    if (resumes.length === 0) return; // Nothing to sync
    setSyncing(true);
    setLastSyncError(null);
    try {
      await syncResumesToBackend(resumes, activeResumeId);
      console.log('[BackendSync] pushed', resumes.length, 'resumes to backend');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setLastSyncError(msg);
      console.warn('[BackendSync] push failed:', msg);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Debounced push
  const debouncedPush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pushToBackend();
    }, SYNC_DEBOUNCE_MS);
  }, [pushToBackend]);

  // Initial sync with retry
  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    /** Try to pull resumes from backend when local store is empty. */
    async function tryPullFromBackend(): Promise<boolean> {
      try {
        const backendResumes = await fetchResumesFull();
        if (cancelled) return false;
        if (backendResumes.length > 0) {
          useResumeStore.getState().loadFromBackend(backendResumes);
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

    async function tryInitialSync(): Promise<boolean> {
      const { resumes, activeResumeId } = useResumeStore.getState();

      // If local store is empty, try to pull from backend first
      if (resumes.length === 0) {
        console.log('[BackendSync] local store empty, pulling from backend...');
        return tryPullFromBackend();
      }

      // Local has data → push to backend
      try {
        await syncResumesToBackend(resumes, activeResumeId);
        console.log('[BackendSync] initial sync success:', resumes.length, 'resumes');
        return true;
      } catch (err) {
        console.warn('[BackendSync] initial sync attempt failed:', err);
        return false;
      }
    }

    async function init() {
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
    if (!initialized) return;

    const unsub = useResumeStore.subscribe(() => {
      debouncedPush();
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [initialized, debouncedPush]);

  return { syncing, lastSyncError, initialized, pushToBackend };
}
