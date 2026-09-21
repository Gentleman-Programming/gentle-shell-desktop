import { describe, expect, it, vi } from "vitest";
import { boundedStop } from "./boundedStop";

describe("boundedStop", () => {
  it("resolves as soon as stop() resolves, well under the timeout", async () => {
    vi.useFakeTimers();
    try {
      let resolved = false;
      const stop = () => Promise.resolve().then(() => undefined);

      const settled = boundedStop(stop, 4000).then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(0);
      await settled;

      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives up and resolves once the timeout elapses when stop() never settles", async () => {
    vi.useFakeTimers();
    try {
      let resolved = false;
      const stop = () => new Promise<void>(() => undefined); // never settles

      const settled = boundedStop(stop, 4000).then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(3999);
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      await settled;

      expect(resolved).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
