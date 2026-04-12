import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // For GitHub Pages deployment, VITE_BASE is set to "/<repo-name>/"
  base: process.env.VITE_BASE || '/',
  build: {
    // In static mode, inline small assets for better standalone experience
    ...(mode === 'static' && { assetsInlineLimit: 8192 }),
  },
}))
