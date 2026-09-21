// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GentleBridge, PiDetection, SetupStatus } from "@shared/bridge-types";
import { FirstRunContainer } from "./FirstRunContainer";

const DETECTION: PiDetection = { found: true, dir: "/Users/dev/.pi/agent", hasAuth: true, hasModels: false };

function makeBridge(overrides: Partial<GentleBridge> = {}): GentleBridge {
  const status: SetupStatus = { needsChoice: true, detection: DETECTION };
  return {
    listChats: vi.fn(),
    openChat: vi.fn(),
    newChat: vi.fn(),
    sendMessage: vi.fn(),
    abort: vi.fn(),
    answerDialog: vi.fn(),
    onState: vi.fn().mockReturnValue(() => {}),
    onError: vi.fn().mockReturnValue(() => {}),
    setupStatus: vi.fn().mockResolvedValue(status),
    chooseHome: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("FirstRunContainer", () => {
  it("calls bridge.setupStatus() and passes its detection through to FirstRun", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;

    render(<FirstRunContainer onDone={vi.fn()} />);

    expect(await screen.findByText("/Users/dev/.pi/agent")).toBeInTheDocument();
    expect(bridge.setupStatus).toHaveBeenCalled();
  });

  it("choosing a home calls bridge.chooseHome(mode) and then onDone()", async () => {
    const bridge = makeBridge();
    window.gentle = bridge;
    const onDone = vi.fn();

    render(<FirstRunContainer onDone={onDone} />);

    const button = await screen.findByRole("button", { name: "Use my pi setup" });
    button.click();

    await vi.waitFor(() => expect(bridge.chooseHome).toHaveBeenCalledWith("link"));
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it("shows a visible error and a Retry button when chooseHome rejects, instead of leaving the screen looking stuck", async () => {
    const chooseHome = vi.fn().mockRejectedValueOnce(new Error("disk full"));
    const bridge = makeBridge({ chooseHome });
    window.gentle = bridge;
    const onDone = vi.fn();

    render(<FirstRunContainer onDone={onDone} />);

    const button = await screen.findByRole("button", { name: "Use my pi setup" });
    button.click();

    expect(await screen.findByText("Could not save your choice: disk full")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("Retry re-attempts the same mode, and a successful retry clears the error and calls onDone()", async () => {
    const chooseHome = vi.fn().mockRejectedValueOnce(new Error("disk full")).mockResolvedValueOnce(undefined);
    const bridge = makeBridge({ chooseHome });
    window.gentle = bridge;
    const onDone = vi.fn();

    render(<FirstRunContainer onDone={onDone} />);

    const button = await screen.findByRole("button", { name: "Use my pi setup" });
    button.click();
    await screen.findByText("Could not save your choice: disk full");

    const retry = screen.getByRole("button", { name: "Retry" });
    retry.click();

    await vi.waitFor(() => expect(chooseHome).toHaveBeenCalledTimes(2));
    expect(chooseHome).toHaveBeenNthCalledWith(2, "link");
    await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(screen.queryByText("Could not save your choice: disk full")).not.toBeInTheDocument();
  });
});
