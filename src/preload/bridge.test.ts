import { describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "@shared/ipc-channels";
import { createBridge, type RendererIpc } from "./bridge";

type Listener = (event: unknown, ...args: unknown[]) => void;

function createFakeIpc(): { ipc: RendererIpc; invoke: ReturnType<typeof vi.fn>; listeners: Map<string, Listener[]> } {
  const invoke = vi.fn().mockResolvedValue(undefined);
  const listeners = new Map<string, Listener[]>();

  const ipc: RendererIpc = {
    invoke,
    on(channel, listener) {
      const list = listeners.get(channel) ?? [];
      list.push(listener);
      listeners.set(channel, list);
    },
    removeListener(channel, listener) {
      const list = listeners.get(channel);
      if (!list) return;
      listeners.set(
        channel,
        list.filter((registered) => registered !== listener),
      );
    },
  };

  return { ipc, invoke, listeners };
}

describe("createBridge", () => {
  it("listChats invokes the sessions.list channel with no payload", async () => {
    const { ipc, invoke } = createFakeIpc();
    invoke.mockResolvedValue([{ id: "chat-1" }]);
    const bridge = createBridge(ipc);

    await expect(bridge.listChats()).resolves.toEqual([{ id: "chat-1" }]);
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.LIST_CHATS);
  });

  it("openChat invokes chat.open with the chat id", async () => {
    const { ipc, invoke } = createFakeIpc();
    const bridge = createBridge(ipc);

    await bridge.openChat("chat-1");

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.OPEN_CHAT, "chat-1");
  });

  it("newChat invokes chat.new with no payload", async () => {
    const { ipc, invoke } = createFakeIpc();
    const bridge = createBridge(ipc);

    await bridge.newChat();

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.NEW_CHAT);
  });

  it("sendMessage invokes chat.send with the text", async () => {
    const { ipc, invoke } = createFakeIpc();
    const bridge = createBridge(ipc);

    await bridge.sendMessage("hello");

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.SEND_MESSAGE, "hello");
  });

  it("abort invokes chat.abort with no payload", async () => {
    const { ipc, invoke } = createFakeIpc();
    const bridge = createBridge(ipc);

    await bridge.abort();

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.ABORT);
  });

  it("answerDialog invokes dialog.answer with the id and the answer", async () => {
    const { ipc, invoke } = createFakeIpc();
    const bridge = createBridge(ipc);

    await bridge.answerDialog("dlg-1", { value: "A" });

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.ANSWER_DIALOG, "dlg-1", { value: "A" });
  });

  it("onState subscribes to the state push channel and forwards pushed state", () => {
    const { ipc, listeners } = createFakeIpc();
    const bridge = createBridge(ipc);
    const states: unknown[] = [];

    bridge.onState((state) => states.push(state));
    const pushed = { messages: [], working: true, pendingDialogs: [], activity: 0 };
    listeners.get(IPC_CHANNELS.STATE_PUSH)?.[0]?.(undefined, pushed);

    expect(states).toEqual([pushed]);
  });

  it("onState's returned unsubscribe removes the listener", () => {
    const { ipc, listeners } = createFakeIpc();
    const bridge = createBridge(ipc);

    const unsubscribe = bridge.onState(() => undefined);
    expect(listeners.get(IPC_CHANNELS.STATE_PUSH)).toHaveLength(1);

    unsubscribe();
    expect(listeners.get(IPC_CHANNELS.STATE_PUSH)).toHaveLength(0);
  });

  it("onError subscribes to the error push channel and forwards the pushed message", () => {
    const { ipc, listeners } = createFakeIpc();
    const bridge = createBridge(ipc);
    const messages: string[] = [];

    bridge.onError((message) => messages.push(message));
    listeners.get(IPC_CHANNELS.ERROR_PUSH)?.[0]?.(undefined, "boom");

    expect(messages).toEqual(["boom"]);
  });

  it("setupStatus invokes setup.status with no payload", async () => {
    const { ipc, invoke } = createFakeIpc();
    invoke.mockResolvedValue({ needsChoice: true, detection: { found: true, dir: "/dir", hasAuth: true, hasModels: true } });
    const bridge = createBridge(ipc);

    await expect(bridge.setupStatus()).resolves.toEqual({
      needsChoice: true,
      detection: { found: true, dir: "/dir", hasAuth: true, hasModels: true },
    });
    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.SETUP_STATUS);
  });

  it("chooseHome invokes setup.chooseHome with the mode", async () => {
    const { ipc, invoke } = createFakeIpc();
    const bridge = createBridge(ipc);

    await bridge.chooseHome("link");

    expect(invoke).toHaveBeenCalledWith(IPC_CHANNELS.CHOOSE_HOME, "link");
  });

  it("onError's returned unsubscribe removes the listener", () => {
    const { ipc, listeners } = createFakeIpc();
    const bridge = createBridge(ipc);

    const unsubscribe = bridge.onError(() => undefined);
    expect(listeners.get(IPC_CHANNELS.ERROR_PUSH)).toHaveLength(1);

    unsubscribe();
    expect(listeners.get(IPC_CHANNELS.ERROR_PUSH)).toHaveLength(0);
  });
});
