import { homedir } from "node:os";
import path from "node:path";

export interface ResolveHomeOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly homedir?: () => string;
}

/**
 * Resolves the gentle-shell-desktop "home": the directory both the spawned
 * `gentle-shell` child (via --home / --link / --isolated, T2's homeArgs)
 * and this process's own SessionStore (piSessionStore.ts) read pi state
 * from, so the session list always matches the chat the user can open.
 *
 * `GENTLE_SHELL_HOME` overrides it. The default, `<homedir>/.gentle-shell/agent`,
 * is isolated from a plain pi CLI install's `~/.pi/agent` — T5 adds a
 * "use my pi setup" (link) vs. "keep it separate" (isolated) first-run
 * choice that can point this at the real pi home instead.
 */
export function resolveHome(options: ResolveHomeOptions = {}): string {
  const env = options.env ?? process.env;
  const resolveHomedir = options.homedir ?? homedir;

  const override = env.GENTLE_SHELL_HOME;
  if (override) return override;

  return path.join(resolveHomedir(), ".gentle-shell", "agent");
}
