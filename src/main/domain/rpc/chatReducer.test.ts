import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decodeLine } from "./codec";
import { INITIAL_CHAT_STATE, reduceChat, type ChatState } from "./chatReducer";
import type { RpcEvent } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readFixtureEvents(name: string): RpcEvent[] {
  const raw = readFileSync(path.join(__dirname, "__fixtures__", name), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const decoded = decodeLine(line);
      if ("kind" in decoded) throw new Error(`fixture line decoded as unknown: ${line}`);
      return decoded;
    });
}

function replay(events: RpcEvent[]): ChatState {
  return events.reduce(reduceChat, INITIAL_CHAT_STATE);
}

describe("reduceChat: working state", () => {
  it("agent_start sets working true", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, { type: "agent_start" });
    expect(state.working).toBe(true);
  });

  it("agent_end sets working false", () => {
    const working = { ...INITIAL_CHAT_STATE, working: true };
    expect(reduceChat(working, { type: "agent_end" }).working).toBe(false);
  });

  it("agent_settled sets working false", () => {
    const working = { ...INITIAL_CHAT_STATE, working: true };
    expect(reduceChat(working, { type: "agent_settled" }).working).toBe(false);
  });
});

describe("reduceChat: assistant message streaming", () => {
  it("message_start for an assistant message opens a new empty streaming message", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
    expect(state.messages).toEqual([{ id: "msg-0", role: "assistant", text: "", streaming: true }]);
  });

  it("message_start for a non-assistant message is a no-op", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "message_start",
      message: { role: "toolResult", content: [] },
    });
    expect(state).toBe(INITIAL_CHAT_STATE);
  });

  it("text_delta appends to the currently open assistant message", () => {
    let state = reduceChat(INITIAL_CHAT_STATE, {
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
    state = reduceChat(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Hello " },
    });
    state = reduceChat(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "world" },
    });
    expect(state.messages[0]?.text).toBe("Hello world");
    expect(state.messages[0]?.streaming).toBe(true);
  });

  it("text_delta with no open assistant message is a no-op", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "orphaned" },
    });
    expect(state).toBe(INITIAL_CHAT_STATE);
  });

  it("message_end finalizes text from the authoritative message content and clears streaming", () => {
    let state = reduceChat(INITIAL_CHAT_STATE, {
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
    state = reduceChat(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Hel" },
    });
    state = reduceChat(state, {
      type: "message_end",
      message: { role: "assistant", content: [{ type: "text", text: "Hello world" }] },
    });
    expect(state.messages).toEqual([{ id: "msg-0", role: "assistant", text: "Hello world", streaming: false }]);
  });

  it("message_end without text content blocks keeps the accumulated delta text", () => {
    let state = reduceChat(INITIAL_CHAT_STATE, {
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
    state = reduceChat(state, {
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "kept" },
    });
    state = reduceChat(state, { type: "message_end", message: { role: "assistant" } });
    expect(state.messages[0]?.text).toBe("kept");
    expect(state.messages[0]?.streaming).toBe(false);
  });
});

describe("reduceChat: thinking, toolcall, tool_execution never touch messages", () => {
  it.each([
    { type: "thinking_start" as const, contentIndex: 0 },
    { type: "thinking_delta" as const, contentIndex: 0, delta: "..." },
    { type: "thinking_end" as const, contentIndex: 0, content: "..." },
    { type: "toolcall_start" as const, contentIndex: 1, id: "call_1", toolName: "bash" },
    { type: "toolcall_delta" as const, contentIndex: 1, delta: "{}" },
    { type: "toolcall_end" as const, contentIndex: 1, toolCall: {} },
  ])("$type bumps activity but leaves messages untouched", (assistantMessageEvent) => {
    const before = { ...INITIAL_CHAT_STATE, messages: [{ id: "msg-0", role: "assistant" as const, text: "" }] };
    const after = reduceChat(before, { type: "message_update", assistantMessageEvent });
    expect(after.messages).toBe(before.messages);
    expect(after.activity).toBe(before.activity + 1);
  });

  it.each(["tool_execution_start", "tool_execution_update", "tool_execution_end"] as const)(
    "%s bumps activity but leaves messages untouched",
    (type) => {
      const before = { ...INITIAL_CHAT_STATE, messages: [{ id: "msg-0", role: "assistant" as const, text: "" }] };
      const event: RpcEvent =
        type === "tool_execution_end"
          ? { type, toolCallId: "call_1", toolName: "bash", isError: false }
          : { type, toolCallId: "call_1", toolName: "bash" };
      const after = reduceChat(before, event);
      expect(after.messages).toBe(before.messages);
      expect(after.activity).toBe(before.activity + 1);
    },
  );
});

