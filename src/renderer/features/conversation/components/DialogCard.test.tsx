// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Dialog } from "@shared/bridge-types";
import { DialogCard } from "./DialogCard";

describe("DialogCard", () => {
  it("select: renders an option per choice and answers with { value }", () => {
    const dialog: Dialog = { id: "d1", method: "select", title: "Which branch?", options: ["main", "dev"] };
    const onAnswer = vi.fn();

    render(<DialogCard dialog={dialog} onAnswer={onAnswer} />);
    expect(screen.getByText("Which branch?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "dev" }));

    expect(onAnswer).toHaveBeenCalledWith({ value: "dev" });
  });

  it("confirm: Yes answers { confirmed: true }, No answers { confirmed: false }", () => {
    const dialog: Dialog = { id: "d2", method: "confirm", title: "Delete the file?", message: "This cannot be undone." };
    const onAnswer = vi.fn();

    render(<DialogCard dialog={dialog} onAnswer={onAnswer} />);
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(onAnswer).toHaveBeenCalledWith({ confirmed: true });

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(onAnswer).toHaveBeenCalledWith({ confirmed: false });
  });

  it("input: typing then Send answers { value }", () => {
    const dialog: Dialog = { id: "d3", method: "input", title: "What's your name?", placeholder: "Your name" };
    const onAnswer = vi.fn();

    render(<DialogCard dialog={dialog} onAnswer={onAnswer} />);
    fireEvent.change(screen.getByPlaceholderText("Your name"), { target: { value: "Alan" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onAnswer).toHaveBeenCalledWith({ value: "Alan" });
  });

  it("editor: renders a multi-line field prefilled, and Send answers { value }", () => {
    const dialog: Dialog = { id: "d4", method: "editor", title: "Edit the summary", prefill: "Initial text" };
    const onAnswer = vi.fn();

    render(<DialogCard dialog={dialog} onAnswer={onAnswer} />);
    const field = screen.getByDisplayValue("Initial text");
    expect(field.tagName).toBe("TEXTAREA");

    fireEvent.change(field, { target: { value: "Edited text" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onAnswer).toHaveBeenCalledWith({ value: "Edited text" });
  });

  it("cancel answers { cancelled: true }", () => {
    const dialog: Dialog = { id: "d5", method: "select", title: "Pick one", options: ["a"] };
    const onAnswer = vi.fn();

    render(<DialogCard dialog={dialog} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onAnswer).toHaveBeenCalledWith({ cancelled: true });
  });
});
