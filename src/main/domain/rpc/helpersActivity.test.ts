import { describe, expect, it } from "vitest";
import { emptyHelpersActivity, parseHelpersActivity } from "./helpersActivity";

const VALID_PAYLOAD = JSON.stringify({
  schema: "gentle-agents.activity/v1",
  summary: { running: 1, queued: 0, waiting: 0, finished: 0 },
  tasks: [
    {
      summary: {
        id: "task-1",
        agent: "researcher",
        label: "Research the API",
        prompt: "Look into the auth flow",
        status: "running",
        createdAt: "2026-09-22T10:00:00.000Z",
        startedAt: "2026-09-22T10:00:01.000Z",
        turns: 2,
        toolCalls: 1,
      },
      thread: {
        version: 1,
        dropped: 0,
        items: [
          { kind: "text", text: "Starting." },
          { kind: "thinking", text: "Hmm." },
          { kind: "tool", callId: "call-1", name: "Read", args: { path: "x" }, output: "y", running: false, isError: false },
          { kind: "note", text: "Needs input." },
        ],
      },
    },
  ],
});

describe("emptyHelpersActivity", () => {
  it("returns an empty summary and no tasks", () => {
    expect(emptyHelpersActivity()).toEqual({
      summary: { running: 0, queued: 0, waiting: 0, finished: 0 },
      tasks: [],
    });
  });
});

