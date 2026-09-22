// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the sidebar heading and the composer placeholder", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Message Gentle…"),
    ).toBeInTheDocument();
  });
});
