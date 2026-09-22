import type { SessionInfoLike, SessionStore } from "../ports";

/**
 * SessionStore backed by pi's own SessionManager.listAll(). The
 * `@earendil-works/pi-coding-agent` import is dynamic to isolate whatever
 * load-time cost/side effects the package graph has from call sites that
 * never list sessions (e.g. plain unit tests of unrelated main-process
 * code, or a future Electron bundle path that only spawns gentle-shell).
 *
 * Deviates from a literal "pass `<home>/sessions` as the session dir"
 * design: `SessionManager.listAll(sessionDir)` treats a passed sessionDir
 * as ONE flat directory of `.jsonl` files, but pi actually stores sessions
 * one subdirectory per project cwd, under
 * `<agentDir>/sessions/--<encoded-cwd>--/*.jsonl` (see
 * getDefaultSessionDirPath in pi's src/core/session-manager.ts) — passing
 * `<home>/sessions` directly would find zero sessions for any real
 * multi-project home. Only the zero-argument overload,
 * `SessionManager.listAll()`, recurses across those per-project
 * subdirectories — but it reads its agent dir from the `PI_CODING_AGENT_DIR`
 * env var (`getAgentDir()` in pi's src/config.ts), not from a parameter.
 * So this adapter sets that env var for the duration of the call instead
 * of passing `home` as an argument, and restores the previous value
 * afterward (a real, accepted M1 limitation: concurrent listAll() calls
 * against two different homes would race on this global; only one
 * SessionStore/home is ever in play in M1).
 */
export function createPiSessionStore(home: string): SessionStore {
  return {
    async listAll(): Promise<SessionInfoLike[]> {
      const { SessionManager } = await import("@earendil-works/pi-coding-agent");

      const previous = process.env.PI_CODING_AGENT_DIR;
      process.env.PI_CODING_AGENT_DIR = home;
      try {
        return await SessionManager.listAll();
      } finally {
        if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
        else process.env.PI_CODING_AGENT_DIR = previous;
      }
    },
  };
}
