import { existsSync } from "node:fs";
import { homedir } from "node:os";
import type { HomeMode, SetupStatus } from "@shared/bridge-types";
import { detectPi } from "../domain/home/home";
import type { SetupService } from "../ports";
import type { AppConfigStore } from "./appConfigStore";

/**
 * SetupService backed by the persisted app config and detectPi (T5).
 * `needsChoice` is true only when no home choice is persisted yet AND pi
 * was actually detected: with no pi on the machine, first-run has nothing
 * useful to offer and gentle-shell-desktop starts in its own isolated
 * space directly (see the first-run mockup's fine print).
 */
export function createSetupService(
  configStore: AppConfigStore,
  env: NodeJS.ProcessEnv = process.env,
  exists: (candidate: string) => boolean = existsSync,
): SetupService {
  return {
    async status(): Promise<SetupStatus> {
      const detection = detectPi(env, homedir, exists);
      const hasChoice = configStore.read().home !== undefined;
      return { needsChoice: !hasChoice && detection.found, detection };
    },

    async chooseHome(mode: HomeMode): Promise<void> {
      try {
        configStore.write({ home: mode });
      } catch (error) {
        // Wraps whatever configStore.write throws (ENOSPC, EACCES, a
        // malformed userData path, ...) with a clear message instead of
        // leaking the raw fs error: ipc's handle() rejection carries only
        // the message text to the renderer (T6 follow-up), and
        // FirstRunContainer shows it as-is ("Could not save your choice:
        // <message>"), so this message alone must already read clearly.
        throw new Error(`Could not save the home choice: ${errorMessage(error)}`, { cause: error });
      }
    },
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
