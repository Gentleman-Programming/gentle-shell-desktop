import {
  CHAT_STATE,
  MESSAGE_ROLE,
  type ChatMessage,
  type ChatSummary,
  type GentleBridge,
} from "@shared/bridge-types";

/**
 * In-memory stand-in for the real preload bridge. useBridge() returns this
 * whenever window.gentle is undefined, which is always true outside
 * Electron — in particular under `pnpm dev:web`, the plain browser preview
 * the maintainer drives with automation. It fakes just enough (two example
 * chats, an echoed reply streamed word by word) to make the M1 skeleton
 * look and feel alive without a real pi process.
 */
const EXAMPLE_CHATS: ChatSummary[] = [
  {
    id: "chat-readme",
    title: "Write the README intro",
    updatedAt: "2026-09-21T09:15:00.000Z",
    state: CHAT_STATE.IDLE,
  },
  {
    id: "chat-refactor",
    title: "Refactor the session store",
    updatedAt: "2026-09-21T10:40:00.000Z",
    state: CHAT_STATE.NEEDS_YOU,
  },
];

const STREAM_DELAY_MS = 40;

function streamWords(
  words: string[],
  onTextDelta: (delta: string) => void,
): Promise<string> {
  return new Promise((resolvePromise) => {
    let index = 0;
    let full = "";

    const emitNext = (): void => {
      if (index >= words.length) {
        resolvePromise(full);
        return;
      }

      const word = words[index] ?? "";
      const delta = index === 0 ? word : ` ${word}`;
      full += delta;
      onTextDelta(delta);
      index += 1;
      setTimeout(emitNext, STREAM_DELAY_MS);
    };

    emitNext();
  });
}

export const mockBridge: GentleBridge = {
  async listChats(): Promise<ChatSummary[]> {
    return EXAMPLE_CHATS;
  },

  async sendMessage(
    _chatId: string,
    text: string,
    onTextDelta: (delta: string) => void,
  ): Promise<ChatMessage> {
    const reply = `Got it — you said: "${text}". This is a mock reply for the browser preview.`;
    const fullText = await streamWords(reply.split(" "), onTextDelta);

    return {
      id: `mock-${Date.now()}`,
      role: MESSAGE_ROLE.ASSISTANT,
      text: fullText,
    };
  },
};
