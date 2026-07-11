/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** When "true", disable all backend sync (pure frontend / GitHub Pages mode) */
  readonly VITE_STATIC_MODE: string;
  /** When "true", ignore local cache and force reading from backend on startup */
  readonly VITE_DISABLE_LOCAL_CACHE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
