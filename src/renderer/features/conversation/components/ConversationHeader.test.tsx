// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConversationHeader } from "./ConversationHeader";

describe("ConversationHeader", () => {
  it("renders the chat title", () => {
    render(<ConversationHeader title="Refactor the store" working={false} />);
    expect(screen.getByRole("heading", { name: "Refactor the store" })).toBeInTheDocument();
  });

  it("shows the Working pill only while working", () => {
    const { rerender } = render(<ConversationHeader title="New chat" working={false} />);
    expect(screen.queryByText("Working…")).not.toBeInTheDocument();

    rerender(<ConversationHeader title="New chat" working />);
    expect(screen.getByText("Working…")).toBeInTheDocument();
  });
});
