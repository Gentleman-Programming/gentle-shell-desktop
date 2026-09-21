// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PiDetection } from "@shared/bridge-types";
import { FirstRun } from "./FirstRun";

const DETECTION: PiDetection = {
  found: true,
  dir: "/Users/dev/.pi/agent",
  hasAuth: true,
  hasModels: true,
};

describe("FirstRun", () => {
  it("renders the title, lead, detection card and fine print copy", () => {
    render(<FirstRun detection={DETECTION} onChoose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Welcome to gentle shell" })).toBeInTheDocument();
    expect(
      screen.getByText("Everything you need is already inside this app. One question before you start."),
    ).toBeInTheDocument();
    expect(screen.getByText("We found pi on this machine")).toBeInTheDocument();
    expect(screen.getByText("/Users/dev/.pi/agent")).toBeInTheDocument();
    expect(
      screen.getByText("No pi on the machine? This screen is skipped and gentle shell starts in its own space."),
    ).toBeInTheDocument();
  });

  it('renders both option cards with their bullets, footnotes, and the "Recommended" badge on "Use my pi setup"', () => {
    render(<FirstRun detection={DETECTION} onChoose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Use my pi setup" })).toBeInTheDocument();
    expect(screen.getByText("Your sign-ins, local models and chats appear here")).toBeInTheDocument();
    expect(screen.getByText("Chats you start here also show up in your terminal")).toBeInTheDocument();
    expect(screen.getByText("Your pi settings are never edited")).toBeInTheDocument();
    expect(screen.getByText("links to ~/.pi/agent")).toBeInTheDocument();
    expect(screen.getByText("Recommended")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Keep it separate" })).toBeInTheDocument();
    expect(screen.getByText("A clean space with its own sign-ins and chats")).toBeInTheDocument();
    expect(screen.getByText("Nothing on this machine is touched")).toBeInTheDocument();
    expect(screen.getByText("You can link to pi later from Providers")).toBeInTheDocument();
    expect(screen.getByText("creates ~/.gentle-shell/agent")).toBeInTheDocument();
  });

  it('calls onChoose("link") for "Use my pi setup"', () => {
    const onChoose = vi.fn();
    render(<FirstRun detection={DETECTION} onChoose={onChoose} />);

    fireEvent.click(screen.getByRole("button", { name: "Use my pi setup" }));

    expect(onChoose).toHaveBeenCalledWith("link");
  });

  it('calls onChoose("isolated") for "Keep it separate"', () => {
    const onChoose = vi.fn();
    render(<FirstRun detection={DETECTION} onChoose={onChoose} />);

    fireEvent.click(screen.getByRole("button", { name: "Keep it separate" }));

    expect(onChoose).toHaveBeenCalledWith("isolated");
  });

  it("does not render the detection card when pi was not found", () => {
    render(<FirstRun detection={{ found: false, dir: "/Users/dev/.pi/agent", hasAuth: false, hasModels: false }} onChoose={vi.fn()} />);

    expect(screen.queryByText("We found pi on this machine")).not.toBeInTheDocument();
  });
});
