import { describe, expect, it, vi } from "vitest";
import type { ChatState } from "@shared/bridge-types";
import type { LauncherLocator, ProcessSpawner, SessionInfoLike, SessionStore, SpawnedProcess } from "../../ports";
import { ChatHost } from "./ChatHost";

/**
 * A controllable fake ProcessSpawner (no real child process), mirroring
 * the pattern in PiSession.test.ts's "Electron host follow-ups" describe
 * block: ChatHost's own tests need the same precise control over
 * stdout/exit timing without racing real process I/O. `events` records
 * spawn/endStdin ordering across handles, used by the startSession
 * serialization test below to prove the previous session is fully
 * stopped before the next one spawns (not just that both eventually run).
 */
interface FakeProcessHandle {
  readonly writes: string[];
  emitStdout(line: string): void;
  emitStderr(line: string): void;
  resolveExited(result: { code: number | null; signal: NodeJS.Signals | null; error?: Error }): void;
}

function createFakeSpawner(): { spawner: ProcessSpawner; handles: FakeProcessHandle[]; events: string[] } {
  const handles: FakeProcessHandle[] = [];
  const events: string[] = [];

  const spawner: ProcessSpawner = {
    spawn(): SpawnedProcess {
      const index = handles.length;
      events.push(`spawn:${index}`);

      const stdoutHandlers: Array<(line: string) => void> = [];
      const stderrHandlers: Array<(line: string) => void> = [];
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
        emitStderr(line) {
          for (const handler of stderrHandlers) handler(line);
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
        endStdin() {
          events.push(`endStdin:${index}`);
        },
        onStdoutLine(handler) {
          stdoutHandlers.push(handler);
        },
        onStderrLine(handler) {
          stderrHandlers.push(handler);
        },
        onError() {},
        kill() {},
      };
    },
  };

  return { spawner, handles, events };
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

  it("sendMessage while the assistant is working resolves { queued: false, reason } instead of rejecting (report once)", async () => {
    const { spawner, handles } = createFakeSpawner();
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: fakeSessionStore([]), env: {} });

    await host.newChat();
    handles[0]?.emitStdout(JSON.stringify({ type: "agent_start" }));

    const result = await host.sendMessage("another message");

    expect(result).toEqual({ queued: false, reason: "Gentle is still working" });
    expect(handles[0]?.writes).toEqual([]);
  });

  it("startSession serializes overlapping open/new calls: the previous session is fully stopped before the next spawns, and the last request wins", async () => {
    const { spawner, handles, events } = createFakeSpawner();
    const store = fakeSessionStore([
      session({ id: "sess-1", path: "/a/sess-1.jsonl" }),
      session({ id: "sess-2", path: "/b/sess-2.jsonl" }),
    ]);
    const host = new ChatHost({ spawner, locator: fakeLocator, sessionStore: store, env: {} });

    const openFirst = host.openChat("sess-1");
    const openSecond = host.openChat("sess-2");

    await vi.waitFor(() => expect(handles).toHaveLength(1));
    // stop() waits for the child to exit (or a 3s grace timeout); resolve
    // it so the serialized second call can proceed without waiting it out.
    handles[0]?.resolveExited({ code: 0, signal: null });

    await Promise.all([openFirst, openSecond]);

    expect(handles).toHaveLength(2);
    // The key regression check: without serialization both sessions spawn
    // back-to-back (current is briefly undefined for both), leaking the
    // first child. Serialized, session 1 must be stopped (endStdin) before
    // session 2 ever spawns.
    expect(events).toEqual(["spawn:0", "endStdin:0", "spawn:1"]);

    await host.abort();
    expect(handles[1]?.writes.some((write) => write.includes('"abort"'))).toBe(true);
    expect(handles[0]?.writes).toEqual([]);
  });

  it("passes deps.log to every PiSession as its onLog callback", async () => {
    const { spawner, handles } = createFakeSpawner();
    const logLines: string[] = [];
    const host = new ChatHost({
      spawner,
      locator: fakeLocator,
      sessionStore: fakeSessionStore([]),
      env: {},
      log: (line) => logLines.push(line),
    });

    await host.newChat();
    handles[0]?.emitStderr("hello from pi");

    expect(logLines).toEqual(["hello from pi"]);
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
