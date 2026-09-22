import { MESSAGE_ROLE, type ChatMessage, type ChatState, type DialogAnswer, type PromptResult } from "@shared/bridge-types";
import { INITIAL_CHAT_STATE, reduceChat } from "../rpc/chatReducer";
import { decodeLine, encodeCommand } from "../rpc/codec";
import type { RpcCommand, RpcEvent } from "../rpc/types";
import type { LauncherLocator, ProcessSpawner, SpawnedProcess } from "../../ports";

export interface PiSessionOptions {
  readonly spawner: ProcessSpawner;
  readonly locator: LauncherLocator;
  /** e.g. `["--link"]` or `["--isolated"]`; empty means gentle-shell's own default. */
  readonly homeArgs?: readonly string[];
  readonly sessionPath?: string;
  readonly env: NodeJS.ProcessEnv;
  readonly cwd?: string;
  /**
   * Receives raw child stderr lines (diagnostics, warnings) for logging.
   * Defaults to a no-op. Stderr output is not, by itself, evidence of a
   * failure (see handleStderrLine) so it no longer sets `lastError`.
   */
  readonly onLog?: (line: string) => void;
}

// PromptResult and DialogAnswer now live in @shared/bridge-types (T5, T3: the renderer
// constructs these too, answering a Dialog card through
// GentleBridge.answerDialog).

interface PiSessionEventMap {
  readonly state: ChatState;
  readonly event: RpcEvent;
  readonly error: Error;
}

type Listener<T> = (payload: T) => void;

/** Minimal typed pub/sub — PiSession only needs on/off/emit, not a full EventEmitter. */
class TypedEmitter<Events> {
  private readonly listeners: { [K in keyof Events]?: Array<Listener<Events[K]>> } = {};

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const list = this.listeners[event] ?? [];
    list.push(listener);
    this.listeners[event] = list;
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((registered) => registered !== listener);
  }

  protected emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    for (const listener of this.listeners[event] ?? []) listener(payload);
  }
}

const STOP_GRACE_PERIOD_MS = 3000;

/**
 * Set on every spawned pi process (M2 prerequisite, see
 * odd/tasks/desktop-m2-helpers.md): only with this flag does gentle-pi
 * enable RPC dialogs for ask_user_question/ask_user_choice and publish
 * subagent activity via the gentle-agents setWidget widget. Applied last
 * in start()'s env merge so neither `this.env` nor a launcher's own env
 * (e.g. ELECTRON_RUN_AS_NODE) can accidentally suppress it.
 */
const GENTLE_SHELL_INTERACTIVE_HOST_ENV = { GENTLE_SHELL_INTERACTIVE_HOST: "1" } as const;

/**
 * Owns one `gentle-shell --mode rpc` child process: spawns it through a
 * ProcessSpawner (resolved via a LauncherLocator), decodes its stdout into
 * RpcEvents, folds them into ChatState with the pure reducer, and emits
 * both out. Only depends on ports (ProcessSpawner, LauncherLocator), so it
 * needs no Node import itself and is testable with fakes — see
 * src/README.md's hexagonal main process note.
 *
 * Never throws from a public method: spawn/decode/stream failures surface
 * as `lastError` on the emitted state plus an ("error", Error) event
 * instead, because this runs inside Electron's main process, where an
 * uncaught exception takes down the whole app.
 */
export class PiSession extends TypedEmitter<PiSessionEventMap> {
  private readonly spawner: ProcessSpawner;
  private readonly locator: LauncherLocator;
  private readonly homeArgs: readonly string[];
  private readonly sessionPath: string | undefined;
  private readonly env: NodeJS.ProcessEnv;
  private readonly cwd: string | undefined;
  private readonly onLog: (line: string) => void;

  private state: ChatState = INITIAL_CHAT_STATE;
  private process: SpawnedProcess | undefined;
  private stopping = false;

  constructor(options: PiSessionOptions) {
    super();
    this.spawner = options.spawner;
    this.locator = options.locator;
    this.homeArgs = options.homeArgs ?? [];
    this.sessionPath = options.sessionPath;
    this.env = options.env;
    this.cwd = options.cwd;
    this.onLog = options.onLog ?? (() => undefined);
  }

  /**
   * Resolves the launcher, spawns it with `--mode rpc`, and starts streaming
   * events. Guarded against a double start: while a process is already
   * active, a second call surfaces an error instead of spawning a second
   * child (which would silently orphan the first one's stdin/stdout wiring).
   */
  start(): void {
    if (this.process) {
      this.surfaceError(new Error("PiSession: already started (a session is already active)"));
      return;
    }

    try {
      const launcher = this.locator.locate();
      const args = [
        ...launcher.args,
        ...this.homeArgs,
        "--mode",
        "rpc",
        ...(this.sessionPath ? ["--session", this.sessionPath] : []),
      ];
      const env = { ...this.env, ...(launcher.env ?? {}), ...GENTLE_SHELL_INTERACTIVE_HOST_ENV };
      const proc = this.spawner.spawn(launcher.command, args, env, this.cwd);
      this.process = proc;

      proc.onStdoutLine((line) => this.handleLine(line));
      proc.onStderrLine((line) => this.handleStderrLine(line));
      proc.onError((error) => this.surfaceError(error));
      proc.exited.then(({ code, signal, error }) => this.handleExit(code, signal, error)).catch(() => undefined);
    } catch (error) {
      this.surfaceError(toError(error));
    }
  }

