/**
 * Ports the domain depends on; concrete adapters (src/main/adapters)
 * implement them, so the domain never imports Electron/Node APIs directly.
 *
 * ProcessSpawner and LauncherLocator are T2's ports for running
 * `gentle-shell --mode rpc` as a child process. SessionStorePlaceholder
 * stays a placeholder for T3 (SessionManager.listAll()).
 */

/** One line-oriented handle to a spawned child process. */
export interface SpawnedProcess {
  /** Resolves once the child exits, however it exits (clean, killed, crashed). */
  readonly exited: Promise<{ readonly code: number | null; readonly signal: NodeJS.Signals | null }>;
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
}

/** Resolves how to invoke the gentle-shell launcher (see adapters/launcherLocator.ts). */
export interface LauncherLocator {
  locate(): ResolvedLauncher;
}

export interface SessionStorePlaceholder {
  readonly kind: "placeholder";
}
