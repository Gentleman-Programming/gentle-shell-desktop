import type { ChatSummary } from "./bridge-types";

/**
 * Moved here from src/main/domain/session/sessionList.ts (T3) because T4's
 * renderer sidebar (features/chats/components/ChatList.tsx) needs the same
 * day-bucketing the main process already used to shape `toChatSummaries`'
 * output — the Scope Rule promotes a helper out of one process/feature once
 * a second consumer needs it (see src/README.md). sessionList.ts re-exports
 * it so its existing call sites and tests keep compiling.
 */
export interface ChatDayGroup {
  readonly label: string;
  readonly chats: readonly ChatSummary[];
}

/**
 * Groups already-sorted ChatSummaries into day buckets labeled "Today",
 * "Yesterday", or an ISO calendar date (YYYY-MM-DD) for anything older.
 * Groups appear in first-seen order, so callers should pass chats already
 * sorted by updatedAt descending (toChatSummaries' output) to get
 * Today-then-Yesterday-then-older group order for free.
 *
 * Day boundaries are computed in UTC, not the local timezone: `now`
 * defaults to `new Date()`, but every call site in tests (and pi's own
 * ISO timestamps) is UTC, so UTC boundaries keep this deterministic
 * regardless of the host machine's timezone.
 */
export function groupChatsByDay(chats: readonly ChatSummary[], now: Date = new Date()): ChatDayGroup[] {
  const order: string[] = [];
  const byLabel = new Map<string, ChatSummary[]>();

  for (const chat of chats) {
    const label = dayLabel(new Date(chat.updatedAt), now);
    const existing = byLabel.get(label);
    if (existing) {
      existing.push(chat);
      continue;
    }
    byLabel.set(label, [chat]);
    order.push(label);
  }

  return order.map((label) => ({ label, chats: byLabel.get(label) ?? [] }));
}

function dayLabel(date: Date, now: Date): string {
  const diffDays = utcDaysBetween(date, now);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return isoCalendarDate(date);
}

function utcDaysBetween(date: Date, now: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((startOfUtcDay(now) - startOfUtcDay(date)) / MS_PER_DAY);
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isoCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
