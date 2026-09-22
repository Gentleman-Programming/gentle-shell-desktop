import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { HOME_MODE, type HomeMode, type PiDetection } from "@shared/bridge-types";

export interface HomeConfig {
  readonly home?: HomeMode;
}

/**
 * Single source of truth for "no choice persisted yet -> isolated" (T6
 * follow-up): resolveHomeArgs below and main/index.ts's SessionStore
 * factory both call this instead of separately re-encoding the same
 * default, so they can never drift out of agreement on what an absent
 * choice means.
 */
export function resolveHomeMode(config: HomeConfig): HomeMode {
  return config.home ?? HOME_MODE.ISOLATED;
}

/**
 * Resolves the launcher flags gentle-shell needs to pick the right pi
 * home (T5): `--link` reuses an existing plain pi CLI install
 * (`~/.pi/agent` or `PI_CODING_AGENT_DIR`), `--isolated` uses
 * `~/.gentle-shell/agent`. Defaults to isolated when no choice has been
 * persisted yet (pre-first-run, or first-run was skipped because no pi
 * was found — see detectPi below), via resolveHomeMode above.
 * `GENTLE_SHELL_HOME` overrides either mode with an explicit
 * `--home <dir>`; homeDirFor honors the same override so gentle-shell's
 * child process and this process's own SessionStore always agree on the
 * same directory.
 */
export function resolveHomeArgs(config: HomeConfig, env: NodeJS.ProcessEnv = process.env): readonly string[] {
  const override = env.GENTLE_SHELL_HOME;
  if (override) return ["--home", override];
  return resolveHomeMode(config) === HOME_MODE.LINK ? ["--link"] : ["--isolated"];
}

/**
 * Single source of truth for the pi-dir rule (T6 follow-up): the linked
 * home is `PI_CODING_AGENT_DIR` when set, else `<homedir>/.pi/agent`.
 * homeDirFor and detectPi below both call this instead of separately
 * re-encoding the same lookup.
 */
export function piAgentDir(env: NodeJS.ProcessEnv = process.env, resolveHomedir: () => string = homedir): string {
  return env.PI_CODING_AGENT_DIR || path.join(resolveHomedir(), ".pi", "agent");
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

  if (mode === HOME_MODE.LINK) return piAgentDir(env, resolveHomedir);

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
  const dir = piAgentDir(env, resolveHomedir);
  const found = exists(dir);

  return {
    found,
    dir,
    hasAuth: found && exists(path.join(dir, "auth.json")),
    hasModels: found && exists(path.join(dir, "models.json")),
  };
}
