import { CHAT_STATE, type ChatSummary } from "@shared/bridge-types";
import type { SessionInfoLike } from "../../ports";

const TITLE_MAX_LENGTH = 80;

/**
 * Maps pi's SessionInfo (via the SessionInfoLike port shape) into the
 * renderer-facing ChatSummary, sorted by modified time descending (most
 * recently active chat first). Pure: no I/O, safe to unit-test with plain
 * fixtures (see src/README.md's hexagonal main process note).
 *
 * State is always "idle": a listed-but-not-open chat has no live PiSession
 * tracking it in M1 — only the currently open chat's ChatHost/PiSession
 * knows a real "working"/"needs you" state.
 */
export function toChatSummaries(sessions: readonly SessionInfoLike[]): ChatSummary[] {
  return sessions.map(toChatSummary).sort(byModifiedDescending);
}

function toChatSummary(session: SessionInfoLike): ChatSummary {
  return {
    id: session.id,
    title: resolveTitle(session),
    cwd: session.cwd,
    updatedAt: session.modified.toISOString(),
    messageCount: session.messageCount,
    state: CHAT_STATE.IDLE,
  };
}

function resolveTitle(session: SessionInfoLike): string {
  const name = session.name?.trim();
  if (name) return name;

  const firstMessage = session.firstMessage.trim();
  if (firstMessage) return firstMessage.slice(0, TITLE_MAX_LENGTH);

  return "New chat";
}

function byModifiedDescending(a: ChatSummary, b: ChatSummary): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

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
 * regardless of the host machine's timezone. A locale-local "today" can
 * be added in T4 if the renderer needs one.
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
