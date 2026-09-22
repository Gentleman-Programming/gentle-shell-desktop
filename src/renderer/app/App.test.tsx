// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the sidebar heading and the composer placeholder", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tell Gentle what you need…"),
    ).toBeInTheDocument();
  });

  it('opens a fresh "New chat" by default', () => {
    render(<App />);

    expect(screen.getAllByRole("heading", { name: "New chat" })).toHaveLength(1);
  });

  it("selecting a sidebar chat updates the conversation header title", async () => {
    render(<App />);

    // mockBridge's example chats load asynchronously into the sidebar.
    const item = await screen.findByRole("button", { name: /Write the README intro/ });
    item.click();

    expect(await screen.findByRole("heading", { name: "Write the README intro" })).toBeInTheDocument();
  });
});
