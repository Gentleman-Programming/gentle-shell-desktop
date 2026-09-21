import { describe, expect, it, vi } from "vitest";
import type { IpcMain, WebContents } from "electron";
import type { ChatHost } from "../domain/session/ChatHost";
import { registerHandlers } from "./registerHandlers";

function fakeHost(overrides: Partial<ChatHost> = {}): ChatHost {
  return {
    listChats: vi.fn(),
    openChat: vi.fn(),
    newChat: vi.fn(),
    sendMessage: vi.fn(),
    abort: vi.fn(),
    answerDialog: vi.fn(),
    onState: vi.fn().mockReturnValue(() => {}),
    onError: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  } as unknown as ChatHost;
}

/** Mirrors Electron's real behaviour: handle() throws for a channel that
 * already has a handler; removeHandler() is a safe no-op otherwise. */
function fakeIpcMain(): IpcMain {
  const handlers = new Set<string>();
  return {
    handle: vi.fn((channel: string) => {
      if (handlers.has(channel)) throw new Error(`Attempted to register a second handler for '${channel}'`);
      handlers.add(channel);
    }),
    removeHandler: vi.fn((channel: string) => {
      handlers.delete(channel);
    }),
  } as unknown as IpcMain;
}

function fakeWebContents(): WebContents {
  return { send: vi.fn() } as unknown as WebContents;
}

describe("registerHandlers", () => {
  it("can be called again for a new window without throwing (window closed, then re-registered on activate)", () => {
    const ipc = fakeIpcMain();
    const host = fakeHost();

    registerHandlers(host, fakeWebContents(), ipc);

    expect(() => registerHandlers(host, fakeWebContents(), ipc)).not.toThrow();
  });

  it("returns an unsubscribe that stops forwarding state/error pushes for that call's webContents", () => {
    const ipc = fakeIpcMain();
    const unsubscribeState = vi.fn();
    const unsubscribeError = vi.fn();
    const host = fakeHost({
      onState: vi.fn().mockReturnValue(unsubscribeState),
      onError: vi.fn().mockReturnValue(unsubscribeError),
    });

    const unregister = registerHandlers(host, fakeWebContents(), ipc);
    unregister();

    expect(unsubscribeState).toHaveBeenCalledTimes(1);
    expect(unsubscribeError).toHaveBeenCalledTimes(1);
  });
});
