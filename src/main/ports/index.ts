/**
 * Ports the domain depends on; concrete adapters (src/main/adapters)
 * implement them, so the domain never imports Electron/Node APIs directly.
 *
 * ProcessSpawner and LauncherLocator are T2's ports for running
 * `gentle-shell --mode rpc` as a child process. SessionStore is T3's port
 * for listing pi chats (adapters/piSessionStore.ts implements it over
 * SessionManager.listAll()).
 */

/** One line-oriented handle to a spawned child process. */
export interface SpawnedProcess {
  /**
   * Resolves once the child exits or fails to spawn (clean, killed,
   * crashed, or never started). `error` is set when the child never
   * started (e.g. ENOENT) — `code`/`signal` are then meaningless (`null`).
   */
  readonly exited: Promise<{ readonly code: number | null; readonly signal: NodeJS.Signals | null; readonly error?: Error }>;
  writeStdin(text: string): void;
  endStdin(): void;
  onStdoutLine(handler: (line: string) => void): void;
  onStderrLine(handler: (line: string) => void): void;
  /** Spawn-time failures (e.g. ENOENT) and other child_process "error" events. */
  onError(handler: (error: Error) => void): void;
  kill(signal?: NodeJS.Signals): void;
}

export interface ProcessSpawner {
  spawn(command: string, args: readonly string[], env: NodeJS.ProcessEnv, cwd?: string): SpawnedProcess;
}

export interface ResolvedLauncher {
  readonly command: string;
  readonly args: readonly string[];
  /**
   * Extra environment variables to merge on top of PiSession's own env
   * before spawning. Used for `ELECTRON_RUN_AS_NODE=1` when `command` is
   * `process.execPath` running a JS entry: under Electron, `process.execPath`
   * is the Electron binary, not a plain Node binary, so without this flag
   * the child launches Electron itself instead of running the script as
   * Node. Harmless (and unread) when this app runs under plain Node.
   */
  readonly env?: Readonly<Record<string, string>>;
}

/** Resolves how to invoke the gentle-shell launcher (see adapters/launcherLocator.ts). */
export interface LauncherLocator {
  locate(): ResolvedLauncher;
}

/**
 * The subset of pi's `SessionInfo` (from @earendil-works/pi-coding-agent)
 * that sessionList.ts maps into a ChatSummary. Declared locally (not
 * imported from the pi package) so the domain mapping in
 * src/main/domain/session/sessionList.ts stays pure and dependency-free —
 * only the adapter (piSessionStore.ts) touches the real package.
 */
export interface SessionInfoLike {
  readonly id: string;
  readonly cwd: string;
  readonly name?: string;
  readonly modified: Date;
  readonly messageCount: number;
  readonly firstMessage: string;
}

export interface SessionStore {
  listAll(): Promise<SessionInfoLike[]>;
}
