import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LineSplitter, decodeLine, encodeCommand } from "./codec";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readFixtureLines(name: string): string[] {
  const raw = readFileSync(path.join(__dirname, "__fixtures__", name), "utf8");
  return raw.split("\n").filter((line) => line.trim().length > 0);
}

describe("encodeCommand", () => {
  it("encodes prompt as one LF-terminated JSON line", () => {
    expect(encodeCommand({ type: "prompt", message: "Hello, world!" })).toBe(
      '{"type":"prompt","message":"Hello, world!"}\n',
    );
  });

  it("encodes abort, new_session, get_state and get_messages with no extra fields", () => {
    expect(encodeCommand({ type: "abort" })).toBe('{"type":"abort"}\n');
    expect(encodeCommand({ type: "new_session" })).toBe('{"type":"new_session"}\n');
    expect(encodeCommand({ type: "get_state" })).toBe('{"type":"get_state"}\n');
    expect(encodeCommand({ type: "get_messages" })).toBe('{"type":"get_messages"}\n');
  });

  it("encodes switch_session with sessionPath", () => {
    expect(encodeCommand({ type: "switch_session", sessionPath: "/tmp/session.jsonl" })).toBe(
      '{"type":"switch_session","sessionPath":"/tmp/session.jsonl"}\n',
    );
  });

  it("encodes each extension_ui_response variant (value, confirmed, cancelled)", () => {
    expect(encodeCommand({ type: "extension_ui_response", id: "dlg-1", value: "Allow" })).toBe(
      '{"type":"extension_ui_response","id":"dlg-1","value":"Allow"}\n',
    );
    expect(encodeCommand({ type: "extension_ui_response", id: "dlg-2", confirmed: true })).toBe(
      '{"type":"extension_ui_response","id":"dlg-2","confirmed":true}\n',
    );
    expect(encodeCommand({ type: "extension_ui_response", id: "dlg-3", cancelled: true })).toBe(
      '{"type":"extension_ui_response","id":"dlg-3","cancelled":true}\n',
    );
  });
});

describe("LineSplitter", () => {
  it("splits a single chunk containing two complete lines", () => {
    const splitter = new LineSplitter();
    expect(splitter.push('{"a":1}\n{"b":2}\n')).toEqual(['{"a":1}', '{"b":2}']);
  });

  it("buffers a partial line across multiple pushes", () => {
    const splitter = new LineSplitter();
    expect(splitter.push('{"a"')).toEqual([]);
    expect(splitter.push(':1}\n')).toEqual(['{"a":1}']);
  });

  it("strips a trailing \\r from \\r\\n input", () => {
    const splitter = new LineSplitter();
    expect(splitter.push('{"a":1}\r\n')).toEqual(['{"a":1}']);
  });

  it("flush returns the buffered remainder once, stripped of a trailing \\r", () => {
    const splitter = new LineSplitter();
    splitter.push('{"a":1}\r');
    expect(splitter.flush()).toEqual(['{"a":1}']);
    expect(splitter.flush()).toEqual([]);
  });

  it("flush on an empty buffer returns no lines", () => {
    expect(new LineSplitter().flush()).toEqual([]);
  });
});