describe("parseHelpersActivity", () => {
  it("decodes a valid gentle-agents.activity/v1 payload into a typed HelpersActivity", () => {
    const activity = parseHelpersActivity([VALID_PAYLOAD]);

    expect(activity).toEqual({
      summary: { running: 1, queued: 0, waiting: 0, finished: 0 },
      tasks: [
        {
          id: "task-1",
          agent: "researcher",
          label: "Research the API",
          prompt: "Look into the auth flow",
          status: "running",
          createdAt: "2026-09-22T10:00:00.000Z",
          startedAt: "2026-09-22T10:00:01.000Z",
          endedAt: undefined,
          lastStep: undefined,
          lastActivityAt: undefined,
          turns: 2,
          toolCalls: 1,
          error: undefined,
          thread: {
            version: 1,
            dropped: 0,
            items: [
              { kind: "text", text: "Starting." },
              { kind: "thinking", text: "Hmm." },
              { kind: "tool", callId: "call-1", name: "Read", args: { path: "x" }, output: "y", running: false, isError: false },
              { kind: "note", text: "Needs input." },
            ],
          },
        },
      ],
    });
  });

  it("normalizes epoch-ms timestamps to ISO strings", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: { running: 0, queued: 0, waiting: 0, finished: 0 },
      tasks: [
        {
          summary: {
            id: "task-1",
            agent: "a",
            label: "l",
            prompt: "p",
            status: "done",
            createdAt: 1758535200000,
            lastActivityAt: 1758535215000,
            turns: 0,
            toolCalls: 0,
          },
          thread: { version: 0, dropped: 0, items: [] },
        },
      ],
    });

    const activity = parseHelpersActivity([payload]);

    expect(activity?.tasks[0]?.createdAt).toBe(new Date(1758535200000).toISOString());
    expect(activity?.tasks[0]?.lastActivityAt).toBe(new Date(1758535215000).toISOString());
  });

  it("defaults missing numeric fields to 0", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: {},
      tasks: [
        {
          summary: { id: "task-1", agent: "a", label: "l", prompt: "p", status: "queued", createdAt: "2026-09-22T10:00:00.000Z" },
          thread: { version: 0, dropped: 0, items: [] },
        },
      ],
    });

    const activity = parseHelpersActivity([payload]);

    expect(activity?.summary).toEqual({ running: 0, queued: 0, waiting: 0, finished: 0 });
    expect(activity?.tasks[0]?.turns).toBe(0);
    expect(activity?.tasks[0]?.toolCalls).toBe(0);
  });

  it("defaults a missing thread to an empty thread", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: { running: 0, queued: 0, waiting: 0, finished: 0 },
      tasks: [
        {
          summary: { id: "task-1", agent: "a", label: "l", prompt: "p", status: "queued", createdAt: "2026-09-22T10:00:00.000Z", turns: 0, toolCalls: 0 },
        },
      ],
    });

    const activity = parseHelpersActivity([payload]);

    expect(activity?.tasks[0]?.thread).toEqual({ version: 0, dropped: 0, items: [] });
  });

  it("ignores unknown fields on the payload, summary, task and thread item", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      unknownTopLevel: true,
      summary: { running: 1, queued: 0, waiting: 0, finished: 0, unknownSummaryField: 42 },
      tasks: [
        {
          summary: {
            id: "task-1",
            agent: "a",
            label: "l",
            prompt: "p",
            status: "running",
            createdAt: "2026-09-22T10:00:00.000Z",
            turns: 0,
            toolCalls: 0,
            unknownTaskField: "x",
          },
          thread: { version: 0, dropped: 0, items: [{ kind: "text", text: "hi", unknownItemField: 1 }] },
        },
      ],
    });

    const activity = parseHelpersActivity([payload]);

    expect(activity?.summary).toEqual({ running: 1, queued: 0, waiting: 0, finished: 0 });
    expect(activity?.tasks[0]?.id).toBe("task-1");
    expect(activity?.tasks[0]?.thread.items).toEqual([{ kind: "text", text: "hi" }]);
  });

  it("drops an unrecognized thread item kind instead of throwing", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: { running: 0, queued: 0, waiting: 0, finished: 0 },
      tasks: [
        {
          summary: { id: "task-1", agent: "a", label: "l", prompt: "p", status: "running", createdAt: "2026-09-22T10:00:00.000Z", turns: 0, toolCalls: 0 },
          thread: { version: 0, dropped: 0, items: [{ kind: "text", text: "kept" }, { kind: "mystery" }] },
        },
      ],
    });

    const activity = parseHelpersActivity([payload]);

    expect(activity?.tasks[0]?.thread.items).toEqual([{ kind: "text", text: "kept" }]);
  });

  it("drops a task missing required fields instead of throwing", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: { running: 0, queued: 0, waiting: 0, finished: 0 },
      tasks: [{ summary: { agent: "a" } }],
    });

    expect(parseHelpersActivity([payload])?.tasks).toEqual([]);
  });

  it("returns undefined for malformed JSON so the caller can keep the previous state", () => {
    expect(parseHelpersActivity(["{not valid json"])).toBeUndefined();
  });

  it("returns undefined when the schema field is missing or wrong", () => {
    expect(parseHelpersActivity([JSON.stringify({ summary: {}, tasks: [] })])).toBeUndefined();
    expect(parseHelpersActivity([JSON.stringify({ schema: "other/v1", summary: {}, tasks: [] })])).toBeUndefined();
  });

  it("returns an empty activity for undefined or empty widgetLines (explicit clear)", () => {
    expect(parseHelpersActivity(undefined)).toEqual(emptyHelpersActivity());
    expect(parseHelpersActivity([])).toEqual(emptyHelpersActivity());
  });

  // D1 advisory follow-up: `new Date(nonFiniteOrOutOfRangeEpoch).toISOString()`
  // throws a RangeError instead of returning a string. A single malformed
  // timestamp field from gentle-agents must never crash the whole decode.
  it("drops an out-of-range epoch timestamp instead of throwing", () => {
    // 8_640_000_000_000_001 is one past JS's maximum representable Date
    // (±8,640,000,000,000,000ms from the epoch) — a finite number that
    // still makes `new Date(...)` invalid.
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: { running: 0, queued: 0, waiting: 0, finished: 0 },
      tasks: [
        {
          summary: {
            id: "task-1",
            agent: "a",
            label: "l",
            prompt: "p",
            status: "running",
            createdAt: "2026-09-22T10:00:00.000Z",
            lastActivityAt: 8_640_000_000_000_001,
            turns: 0,
            toolCalls: 0,
          },
          thread: { version: 0, dropped: 0, items: [] },
        },
      ],
    });

    expect(() => parseHelpersActivity([payload])).not.toThrow();
    expect(parseHelpersActivity([payload])?.tasks[0]?.lastActivityAt).toBeUndefined();
  });

  it("drops a non-finite epoch timestamp (Infinity, from an overflowing JSON number literal) instead of throwing", () => {
    // JSON.parse accepts a numeric literal that overflows to Infinity even
    // though the JSON spec has no Infinity keyword — this is how a
    // malformed upstream payload could produce a non-finite number here.
    const payload = '{"schema":"gentle-agents.activity/v1","summary":{},"tasks":[{"summary":{"id":"task-1","agent":"a","label":"l","prompt":"p","status":"running","createdAt":"2026-09-22T10:00:00.000Z","lastActivityAt":1e400,"turns":0,"toolCalls":0},"thread":{"version":0,"dropped":0,"items":[]}}]}';

    expect(() => parseHelpersActivity([payload])).not.toThrow();
    expect(parseHelpersActivity([payload])?.tasks[0]?.lastActivityAt).toBeUndefined();
  });

  it("drops a task whose createdAt is an out-of-range epoch instead of throwing (createdAt is required)", () => {
    const payload = JSON.stringify({
      schema: "gentle-agents.activity/v1",
      summary: {},
      tasks: [
        {
          summary: { id: "task-1", agent: "a", label: "l", prompt: "p", status: "running", createdAt: 8_640_000_000_000_001, turns: 0, toolCalls: 0 },
          thread: { version: 0, dropped: 0, items: [] },
        },
      ],
    });

    expect(() => parseHelpersActivity([payload])).not.toThrow();
    expect(parseHelpersActivity([payload])?.tasks).toEqual([]);
  });
});
