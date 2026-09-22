import { describe, expect, it } from "vitest";
import type { HelperTask, HelperThreadItem } from "@shared/bridge-types";
import {
  countSteps,
  formatElapsed,
  formatEarlierDateHint,
  formatMetaLine,
  formatSummaryLine,
  labelThreadItems,
  partitionHelpers,
  statusLabel,
  summarizeTool,
} from "./format";

function baseTask(overrides: Partial<HelperTask> = {}): HelperTask {
  return {
    id: "task-1",
    agent: "researcher",
    label: "Research the API",
    prompt: "Look into the auth flow",
    status: "running",
    createdAt: "2026-09-22T10:00:00.000Z",
    turns: 0,
    toolCalls: 0,
    thread: { version: 0, dropped: 0, items: [] },
    ...overrides,
  };
}

describe("formatElapsed", () => {
  it("returns undefined when the task has not started yet (queued)", () => {
    expect(formatElapsed(baseTask({ startedAt: undefined }))).toBeUndefined();
  });

  it("formats elapsed time between startedAt and endedAt for a finished task", () => {
    const task = baseTask({ startedAt: "2026-09-22T10:00:00.000Z", endedAt: "2026-09-22T10:01:40.000Z" });
    expect(formatElapsed(task)).toBe("1m 40s");
  });

  it("formats elapsed time under a minute as seconds only", () => {
    const task = baseTask({ startedAt: "2026-09-22T10:00:00.000Z", endedAt: "2026-09-22T10:00:09.000Z" });
    expect(formatElapsed(task)).toBe("9s");
  });

  it("formats elapsed time between startedAt and `now` for a still-running task", () => {
    const task = baseTask({ startedAt: "2026-09-22T10:00:00.000Z" });
    const now = new Date("2026-09-22T10:00:05.000Z").getTime();
    expect(formatElapsed(task, now)).toBe("5s");
  });
});

describe("countSteps", () => {
  it("counts only tool items as steps", () => {
    const items: HelperThreadItem[] = [
      { kind: "text", text: "hi" },
      { kind: "thinking", text: "hmm" },
      { kind: "tool", callId: "1", name: "Read" },
      { kind: "tool", callId: "2", name: "Edit" },
      { kind: "note", text: "note" },
    ];
    expect(countSteps(baseTask({ thread: { version: 0, dropped: 0, items } }))).toBe(2);
  });
});

describe("summarizeTool", () => {
  it("falls back to just the tool name when args have no recognizable shape", () => {
    expect(summarizeTool({ name: "Bash", args: 42 })).toBe("Bash");
    expect(summarizeTool({ name: "Bash", args: undefined })).toBe("Bash");
  });

  it("summarizes a path argument", () => {
    expect(summarizeTool({ name: "Read", args: { path: "src/config/schema.ts" } })).toBe("Read src/config/schema.ts");
  });

  it("summarizes a paths array argument as a file count", () => {
    expect(summarizeTool({ name: "Read", args: { paths: ["a.ts", "b.ts", "c.ts"] } })).toBe("Read 3 files");
  });

  it("summarizes a command argument", () => {
    expect(summarizeTool({ name: "Bash", args: { command: "pnpm test" } })).toBe("Bash pnpm test");
  });

  it("truncates a long string argument", () => {
    const long = "x".repeat(100);
    const summary = summarizeTool({ name: "Grep", args: { query: long } });
    expect(summary.length).toBeLessThan(80);
    expect(summary.endsWith("…")).toBe(true);
  });
});

describe("labelThreadItems", () => {
  it("labels the first text item Task, later text items Update, thinking as Plan, tool items as numbered Steps, and note as Note", () => {
    const items: HelperThreadItem[] = [
      { kind: "text", text: "Starting." },
      { kind: "thinking", text: "Hmm." },
      { kind: "tool", callId: "1", name: "Read" },
      { kind: "tool", callId: "2", name: "Edit" },
      { kind: "text", text: "Update one." },
      { kind: "note", text: "Needs input." },
    ];

    const labeled = labelThreadItems(items);

    expect(labeled.map((entry) => entry.label)).toEqual(["Task", "Plan", "Step 1", "Step 2", "Update", "Note"]);
  });
});