describe("decodeLine", () => {
  it("is tolerant of a blank line", () => {
    expect(decodeLine("")).toEqual({ kind: "unknown", raw: "" });
    expect(decodeLine("   ")).toEqual({ kind: "unknown", raw: "   " });
  });

  it("is tolerant of malformed JSON", () => {
    expect(decodeLine("{not json")).toEqual({ kind: "unknown", raw: "{not json" });
  });

  it("is unknown for JSON without a string type field", () => {
    expect(decodeLine('{"foo":"bar"}')).toEqual({ kind: "unknown", raw: '{"foo":"bar"}' });
    expect(decodeLine('{"type":1}')).toEqual({ kind: "unknown", raw: '{"type":1}' });
  });

  it("is unknown for a syntactically valid but unmodeled event type", () => {
    const line = '{"type":"queue_update","steering":[],"followUp":[]}';
    expect(decodeLine(line)).toEqual({ kind: "unknown", raw: line });
  });

  it("decodes agent_start / agent_settled / turn_start / turn_end", () => {
    expect(decodeLine('{"type":"agent_start"}')).toEqual({ type: "agent_start" });
    expect(decodeLine('{"type":"agent_settled"}')).toEqual({ type: "agent_settled" });
    expect(decodeLine('{"type":"turn_start"}')).toEqual({ type: "turn_start" });
    expect(decodeLine('{"type":"turn_end"}')).toEqual({ type: "turn_end" });
  });

  it("decodes agent_end with willRetry", () => {
    expect(decodeLine('{"type":"agent_end","messages":[],"willRetry":true}')).toEqual({
      type: "agent_end",
      willRetry: true,
    });
  });

  it("decodes message_start/message_end for an assistant message", () => {
    const line = '{"type":"message_start","message":{"role":"assistant","content":[]}}';
    expect(decodeLine(line)).toEqual({
      type: "message_start",
      message: { role: "assistant", content: [] },
    });
  });

  it("decodes a message_update text_delta", () => {
    const line =
      '{"type":"message_update","usage":{},"assistantMessageEvent":{"type":"text_delta","contentIndex":0,"delta":"Hi"}}';
    expect(decodeLine(line)).toEqual({
      type: "message_update",
      assistantMessageEvent: { type: "text_delta", contentIndex: 0, delta: "Hi" },
    });
  });

  it("decodes tool_execution_start/update/end", () => {
    expect(
      decodeLine('{"type":"tool_execution_start","toolCallId":"call_1","toolName":"bash","args":{}}'),
    ).toEqual({ type: "tool_execution_start", toolCallId: "call_1", toolName: "bash" });
    expect(
      decodeLine(
        '{"type":"tool_execution_end","toolCallId":"call_1","toolName":"bash","result":{},"isError":false}',
      ),
    ).toEqual({ type: "tool_execution_end", toolCallId: "call_1", toolName: "bash", isError: false });
  });

  it("decodes an extension_ui_request select dialog", () => {
    const line =
      '{"type":"extension_ui_request","id":"uuid-1","method":"select","title":"Allow?","options":["Allow","Block"],"timeout":10000}';
    expect(decodeLine(line)).toEqual({
      type: "extension_ui_request",
      id: "uuid-1",
      method: "select",
      title: "Allow?",
      options: ["Allow", "Block"],
      timeout: 10000,
    });
  });

  it("decodes a fire-and-forget extension_ui_request (notify)", () => {
    const line = '{"type":"extension_ui_request","id":"uuid-5","method":"notify","message":"Blocked","notifyType":"warning"}';
    const decoded = decodeLine(line);
    expect(decoded).toMatchObject({ type: "extension_ui_request", id: "uuid-5", method: "notify" });
  });

  it("decodes extension_error", () => {
    const line =
      '{"type":"extension_error","extensionPath":"/ext.ts","event":"tool_call","error":"boom"}';
    expect(decodeLine(line)).toEqual({
      type: "extension_error",
      extensionPath: "/ext.ts",
      event: "tool_call",
      error: "boom",
    });
  });

  it("decodes a successful response envelope", () => {
    const line = '{"id":"req-1","type":"response","command":"prompt","success":true}';
    expect(decodeLine(line)).toEqual({ id: "req-1", type: "response", command: "prompt", success: true, data: undefined });
  });

  it("decodes a failed response envelope", () => {
    const line = '{"type":"response","command":"set_model","success":false,"error":"Model not found"}';
    expect(decodeLine(line)).toEqual({
      id: undefined,
      type: "response",
      command: "set_model",
      success: false,
      error: "Model not found",
    });
  });

  it("decodes every line of the recorded fixtures without falling back to unknown", () => {
    for (const fixture of ["prompt-turn.jsonl", "select-dialog.jsonl", "extension-error.jsonl"]) {
      for (const line of readFixtureLines(fixture)) {
        const decoded = decodeLine(line);
        expect("kind" in decoded, `expected a recognized event in ${fixture} for line: ${line}`).toBe(false);
      }
    }
  });
});
