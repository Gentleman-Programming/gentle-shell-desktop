import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createNodeProcessSpawner } from "../../adapters/nodeProcessSpawner";
import { createLauncherLocator } from "../../adapters/launcherLocator";
import { PiSession } from "./PiSession";
import type { ChatState } from "../rpc/chatReducer";
import type { LauncherLocator, ProcessSpawner, SpawnedProcess } from "../../ports";

/**
 * A tiny fake `gentle-shell --mode rpc` script: reads JSON lines on stdin,
 * replies with a scripted event sequence. On `prompt` it streams
 * "hello world" as two text_delta events then settles; on the special
 * prompt text "ask" it opens a select dialog and waits for the matching
 * extension_ui_response before streaming its reply; on `abort` it settles
 * immediately.
 */
const FAKE_RPC_SCRIPT = `
process.stdin.setEncoding("utf8");
let buffer = "";
const pendingDialogs = new Map();

process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\\n")) !== -1) {
    const line = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 1);
    if (line.trim().length > 0) handleLine(line);
  }
});
process.stdin.on("end", () => process.exit(0));

function write(obj) {
  process.stdout.write(JSON.stringify(obj) + "\\n");
}

function zeroUsage() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
}

function streamReply(text) {
  write({ type: "message_start", message: { role: "assistant", content: [] } });
  write({ type: "message_update", usage: zeroUsage(), assistantMessageEvent: { type: "text_start", contentIndex: 0 } });
  for (const word of text.split(" ")) {
    write({ type: "message_update", usage: zeroUsage(), assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: word + " " } });
  }
  write({ type: "message_update", usage: zeroUsage(), assistantMessageEvent: { type: "text_end", contentIndex: 0, content: text } });
  write({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text }] } });
  write({ type: "agent_settled" });
}

function handleLine(line) {
  const cmd = JSON.parse(line);

  if (cmd.type === "prompt" && cmd.message === "ask") {
    write({ type: "agent_start" });
    write({ type: "extension_ui_request", id: "dlg-1", method: "select", title: "Pick one", options: ["A", "B"] });
    pendingDialogs.set("dlg-1", (value) => streamReply("you picked " + value));
    return;
  }

  if (cmd.type === "prompt" && cmd.message === "crash") {
    process.exit(1);
  }

  if (cmd.type === "prompt") {
    write({ type: "agent_start" });
    streamReply("hello world");
    return;
  }

  if (cmd.type === "abort") {
    write({ type: "agent_settled" });
    return;
  }

  if (cmd.type === "extension_ui_response") {
    const resolve = pendingDialogs.get(cmd.id);
    pendingDialogs.delete(cmd.id);
    if (resolve) resolve(cmd.value ?? (cmd.cancelled ? "cancelled" : "unknown"));
  }
}
`;

