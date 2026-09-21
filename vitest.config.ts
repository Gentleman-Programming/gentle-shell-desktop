import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Main-process code (src/main, src/preload) runs under Node and never
// touches the DOM, so "node" is the default environment. Renderer test
// files that need the DOM opt in per-file with a leading
// `// @vitest-environment jsdom` comment (Vitest 5 dropped
// environmentMatchGlobs), which keeps a single `pnpm test` invocation
// instead of juggling two vitest projects.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@renderer": resolve(import.meta.dirname, "src/renderer"),
      "@shared": resolve(import.meta.dirname, "src/shared"),
    },
  },
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["test/setup.ts"],
    css: false,
  },
});
