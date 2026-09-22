import { resolveHomeArgs } from "../domain/home/home";
import type { HomeSettings } from "../ports";
import type { AppConfigStore } from "./appConfigStore";

/**
 * HomeSettings backed by the persisted app config (T5): ChatHost calls
 * `homeArgs()` fresh on every spawned session instead of receiving a
 * fixed array, so a home choice made mid-session (first-run) takes effect
 * on the very next open/new without restarting the app.
 */
export function createHomeSettings(configStore: AppConfigStore, env: NodeJS.ProcessEnv = process.env): HomeSettings {
  return {
    homeArgs(): readonly string[] {
      return resolveHomeArgs(configStore.read(), env);
    },
  };
}