describe("formatMetaLine", () => {
  it("joins status, elapsed and step count with middle dots", () => {
    const task = baseTask({
      status: "running",
      startedAt: "2026-09-22T10:00:00.000Z",
      thread: { version: 0, dropped: 0, items: [{ kind: "tool", callId: "1", name: "Read" }] },
    });
    const now = new Date("2026-09-22T10:01:40.000Z").getTime();

    expect(formatMetaLine(task, now)).toBe("running · 1m 40s · 1 step");
  });

  it("omits elapsed when the task has not started (no startedAt)", () => {
    const task = baseTask({ status: "queued", startedAt: undefined, thread: { version: 0, dropped: 0, items: [] } });
    expect(formatMetaLine(task)).toBe("queued · 0 steps");
  });
});

describe("statusLabel", () => {
  it("capitalizes each status for display", () => {
    expect(statusLabel("running")).toBe("Running");
    expect(statusLabel("waiting")).toBe("Waiting");
    expect(statusLabel("done")).toBe("Done");
    expect(statusLabel("queued")).toBe("Queued");
    expect(statusLabel("failed")).toBe("Failed");
    expect(statusLabel("cancelled")).toBe("Cancelled");
  });
});

describe("formatSummaryLine", () => {
  it("joins non-zero summary counts with middle dots", () => {
    expect(formatSummaryLine({ running: 2, queued: 1, waiting: 0, finished: 1 })).toBe("2 running · 1 queued · 1 finished");
  });

  it("shows a single neutral message when nothing is happening", () => {
    expect(formatSummaryLine({ running: 0, queued: 0, waiting: 0, finished: 0 })).toBe("No helpers yet");
  });
});

describe("partitionHelpers", () => {
  const openedAt = "2026-09-22T10:00:00.000Z";

  it("buckets a terminal task that finished before openedAt as earlier", () => {
    const task = baseTask({ status: "done", endedAt: "2026-09-20T10:00:00.000Z" });
    expect(partitionHelpers([task], openedAt)).toEqual({ current: [], earlier: [task] });
  });

  it("buckets a terminal task that finished after openedAt as current", () => {
    const task = baseTask({ status: "done", endedAt: "2026-09-23T10:00:00.000Z" });
    expect(partitionHelpers([task], openedAt)).toEqual({ current: [task], earlier: [] });
  });

  it("keeps a still-running task current even with old timestamps", () => {
    const task = baseTask({ status: "running", startedAt: "2026-09-10T10:00:00.000Z" });
    expect(partitionHelpers([task], openedAt)).toEqual({ current: [task], earlier: [] });
  });

  it("falls back to lastActivityAt, then createdAt, when endedAt is missing", () => {
    const viaLastActivity = baseTask({
      status: "failed",
      endedAt: undefined,
      lastActivityAt: "2026-09-20T10:00:00.000Z",
      createdAt: "2026-09-23T10:00:00.000Z",
    });
    expect(partitionHelpers([viaLastActivity], openedAt)).toEqual({ current: [], earlier: [viaLastActivity] });

    const viaCreatedAt = baseTask({
      status: "cancelled",
      endedAt: undefined,
      lastActivityAt: undefined,
      createdAt: "2026-09-20T10:00:00.000Z",
    });
    expect(partitionHelpers([viaCreatedAt], openedAt)).toEqual({ current: [], earlier: [viaCreatedAt] });
  });

  it("preserves the existing order within each bucket", () => {
    const running = baseTask({ id: "running", status: "running", startedAt: "2026-09-22T09:00:00.000Z" });
    const oldDone = baseTask({ id: "old-done", status: "done", endedAt: "2026-09-20T10:00:00.000Z" });
    const newDone = baseTask({ id: "new-done", status: "done", endedAt: "2026-09-23T10:00:00.000Z" });
    const olderDone = baseTask({ id: "older-done", status: "done", endedAt: "2026-09-19T10:00:00.000Z" });

    expect(partitionHelpers([running, oldDone, newDone, olderDone], openedAt)).toEqual({
      current: [running, newDone],
      earlier: [oldDone, olderDone],
    });
  });
});

describe("formatEarlierDateHint", () => {
  it("returns undefined for an empty earlier group", () => {
    expect(formatEarlierDateHint([])).toBeUndefined();
  });

  it("formats the latest endedAt among the earlier group", () => {
    const tasks = [
      baseTask({ id: "1", status: "done", endedAt: "2026-09-18T10:00:00.000Z" }),
      baseTask({ id: "2", status: "done", endedAt: "2026-09-20T10:00:00.000Z" }),
    ];
    expect(formatEarlierDateHint(tasks)).toBe("until Sep 20, 2026");
  });
});
