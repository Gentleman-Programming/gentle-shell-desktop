import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { HOME_MODE, type HomeMode, type PiDetection } from "@shared/bridge-types";

export interface HomeConfig {
  readonly home?: HomeMode;
}

/**
 * Resolves the launcher flags gentle-shell needs to pick the right pi
 * home (T5): `--link` reuses an existing plain pi CLI install
 * (`~/.pi/agent` or `PI_CODING_AGENT_DIR`), `--isolated` uses
 * `~/.gentle-shell/agent`. Defaults to isolated when no choice has been
 * persisted yet (pre-first-run, or first-run was skipped because no pi
 * was found — see detectPi below). `GENTLE_SHELL_HOME` overrides either
 * mode with an explicit `--home <dir>`; homeDirFor honors the same
 * override so gentle-shell's child process and this process's own
 * SessionStore always agree on the same directory.
 */
export function resolveHomeArgs(config: HomeConfig, env: NodeJS.ProcessEnv = process.env): readonly string[] {
  const override = env.GENTLE_SHELL_HOME;
  if (override) return ["--home", override];
  return config.home === HOME_MODE.LINK ? ["--link"] : ["--isolated"];
}

/**
 * Resolves the actual directory this process's own SessionStore
 * (adapters/piSessionStore.ts) reads from for a given mode — must stay in
 * lockstep with resolveHomeArgs' flags (T2's ChatHostDeps.homeArgs doc
 * note) or the session list would not match the chat the user can
 * actually open.
 */
export function homeDirFor(
  mode: HomeMode,
  env: NodeJS.ProcessEnv = process.env,
  resolveHomedir: () => string = homedir,
): string {
  const override = env.GENTLE_SHELL_HOME;
  if (override) return override;

  if (mode === HOME_MODE.LINK) {
    const piOverride = env.PI_CODING_AGENT_DIR;
    if (piOverride) return piOverride;
    return path.join(resolveHomedir(), ".pi", "agent");
  }

  return path.join(resolveHomedir(), ".gentle-shell", "agent");
}

/**
 * Detects an existing plain pi CLI install so first-run (T5) can offer
 * "use my pi setup" only when there is a pi setup to use, and can skip
 * the screen entirely otherwise. Pure and injectable (env/homedir/exists)
 * so it needs no real filesystem access in tests.
 */
export function detectPi(
  env: NodeJS.ProcessEnv = process.env,
  resolveHomedir: () => string = homedir,
  exists: (candidate: string) => boolean = existsSync,
): PiDetection {
  const dir = env.PI_CODING_AGENT_DIR || path.join(resolveHomedir(), ".pi", "agent");
  const found = exists(dir);

  return {
    found,
    dir,
    hasAuth: found && exists(path.join(dir, "auth.json")),
    hasModels: found && exists(path.join(dir, "models.json")),
  };
}