  /**
   * Sends `prompt` and appends the user's message to state immediately (no
   * round trip needed to show it). M1 keeps this simple with no queue: a
   * prompt sent while the assistant is still working is rejected outright
   * (no message appended, nothing written to stdin) instead of buffered.
   */
  prompt(text: string): PromptResult {
    if (this.state.working) {
      // Declined, not a failure: report once via the return value (and the
      // state push below, for anyone reading ChatState.lastError directly)
      // rather than also emitting an "error" event — ChatHost.sendMessage
      // (T5) resolves this PromptResult straight to the renderer instead
      // of rejecting, so a second report through onError would duplicate
      // the same message.
      const reason = "Gentle is still working";
      this.state = { ...this.state, lastError: reason };
      this.emit("state", this.state);
      return { queued: false, reason };
    }

    this.state = appendUserMessage(this.state, text);
    this.emit("state", this.state);
    this.send({ type: "prompt", message: text });
    return { queued: true };
  }

  abort(): void {
    this.send({ type: "abort" });
  }

  /** Answers a pending extension_ui_request dialog and drops it from `pendingDialogs`. */
  answerDialog(id: string, answer: DialogAnswer): void {
    this.state = {
      ...this.state,
      pendingDialogs: this.state.pendingDialogs.filter((dialog) => dialog.id !== id),
    };
    this.emit("state", this.state);

    if ("cancelled" in answer) {
      this.send({ type: "extension_ui_response", id, cancelled: true });
    } else if ("confirmed" in answer) {
      this.send({ type: "extension_ui_response", id, confirmed: answer.confirmed });
    } else {
      this.send({ type: "extension_ui_response", id, value: answer.value });
    }
  }

  getState(): ChatState {
    return this.state;
  }

  /** Graceful shutdown: close stdin, wait up to 3s for exit, then kill. */
  async stop(): Promise<void> {
    const proc = this.process;
    if (!proc) return;

    this.stopping = true;
    proc.endStdin();

    const timedOut = Symbol("stop-timeout");
    const outcome = await Promise.race([
      proc.exited.then(() => "exited" as const),
      new Promise<typeof timedOut>((resolve) => {
        setTimeout(() => resolve(timedOut), STOP_GRACE_PERIOD_MS);
      }),
    ]);

    if (outcome === timedOut) {
      proc.kill();
      await proc.exited.catch(() => undefined);
    }

    this.process = undefined;
  }

  private send(command: RpcCommand): void {
    if (!this.process || this.stopping) {
      this.surfaceError(new Error("PiSession: cannot send a command (no active process)"));
      return;
    }
    this.process.writeStdin(encodeCommand(command));
  }

  private handleLine(line: string): void {
    try {
      const decoded = decodeLine(line);
      if ("kind" in decoded) return; // unknown/unmodeled line: nothing to fold or emit

      this.state = reduceChat(this.state, decoded);
      this.emit("event", decoded);
      this.emit("state", this.state);
    } catch (error) {
      this.surfaceError(toError(error));
    }
  }

  /**
   * Child stderr is diagnostics/warnings, not by itself evidence of a
   * failure (pi logs there routinely) — route it to the injectable logger
   * instead of surfacing it as `lastError`, which previously made routine
   * stderr output look like a fatal error to the UI.
   */
  private handleStderrLine(line: string): void {
    if (line.trim().length === 0) return;
    this.onLog(line);
  }

  /**
   * Clears `this.process` unconditionally so the next `send()` never
   * writes to a dead child's stdin (R4-001), whether the exit was clean,
   * a crash, or a spawn failure. ANY exit not requested via `stop()` —
   * including a clean `code === 0` self-exit — resets `working` and drops
   * any pending dialogs: the child that would have resolved them is gone
   * either way, so a stale "working" pill or an unanswerable dialog card
   * would otherwise strand the UI regardless of how the child exited. An
   * error is only surfaced for a non-zero exit: a spawn failure already
   * surfaced its real error via `onError` (not re-reported here), and a
   * clean self-exit is not, by itself, evidence of a failure.
   */
  private handleExit(code: number | null, signal: NodeJS.Signals | null, spawnError?: Error): void {
    this.process = undefined;
    if (this.stopping) return;

    this.state = { ...this.state, working: false, pendingDialogs: [] };

    if (spawnError) {
      this.emit("state", this.state);
      return;
    }
    if (code !== 0) {
      this.surfaceError(new Error(`gentle-shell exited unexpectedly (code ${code ?? "null"}${signal ? `, signal ${signal}` : ""})`));
      return;
    }
    this.emit("state", this.state);
  }

  private surfaceError(error: Error): void {
    this.state = { ...this.state, lastError: error.message };
    this.emit("error", error);
    this.emit("state", this.state);
  }
}

function appendUserMessage(state: ChatState, text: string): ChatState {
  const message: ChatMessage = { id: `msg-${state.messages.length}`, role: MESSAGE_ROLE.USER, text };
  return { ...state, messages: [...state.messages, message] };
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
