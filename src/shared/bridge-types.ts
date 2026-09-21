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

export type ChatState = (typeof CHAT_STATE)[keyof typeof CHAT_STATE];

export interface ChatSummary {
  readonly id: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly state: ChatState;
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
 * Surface exposed on `window.gentle` by the preload script.
 * T1 types the full shape; T2/T3 wire it to the real pi RPC adapter and
 * session store. Until then the real preload implementation throws.
 */
export interface GentleBridge {
  listChats(): Promise<ChatSummary[]>;
  sendMessage(
    chatId: string,
    text: string,
    onTextDelta: (delta: string) => void,
  ): Promise<ChatMessage>;
}

declare global {
  interface Window {
    gentle?: GentleBridge;
  }
}
