import { describe, expect, it } from "vitest";
import { CHAT_STATE, type ChatSummary } from "./bridge-types";
import { groupChatsByDay } from "./chatGrouping";

function makeChat(overrides: Partial<ChatSummary> = {}): ChatSummary {
  return {
    id: "chat-1",
    title: "A chat",
    cwd: "/tmp/project",
    updatedAt: "2026-09-21T09:00:00.000Z",
    messageCount: 1,
    state: CHAT_STATE.IDLE,
    ...overrides,
  };
}

describe("groupChatsByDay", () => {
  const now = new Date("2026-09-21T12:00:00.000Z");

  it('groups a chat updated today under "Today" (UTC calendar day)', () => {
    const chats = [makeChat({ id: "a", updatedAt: "2026-09-21T09:00:00.000Z" })];
    expect(groupChatsByDay(chats, now)).toEqual([{ label: "Today", chats }]);
  });

  it('groups a chat updated yesterday under "Yesterday"', () => {
    const chats = [makeChat({ id: "a", updatedAt: "2026-09-20T09:00:00.000Z" })];
    expect(groupChatsByDay(chats, now)).toEqual([{ label: "Yesterday", chats }]);
  });

  it("groups an older chat under its ISO calendar date", () => {
    const chats = [makeChat({ id: "a", updatedAt: "2026-09-10T09:00:00.000Z" })];
    expect(groupChatsByDay(chats, now)).toEqual([{ label: "2026-09-10", chats }]);
  });

  it("keeps same-day chats in one group, preserving their (already-sorted) order", () => {
    const chats = [
      makeChat({ id: "a", updatedAt: "2026-09-21T09:00:00.000Z" }),
      makeChat({ id: "b", updatedAt: "2026-09-21T08:00:00.000Z" }),
    ];

    const groups = groupChatsByDay(chats, now);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.chats.map((chat) => chat.id)).toEqual(["a", "b"]);
  });

  it("returns Today and Yesterday as separate, ordered groups", () => {
    const chats = [
      makeChat({ id: "today", updatedAt: "2026-09-21T09:00:00.000Z" }),
      makeChat({ id: "yesterday", updatedAt: "2026-09-20T09:00:00.000Z" }),
    ];

    const groups = groupChatsByDay(chats, now);

    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday"]);
  });

  it("defaults `now` to the current time when omitted", () => {
    const chats = [makeChat({ id: "a", updatedAt: new Date().toISOString() })];
    expect(groupChatsByDay(chats)).toEqual([{ label: "Today", chats }]);
  });
});
