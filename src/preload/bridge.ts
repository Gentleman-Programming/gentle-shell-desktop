import type { GentleBridge } from "@shared/bridge-types";

function notImplemented(method: string) {
  return async (): Promise<never> => {
    throw new Error(`GentleBridge.${method} is not implemented yet (see odd/tasks/desktop-m1-chat-core.md, T2/T3)`);
  };
}

export function createBridge(): GentleBridge {
  return { listChats: notImplemented("listChats"), sendMessage: notImplemented("sendMessage") };
}
