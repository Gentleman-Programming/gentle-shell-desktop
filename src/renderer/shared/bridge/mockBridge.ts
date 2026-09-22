import {
  CHAT_STATE,
  MESSAGE_ROLE,
  type ChatMessage,
  type ChatState,
  type ChatSummary,
  type DialogAnswer,
  type GentleBridge,
} from "@shared/bridge-types";

/**
 * In-memory stand-in for the real preload bridge. useBridge() returns this
 * whenever window.gentle is undefined, which is always true outside
 * Electron — in particular under `pnpm dev:web`, the plain browser preview
 * the maintainer drives with automation. It fakes just enough (two example
 * chats, an echoed reply streamed word by word through onState pushes) to
 * make the M1 skeleton look and feel alive without a real pi process.
 *
 * T3 rewires this from T1's streamed-callback sendMessage(chatId, text,
 * onTextDelta) shape to the finalized bridge: a single module-level
 * ChatState that openChat/newChat reset and sendMessage/abort/answerDialog
 * mutate, pushed to subscribers through onState — mirroring how the real
 * ChatHost/PiSession only ever track one "current" chat in M1.
 */
const EXAMPLE_CHATS: ChatSummary[] = [
  {
    id: "chat-readme",
    title: "Write the README intro",
    cwd: "/Users/dev/gentle-shell-desktop",
    updatedAt: "2026-09-21T09:15:00.000Z",
    messageCount: 4,
    state: CHAT_STATE.IDLE,
  },
  {
    id: "chat-refactor",
    title: "Refactor the session store",
    cwd: "/Users/dev/pi",
    updatedAt: "2026-09-21T10:40:00.000Z",
    messageCount: 12,
    state: CHAT_STATE.NEEDS_YOU,
  },
];

const STREAM_DELAY_MS = 40;

function emptyState(): ChatState {
  return { messages: [], working: false, pendingDialogs: [], activity: 0 };
}

let currentState: ChatState = emptyState();
let nextMessageId = 0;

const stateListeners = new Set<(state: ChatState) => void>();
const errorListeners = new Set<(message: string) => void>();

function setState(state: ChatState): void {
  currentState = state;
  for (const listener of stateListeners) listener(state);
}

function makeMessage(role: ChatMessage["role"], text: string, streaming = false): ChatMessage {
  nextMessageId += 1;
  return { id: `mock-${nextMessageId}`, role, text, streaming };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamReply(userText: string): Promise<void> {
  const reply = `Got it — you said: "${userText}". This is a mock reply for the browser preview.`;
  const words = reply.split(" ");
  const assistantMessage = makeMessage(MESSAGE_ROLE.ASSISTANT, "", true);

  setState({ ...currentState, working: true, messages: [...currentState.messages, assistantMessage] });

  let text = "";
  for (const [index, word] of words.entries()) {
    await delay(STREAM_DELAY_MS);
    text += index === 0 ? word : ` ${word}`;
    setState({
      ...currentState,
      messages: currentState.messages.map((message) => (message.id === assistantMessage.id ? { ...message, text } : message)),
    });
  }

  setState({
    ...currentState,
    working: false,
    messages: currentState.messages.map((message) =>
      message.id === assistantMessage.id ? { ...message, streaming: false } : message,
    ),
  });
}

export const mockBridge: GentleBridge = {
  async listChats(): Promise<ChatSummary[]> {
    return EXAMPLE_CHATS;
  },

  async openChat(_id: string): Promise<ChatState> {
    setState(emptyState());
    return currentState;
  },

  async newChat(): Promise<ChatState> {
    setState(emptyState());
    return currentState;
  },

  async sendMessage(text: string): Promise<void> {
    if (currentState.working) {
      for (const listener of errorListeners) listener("Gentle is still working");
      return;
    }

    const userMessage = makeMessage(MESSAGE_ROLE.USER, text);
    setState({ ...currentState, messages: [...currentState.messages, userMessage] });
    void streamReply(text);
  },

  async abort(): Promise<void> {
    setState({ ...currentState, working: false });
  },

  async answerDialog(id: string, _answer: DialogAnswer): Promise<void> {
    setState({ ...currentState, pendingDialogs: currentState.pendingDialogs.filter((dialog) => dialog.id !== id) });
  },

  onState(callback: (state: ChatState) => void): () => void {
    stateListeners.add(callback);
    return () => stateListeners.delete(callback);
  },

  onError(callback: (message: string) => void): () => void {
    errorListeners.add(callback);
    return () => errorListeners.delete(callback);
  },
};
