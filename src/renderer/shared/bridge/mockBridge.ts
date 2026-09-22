import {
  CHAT_STATE,
  HELPER_STATUS,
  MESSAGE_ROLE,
  type ChatMessage,
  type ChatState,
  type ChatSummary,
  type Dialog,
  type DialogAnswer,
  type GentleBridge,
  type HelperTask,
  type HelperThread,
  type HelperThreadItem,
  type HelperThreadToolItem,
  type HelpersActivity,
  type HelpersSummary,
  type HomeMode,
  type PiDetection,
  type PromptResult,
  type SetupStatus,
} from "@shared/bridge-types";

/**
 * In-memory stand-in for the real preload bridge. useBridge() returns this
 * whenever window.gentle is undefined, which is always true outside
 * Electron — in particular under `pnpm dev:web`, the plain browser preview
 * the maintainer drives with automation. It fakes enough of pi's behaviour
 * to exercise the whole T4 UI without a real pi process: a streamed echo
 * reply, and three keyword-triggered scenarios so every dialog method and
 * the status line are reachable from the preview:
 *   - a message containing "?"      -> a `select` dialog
 *   - a message containing "delete" -> a `confirm` dialog
 *   - a message containing "name"   -> an `input` dialog
 *   - a message containing "fail"   -> an onError push, no reply
 *
 * T3 rewired this from T1's streamed-callback shape to the finalized
 * bridge: a single module-level ChatState that openChat/newChat reset and
 * sendMessage/abort/answerDialog mutate, pushed to subscribers through
 * onState — mirroring how the real ChatHost/PiSession only ever track one
 * "current" chat in M1.
 */
const EXAMPLE_CHATS: ChatSummary[] = [
  {
    id: "chat-readme",
    title: "Write the README intro",
    cwd: "/Users/dev/gentle-shell-desktop",
    updatedAt: "2026-09-21T09:15:00.000Z",
    messageCount: 4,
    state: CHAT_STATE.IDLE,
  },
  {
    id: "chat-refactor",
    title: "Refactor the session store",
    cwd: "/Users/dev/pi",
    updatedAt: "2026-09-21T10:40:00.000Z",
    messageCount: 12,
    state: CHAT_STATE.NEEDS_YOU,
  },
  {
    id: "chat-migration",
    title: "Migrate the config schema",
    cwd: "/Users/dev/pi",
    updatedAt: "2026-09-21T11:05:00.000Z",
    messageCount: 7,
    state: CHAT_STATE.WORKING,
  },
];

const STREAM_DELAY_MS = 40;

/** Fake "we found pi on this machine" detection (T5), so the first-run
 * screen's detection card is reachable in the browser preview without a
 * real pi install. */
const FAKE_DETECTION: PiDetection = {
  found: true,
  dir: "/Users/dev/.pi/agent",
  hasAuth: true,
  hasModels: true,
};

/** The persisted home choice, mirroring appConfigStore/setupService (T5):
 * undefined means "no choice yet", so setupStatus() reports needsChoice
 * until chooseHome() is called. */
let homeChoice: HomeMode | undefined;

/**
 * `?firstRun=0`/`?firstRun=1` in the preview URL force-skips or
 * force-shows the first-run screen regardless of the persisted choice
 * above, so it can be exercised (or gotten out of the way) on demand
 * under `pnpm dev:web`. Guarded for `typeof window === "undefined"`:
 * this module's own unit tests run under vitest's Node environment,
 * which has no `window`.
 */
function firstRunOverride(): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  const flag = new URLSearchParams(window.location.search).get("firstRun");
  if (flag === "0") return false;
  if (flag === "1") return true;
  return undefined;
}

function emptyState(): ChatState {
  // D4 (a "working" chat with three helpers, browser-verified) fills this
  // in later; for now the mock bridge just needs a compiling, empty
  // HelpersActivity so it keeps matching the real ChatState shape.
  return { messages: [], working: false, pendingDialogs: [], activity: 0, helpers: { summary: { running: 0, queued: 0, waiting: 0, finished: 0 }, tasks: [] } };
}

let currentState: ChatState = emptyState();
let nextMessageId = 0;
let nextDialogId = 0;

const stateListeners = new Set<(state: ChatState) => void>();
const errorListeners = new Set<(message: string) => void>();

/**
 * Resets every module-level mutable field mockBridge keeps (T6 follow-up).
 * mockBridge.test.ts calls this in `beforeEach` instead of just
 * `newChat()`: `newChat()` alone only resets `currentState`, leaving
 * `homeChoice` (and the accumulating listener sets/id counters) persisted
 * across tests — a test asserting `setupStatus().needsChoice` would then
 * silently depend on whether an earlier test already called chooseHome().
 * Exported (not automatic) because only tests need it: the browser preview
 * this module backs never wants its own state wiped mid-session.
 */
