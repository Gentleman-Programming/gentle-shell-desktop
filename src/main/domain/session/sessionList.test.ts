import { describe, expect, it } from "vitest";
import { CHAT_STATE } from "@shared/bridge-types";
import { groupChatsByDay, toChatSummaries } from "./sessionList";
import type { SessionInfoLike } from "../../ports";

function makeSession(overrides: Partial<SessionInfoLike> = {}): SessionInfoLike {
  return {
    id: "sess-1",
    cwd: "/tmp/project",
    modified: new Date("2026-09-21T10:00:00.000Z"),
    messageCount: 3,
    firstMessage: "hello there",
    ...overrides,
  };
}

describe("toChatSummaries", () => {
  it("prefers the session name for the title", () => {
    const [summary] = toChatSummaries([makeSession({ name: "  My chat  " })]);
    expect(summary?.title).toBe("My chat");
  });

  it("falls back to the first message, trimmed to 80 chars, when there is no name", () => {
    const longMessage = "x".repeat(120);
    const [summary] = toChatSummaries([makeSession({ firstMessage: longMessage })]);
    expect(summary?.title).toHaveLength(80);
    expect(summary?.title).toBe(longMessage.slice(0, 80));
  });

  it('falls back to "New chat" when there is no name and no first message', () => {
    const [summary] = toChatSummaries([makeSession({ firstMessage: "" })]);
    expect(summary?.title).toBe("New chat");
  });

  it("maps cwd, updatedAt (ISO), messageCount and the idle state", () => {
    const [summary] = toChatSummaries([makeSession({ id: "sess-2", cwd: "/tmp/other", messageCount: 7 })]);
    expect(summary).toMatchObject({
      id: "sess-2",
      cwd: "/tmp/other",
      updatedAt: "2026-09-21T10:00:00.000Z",
      messageCount: 7,
      state: CHAT_STATE.IDLE,
    });
  });

  it("sorts by modified time descending (most recently active first)", () => {
    const older = makeSession({ id: "older", modified: new Date("2026-09-19T00:00:00.000Z") });
    const newer = makeSession({ id: "newer", modified: new Date("2026-09-21T00:00:00.000Z") });

    const summaries = toChatSummaries([older, newer]);

    expect(summaries.map((summary) => summary.id)).toEqual(["newer", "older"]);
  });
});

describe("groupChatsByDay", () => {
  const now = new Date("2026-09-21T12:00:00.000Z");

  it('groups a chat updated today under "Today" (UTC calendar day)', () => {
    const summaries = toChatSummaries([makeSession({ id: "a", modified: new Date("2026-09-21T09:00:00.000Z") })]);
    expect(groupChatsByDay(summaries, now)).toEqual([{ label: "Today", chats: summaries }]);
  });

  it('groups a chat updated yesterday under "Yesterday"', () => {
    const summaries = toChatSummaries([makeSession({ id: "a", modified: new Date("2026-09-20T09:00:00.000Z") })]);
    expect(groupChatsByDay(summaries, now)).toEqual([{ label: "Yesterday", chats: summaries }]);
  });

  it("groups an older chat under its ISO calendar date", () => {
    const summaries = toChatSummaries([makeSession({ id: "a", modified: new Date("2026-09-10T09:00:00.000Z") })]);
    expect(groupChatsByDay(summaries, now)).toEqual([{ label: "2026-09-10", chats: summaries }]);
  });

  it("keeps same-day chats in one group, preserving their (already-sorted) order", () => {
    const summaries = toChatSummaries([
      makeSession({ id: "a", modified: new Date("2026-09-21T09:00:00.000Z") }),
      makeSession({ id: "b", modified: new Date("2026-09-21T08:00:00.000Z") }),
    ]);

    const groups = groupChatsByDay(summaries, now);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.chats.map((chat) => chat.id)).toEqual(["a", "b"]);
  });

  it("returns Today and Yesterday as separate, ordered groups", () => {
    const summaries = toChatSummaries([
      makeSession({ id: "today", modified: new Date("2026-09-21T09:00:00.000Z") }),
      makeSession({ id: "yesterday", modified: new Date("2026-09-20T09:00:00.000Z") }),
    ]);

    const groups = groupChatsByDay(summaries, now);

    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday"]);
  });
});
