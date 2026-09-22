import type { GentleBridge } from "@shared/bridge-types";
import { mockBridge } from "./mockBridge";

/**
 * Selects the real preload bridge when running inside Electron
 * (window.gentle is set by src/preload/index.ts) or falls back to the
 * in-memory mock everywhere else, so the same renderer code runs under
 * `pnpm dev` and `pnpm dev:web` alike.
 */
export function useBridge(): GentleBridge {
  return window.gentle ?? mockBridge;
}
