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
