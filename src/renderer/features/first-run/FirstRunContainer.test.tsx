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
});