export function resetMockBridge(): void {
  helpersScenarioToken += 1; // invalidate any in-flight D4 growth loop
  homeChoice = undefined;
  currentState = emptyState();
  nextMessageId = 0;
  nextDialogId = 0;
  stateListeners.clear();
  errorListeners.clear();
}

function setState(state: ChatState): void {
  currentState = state;
  for (const listener of stateListeners) listener(state);
}

function makeMessage(role: ChatMessage["role"], text: string, streaming = false): ChatMessage {
  nextMessageId += 1;
  return { id: `mock-${nextMessageId}`, role, text, streaming };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function streamReply(userText: string): Promise<void> {
  const reply = `Got it — you said: "${userText}". This is a mock reply for the browser preview.`;
  const words = reply.split(" ");
  const assistantMessage = makeMessage(MESSAGE_ROLE.ASSISTANT, "", true);

  setState({ ...currentState, working: true, messages: [...currentState.messages, assistantMessage] });

  let text = "";
  for (const [index, word] of words.entries()) {
    await delay(STREAM_DELAY_MS);
    text += index === 0 ? word : ` ${word}`;
    setState({
      ...currentState,
      messages: currentState.messages.map((message) => (message.id === assistantMessage.id ? { ...message, text } : message)),
    });
  }

  setState({
    ...currentState,
    working: false,
    messages: currentState.messages.map((message) =>
      message.id === assistantMessage.id ? { ...message, streaming: false } : message,
    ),
  });
}

function makeDialogForKeyword(text: string): Dialog | undefined {
  const lower = text.toLowerCase();
  nextDialogId += 1;
  const id = `mock-dialog-${nextDialogId}`;

  if (lower.includes("delete")) {
    return { id, method: "confirm", title: "Confirm this action?", message: text };
  }
  if (lower.includes("name")) {
    return { id, method: "input", title: "Gentle needs a bit more info", placeholder: "Type an answer…" };
  }
  if (lower.includes("?")) {
    return { id, method: "select", title: "Gentle needs a bit more info", options: ["Option A", "Option B", "Option C"] };
  }
  nextDialogId -= 1;
  return undefined;
}

async function openDialog(text: string): Promise<void> {
  const dialog = makeDialogForKeyword(text);
  if (!dialog) return;

  await delay(STREAM_DELAY_MS);
  setState({ ...currentState, working: true, pendingDialogs: [...currentState.pendingDialogs, dialog] });
}

async function failReply(): Promise<void> {
  await delay(STREAM_DELAY_MS);
  for (const listener of errorListeners) listener("Mock error: pretend this failed for the browser preview.");
}

function describeAnswer(answer: DialogAnswer): string {
  if ("cancelled" in answer) return "Cancelled.";
  if ("confirmed" in answer) return answer.confirmed ? "Confirmed." : "Declined.";
  return `Got it: "${answer.value}".`;
}

/**
 * D4: seeds "chat-migration" (the one EXAMPLE_CHATS chat marked WORKING)
 * with helpers so the Helpers tab is reachable under `pnpm dev:web`
 * without a real gentle-agents process — a running helper with a thread
 * that grows every ~800ms (text -> thinking -> tool running -> tool done ->
 * text, repeated), a waiting helper, a done one, and two helpers already
 * finished days ago (so the "Earlier" group — see format.ts's
 * partitionHelpers, maintainer decision 2026-09-22 — has something to
 * show in the preview). Only chat-migration gets a scenario: every other
 * chat's helpers stay empty, matching emptyState().
 */
const RUNNING_TASK_ID = "mock-helper-running";
const WAITING_TASK_ID = "mock-helper-waiting";
const DONE_TASK_ID = "mock-helper-done";
const EARLIER_DONE_TASK_ID = "mock-helper-earlier-done";
const EARLIER_FAILED_TASK_ID = "mock-helper-earlier-failed";
const HELPERS_STEP_DELAY_MS = 800;
const HELPERS_SCENARIO_CYCLES = 3;

function makeHelperTask(fields: Pick<HelperTask, "id" | "agent" | "label" | "prompt" | "status"> & Partial<HelperTask>): HelperTask {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    turns: 0,
    toolCalls: 0,
    thread: { version: 0, dropped: 0, items: [] },
    ...fields,
  };
}

