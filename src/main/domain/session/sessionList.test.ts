import { describe, expect, it } from "vitest";
import { CHAT_STATE } from "@shared/bridge-types";
import { toChatSummaries } from "./sessionList";
import type { SessionInfoLike } from "../../ports";

// groupChatsByDay/ChatDayGroup moved to @shared/chatGrouping.ts in T4 (the
// renderer sidebar needs it too); its tests moved with it to
// @shared/chatGrouping.test.ts. sessionList.ts still re-exports both names
// for API stability — see that file's doc comment.

function makeSession(overrides: Partial<SessionInfoLike> = {}): SessionInfoLike {
  return {
    id: "sess-1",
    path: "/tmp/sessions/proj/sess-1.jsonl",
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