function waitFor(session: PiSession, predicate: (state: ChatState) => boolean, timeoutMs = 5000): Promise<ChatState> {
  return new Promise((resolve, reject) => {
    const current = session.getState();
    if (predicate(current)) {
      resolve(current);
      return;
    }

    const timer = setTimeout(() => {
      session.off("state", onState);
      reject(new Error(`waitFor timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    function onState(state: ChatState) {
      if (!predicate(state)) return;
      clearTimeout(timer);
      session.off("state", onState);
      resolve(state);
    }

    session.on("state", onState);
  });
}

describe("PiSession", () => {
  let tmpDir: string | undefined;

  function createSession(env: NodeJS.ProcessEnv): PiSession {
    return new PiSession({
      spawner: createNodeProcessSpawner(),
      locator: createLauncherLocator(env),
      env,
    });
  }

  function writeFakeScript(): string {
    tmpDir = mkdtempSync(path.join(tmpdir(), "pi-session-test-"));
    const scriptPath = path.join(tmpDir, "fake-gentle-shell.mjs");
    writeFileSync(scriptPath, FAKE_RPC_SCRIPT);
    return scriptPath;
  }

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  it("start + prompt streams the assistant's text into state", async () => {
    const scriptPath = writeFakeScript();
    const session = createSession({ GENTLE_SHELL_BIN: scriptPath });

    session.start();
    session.prompt("hi");

    const settled = await waitFor(
      session,
      (state) => state.messages.some((message) => message.role === "assistant" && message.streaming === false),
    );

    expect(settled.messages).toHaveLength(2);
    expect(settled.messages[0]).toMatchObject({ role: "user", text: "hi" });
    // message_end.message is authoritative (see chatReducer's extractAssistantText),
    // so the final text is the un-spaced-joined content block, not the raw deltas.
    expect(settled.messages[1]).toMatchObject({ role: "assistant", text: "hello world", streaming: false });

    await session.stop();
  });

  it("round-trips a select dialog: pending dialog appears, the answer reaches pi, and the reply streams back", async () => {
    const scriptPath = writeFakeScript();
    const session = createSession({ GENTLE_SHELL_BIN: scriptPath });

    session.start();
    session.prompt("ask");

    const withDialog = await waitFor(session, (state) => state.pendingDialogs.length > 0);
    expect(withDialog.pendingDialogs[0]).toMatchObject({ id: "dlg-1", method: "select", options: ["A", "B"] });

    session.answerDialog("dlg-1", { value: "A" });

    const answered = await waitFor(session, (state) => !state.working && state.pendingDialogs.length === 0 && state.messages.some((m) => m.role === "assistant"));
    const assistantMessage = answered.messages.find((m) => m.role === "assistant");
    expect(assistantMessage?.text).toBe("you picked A");
  });

  it("abort sends the abort command and the session settles", async () => {
    const scriptPath = writeFakeScript();
    const session = createSession({ GENTLE_SHELL_BIN: scriptPath });
    const events: string[] = [];
    session.on("event", (event) => events.push(event.type));

    session.start();
    session.abort();

    await waitFor(session, () => events.includes("agent_settled"));
    expect(events).toContain("agent_settled");

    await session.stop();
  });

  it("stop() closes stdin and the child exits; a second stop() is a safe no-op", async () => {
    const scriptPath = writeFakeScript();
    const session = createSession({ GENTLE_SHELL_BIN: scriptPath });

    session.start();
    await session.stop();
    await expect(session.stop()).resolves.toBeUndefined();
  });

  it("surfaces a locator failure as lastError and an error event instead of throwing", () => {
    const session = createSession({ PATH: "" });
    const errors: Error[] = [];
    session.on("error", (error) => errors.push(error));

    expect(() => session.start()).not.toThrow();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/GENTLE_SHELL_BIN/);
    expect(session.getState().lastError).toMatch(/GENTLE_SHELL_BIN/);
  });

  it("a spawn failure (missing executable) surfaces an error event and stop() still resolves", async () => {
    const missingBin = path.join(tmpdir(), `gentle-shell-desktop-missing-${Date.now()}`);
    const session = createSession({ GENTLE_SHELL_BIN: missingBin });
    const errors: Error[] = [];
    session.on("error", (error) => errors.push(error));

    session.start();

    await waitFor(session, (state) => state.lastError !== undefined);
    expect(errors.length).toBeGreaterThan(0);

    await session.stop();
  }, 6000);

  it("prompt() after the child exits unexpectedly does not throw or crash the process", async () => {
    const scriptPath = writeFakeScript();
    const session = createSession({ GENTLE_SHELL_BIN: scriptPath });
    const unhandled: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => unhandled.push(reason);
    const onUncaughtException = (error: unknown) => unhandled.push(error);
    process.on("unhandledRejection", onUnhandledRejection);
    process.on("uncaughtException", onUncaughtException);

    try {
      session.start();
      session.prompt("crash");
      await waitFor(session, (state) => state.lastError !== undefined);

      expect(() => session.prompt("hi")).not.toThrow();
      expect(session.getState().lastError).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(unhandled).toEqual([]);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
      process.off("uncaughtException", onUncaughtException);
    }
  });

  it("prompt() called right after stop() begins does not throw (write-after-end guard)", async () => {
    const scriptPath = writeFakeScript();
    const session = createSession({ GENTLE_SHELL_BIN: scriptPath });

    session.start();
    const stopPromise = session.stop();

    expect(() => session.prompt("hi")).not.toThrow();
    expect(session.getState().lastError).toMatch(/no active process/);

    await stopPromise;
  });
});

/**
 * A controllable fake ProcessSpawner (no real child process) for the
 * Electron-host follow-up tests below: stderr-to-log routing, unexpected
 * exit cleanup, the double-start guard, prompt()-while-working, and env
 * merging. These need precise control over stdout/stderr timing and the
 * spawned env, which the real fake-RPC-script tests above cannot give
 * without racing real process I/O.
 */
interface FakeProcessHandle {
  readonly command: string;
  readonly args: readonly string[];
  readonly env: NodeJS.ProcessEnv;
  readonly writes: string[];
  killed: boolean;
  emitStdout(line: string): void;
  emitStderr(line: string): void;
  resolveExited(result: { code: number | null; signal: NodeJS.Signals | null; error?: Error }): void;
}

function createFakeSpawner(): { spawner: ProcessSpawner; handles: FakeProcessHandle[] } {
  const handles: FakeProcessHandle[] = [];

  const spawner: ProcessSpawner = {
    spawn(command, args, env): SpawnedProcess {
      const stdoutHandlers: Array<(line: string) => void> = [];
      const stderrHandlers: Array<(line: string) => void> = [];
      const errorHandlers: Array<(error: Error) => void> = [];
      const writes: string[] = [];

      let resolveExitedFn: (result: { code: number | null; signal: NodeJS.Signals | null; error?: Error }) => void = () => undefined;
      const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null; error?: Error }>((resolve) => {
        resolveExitedFn = resolve;
      });

      const handle: FakeProcessHandle = {
        command,
        args,
        env,
        writes,
        killed: false,
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
        endStdin() {},
        onStdoutLine(handler) {
          stdoutHandlers.push(handler);
        },
        onStderrLine(handler) {
          stderrHandlers.push(handler);
        },
        onError(handler) {
          errorHandlers.push(handler);
        },
        kill() {
          handle.killed = true;
        },
      };
    },
  };

  return { spawner, handles };
}

const fakeLocator: LauncherLocator = { locate: () => ({ command: "fake-gentle-shell", args: [] }) };

/** Flush the microtask queue so `proc.exited.then(...)` handlers inside PiSession run. */
async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("PiSession: Electron host follow-ups", () => {
  it("routes stderr lines to the injectable onLog callback instead of surfacing them as lastError", () => {
    const { spawner, handles } = createFakeSpawner();
    const logLines: string[] = [];
    const session = new PiSession({ spawner, locator: fakeLocator, env: {}, onLog: (line) => logLines.push(line) });

    session.start();
    handles[0]?.emitStderr("some diagnostic output");

    expect(logLines).toEqual(["some diagnostic output"]);
    expect(session.getState().lastError).toBeUndefined();
  });

  it("resets working and clears pending dialogs on an unexpected exit, surfacing exactly one error", async () => {
    const { spawner, handles } = createFakeSpawner();
    const session = new PiSession({ spawner, locator: fakeLocator, env: {} });
    const errors: Error[] = [];
    session.on("error", (error) => errors.push(error));

    session.start();
    handles[0]?.emitStdout(JSON.stringify({ type: "agent_start" }));
    handles[0]?.emitStdout(
      JSON.stringify({ type: "extension_ui_request", id: "dlg-1", method: "select", title: "Pick", options: ["A"] }),
    );

    expect(session.getState().working).toBe(true);
    expect(session.getState().pendingDialogs).toHaveLength(1);

    handles[0]?.resolveExited({ code: 1, signal: null });
    await flushMicrotasks();

    expect(session.getState().working).toBe(false);
    expect(session.getState().pendingDialogs).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/exited unexpectedly/);
  });

  it("resets working and clears pending dialogs on a clean self-exit too (code 0, not via stop()), without surfacing an error", async () => {
    const { spawner, handles } = createFakeSpawner();
    const session = new PiSession({ spawner, locator: fakeLocator, env: {} });
    const errors: Error[] = [];
    session.on("error", (error) => errors.push(error));

    session.start();
    handles[0]?.emitStdout(JSON.stringify({ type: "agent_start" }));
    handles[0]?.emitStdout(
      JSON.stringify({ type: "extension_ui_request", id: "dlg-1", method: "select", title: "Pick", options: ["A"] }),
    );

    expect(session.getState().working).toBe(true);
    expect(session.getState().pendingDialogs).toHaveLength(1);

    handles[0]?.resolveExited({ code: 0, signal: null });
    await flushMicrotasks();

    expect(session.getState().working).toBe(false);
    expect(session.getState().pendingDialogs).toEqual([]);
    expect(errors).toHaveLength(0);
  });

  it("guards start() against a double start: the second call surfaces an error instead of spawning again", () => {
    const { spawner, handles } = createFakeSpawner();
    const session = new PiSession({ spawner, locator: fakeLocator, env: {} });
    const errors: Error[] = [];
    session.on("error", (error) => errors.push(error));

    session.start();
    session.start();

    expect(handles).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/already started|active/i);
  });

  it("rejects prompt() while working: no message appended, no stdin write, lastError set", () => {
    const { spawner, handles } = createFakeSpawner();
    const session = new PiSession({ spawner, locator: fakeLocator, env: {} });

    session.start();
    handles[0]?.emitStdout(JSON.stringify({ type: "agent_start" }));
    expect(session.getState().working).toBe(true);

    const beforeCount = session.getState().messages.length;
    const result = session.prompt("another message");

    expect(result).toEqual({ queued: false, reason: "Gentle is still working" });
    expect(session.getState().messages).toHaveLength(beforeCount);
    expect(handles[0]?.writes).toEqual([]);
    expect(session.getState().lastError).toBe("Gentle is still working");
  });

  it("prompt() while idle still queues normally and returns { queued: true }", () => {
    const { spawner, handles } = createFakeSpawner();
    const session = new PiSession({ spawner, locator: fakeLocator, env: {} });

    session.start();
    const result = session.prompt("hi");

    expect(result).toEqual({ queued: true });
    expect(session.getState().messages).toHaveLength(1);
    expect(handles[0]?.writes).toHaveLength(1);
  });

  it("merges the launcher's env (e.g. ELECTRON_RUN_AS_NODE for a JS entry) into the spawned process env", () => {
    const { spawner, handles } = createFakeSpawner();
    const locator: LauncherLocator = {
      locate: () => ({ command: process.execPath, args: ["entry.mjs"], env: { ELECTRON_RUN_AS_NODE: "1" } }),
    };
    const session = new PiSession({ spawner, locator, env: { FOO: "bar" } });

    session.start();

    expect(handles[0]?.env).toMatchObject({ FOO: "bar", ELECTRON_RUN_AS_NODE: "1" });
  });
});
