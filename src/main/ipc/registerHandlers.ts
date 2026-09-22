import type { IpcMain, WebContents } from "electron";
import type { DialogAnswer } from "@shared/bridge-types";
import { IPC_CHANNELS } from "@shared/ipc-channels";
import type { ChatHost } from "../domain/session/ChatHost";

/**
 * Registers `ipcMain.handle` for every GentleBridge request channel
 * (thin pass-through to ChatHost) and forwards ChatHost's state/error
 * pushes to the renderer via `webContents.send`. Takes `ipc`/`webContents`
 * as parameters (never imports the `ipcMain` value itself) so this file
 * never executes `require("electron")` at module load time — only
 * src/main/index.ts, which genuinely runs inside Electron, does that.
 *
 * Returns an unsubscribe function that stops forwarding state/error
 * pushes for this webContents. Request handlers stay registered on `ipc`:
 * Electron's ipcMain.handle has no per-registration removal (only
 * removeHandler(channel), which would affect every window), and M1 has
 * exactly one window.
 */
export function registerHandlers(host: ChatHost, webContents: WebContents, ipc: IpcMain): () => void {
  ipc.handle(IPC_CHANNELS.LIST_CHATS, () => host.listChats());
  ipc.handle(IPC_CHANNELS.OPEN_CHAT, (_event, id: string) => host.openChat(id));
  ipc.handle(IPC_CHANNELS.NEW_CHAT, () => host.newChat());
  ipc.handle(IPC_CHANNELS.SEND_MESSAGE, (_event, text: string) => host.sendMessage(text));
  ipc.handle(IPC_CHANNELS.ABORT, () => host.abort());
  ipc.handle(IPC_CHANNELS.ANSWER_DIALOG, (_event, id: string, answer: DialogAnswer) => host.answerDialog(id, answer));

  const unsubscribeState = host.onState((state) => webContents.send(IPC_CHANNELS.STATE_PUSH, state));
  const unsubscribeError = host.onError((message) => webContents.send(IPC_CHANNELS.ERROR_PUSH, message));

  return () => {
    unsubscribeState();
    unsubscribeError();
  };
}
