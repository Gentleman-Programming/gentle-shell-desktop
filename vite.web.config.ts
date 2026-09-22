import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Plain Vite dev server for the renderer only. The maintainer drives the UI
// with browser automation, which cannot attach to an Electron BrowserWindow,
// so this serves the exact same renderer code in an ordinary Chrome tab.
// useBridge() falls back to the in-memory mock bridge here because
// window.gentle only exists when the preload script has run inside Electron.
export default defineConfig({
  root: resolve(import.meta.dirname, "src/renderer"),
  plugins: [react()],
  resolve: {
    alias: {
      "@renderer": resolve(import.meta.dirname, "src/renderer"),
      "@shared": resolve(import.meta.dirname, "src/shared"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
