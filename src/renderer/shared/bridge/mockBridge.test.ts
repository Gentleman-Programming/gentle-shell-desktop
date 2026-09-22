import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHAT_STATE, type ChatState } from "@shared/bridge-types";
import { mockBridge, resetMockBridge } from "./mockBridge";

function collectStates(): { states: ChatState[]; errors: string[] } {
  const states: ChatState[] = [];
  const errors: string[] = [];
  mockBridge.onState((state) => states.push(state));
  mockBridge.onError((message) => errors.push(message));
  return { states, errors };
}

describe("mockBridge", () => {
  // resetMockBridge (not just newChat()) so homeChoice, listener sets and
  // id counters never leak between tests — see its doc comment.
  beforeEach(() => {
    resetMockBridge();
  });

  // Ordered deliberately before the "needsChoice: true" test below: with
  // module state reset between tests (resetMockBridge in beforeEach), the
  // two must not depend on running in file order — a rerun with only this
  // test, or the suite in reverse, must see the same fresh homeChoice.
  it("chooseHome persists the choice: a later setupStatus() reports needsChoice: false", async () => {
    await mockBridge.chooseHome("link");

    const status = await mockBridge.setupStatus();

    expect(status.needsChoice).toBe(false);
  });

  it("setupStatus() starts with needsChoice: true and a fake pi detection, so the first-run screen is reachable in the browser preview", async () => {
    const status = await mockBridge.setupStatus();

    expect(status.needsChoice).toBe(true);
    expect(status.detection).toMatchObject({ found: true, hasAuth: true, hasModels: true });
  });

  it("lists two example chats plus one already-working chat", async () => {
    const chats = await mockBridge.listChats();

    expect(chats).toHaveLength(3);
    expect(chats.filter((chat) => chat.state === CHAT_STATE.WORKING)).toHaveLength(1);
  });

  it('opens a select dialog for a message containing "?"', async () => {
    const { states } = collectStates();

    await mockBridge.sendMessage("Which branch?");

    const withDialog = states.find((state) => state.pendingDialogs.length > 0);
    expect(withDialog?.pendingDialogs[0]).toMatchObject({ method: "select" });
    expect(withDialog?.working).toBe(true);
  });

  it('opens a confirm dialog for a message containing "delete"', async () => {
    const { states } = collectStates();

    await mockBridge.sendMessage("please delete the branch");

    const withDialog = states.find((state) => state.pendingDialogs.length > 0);
    expect(withDialog?.pendingDialogs[0]).toMatchObject({ method: "confirm" });
  });

  it('opens an input dialog for a message containing "name"', async () => {
    const { states } = collectStates();

    await mockBridge.sendMessage("what is your name");

    const withDialog = states.find((state) => state.pendingDialogs.length > 0);
    expect(withDialog?.pendingDialogs[0]).toMatchObject({ method: "input" });
  });

  it('surfaces an error through onError for a message containing "fail"', async () => {
    const { states, errors } = collectStates();

    await mockBridge.sendMessage("make this fail please");

    expect(errors).toHaveLength(1);
    expect(states.every((state) => state.pendingDialogs.length === 0)).toBe(true);
  });

  it("answering a dialog clears it and resolves back to not working", async () => {
    const { states } = collectStates();

    await mockBridge.sendMessage("Which branch?");
    const dialog = states.find((state) => state.pendingDialogs.length > 0)?.pendingDialogs[0];
    expect(dialog).toBeDefined();

    await mockBridge.answerDialog(dialog!.id, { value: "main" });

    const final = states.at(-1);
    expect(final?.pendingDialogs).toHaveLength(0);
    expect(final?.working).toBe(false);
  });

  it('resolves { queued: false, reason } instead of notifying onError while already working (report once)', async () => {
    const { errors } = collectStates();

    await mockBridge.sendMessage("Which branch?"); // opens a dialog, leaves working: true
    const result = await mockBridge.sendMessage("another message");

    expect(result).toEqual({ queued: false, reason: "Gentle is still working" });
    expect(errors).toHaveLength(0);
  });

  it("streams a plain reply word by word for an ordinary message", async () => {
    const { states } = collectStates();

    await mockBridge.sendMessage("hello Gentle");
    await vi.waitFor(() => expect(states.at(-1)?.working).toBe(false));

    expect(states.at(-1)?.messages.at(-1)?.text).toContain("hello Gentle");
  });
});
