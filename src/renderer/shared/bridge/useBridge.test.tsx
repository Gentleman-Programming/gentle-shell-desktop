// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { GentleBridge } from "@shared/bridge-types";
import { mockBridge } from "./mockBridge";
import { useBridge } from "./useBridge";

describe("useBridge", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "gentle");
  });

  it("returns the in-memory mock bridge when window.gentle is undefined", () => {
    const { result } = renderHook(() => useBridge());

    expect(result.current).toBe(mockBridge);
  });

  it("returns window.gentle when the preload bridge is defined", () => {
    const realBridge: GentleBridge = {
      listChats: vi.fn(),
      openChat: vi.fn(),
      newChat: vi.fn(),
      sendMessage: vi.fn(),
      abort: vi.fn(),
      answerDialog: vi.fn(),
      onState: vi.fn(),
      onError: vi.fn(),
      setupStatus: vi.fn(),
      chooseHome: vi.fn(),
    };
    window.gentle = realBridge;

    const { result } = renderHook(() => useBridge());

    expect(result.current).toBe(realBridge);
  });
});
