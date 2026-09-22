import type { HelperStatus, HelperTask, HelperThreadItem, HelpersSummary } from "@shared/bridge-types";

/**
 * Pure formatting helpers for the Helpers tab (D3). Kept separate from any
 * component so they're trivially unit-testable without rendering React —
 * elapsed time, step counts and one-line tool summaries are all derived
 * data, never fetched or mutated.
 */

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

/**
 * Elapsed time from `startedAt` to `endedAt` (a finished task) or to `now`
 * (a still-running task), as "1m 40s"/"9s". `undefined` when the task
 * hasn't started yet (queued tasks have no elapsed time to show).
 */
export function formatElapsed(task: Pick<HelperTask, "startedAt" | "endedAt">, now: number = Date.now()): string | undefined {
  if (!task.startedAt) return undefined;

  const start = Date.parse(task.startedAt);
  if (Number.isNaN(start)) return undefined;

  const endSource = task.endedAt ? Date.parse(task.endedAt) : now;
  const end = Number.isNaN(endSource) ? now : endSource;

  return formatDuration(Math.max(0, end - start));
}

/** Steps are `tool` thread items only — Task/Plan/Update/Note items narrate, per the mockup's "6 steps" meta line. */
export function countSteps(task: Pick<HelperTask, "thread">): number {
  return task.thread.items.filter((item) => item.kind === "tool").length;
}

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function summarizeArgs(args: unknown): string | undefined {
  if (args === null || args === undefined) return undefined;
  if (typeof args === "string") return truncate(args);
  if (typeof args !== "object") return undefined;

  const record = args as Record<string, unknown>;
  if (typeof record.path === "string") return truncate(record.path);
  if (typeof record.file_path === "string") return truncate(record.file_path);
  if (Array.isArray(record.paths)) return `${record.paths.length} files`;
  if (typeof record.command === "string") return truncate(record.command);
  if (typeof record.query === "string") return truncate(record.query);
  if (typeof record.pattern === "string") return truncate(record.pattern);
  return undefined;
}

/** One-line collapsed summary for a tool row: "Read 3 files" style — the tool name plus a short, best-effort description of its args. Falls back to just the name when args aren't in a recognizable shape. */
export function summarizeTool(item: { readonly name: string; readonly args?: unknown }): string {
  const detail = summarizeArgs(item.args);
  return detail ? `${item.name} ${detail}` : item.name;
}

export interface LabeledThreadItem {
  readonly item: HelperThreadItem;
  readonly label: string;
}

/**
 * Labels each thread item per the mockup: the first `text` item is the
 * "Task" the helper was given, later `text` items are "Update" bubbles,
 * `thinking` items are the "Plan", `tool` items are numbered "Step N" in
 * thread order, and `note` items are "Note".
 */
export function labelThreadItems(items: readonly HelperThreadItem[]): readonly LabeledThreadItem[] {
  let sawTask = false;
  let stepCount = 0;

  return items.map((item) => {
    switch (item.kind) {
      case "text": {
        const label = sawTask ? "Update" : "Task";
        sawTask = true;
        return { item, label };
      }
      case "thinking":
        return { item, label: "Plan" };
      case "tool":
        stepCount += 1;
        return { item, label: `Step ${stepCount}` };
      case "note":
        return { item, label: "Note" };
    }
  });
}

const STATUS_LABEL: Record<HelperStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Waiting",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** Display label for a HelperStatus value ("running" -> "Running"). */
export function statusLabel(status: HelperStatus): string {
  return STATUS_LABEL[status];
}

/** The "running · 1m 40s · 6 steps" meta line under a helper's title in the list. */
export function formatMetaLine(task: HelperTask, now?: number): string {
  const steps = countSteps(task);
  const parts = [task.status, formatElapsed(task, now), `${steps} step${steps === 1 ? "" : "s"}`].filter(
    (part): part is string => Boolean(part),
  );
  return parts.join(" · ");
}

/** The "2 running · 1 queued · 1 finished" summary line above the helper list. */
export function formatSummaryLine(summary: HelpersSummary): string {
  const parts = [
    summary.running > 0 && `${summary.running} running`,
    summary.queued > 0 && `${summary.queued} queued`,
    summary.waiting > 0 && `${summary.waiting} waiting`,
    summary.finished > 0 && `${summary.finished} finished`,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" · ") : "No helpers yet";
}
