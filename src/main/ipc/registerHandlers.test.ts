import { describe, expect, it, vi } from "vitest";
import type { IpcMain, WebContents } from "electron";
import type { ChatHost } from "../domain/session/ChatHost";
import type { SetupService } from "../ports";
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

function fakeSetup(): SetupService {
  return {
    status: vi.fn().mockResolvedValue({ needsChoice: false, detection: { found: false, dir: "", hasAuth: false, hasModels: false } }),
    chooseHome: vi.fn().mockResolvedValue(undefined),
  };
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

    registerHandlers(host, fakeSetup(), fakeWebContents(), ipc);

    expect(() => registerHandlers(host, fakeSetup(), fakeWebContents(), ipc)).not.toThrow();
  });

  it("returns an unsubscribe that stops forwarding state/error pushes for that call's webContents", () => {
    const ipc = fakeIpcMain();
    const unsubscribeState = vi.fn();
    const unsubscribeError = vi.fn();
    const host = fakeHost({
      onState: vi.fn().mockReturnValue(unsubscribeState),
      onError: vi.fn().mockReturnValue(unsubscribeError),
    });

    const unregister = registerHandlers(host, fakeSetup(), fakeWebContents(), ipc);
    unregister();

    expect(unsubscribeState).toHaveBeenCalledTimes(1);
    expect(unsubscribeError).toHaveBeenCalledTimes(1);
  });

  it("registers setup.status and setup.chooseHome, wired to the SetupService", () => {
    const ipc = fakeIpcMain();
    const host = fakeHost();
    const setup = fakeSetup();

    registerHandlers(host, setup, fakeWebContents(), ipc);

    const statusHandler = registeredHandler(ipc, "setup.status");
    const chooseHomeHandler = registeredHandler(ipc, "setup.chooseHome");

    void statusHandler({} as never);
    expect(setup.status).toHaveBeenCalledTimes(1);

    void chooseHomeHandler({} as never, "link");
    expect(setup.chooseHome).toHaveBeenCalledWith("link");
  });

  // registerRequestHandler is a thin pass-through (ipc.handle(channel,
  // listener) with no try/catch of its own) so a rejected SetupService
  // call reaches the renderer as a rejected invoke() unchanged — this is
  // Electron's own ipcMain.handle()/ipcRenderer.invoke() contract, not
  // something this file has to implement; this test pins that the
  // pass-through never starts swallowing or rewrapping it (T6 follow-up).
  it("setup.chooseHome's handler rejects with the SetupService's own error instead of swallowing it", async () => {
    const ipc = fakeIpcMain();
    const setup: SetupService = {
      status: vi.fn(),
      chooseHome: vi.fn().mockRejectedValue(new Error("Could not save the home choice: EACCES")),
    };

    registerHandlers(fakeHost(), setup, fakeWebContents(), ipc);
    const chooseHomeHandler = registeredHandler(ipc, "setup.chooseHome");

    await expect(chooseHomeHandler({} as never, "link")).rejects.toThrow("Could not save the home choice: EACCES");
  });
});

function registeredHandler(ipc: IpcMain, channel: string): (...args: unknown[]) => unknown {
  const call = vi.mocked(ipc.handle).mock.calls.find(([registeredChannel]) => registeredChannel === channel);
  if (!call) throw new Error(`no handler registered for channel "${channel}"`);
  return call[1] as (...args: unknown[]) => unknown;
}
