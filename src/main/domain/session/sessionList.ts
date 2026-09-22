import { CHAT_STATE, type ChatSummary } from "@shared/bridge-types";
import type { SessionInfoLike } from "../../ports";

// groupChatsByDay/ChatDayGroup moved to @shared/chatGrouping in T4: the
// renderer sidebar (features/chats/components/ChatList.tsx) needs the same
// day-bucketing this module used to own locally — Scope Rule, see
// @shared/chatGrouping.ts's own doc comment. Re-exported here so existing
// call sites (none left in this repo, kept for API stability) still resolve
// through "./sessionList".
export { groupChatsByDay, type ChatDayGroup } from "@shared/chatGrouping";

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
