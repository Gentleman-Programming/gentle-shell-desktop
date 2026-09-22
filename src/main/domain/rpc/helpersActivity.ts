import type {
  HelperStatus,
  HelperTask,
  HelperThread,
  HelperThreadItem,
  HelpersActivity,
  HelpersSummary,
} from "@shared/bridge-types";

/**
 * Decodes and normalizes gentle-agents' `gentle-agents.activity/v1` widget
 * payload (see src/README.md's hexagonal main process note: this file has
 * no Node/Electron import so it stays testable without spawning a real
 * process). Tolerant by design, per the M2 protocol contract: unknown
 * fields are ignored, a missing thread becomes empty, and malformed JSON
 * returns `undefined` so the caller (chatReducer) keeps the previous
 * helpers state instead of clobbering it with a partial/garbage frame.
 */
const SCHEMA = "gentle-agents.activity/v1";

const HELPER_STATUSES: ReadonlySet<string> = new Set(["queued", "running", "waiting", "done", "failed", "cancelled"]);
const THREAD_ITEM_KINDS: ReadonlySet<string> = new Set(["text", "thinking", "tool", "note"]);

export function emptyHelpersActivity(): HelpersActivity {
  return { summary: { running: 0, queued: 0, waiting: 0, finished: 0 }, tasks: [] };
}

/**
 * Parses the `widgetLines` array of a `setWidget` request for
 * `widgetKey: "gentle-agents"` into a typed `HelpersActivity`.
 *
 * - `undefined`/empty `widgetLines` (pi's documented way to clear a
 *   widget) decodes to `emptyHelpersActivity()`.
 * - Malformed JSON, or JSON that isn't a `gentle-agents.activity/v1`
 *   payload, returns `undefined` — the caller must keep whatever helpers
 *   state it already had instead of treating this as "no helpers".
 */
export function parseHelpersActivity(lines: readonly string[] | undefined): HelpersActivity | undefined {
  if (!lines || lines.length === 0) return emptyHelpersActivity();

  let parsed: unknown;
  try {
    parsed = JSON.parse(lines.join(""));
  } catch {
    return undefined;
  }

  if (!isRecord(parsed) || parsed.schema !== SCHEMA) return undefined;

  const tasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.map(toTask).filter((task): task is HelperTask => task !== undefined)
    : [];

  return { summary: toSummary(parsed.summary), tasks };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

/** Accepts an ISO timestamp string as-is, normalizes an epoch-ms number to ISO, and drops anything else. */
function toIsoString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return undefined;
}

function toStatus(value: unknown): HelperStatus | undefined {
  return typeof value === "string" && HELPER_STATUSES.has(value) ? (value as HelperStatus) : undefined;
}

function toSummary(value: unknown): HelpersSummary {
  if (!isRecord(value)) return { running: 0, queued: 0, waiting: 0, finished: 0 };
  return {
    running: toNumber(value.running),
    queued: toNumber(value.queued),
    waiting: toNumber(value.waiting),
    finished: toNumber(value.finished),
  };
}

function toThreadItem(value: unknown): HelperThreadItem | undefined {
  if (!isRecord(value) || typeof value.kind !== "string" || !THREAD_ITEM_KINDS.has(value.kind)) return undefined;

  switch (value.kind) {
    case "text":
      return typeof value.text === "string" ? { kind: "text", text: value.text } : undefined;
    case "thinking":
      return typeof value.text === "string" ? { kind: "thinking", text: value.text } : undefined;
    case "note":
      return typeof value.text === "string" ? { kind: "note", text: value.text } : undefined;
    case "tool":
      return typeof value.callId === "string" && typeof value.name === "string"
        ? {
            kind: "tool",
            callId: value.callId,
            name: value.name,
            args: value.args,
            output: value.output,
            running: typeof value.running === "boolean" ? value.running : undefined,
            isError: typeof value.isError === "boolean" ? value.isError : undefined,
          }
        : undefined;
    default:
      return undefined;
  }
}

function toThread(value: unknown): HelperThread {
  if (!isRecord(value)) return { version: 0, dropped: 0, items: [] };

  const items = Array.isArray(value.items)
    ? value.items.map(toThreadItem).filter((item): item is HelperThreadItem => item !== undefined)
    : [];

  return { version: toNumber(value.version), dropped: toNumber(value.dropped), items };
}

function toTask(value: unknown): HelperTask | undefined {
  if (!isRecord(value) || !isRecord(value.summary)) return undefined;
  const summary = value.summary;

  const id = summary.id;
  const status = toStatus(summary.status);
  const createdAt = toIsoString(summary.createdAt);
  if (typeof id !== "string" || !status || !createdAt) return undefined;

  return {
    id,
    agent: typeof summary.agent === "string" ? summary.agent : "",
    label: typeof summary.label === "string" ? summary.label : "",
    prompt: typeof summary.prompt === "string" ? summary.prompt : "",
    status,
    createdAt,
    startedAt: toIsoString(summary.startedAt),
    endedAt: toIsoString(summary.endedAt),
    lastStep: typeof summary.lastStep === "string" ? summary.lastStep : undefined,
    lastActivityAt: toIsoString(summary.lastActivityAt),
    turns: toNumber(summary.turns),
    toolCalls: toNumber(summary.toolCalls),
    error: typeof summary.error === "string" ? summary.error : undefined,
    thread: toThread(value.thread),
  };
}
