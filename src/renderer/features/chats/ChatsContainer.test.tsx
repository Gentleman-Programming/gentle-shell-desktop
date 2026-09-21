// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GentleBridge } from "@shared/bridge-types";
import { ChatsContainer } from "./ChatsContainer";

it("shows a message when listChats rejects", async () => {
  const bridge: GentleBridge = {
    listChats: vi.fn().mockRejectedValue(new Error("bridge not ready")),
    sendMessage: vi.fn(),
  };
  window.gentle = bridge;
  render(<ChatsContainer />);
  expect(await screen.findByText("Chats are not available yet: bridge not ready")).toBeInTheDocument();
});
