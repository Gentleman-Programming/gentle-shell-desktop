import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { HOME_MODE, type HomeMode } from "@shared/bridge-types";
import type { HomeConfig } from "../domain/home/home";

export interface AppConfigStore {
  read(): HomeConfig;
  write(patch: Partial<HomeConfig>): HomeConfig;
}

/**
 * JSON config under Electron's `app.getPath("userData")/config.json`
 * (T5), with `configPath` injected so this is testable without a real
 * Electron `app` — see src/main/index.ts for the real wiring. Tolerant of
 * a missing or invalid file: any read failure (ENOENT, malformed JSON, an
 * unrecognized `home` value) is treated as "no choice persisted yet"
 * instead of throwing, so a corrupt config never blocks the app from
 * starting.
 */
export function createAppConfigStore(configPath: string): AppConfigStore {
  function read(): HomeConfig {
    try {
      const raw = readFileSync(configPath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};

      const home: unknown = (parsed as { home?: unknown }).home;
      return isHomeMode(home) ? { home } : {};
    } catch {
      return {};
    }
  }

  function write(patch: Partial<HomeConfig>): HomeConfig {
    const next: HomeConfig = { ...read(), ...patch };
    mkdirSync(path.dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(next, null, 2));
    return next;
  }

  return { read, write };
}

function isHomeMode(value: unknown): value is HomeMode {
  return value === HOME_MODE.LINK || value === HOME_MODE.ISOLATED;
}
