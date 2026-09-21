// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MESSAGE_ROLE, type ChatState, type GentleBridge } from "@shared/bridge-types";
import { ConversationContainer } from "./ConversationContainer";

function emptyState(): ChatState {
  return { messages: [], working: false, pendingDialogs: [], activity: 0 };
}

function makeBridge(overrides: Partial<GentleBridge> = {}): GentleBridge {
  return {
    listChats: vi.fn().mockResolvedValue([]),
    openChat: vi.fn().mockResolvedValue(emptyState()),
    newChat: vi.fn().mockResolvedValue(emptyState()),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
    answerDialog: vi.fn().mockResolvedValue(undefined),
    onState: vi.fn().mockReturnValue(() => {}),
    onError: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

describe("ConversationContainer", () => {
  it("opens a fresh chat on mount and renders only the pushed ChatState", async () => {
    let pushState: (state: ChatState) => void = () => {};
    const bridge = makeBridge({
      onState: vi.fn((callback: (state: ChatState) => void) => {
        pushState = callback;
        return () => {};
      }),
    });
    window.gentle = bridge;

    render(<ConversationContainer />);

    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushState({
      messages: [{ id: "m1", role: MESSAGE_ROLE.ASSISTANT, text: "Hello there", streaming: false }],
      working: false,
      pendingDialogs: [],
      activity: 0,
    });

    expect(await screen.findByText("Hello there")).toBeInTheDocument();
  });

  it("calls bridge.sendMessage with the trimmed draft on submit", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<ConversationContainer />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Message Gentle…"), { target: { value: "  hi Gentle  " } });
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

    render(<ConversationContainer />);
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

    render(<ConversationContainer />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    pushState({
      messages: [],
      working: false,
      pendingDialogs: [],
      activity: 0,
      lastError: "pi exited unexpectedly",
    });

    expect(await screen.findByRole("status")).toHaveTextContent("pi exited unexpectedly");
  });

  it("does not call sendMessage when the draft is only whitespace", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<ConversationContainer />);
    await vi.waitFor(() => expect(bridge.newChat).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Message Gentle…"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(bridge.sendMessage).not.toHaveBeenCalled();
  });
});
