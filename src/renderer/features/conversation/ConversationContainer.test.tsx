// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CHAT_STATE, MESSAGE_ROLE, type ChatState, type ChatSummary, type GentleBridge } from "@shared/bridge-types";
import { ConversationContainer, type ActiveChat } from "./ConversationContainer";

const NEW_CHAT: ActiveChat = { kind: "new" };

const EXISTING_CHAT: ChatSummary = {
  id: "chat-1",
  title: "Refactor the store",
  cwd: "/tmp/project",
  updatedAt: "2026-09-21T09:00:00.000Z",
  messageCount: 3,
  state: CHAT_STATE.IDLE,
};

const EMPTY_HELPERS = { summary: { running: 0, queued: 0, waiting: 0, finished: 0 }, tasks: [] };

function emptyState(): ChatState {
  return { messages: [], working: false, pendingDialogs: [], activity: 0, helpers: EMPTY_HELPERS };
}

function makeBridge(overrides: Partial<GentleBridge> = {}): GentleBridge {
  return {
    listChats: vi.fn().mockResolvedValue([]),
    openChat: vi.fn().mockResolvedValue(emptyState()),
    newChat: vi.fn().mockResolvedValue(emptyState()),
    sendMessage: vi.fn().mockResolvedValue({ queued: true }),
    abort: vi.fn().mockResolvedValue(undefined),
    answerDialog: vi.fn().mockResolvedValue(undefined),
    onState: vi.fn().mockReturnValue(() => {}),
    onError: vi.fn().mockReturnValue(() => {}),
    setupStatus: vi.fn().mockResolvedValue({ needsChoice: false, detection: { found: false, dir: "", hasAuth: false, hasModels: false } }),
    chooseHome: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("ConversationContainer", () => {
  it('calls bridge.newChat() for activeChat { kind: "new" } and shows "New chat" as the title', async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);

    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());
    expect(bridge.openChat).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "New chat" })).toBeInTheDocument();
  });

  it("calls bridge.openChat(id) for an existing activeChat and shows its title", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<ConversationContainer activeChat={{ kind: "existing", chat: EXISTING_CHAT }} />);

    await vi.waitFor(() => expect(bridge.openChat).toHaveBeenCalledWith("chat-1"));
    expect(bridge.newChat).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Refactor the store" })).toBeInTheDocument();
  });

  it("re-opens when activeChat changes", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    const { rerender } = render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalledTimes(1));

    rerender(<ConversationContainer activeChat={{ kind: "existing", chat: EXISTING_CHAT }} />);
    await vi.waitFor(() => expect(bridge.openChat).toHaveBeenCalledWith("chat-1"));
  });

  it("renders only the pushed ChatState", async () => {
    let pushState: (state: ChatState) => void = () => {};
    const bridge = makeBridge({
      onState: vi.fn((callback: (state: ChatState) => void) => {
        pushState = callback;
        return () => {};
      }),
    });
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushState({
      messages: [{ id: "m1", role: MESSAGE_ROLE.ASSISTANT, text: "Hello there", streaming: false }],
      working: false,
      pendingDialogs: [],
      activity: 0,
      helpers: EMPTY_HELPERS,
    });

    expect(await screen.findByText("Hello there")).toBeInTheDocument();
  });

  it("calls bridge.sendMessage with the trimmed draft on submit", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Tell Gentle what you need…"), { target: { value: "  hi Gentle  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(bridge.sendMessage).toHaveBeenCalledWith("hi Gentle");
  });

  it("shows an onError push in the status line without adding a message", async () => {
    let pushError: (message: string) => void = () => {};
    const bridge = makeBridge({
      onError: vi.fn((callback: (message: string) => void) => {
        pushError = callback;
        return () => {};
      }),
    });
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushError("Gentle is still working");

    expect(await screen.findByRole("status")).toHaveTextContent("Gentle is still working");
    expect(screen.queryByText(/still working/, { selector: ".gc-message__text" })).not.toBeInTheDocument();
  });

  it("shows a pushed ChatState.lastError in the status line", async () => {
    let pushState: (state: ChatState) => void = () => {};
    const bridge = makeBridge({
      onState: vi.fn((callback: (state: ChatState) => void) => {
        pushState = callback;
        return () => {};
      }),
    });
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushState({ messages: [], working: false, pendingDialogs: [], activity: 0, helpers: EMPTY_HELPERS, lastError: "pi exited unexpectedly" });

    expect(await screen.findByRole("status")).toHaveTextContent("pi exited unexpectedly");
  });

  it("forwards a dialog answer to bridge.answerDialog with the dialog id", async () => {
    let pushState: (state: ChatState) => void = () => {};
    const bridge = makeBridge({
      onState: vi.fn((callback: (state: ChatState) => void) => {
        pushState = callback;
        return () => {};
      }),
    });
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushState({
      messages: [],
      working: false,
      pendingDialogs: [{ id: "dlg-1", method: "confirm", title: "Delete the file?" }],
      activity: 0,
      helpers: EMPTY_HELPERS,
    });

    fireEvent.click(await screen.findByRole("button", { name: "Yes" }));

    expect(bridge.answerDialog).toHaveBeenCalledWith("dlg-1", { confirmed: true });
  });

  it("calls bridge.abort() on Escape while working", async () => {
    let pushState: (state: ChatState) => void = () => {};
    const bridge = makeBridge({
      onState: vi.fn((callback: (state: ChatState) => void) => {
        pushState = callback;
        return () => {};
      }),
    });
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushState({ messages: [], working: true, pendingDialogs: [], activity: 0, helpers: EMPTY_HELPERS });

    const textarea = screen.getByPlaceholderText("Tell Gentle what you need…");
    await vi.waitFor(() => expect(textarea).toHaveAttribute("readonly"));
    fireEvent.keyDown(textarea, { key: "Escape" });

    expect(bridge.abort).toHaveBeenCalled();
  });

  it("guards the open/new effect against a stale resolution when the selection changes before it settles", async () => {
    let resolveFirst: (state: ChatState) => void = () => {};
    const firstChat: ChatSummary = { ...EXISTING_CHAT, id: "chat-1", title: "First chat" };
    const secondChat: ChatSummary = { ...EXISTING_CHAT, id: "chat-2", title: "Second chat" };

    const bridge = makeBridge({
      openChat: vi.fn((id: string) => {
        if (id === "chat-1") {
          return new Promise<ChatState>((resolve) => {
            resolveFirst = resolve;
          });
        }
        return Promise.resolve(emptyState());
      }),
    });
    window.gentle = bridge;

    const { rerender } = render(<ConversationContainer activeChat={{ kind: "existing", chat: firstChat }} />);
    await vi.waitFor(() => expect(bridge.openChat).toHaveBeenCalledWith("chat-1"));

    rerender(<ConversationContainer activeChat={{ kind: "existing", chat: secondChat }} />);
    await vi.waitFor(() => expect(bridge.openChat).toHaveBeenCalledWith("chat-2"));

    // The stale first request resolves after the second one was already
    // requested; its state must never overwrite what belongs to chat-2.
    resolveFirst({
      messages: [{ id: "stale", role: MESSAGE_ROLE.ASSISTANT, text: "stale reply", streaming: false }],
      working: false,
      pendingDialogs: [],
      activity: 0,
      helpers: EMPTY_HELPERS,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByText("stale reply")).not.toBeInTheDocument();
  });

  it("does not call sendMessage when the draft is only whitespace", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<ConversationContainer activeChat={NEW_CHAT} />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Tell Gentle what you need…"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(bridge.sendMessage).not.toHaveBeenCalled();
  });
});
