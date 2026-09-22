import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

// electron-vite builds three independent bundles (main, preload, renderer)
// because they run in three different JS runtimes with different
// capabilities (Node, a sandboxed bridge, and the browser-like renderer).
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve(import.meta.dirname, "src/shared"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve(import.meta.dirname, "src/shared"),
      },
    },
  },
  renderer: {
    root: resolve(import.meta.dirname, "src/renderer"),
    build: {
      rollupOptions: {
        input: resolve(import.meta.dirname, "src/renderer/index.html"),
      },
    },
    resolve: {
      alias: {
        "@renderer": resolve(import.meta.dirname, "src/renderer"),
        "@shared": resolve(import.meta.dirname, "src/shared"),
      },
    },
    plugins: [react()],
  },
});