describe("reduceChat: extension UI dialogs", () => {
  it("pushes a select dialog", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "extension_ui_request",
      id: "dlg-1",
      method: "select",
      title: "Allow?",
      options: ["Allow", "Block"],
    });
    expect(state.pendingDialogs).toEqual([{ id: "dlg-1", method: "select", title: "Allow?", options: ["Allow", "Block"] }]);
  });

  it("pushes a confirm dialog with its message", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "extension_ui_request",
      id: "dlg-2",
      method: "confirm",
      title: "Clear session?",
      message: "All messages will be lost.",
    });
    expect(state.pendingDialogs).toEqual([
      { id: "dlg-2", method: "confirm", title: "Clear session?", message: "All messages will be lost." },
    ]);
  });

  it("pushes an input dialog with its placeholder", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "extension_ui_request",
      id: "dlg-3",
      method: "input",
      title: "Enter a value",
      placeholder: "type something...",
    });
    expect(state.pendingDialogs).toEqual([
      { id: "dlg-3", method: "input", title: "Enter a value", placeholder: "type something..." },
    ]);
  });

  it("pushes an editor dialog with its prefill", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "extension_ui_request",
      id: "dlg-4",
      method: "editor",
      title: "Edit",
      prefill: "line 1",
    });
    expect(state.pendingDialogs).toEqual([{ id: "dlg-4", method: "editor", title: "Edit", prefill: "line 1" }]);
  });

  it("ignores fire-and-forget methods", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "extension_ui_request",
      id: "dlg-5",
      method: "notify",
      message: "hi",
    });
    expect(state).toBe(INITIAL_CHAT_STATE);
  });
});

describe("reduceChat: errors and unhandled events", () => {
  it("extension_error sets lastError", () => {
    const state = reduceChat(INITIAL_CHAT_STATE, {
      type: "extension_error",
      extensionPath: "/ext.ts",
      event: "tool_call",
      error: "boom",
    });
    expect(state.lastError).toBe("boom");
  });

  it("turn_start/turn_end/response are no-ops", () => {
    expect(reduceChat(INITIAL_CHAT_STATE, { type: "turn_start" })).toBe(INITIAL_CHAT_STATE);
    expect(reduceChat(INITIAL_CHAT_STATE, { type: "turn_end" })).toBe(INITIAL_CHAT_STATE);
    expect(
      reduceChat(INITIAL_CHAT_STATE, { type: "response", command: "prompt", success: true }),
    ).toBe(INITIAL_CHAT_STATE);
  });
});

describe("reduceChat: fixture replays", () => {
  it("a prompt turn with thinking, a tool call and streamed text ends with only the final assistant text visible", () => {
    const state = replay(readFixtureEvents("prompt-turn.jsonl"));
    expect(state.messages).toEqual([
      { id: "msg-0", role: "assistant", text: "The README describes Gentle Shell.", streaming: false },
    ]);
    expect(state.working).toBe(false);
    expect(state.pendingDialogs).toEqual([]);
    expect(state.lastError).toBeUndefined();
    // 3 thinking + 3 toolcall + 3 tool_execution deltas.
    expect(state.activity).toBe(9);
  });

  it("a select dialog mid-turn surfaces in pendingDialogs and leaves the agent working", () => {
    const state = replay(readFixtureEvents("select-dialog.jsonl"));
    expect(state.working).toBe(true);
    expect(state.pendingDialogs).toEqual([
      { id: "dlg-1", method: "select", title: "Allow dangerous command?", options: ["Allow", "Block"] },
    ]);
  });

  it("an extension_error settles into lastError once the agent settles", () => {
    const state = replay(readFixtureEvents("extension-error.jsonl"));
    expect(state.lastError).toBe("Cannot read properties of undefined (reading 'foo')");
    expect(state.working).toBe(false);
  });
});
