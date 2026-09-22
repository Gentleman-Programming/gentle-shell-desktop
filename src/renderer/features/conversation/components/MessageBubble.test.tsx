// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MESSAGE_ROLE, type ChatMessage } from "@shared/bridge-types";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders assistant Markdown text as real HTML elements", () => {
    const message: ChatMessage = { id: "m1", role: MESSAGE_ROLE.ASSISTANT, text: "**bold**" };
    const { container } = render(<MessageBubble message={message} />);

    expect(container.querySelector("strong")).toHaveTextContent("bold");
  });

  it("renders user text literally, without interpreting Markdown", () => {
    const message: ChatMessage = { id: "m1", role: MESSAGE_ROLE.USER, text: "**bold**" };
    const { container } = render(<MessageBubble message={message} />);

    expect(container.querySelector("strong")).toBeNull();
    expect(container).toHaveTextContent("**bold**");
  });

  it("still applies the user/assistant bubble class", () => {
    const message: ChatMessage = { id: "m1", role: MESSAGE_ROLE.USER, text: "hi" };
    const { container } = render(<MessageBubble message={message} />);

    expect(container.querySelector(".gc-message--user")).not.toBeNull();
  });
});
