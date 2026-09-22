/**
 * The typed contract between the three Electron processes.
 * Lives under src/shared/ (not src/renderer/ or src/main/) because all
 * three processes import it: the Scope Rule says code used by 2+ features
 * (here, 2+ processes) belongs in a shared location, never duplicated
 * locally in one of them.
 */
export const CHAT_STATE = {
  IDLE: "idle",
  WORKING: "working",
  NEEDS_YOU: "needs-you",
} as const;

/**
 * A chat's status in the sidebar list. Named `ChatStatus`, not `ChatState`,
 * to avoid colliding with the full per-conversation `ChatState` below
 * (messages/working/pendingDialogs/lastError/activity) — two genuinely
 * different things that both wanted the name "ChatState" once this file
 * became their shared home.
 */
export type ChatStatus = (typeof CHAT_STATE)[keyof typeof CHAT_STATE];

export interface ChatSummary {
  readonly id: string;
  readonly title: string;
  /** Working directory the session was started in (pi SessionInfo.cwd). */
  readonly cwd: string;
  readonly updatedAt: string;
  readonly messageCount: number;
  readonly state: ChatStatus;
}

export const MESSAGE_ROLE = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];

export interface ChatMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly text: string;
  /**
   * True while an assistant message is still streaming (between
   * message_start and message_end on the pi RPC wire). Optional so T1-era
   * call sites that never set it (mockBridge, ConversationContainer) keep
   * compiling; the chat reducer added in T2 always sets it explicitly.
   */
  readonly streaming?: boolean;
}

export const DIALOG_METHOD = {
  SELECT: "select",
  CONFIRM: "confirm",
  INPUT: "input",
  EDITOR: "editor",
} as const;

export type DialogMethod = (typeof DIALOG_METHOD)[keyof typeof DIALOG_METHOD];

/**
 * A blocking extension UI request (pi RPC `extension_ui_request` with a
 * dialog method: select, confirm, input, editor) waiting for an
 * `extension_ui_response`. Lives here, not in src/main/domain, because both
 * main (produces it from the RPC event stream) and renderer (T4 renders it
 * as a card) need the shape — the Scope Rule promotes shared-by-2+-processes
 * types out of either process folder.
 */
export interface Dialog {
  readonly id: string;
  readonly method: DialogMethod;
  readonly title: string;
  /** confirm only */
  readonly message?: string;
  /** select only */
  readonly options?: readonly string[];
  /** input only */
  readonly placeholder?: string;
  /** editor only */
  readonly prefill?: string;
}

/**
 * Mirrors pi's rpc-types.ts `RpcExtensionUIResponse`: `confirm` dialogs
 * answer with `confirmed`, `select`/`input`/`editor` answer with `value`,
 * and any dialog can be dismissed with `cancelled: true`. Lives here (not
 * src/main/domain/session/PiSession.ts, where T2 first defined it) because
 * the renderer now constructs these values too, answering a Dialog card
 * through GentleBridge.answerDialog.
 */
export type DialogAnswer = { readonly value: string } | { readonly confirmed: boolean } | { readonly cancelled: true };

/**
 * Result of `sendMessage`/`PiSession.prompt`: M1 has no queue, so a prompt
 * sent while the assistant is already working is declined outright rather
 * than buffered. Lives here (not src/main/domain/session/PiSession.ts,
 * where T2 first defined it) because GentleBridge.sendMessage (T5) now
 * resolves this value straight to the renderer instead of throwing — the
 * Scope Rule promotes it out of src/main once a second process needs the
 * shape. `reason` is set only when `queued` is false; the renderer shows
 * it in the status line, and ChatState.lastError also carries it for
 * anyone reading pushed state directly, but never both an event AND a
 * rejection ("report once" — see PiSession.prompt).
 */
export interface PromptResult {
  readonly queued: boolean;
  readonly reason?: string;
}

