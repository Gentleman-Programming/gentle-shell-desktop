// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CHAT_STATE, type ChatSummary } from "@shared/bridge-types";
import { ChatList } from "./ChatList";

const NOW = new Date("2026-09-21T12:00:00.000Z");

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

describe("ChatList", () => {
  it("renders a day heading per group and a state pill per chat", () => {
    const chats = [
      makeChat({ id: "a", title: "Today's chat", updatedAt: "2026-09-21T09:00:00.000Z", state: CHAT_STATE.WORKING }),
      makeChat({ id: "b", title: "Old chat", updatedAt: "2026-09-10T09:00:00.000Z", state: CHAT_STATE.NEEDS_YOU }),
    ];

    render(<ChatList chats={chats} onSelect={vi.fn()} now={NOW} />);

    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2026-09-10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today's chat/ })).toHaveTextContent("working");
    expect(screen.getByRole("button", { name: /Old chat/ })).toHaveTextContent("needs you");
  });

  it("calls onSelect with the chat when an item is clicked", () => {
    const chat = makeChat({ id: "clicked" });
    const onSelect = vi.fn();

    render(<ChatList chats={[chat]} onSelect={onSelect} now={NOW} />);
    screen.getByRole("button", { name: /A chat/ }).click();

    expect(onSelect).toHaveBeenCalledWith(chat);
  });

  it("marks the selected chat as current", () => {
    const chats = [makeChat({ id: "a", title: "First" }), makeChat({ id: "b", title: "Second" })];

    render(<ChatList chats={chats} selectedId="b" onSelect={vi.fn()} now={NOW} />);

    expect(screen.getByRole("button", { name: /First/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: /Second/ })).toHaveAttribute("aria-current", "true");
  });

  it("renders nothing when there are no chats", () => {
    const { container } = render(<ChatList chats={[]} onSelect={vi.fn()} now={NOW} />);
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });
});
