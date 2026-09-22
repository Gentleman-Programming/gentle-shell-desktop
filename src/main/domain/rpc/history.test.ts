import { describe, expect, it } from "vitest";
import type { RpcMessage } from "./types";
import { extractHistoryMessages, historyToMessages } from "./history";

describe("historyToMessages", () => {
  it("keeps a user message's plain string content as-is", () => {
    const messages: RpcMessage[] = [{ role: "user", content: "What is 2+2?", timestamp: 0 }];

    expect(historyToMessages(messages)).toEqual([{ id: "msg-0", role: "user", text: "What is 2+2?" }]);
  });

  it("joins a user message's text content parts and skips image parts", () => {
    const messages: RpcMessage[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "look at " },
          { type: "image", data: "base64", mimeType: "image/png" },
          { type: "text", text: "this" },
        ],
        timestamp: 0,
      },
    ];

    expect(historyToMessages(messages)).toEqual([{ id: "msg-0", role: "user", text: "look at this" }]);
  });

  it("joins an assistant message's text parts and skips thinking and toolCall parts", () => {
    const messages: RpcMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "thinking", thinking: "let me think" },
          { type: "text", text: "The answer is " },
          { type: "toolCall", id: "call_1", name: "bash", arguments: { command: "ls" } },
          { type: "text", text: "4." },
        ],
        timestamp: 0,
      },
    ];

    expect(historyToMessages(messages)).toEqual([
      { id: "msg-0", role: "assistant", text: "The answer is 4.", streaming: false },
    ]);
  });

  it("skips toolResult messages and any other role entirely", () => {
    const messages: RpcMessage[] = [
      { role: "user", content: "hi", timestamp: 0 },
      {
        role: "toolResult",
        toolCallId: "call_1",
        toolName: "bash",
        content: [{ type: "text", text: "output" }],
        isError: false,
        timestamp: 0,
      },
      { role: "assistant", content: [{ type: "text", text: "hello" }], timestamp: 0 },
    ];

    expect(historyToMessages(messages)).toEqual([
      { id: "msg-0", role: "user", text: "hi" },
      { id: "msg-1", role: "assistant", text: "hello", streaming: false },
    ]);
  });

  it("assigns ids by position in the returned array, so a skipped toolResult never leaves a gap", () => {
    const messages: RpcMessage[] = [
      { role: "toolResult", toolCallId: "call_1", toolName: "bash", content: [], isError: false, timestamp: 0 },
      { role: "user", content: "first", timestamp: 0 },
      { role: "toolResult", toolCallId: "call_2", toolName: "bash", content: [], isError: false, timestamp: 0 },
      { role: "assistant", content: [{ type: "text", text: "second" }], timestamp: 0 },
    ];

    const result = historyToMessages(messages);

    expect(result.map((message) => message.id)).toEqual(["msg-0", "msg-1"]);
  });

  it("returns an empty array for an empty history", () => {
    expect(historyToMessages([])).toEqual([]);
  });
});

describe("extractHistoryMessages", () => {
  it("pulls the messages array out of a get_messages response's data field", () => {
    const data = { messages: [{ role: "user", content: "hi", timestamp: 0 }] };

    expect(extractHistoryMessages(data)).toEqual(data.messages);
  });

  it("returns an empty array for malformed or missing data", () => {
    expect(extractHistoryMessages(undefined)).toEqual([]);
    expect(extractHistoryMessages(null)).toEqual([]);
    expect(extractHistoryMessages("nope")).toEqual([]);
    expect(extractHistoryMessages({})).toEqual([]);
    expect(extractHistoryMessages({ messages: "nope" })).toEqual([]);
  });

  it("filters out entries without a string role", () => {
    const data = { messages: [{ role: "user", content: "hi", timestamp: 0 }, { foo: "bar" }, null, "nope"] };

    expect(extractHistoryMessages(data)).toEqual([{ role: "user", content: "hi", timestamp: 0 }]);
  });
});