/**
 * The full state of the currently open conversation: messages, whether the
 * assistant is working, pending dialogs awaiting an answer, the last
 * surfaced error, and an activity counter for thinking/tool events (no
 * thinking or tool output is shown — see the M1 objective). Moved here
 * from src/main/domain/rpc/chatReducer.ts (T2) because the renderer now
 * receives it directly as GentleBridge.onState's payload and openChat/
 * newChat's return value — the Scope Rule promotes it out of src/main once
 * a second process needs the shape.
 */
export interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly working: boolean;
  readonly pendingDialogs: readonly Dialog[];
  readonly lastError?: string;
  readonly activity: number;
}

/**
 * Whether the desktop app links to an existing plain pi CLI install
 * (`--link`, reusing `~/.pi/agent` or `PI_CODING_AGENT_DIR`) or keeps its
 * own isolated home (`--isolated`, `~/.gentle-shell/agent`) — the choice
 * T5's first-run screen offers. Lives here (not
 * src/main/domain/home/home.ts, where it is resolved and persisted)
 * because the renderer's first-run screen sends this same value back
 * through GentleBridge.chooseHome — the Scope Rule promotes it out of
 * src/main once a second process needs the shape.
 */
export const HOME_MODE = {
  LINK: "link",
  ISOLATED: "isolated",
} as const;

export type HomeMode = (typeof HOME_MODE)[keyof typeof HOME_MODE];

/**
 * Whether `~/.pi/agent` (or `PI_CODING_AGENT_DIR`) exists, and what a
 * plain pi CLI install left there — what the first-run screen's
 * "We found pi on this machine" detection card renders.
 */
export interface PiDetection {
  readonly found: boolean;
  readonly dir: string;
  readonly hasAuth: boolean;
  readonly hasModels: boolean;
}

/** GentleBridge.setupStatus()'s result: whether first-run should be shown
 * (no home choice persisted yet AND pi was detected) and what detectPi
 * found either way, so the screen can render its detection card even when
 * a choice already exists (defensive; App.tsx only renders the screen
 * when `needsChoice` is true). */
export interface SetupStatus {
  readonly needsChoice: boolean;
  readonly detection: PiDetection;
}

/**
 * Surface exposed on `window.gentle` by the preload script. T1 typed the
 * listChats/sendMessage skeleton; T3 finalizes the full shape and wires it
 * to the real IPC bridge (src/preload/bridge.ts) and main-process ChatHost
 * (src/main/domain/session/ChatHost.ts, src/main/ipc/registerHandlers.ts);
 * T5 adds first-run/home.
 */
export interface GentleBridge {
  listChats(): Promise<ChatSummary[]>;
  /** Opens an existing chat by id and returns its current ChatState. */
  openChat(id: string): Promise<ChatState>;
  /** Starts a fresh chat (no prior session file) and returns its initial ChatState. */
  newChat(): Promise<ChatState>;
  /** Sends a message in whichever chat is currently open. Resolves with
   * `{ queued: false, reason }` instead of rejecting when the assistant is
   * already working, so the caller reports it exactly once. */
  sendMessage(text: string): Promise<PromptResult>;
  abort(): Promise<void>;
  answerDialog(id: string, answer: DialogAnswer): Promise<void>;
  /** Subscribes to ChatState pushes for the currently open chat. Returns an unsubscribe function. */
  onState(callback: (state: ChatState) => void): () => void;
  /** Subscribes to error messages surfaced by the currently open chat. Returns an unsubscribe function. */
  onError(callback: (message: string) => void): () => void;
  /** Whether to show the first-run home-choice screen, and what pi
   * detection found. */
  setupStatus(): Promise<SetupStatus>;
  /** Persists the chosen home mode; the next spawned session and the
   * session list use it. */
  chooseHome(mode: HomeMode): Promise<void>;
}

declare global {
  interface Window {
    gentle?: GentleBridge;
  }
}
