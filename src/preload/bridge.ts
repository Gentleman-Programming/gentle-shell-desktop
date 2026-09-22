import type { ChatState, ChatSummary, DialogAnswer, GentleBridge } from "@shared/bridge-types";
import { IPC_CHANNELS } from "@shared/ipc-channels";

/**
 * The minimal shape of Electron's ipcRenderer this bridge needs, injected
 * so createBridge(ipc) can be unit-tested with a fake ipc instead of the
 * real Electron renderer process (which vitest's Node environment doesn't
 * provide).
 */
export interface RendererIpc {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
  removeListener(channel: string, listener: (event: unknown, ...args: unknown[]) => void): void;
}

/** Implements GentleBridge over ipc.invoke (request/response) and
 * ipc.on/removeListener (state/error pushes). src/preload/index.ts calls
 * this with the real Electron ipcRenderer. */
export function createBridge(ipc: RendererIpc): GentleBridge {
  return {
    listChats: () => ipc.invoke(IPC_CHANNELS.LIST_CHATS) as Promise<ChatSummary[]>,
    openChat: (id: string) => ipc.invoke(IPC_CHANNELS.OPEN_CHAT, id) as Promise<ChatState>,
    newChat: () => ipc.invoke(IPC_CHANNELS.NEW_CHAT) as Promise<ChatState>,
    sendMessage: (text: string) => ipc.invoke(IPC_CHANNELS.SEND_MESSAGE, text) as Promise<void>,
    abort: () => ipc.invoke(IPC_CHANNELS.ABORT) as Promise<void>,
    answerDialog: (id: string, answer: DialogAnswer) =>
      ipc.invoke(IPC_CHANNELS.ANSWER_DIALOG, id, answer) as Promise<void>,

    onState(callback: (state: ChatState) => void): () => void {
      const listener = (_event: unknown, state: unknown): void => callback(state as ChatState);
      ipc.on(IPC_CHANNELS.STATE_PUSH, listener);
      return () => ipc.removeListener(IPC_CHANNELS.STATE_PUSH, listener);
    },

    onError(callback: (message: string) => void): () => void {
      const listener = (_event: unknown, message: unknown): void => callback(message as string);
      ipc.on(IPC_CHANNELS.ERROR_PUSH, listener);
      return () => ipc.removeListener(IPC_CHANNELS.ERROR_PUSH, listener);
    },
  };
}
