import { describe, expect, it } from "vitest";
import type { ChatState } from "@shared/bridge-types";
import type { LauncherLocator, ProcessSpawner, SessionInfoLike, SessionStore, SpawnedProcess } from "../../ports";
import { ChatHost } from "./ChatHost";

/**
 * A controllable fake ProcessSpawner (no real child process), mirroring
 * the pattern in PiSession.test.ts's "Electron host follow-ups" describe
 * block: ChatHost's own tests need the same precise control over
 * stdout/exit timing without racing real process I/O.
 */
interface FakeProcessHandle {
  readonly writes: string[];
  emitStdout(line: string): void;
  resolveExited(result: { code: number | null; signal: NodeJS.Signals | null; error?: Error }): void;
}

function createFakeSpawner(): { spawner: ProcessSpawner; handles: FakeProcessHandle[] } {
  const handles: FakeProcessHandle[] = [];

  const spawner: ProcessSpawner = {
    spawn(): SpawnedProcess {
      const stdoutHandlers: Array<(line: string) => void> = [];
      const writes: string[] = [];
      let resolveExitedFn: (result: { code: number | null; signal: NodeJS.Signals | null; error?: Error }) => void = () => undefined;
      const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null; error?: Error }>((resolve) => {
        resolveExitedFn = resolve;
      });

      const handle: FakeProcessHandle = {
        writes,
        emitStdout(line) {
          for (const handler of stdoutHandlers) handler(line);
        },
        resolveExited(result) {
          resolveExitedFn(result);
        },
      };
      handles.push(handle);

      return {
        exited,
        writeStdin(text: string) {
          writes.push(text);
        },
        endStdin() {},
        onStdoutLine(handler) {
          stdoutHandlers.push(handler);
        },
        onStderrLine() {},
        onError() {},
        kill() {},
      };
    },
  };

  return { spawner, handles };
}

const fakeLocator: LauncherLocator = { locate: () => ({ command: "fake-gentle-shell", args: [] }) };

function fakeSessionStore(sessions: readonly SessionInfoLike[]): SessionStore {
  return { listAll: () => Promise.resolve([...sessions]) };
}

function session(overrides: Partial<SessionInfoLike> = {}): SessionInfoLike {
  return {
    id: "sess-1",
    path: "/home/sessions/proj/sess-1.jsonl",
    cwd: "/tmp/proj",
    modified: new Date("2026-09-21T10:00:00.000Z"),
    messageCount: 0,
    firstMessage: "",
    ...overrides,
  };
}

describe("ChatHost", () => {
  it("openChat resolves the session path from the store, starts it, and pushes state", async () => {
    const { spawner, handles } = createFakeSpawner();
    const store = fakeSessionStore([session({ id: "sess-1", path: "/home/sessions/proj/sess-1.jsonl" })]);
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: store, env: {} });
    const states: ChatState[] = [];
    host.onState((state) => states.push(state));

    const initial = await host.openChat("sess-1");

    expect(initial.messages).toEqual([]);
    handles[0]?.emitStdout(JSON.stringify({ type: "agent_start" }));
    expect(states.some((state) => state.working)).toBe(true);
  });

  it("openChat rejects for an id the session store does not have", async () => {
    const { spawner } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });

    await expect(host.openChat("missing")).rejects.toThrow(/no session found/i);
  });

  it("newChat starts a session with no sessionPath", async () => {
    const { spawner } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });

    const state = await host.newChat();

    expect(state.messages).toEqual([]);
  });

  it("switching chats stops the previous session before starting the next one", async () => {
    const { spawner, handles } = createFakeSpawner();
    const store = fakeSessionStore([
      session({ id: "sess-1", path: "/a/sess-1.jsonl" }),
      session({ id: "sess-2", path: "/b/sess-2.jsonl" }),
    ]);
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: store, env: {} });

    await host.openChat("sess-1");
    expect(handles).toHaveLength(1);

    const openSecond = host.openChat("sess-2");
    // stop() waits for the child to exit (or a 3s grace timeout); resolve
    // the first child's exit immediately so this test does not wait it out.
    handles[0]?.resolveExited({ code: 0, signal: null });
    await openSecond;

    expect(handles).toHaveLength(2);
  });

  it("sendMessage while the assistant is working rejects without writing to stdin", async () => {
    const { spawner, handles } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });

    await host.newChat();
    handles[0]?.emitStdout(JSON.stringify({ type: "agent_start" }));

    await expect(host.sendMessage("another message")).rejects.toThrow(/still working/i);
    expect(handles[0]?.writes).toEqual([]);
  });

  it("answerDialog round-trips: forwards the answer to the current session's stdin", async () => {
    const { spawner, handles } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });

    await host.newChat();
    handles[0]?.emitStdout(
      JSON.stringify({ type: "extension_ui_request", id: "dlg-1", method: "select", title: "Pick", options: ["A"] }),
    );

    await host.answerDialog("dlg-1", { value: "A" });

    expect(handles[0]?.writes).toEqual([`${JSON.stringify({ type: "extension_ui_response", id: "dlg-1", value: "A" })}\n`]);
  });

  it("abort() with no chat open rejects instead of throwing synchronously", async () => {
    const { spawner } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });

    await expect(host.abort()).rejects.toThrow(/no chat is open/i);
  });

  it("onError forwards errors surfaced by the current session (e.g. an unexpected exit)", async () => {
    const { spawner, handles } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });
    const errors: string[] = [];
    host.onError((message) => errors.push(message));

    await host.newChat();
    handles[0]?.resolveExited({ code: 1, signal: null });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/exited unexpectedly/);
  });
});