function helpersSummaryFor(tasks: readonly HelperTask[]): HelpersSummary {
  return {
    running: tasks.filter((task) => task.status === HELPER_STATUS.RUNNING).length,
    queued: tasks.filter((task) => task.status === HELPER_STATUS.QUEUED).length,
    waiting: tasks.filter((task) => task.status === HELPER_STATUS.WAITING).length,
    finished: tasks.filter((task) => task.status === HELPER_STATUS.DONE || task.status === HELPER_STATUS.FAILED || task.status === HELPER_STATUS.CANCELLED)
      .length,
  };
}

function appendThreadItem(thread: HelperThread, item: HelperThreadItem): HelperThread {
  return { ...thread, items: [...thread.items, item] };
}

function updateLastToolItem(thread: HelperThread, patch: Partial<HelperThreadToolItem>): HelperThread {
  const lastToolIndex = thread.items.map((item) => item.kind).lastIndexOf("tool");
  if (lastToolIndex === -1) return thread;

  const items = thread.items.slice();
  items[lastToolIndex] = { ...(items[lastToolIndex] as HelperThreadToolItem), ...patch };
  return { ...thread, items };
}

const TOOL_STEPS: ReadonlyArray<{ readonly name: string; readonly args: Record<string, unknown> }> = [
  { name: "Read", args: { paths: ["src/config/schema.ts", "src/config/loader.ts", "src/config/defaults.ts"] } },
  { name: "Edit", args: { path: "src/config/schema.ts" } },
];

/** One step per ~800ms tick of the running helper's thread: a fixed script (not an infinite loop) so the mock never grows unbounded memory. */
const RUNNING_TASK_STEPS: ReadonlyArray<(thread: HelperThread, callId: string) => HelperThread> = [
  (thread) => appendThreadItem(thread, { kind: "text", text: "Migrating the config schema to the new shape." }),
  (thread) => appendThreadItem(thread, { kind: "thinking", text: "Checking which fields moved before touching the loader." }),
  (thread, callId) => {
    const step = TOOL_STEPS[thread.items.filter((item) => item.kind === "tool").length % TOOL_STEPS.length]!;
    return appendThreadItem(thread, { kind: "tool", callId, name: step.name, args: step.args, running: true });
  },
  (thread) => updateLastToolItem(thread, { running: false, output: "done" }),
  (thread) => appendThreadItem(thread, { kind: "text", text: "Schema fields migrated, updating the loader next." }),
];

let helpersScenarioToken = 0;

function updateRunningHelperThread(step: (thread: HelperThread, callId: string) => HelperThread, callId: string): void {
  const tasks = currentState.helpers.tasks.map((task) =>
    task.id === RUNNING_TASK_ID ? { ...task, thread: step(task.thread, callId), lastActivityAt: new Date().toISOString() } : task,
  );
  if (tasks === currentState.helpers.tasks) return; // the running task already left this chat (switched away)
  setState({ ...currentState, helpers: { ...currentState.helpers, tasks } });
}

