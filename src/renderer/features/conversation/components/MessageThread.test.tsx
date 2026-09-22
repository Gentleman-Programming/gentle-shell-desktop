// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MESSAGE_ROLE, type ChatMessage, type Dialog } from "@shared/bridge-types";
import { MessageThread } from "./MessageThread";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("MessageThread", () => {
  it("shows an empty-state hint when there are no messages or dialogs", () => {
    render(<MessageThread messages={[]} dialogs={[]} onAnswerDialog={vi.fn()} />);
    expect(screen.getByText("Start a conversation with Gentle.")).toBeInTheDocument();
  });

  it("renders user and assistant bubbles, then pending dialog cards, in order", () => {
    const messages: ChatMessage[] = [
      { id: "m1", role: MESSAGE_ROLE.USER, text: "Hi Gentle" },
      { id: "m2", role: MESSAGE_ROLE.ASSISTANT, text: "Hi there" },
    ];
    const dialogs: Dialog[] = [{ id: "d1", method: "confirm", title: "Delete it?" }];

    render(<MessageThread messages={messages} dialogs={dialogs} onAnswerDialog={vi.fn()} />);

    const thread = screen.getByTestId("gc-message-thread");
    const rendered = [...thread.querySelectorAll(".gc-message, .gc-dialog-card")];
    expect(rendered).toHaveLength(3);
    expect(rendered[0]).toHaveTextContent("Hi Gentle");
    expect(rendered[1]).toHaveTextContent("Hi there");
    expect(rendered[2]).toHaveTextContent("Delete it?");
  });

  it("does not render an assistant bubble with empty text once it stopped streaming", () => {
    const messages: ChatMessage[] = [
      { id: "m1", role: MESSAGE_ROLE.USER, text: "run the tool" },
      { id: "m2", role: MESSAGE_ROLE.ASSISTANT, text: "", streaming: false },
      { id: "m3", role: MESSAGE_ROLE.ASSISTANT, text: "done", streaming: false },
    ];

    render(<MessageThread messages={messages} dialogs={[]} onAnswerDialog={vi.fn()} />);

    const thread = screen.getByTestId("gc-message-thread");
    const rendered = [...thread.querySelectorAll(".gc-message")];
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveTextContent("run the tool");
    expect(rendered[1]).toHaveTextContent("done");
  });

  it("still renders an empty assistant bubble while it is streaming (typing placeholder)", () => {
    const messages: ChatMessage[] = [{ id: "m1", role: MESSAGE_ROLE.ASSISTANT, text: "", streaming: true }];

    render(<MessageThread messages={messages} dialogs={[]} onAnswerDialog={vi.fn()} />);

    const thread = screen.getByTestId("gc-message-thread");
    expect(thread.querySelectorAll(".gc-message")).toHaveLength(1);
  });

  it("forwards dialog answers with the dialog id", () => {
    const dialogs: Dialog[] = [{ id: "d1", method: "confirm", title: "Delete it?" }];
    const onAnswerDialog = vi.fn();

    render(<MessageThread messages={[]} dialogs={dialogs} onAnswerDialog={onAnswerDialog} />);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(onAnswerDialog).toHaveBeenCalledWith("d1", { confirmed: true });
  });

  it("scrolls to the bottom when messages change", () => {
    const { rerender } = render(<MessageThread messages={[]} dialogs={[]} onAnswerDialog={vi.fn()} />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();
    rerender(
      <MessageThread
        messages={[{ id: "m1", role: MESSAGE_ROLE.USER, text: "hi" }]}
        dialogs={[]}
        onAnswerDialog={vi.fn()}
      />,
    );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
