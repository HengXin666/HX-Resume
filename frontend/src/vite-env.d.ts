/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** When "true", disable all backend sync (pure frontend / GitHub Pages mode) */
  readonly VITE_STATIC_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
