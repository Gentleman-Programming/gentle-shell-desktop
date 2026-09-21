import { expect, it } from "vitest";
import { createBridge } from "./bridge";

it("rejects rather than throwing synchronously", async () => {
  const bridge = createBridge();
  await expect(bridge.listChats()).rejects.toThrow("not implemented yet");
});
