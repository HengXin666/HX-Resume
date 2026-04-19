import { createContext, useContext } from 'react';
import { useBackendSync } from '../hooks/useBackendSync';
import type { ForceSyncResult } from '../hooks/useBackendSync';

interface BackendSyncContextValue {
  syncing: boolean;
  lastSyncError: string | null;
  initialized: boolean;
  forcePush: () => Promise<ForceSyncResult>;
  forcePull: () => Promise<ForceSyncResult>;
}

const BackendSyncContext = createContext<BackendSyncContextValue | null>(null);

export function BackendSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useBackendSync();
  return (
    <BackendSyncContext.Provider value={sync}>
      {children}
    </BackendSyncContext.Provider>
  );
}

export function useBackendSyncContext(): BackendSyncContextValue | null {
  return useContext(BackendSyncContext);
}
