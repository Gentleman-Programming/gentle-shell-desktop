import { contextBridge } from "electron";
import type { GentleBridge } from "@shared/bridge-types";

/**
 * T1 scaffold: window.gentle is fully typed against GentleBridge so the
 * renderer already imports the real shape, but wiring it to pi's RPC
 * process is T2 (adapter) and T3 (IPC handlers) work. Every method throws
 * until then — an "empty surface, typed" bridge, not a stub that silently
 * returns fake data (mockBridge already covers the fake-data case for the
 * browser preview).
 */
function notImplemented(method: string) {
  return (): never => {
    throw new Error(
      `GentleBridge.${method} is not implemented yet (see odd/tasks/desktop-m1-chat-core.md, T2/T3)`,
    );
  };
}

const bridge: GentleBridge = {
  listChats: notImplemented("listChats"),
  sendMessage: notImplemented("sendMessage"),
};

contextBridge.exposeInMainWorld("gentle", bridge);