async function runHelpersScenario(token: number): Promise<void> {
  let stepId = 0;
  for (let cycle = 0; cycle < HELPERS_SCENARIO_CYCLES; cycle += 1) {
    for (const step of RUNNING_TASK_STEPS) {
      await delay(HELPERS_STEP_DELAY_MS);
      if (token !== helpersScenarioToken) return;
      stepId += 1;
      updateRunningHelperThread(step, `mock-call-${stepId}`);
    }
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startHelpersScenario(): void {
  helpersScenarioToken += 1;
  const token = helpersScenarioToken;
  const now = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * DAY_MS).toISOString();
  const oneDayAgo = new Date(Date.now() - DAY_MS).toISOString();

  const tasks: HelperTask[] = [
    makeHelperTask({
      id: RUNNING_TASK_ID,
      agent: "general-purpose",
      label: "Migrate the config schema",
      prompt: "Move the deprecated config fields to their new location and update the loader.",
      status: HELPER_STATUS.RUNNING,
      createdAt: now,
      startedAt: now,
      turns: 1,
    }),
    makeHelperTask({
      id: WAITING_TASK_ID,
      agent: "general-purpose",
      label: "Confirm the breaking change",
      prompt: "Ask whether removing the old field name is acceptable.",
      status: HELPER_STATUS.WAITING,
      createdAt: now,
      startedAt: now,
      turns: 1,
      thread: {
        version: 0,
        dropped: 0,
        items: [
          { kind: "text", text: "Ready to drop the old `configPath` field — confirm?" },
          { kind: "note", text: "Waiting on your answer." },
        ],
      },
    }),
    makeHelperTask({
      id: DONE_TASK_ID,
      agent: "general-purpose",
      label: "Audit config readers",
      prompt: "Find every place that reads the config file directly.",
      status: HELPER_STATUS.DONE,
      createdAt: now,
      startedAt: now,
      endedAt: now,
      turns: 3,
      toolCalls: 1,
      thread: {
        version: 0,
        dropped: 0,
        items: [
          { kind: "text", text: "Auditing config readers across the codebase." },
          { kind: "tool", callId: "mock-call-audit-1", name: "Grep", args: { pattern: "readConfig" }, running: false, output: "3 matches" },
          { kind: "text", text: "Found 3 call sites, all already using the loader — no direct file reads left." },
        ],
      },
    }),
    makeHelperTask({
      id: EARLIER_DONE_TASK_ID,
      agent: "general-purpose",
      label: "Draft the migration plan",
      prompt: "Write up the plan for migrating the config schema.",
      status: HELPER_STATUS.DONE,
      createdAt: twoDaysAgo,
      startedAt: twoDaysAgo,
      endedAt: twoDaysAgo,
      turns: 2,
      toolCalls: 1,
      thread: {
        version: 0,
        dropped: 0,
        items: [{ kind: "text", text: "Drafted the migration plan for the deprecated config fields." }],
      },
    }),
    makeHelperTask({
      id: EARLIER_FAILED_TASK_ID,
      agent: "general-purpose",
      label: "Check the staging deploy",
      prompt: "Verify the staging deploy picked up the schema change.",
      status: HELPER_STATUS.FAILED,
      createdAt: oneDayAgo,
      startedAt: oneDayAgo,
      endedAt: oneDayAgo,
      turns: 1,
      toolCalls: 1,
      error: "Staging deploy webhook timed out.",
      thread: {
        version: 0,
        dropped: 0,
        items: [{ kind: "text", text: "Checking the staging deploy for the schema change." }],
      },
    }),
  ];

  const helpers: HelpersActivity = { summary: helpersSummaryFor(tasks), tasks };
  setState({ ...currentState, helpers });
  void runHelpersScenario(token);
}

export const mockBridge: GentleBridge = {
  async listChats(): Promise<ChatSummary[]> {
    return EXAMPLE_CHATS;
  },

  async openChat(id: string): Promise<ChatState> {
    helpersScenarioToken += 1; // invalidate any growth loop from a previously open chat
    setState(emptyState());
    if (id === "chat-migration") startHelpersScenario();
    return currentState;
  },

  async newChat(): Promise<ChatState> {
    helpersScenarioToken += 1;
    setState(emptyState());
    return currentState;
  },

  async sendMessage(text: string): Promise<PromptResult> {
    // Mirrors the real ChatHost/PiSession contract (T5): a declined prompt
    // resolves { queued: false, reason } instead of notifying onError, so
    // the caller reports it exactly once.
    if (currentState.working) {
      return { queued: false, reason: "Gentle is still working" };
    }

    const userMessage = makeMessage(MESSAGE_ROLE.USER, text);
    setState({ ...currentState, messages: [...currentState.messages, userMessage] });

    // Dialog and error scenarios await their own (short) delay before
    // resolving, so callers observing the resolved state right after
    // `await sendMessage(...)` already see the pushed dialog/error;
    // streamReply is intentionally fire-and-forget instead — its "working"
    // state and streamed text should render immediately, not after the
    // whole multi-word reply finishes.
    const lower = text.toLowerCase();
    if (lower.includes("fail")) {
      await failReply();
      return { queued: true };
    }
    if (lower.includes("delete") || lower.includes("name") || lower.includes("?")) {
      await openDialog(text);
      return { queued: true };
    }
    void streamReply(text);
    return { queued: true };
  },

  async abort(): Promise<void> {
    setState({ ...currentState, working: false });
  },

  async answerDialog(id: string, answer: DialogAnswer): Promise<void> {
    const remaining = currentState.pendingDialogs.filter((dialog) => dialog.id !== id);
    const acknowledgement = makeMessage(MESSAGE_ROLE.ASSISTANT, describeAnswer(answer));

    setState({
      ...currentState,
      pendingDialogs: remaining,
      working: remaining.length > 0,
      messages: [...currentState.messages, acknowledgement],
    });
  },

  onState(callback: (state: ChatState) => void): () => void {
    stateListeners.add(callback);
    return () => stateListeners.delete(callback);
  },

  onError(callback: (message: string) => void): () => void {
    errorListeners.add(callback);
    return () => errorListeners.delete(callback);
  },

  async setupStatus(): Promise<SetupStatus> {
    const override = firstRunOverride();
    const needsChoice = override ?? homeChoice === undefined;
    return { needsChoice, detection: FAKE_DETECTION };
  },

  async chooseHome(mode: HomeMode): Promise<void> {
    homeChoice = mode;
  },
};
