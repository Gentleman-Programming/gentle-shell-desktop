import type { ChatState, ChatSummary, DialogAnswer } from "@shared/bridge-types";
import type { LauncherLocator, ProcessSpawner, SessionStore } from "../../ports";
import { PiSession } from "./PiSession";
import { toChatSummaries } from "./sessionList";

export interface ChatHostDeps {
  readonly spawner: ProcessSpawner;
  readonly locator: LauncherLocator;
  readonly sessionStore: SessionStore;
  readonly env: NodeJS.ProcessEnv;
  /** e.g. `["--home", home]`; forwarded to every spawned PiSession so the
   * child pi process and this process's own SessionStore agree on the
   * same home. */
  readonly homeArgs?: readonly string[];
}

type StateListener = (state: ChatState) => void;
type ErrorListener = (message: string) => void;

/**
 * Owns the one PiSession the desktop window can have open at a time (M1
 * scope: no multi-chat tabs). openChat/newChat stop whatever session is
 * currently running before starting the next one, so exactly one
 * `gentle-shell --mode rpc` child is ever alive — this is the IPC layer's
 * single point of contact with PiSession, mirroring the shape of
 * GentleBridge so registerHandlers.ts (src/main/ipc/) is a thin pass-through.
 */
export class ChatHost {
  private readonly deps: ChatHostDeps;
  private current: PiSession | undefined;
  private readonly stateListeners = new Set<StateListener>();
  private readonly errorListeners = new Set<ErrorListener>();

  constructor(deps: ChatHostDeps) {
    this.deps = deps;
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  async listChats(): Promise<ChatSummary[]> {
    const sessions = await this.deps.sessionStore.listAll();
    return toChatSummaries(sessions);
  }

  /** Reopens an existing chat: looks up its session file path from the
   * store (ChatSummary.id is pi's session id, not a file path) and passes
   * it to PiSession as `sessionPath` (`--session <path>`). */
  async openChat(id: string): Promise<ChatState> {
    const sessions = await this.deps.sessionStore.listAll();
    const match = sessions.find((session) => session.id === id);
    if (!match) throw new Error(`ChatHost: no session found for id "${id}"`);
    return this.startSession(match.path);
  }

  /** Starts a fresh chat: no sessionPath, so PiSession omits `--session`. */
  async newChat(): Promise<ChatState> {
    return this.startSession(undefined);
  }

  async sendMessage(text: string): Promise<void> {
    const result = this.requireCurrent().prompt(text);
    if (!result.queued) throw new Error(result.reason ?? "ChatHost: prompt was not queued");
  }

  async abort(): Promise<void> {
    this.requireCurrent().abort();
  }

  async answerDialog(id: string, answer: DialogAnswer): Promise<void> {
    this.requireCurrent().answerDialog(id, answer);
  }

  /** Stops the current session, if any. Called on app quit. */
  async stop(): Promise<void> {
    await this.current?.stop();
  }

  private async startSession(sessionPath: string | undefined): Promise<ChatState> {
    await this.current?.stop();

    const session = new PiSession({
      spawner: this.deps.spawner,
      locator: this.deps.locator,
      homeArgs: this.deps.homeArgs,
      sessionPath,
      env: this.deps.env,
    });
    session.on("state", (state) => this.emitState(state));
    session.on("error", (error) => this.emitError(error.message));

    this.current = session;
    session.start();
    return session.getState();
  }

  private requireCurrent(): PiSession {
    if (!this.current) throw new Error("ChatHost: no chat is open (call openChat or newChat first)");
    return this.current;
  }

  private emitState(state: ChatState): void {
    for (const listener of this.stateListeners) listener(state);
  }

  private emitError(message: string): void {
    for (const listener of this.errorListeners) listener(message);
  }
}
