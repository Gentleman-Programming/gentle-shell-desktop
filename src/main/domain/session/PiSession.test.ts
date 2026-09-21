import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createNodeProcessSpawner } from "../../adapters/nodeProcessSpawner";
import { createLauncherLocator } from "../../adapters/launcherLocator";
import { PiSession } from "./PiSession";
import type { ChatState } from "../rpc/chatReducer";

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
});
