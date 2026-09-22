// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

// `?firstRun=0` forces mockBridge.setupStatus() to needsChoice: false (see
// mockBridge's firstRunOverride), so these tests exercise the normal chat
// layout without going through the first-run screen mockBridge shows by
// default for the browser preview.
describe("App", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "?firstRun=0");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the sidebar heading and the composer placeholder", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tell Gentle what you need…"),
    ).toBeInTheDocument();
  });

  it('opens a fresh "New chat" by default', async () => {
    render(<App />);

    expect(await screen.findAllByRole("heading", { name: "New chat" })).toHaveLength(1);
  });

  it("selecting a sidebar chat updates the conversation header title", async () => {
    render(<App />);

    // mockBridge's example chats load asynchronously into the sidebar.
    const item = await screen.findByRole("button", { name: /Write the README intro/ });
    item.click();

    expect(await screen.findByRole("heading", { name: "Write the README intro" })).toBeInTheDocument();
  });

  it("shows the first-run screen when setupStatus reports needsChoice (no persisted home choice yet)", async () => {
    window.history.pushState({}, "", "?firstRun=1");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Welcome to gentle shell" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Chats" })).not.toBeInTheDocument();
  });

  it("choosing a home in first-run switches to the normal chat layout", async () => {
    window.history.pushState({}, "", "?firstRun=1");

    render(<App />);

    const button = await screen.findByRole("button", { name: "Use my pi setup" });
    button.click();

    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Welcome to gentle shell" })).not.toBeInTheDocument();
  });
});
