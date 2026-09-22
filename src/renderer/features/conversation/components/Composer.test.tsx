// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Composer } from "./Composer";

describe("Composer", () => {
  it("shows the placeholder and the key hints", () => {
    render(<Composer value="" working={false} onChange={vi.fn()} onSend={vi.fn()} onAbort={vi.fn()} />);

    expect(screen.getByPlaceholderText("Tell Gentle what you need…")).toBeInTheDocument();
    expect(screen.getByText("Enter to send · Shift+Enter for a new line · Esc to stop")).toBeInTheDocument();
  });

  it("calls onSend and does not insert a newline when Enter is pressed without Shift", () => {
    const onSend = vi.fn();

    render(<Composer value="hello" working={false} onChange={vi.fn()} onSend={onSend} onAbort={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Tell Gentle what you need…");
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(onSend).toHaveBeenCalled();
  });

  it("does not call onSend when Shift+Enter is pressed (newline instead)", () => {
    const onSend = vi.fn();

    render(<Composer value="hello" working={false} onChange={vi.fn()} onSend={onSend} onAbort={vi.fn()} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Tell Gentle what you need…"), { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend on Enter when the draft is empty", () => {
    const onSend = vi.fn();

    render(<Composer value="   " working={false} onChange={vi.fn()} onSend={onSend} onAbort={vi.fn()} />);
    fireEvent.keyDown(screen.getByPlaceholderText("Tell Gentle what you need…"), { key: "Enter" });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onAbort on Escape only while working", () => {
    const onAbort = vi.fn();
    const { rerender } = render(
      <Composer value="" working={false} onChange={vi.fn()} onSend={vi.fn()} onAbort={onAbort} />,
    );
    const textarea = screen.getByPlaceholderText("Tell Gentle what you need…");

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(onAbort).not.toHaveBeenCalled();

    rerender(<Composer value="" working onChange={vi.fn()} onSend={vi.fn()} onAbort={onAbort} />);
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(onAbort).toHaveBeenCalled();
  });

  it("marks the field read-only while working so Escape still reaches it, and disables Send", () => {
    render(<Composer value="hi" working onChange={vi.fn()} onSend={vi.fn()} onAbort={vi.fn()} />);

    const textarea = screen.getByPlaceholderText("Tell Gentle what you need…");
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("disables Send when the draft is empty", () => {
    render(<Composer value="" working={false} onChange={vi.fn()} onSend={vi.fn()} onAbort={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("clicking Send calls onSend", () => {
    const onSend = vi.fn();
    render(<Composer value="hi" working={false} onChange={vi.fn()} onSend={onSend} onAbort={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalled();
  });
});
