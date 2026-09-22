import {
  HELPER_STATUS,
  MESSAGE_ROLE,
  type ChatMessage,
  type ChatState,
  type Dialog,
  type HelperTask,
  type HelpersActivity,
} from "@shared/bridge-types";
import { emptyHelpersActivity, parseHelpersActivity } from "./helpersActivity";
import type { AssistantMessageEvent, FireAndForgetMethod, RpcEvent, RpcExtensionUIRequest, RpcMessage } from "./types";

/** The fire-and-forget branch of RpcExtensionUIRequest (notify, setStatus, setWidget, setTitle, set_editor_text). */
type FireAndForgetUIRequest = Extract<RpcExtensionUIRequest, { readonly method: FireAndForgetMethod }>;

// ChatState itself now lives in @shared/bridge-types (T3: the renderer
// receives it directly through GentleBridge.onState/openChat/newChat).
// Re-exported here so existing call sites in this main-process domain
// (PiSession.ts, PiSession.test.ts) can keep importing it from the
// reducer without churn.
export type { ChatState };

export const INITIAL_CHAT_STATE: ChatState = {
  messages: [],
  working: false,
  pendingDialogs: [],
  activity: 0,
  helpers: emptyHelpersActivity(),
};

/** The one widgetKey gentle-agents publishes its per-chat helpers activity under (`gentle-agents.activity/v1`). */
const HELPERS_WIDGET_KEY = "gentle-agents";

const ACTIVITY_DELTA_TYPES: ReadonlySet<AssistantMessageEvent["type"]> = new Set([
  "thinking_start",
  "thinking_delta",
  "thinking_end",
  "toolcall_start",
  "toolcall_delta",
  "toolcall_end",
]);

/**
 * Folds one decoded RPC event into chat state. Pure: same inputs, same
 * output, no I/O, no id generation from Date.now()/crypto (message ids are
 * derived from `state.messages.length`, which is unique per open call
 * because each open appends exactly one message). The optional `now` is the
 * one exception: the caller (PiSession) supplies the wall-clock time as an
 * ISO string for the `setWidget` helpers-retention fallback below instead
 * of this file reading the clock itself.
 */
export function reduceChat(state: ChatState, event: RpcEvent, now?: string): ChatState {
  switch (event.type) {
    case "agent_start":
      return { ...state, working: true };
    case "agent_end":
    case "agent_settled":
      return { ...state, working: false };
    case "message_start":
      return openAssistantMessage(state, event.message);
    case "message_update":
      return applyAssistantMessageEvent(state, event.assistantMessageEvent);
    case "message_end":
      return closeAssistantMessage(state, event.message);
    case "tool_execution_start":
    case "tool_execution_update":
    case "tool_execution_end":
      return { ...state, activity: state.activity + 1 };
    case "extension_ui_request":
      return applyExtensionUIRequest(state, event, now);
    case "extension_error":
      return { ...state, lastError: event.error };
    // turn_start/turn_end and command-response envelopes carry nothing the
    // chat view needs; agent_start/agent_end/agent_settled already drive
    // `working`, and the assistant text is driven by message_*/text_* deltas.
    default:
      return state;
  }
}

function openAssistantMessage(state: ChatState, message: RpcMessage): ChatState {
  if (message.role !== "assistant") return state;

  const chatMessage: ChatMessage = {
    id: `msg-${state.messages.length}`,
    role: MESSAGE_ROLE.ASSISTANT,
    text: "",
    streaming: true,
  };
  return { ...state, messages: [...state.messages, chatMessage] };
}

function applyAssistantMessageEvent(state: ChatState, delta: AssistantMessageEvent): ChatState {
  if (delta.type === "text_delta") {
    return appendToLastAssistantMessage(state, delta.delta);
  }
  if (ACTIVITY_DELTA_TYPES.has(delta.type)) {
    return { ...state, activity: state.activity + 1 };
  }
  // text_start/text_end/thinking_start/thinking_end already covered above
  // (thinking_* bumps activity, text_* otherwise carries nothing new: the
  // running text is assembled from text_delta and finalized on message_end).
  return state;
}

function appendToLastAssistantMessage(state: ChatState, delta: string): ChatState {
  const lastIndex = state.messages.length - 1;
  const last = state.messages[lastIndex];
  if (!last || last.role !== MESSAGE_ROLE.ASSISTANT) return state;

  const updated: ChatMessage = { ...last, text: last.text + delta };
  return { ...state, messages: replaceAt(state.messages, lastIndex, updated) };
}

function closeAssistantMessage(state: ChatState, message: RpcMessage): ChatState {
  if (message.role !== "assistant") return state;

  const lastIndex = state.messages.length - 1;
  const last = state.messages[lastIndex];
  if (!last || last.role !== MESSAGE_ROLE.ASSISTANT) return state;

  // message_end.message is authoritative per rpc.md; resync from its text
  // content blocks when present, otherwise keep what text_delta accumulated.
  const authoritativeText = extractAssistantText(message) ?? last.text;
  const updated: ChatMessage = { ...last, text: authoritativeText, streaming: false };
  return { ...state, messages: replaceAt(state.messages, lastIndex, updated) };
}

function extractAssistantText(message: RpcMessage): string | undefined {
  const content = message.content;
  if (!Array.isArray(content)) return undefined;

  return content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join("");
}

function isTextBlock(value: unknown): value is { type: "text"; text: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).type === "text" &&
    typeof (value as Record<string, unknown>).text === "string"
  );
}

function applyExtensionUIRequest(state: ChatState, event: RpcExtensionUIRequest, now: string | undefined): ChatState {
  switch (event.method) {
    case "select":
      return pushDialog(state, { id: event.id, method: "select", title: event.title, options: event.options });
    case "confirm":
      return pushDialog(state, { id: event.id, method: "confirm", title: event.title, message: event.message });
    case "input":
      return pushDialog(state, {
        id: event.id,
        method: "input",
        title: event.title,
        placeholder: event.placeholder,
      });
    case "editor":
      return pushDialog(state, { id: event.id, method: "editor", title: event.title, prefill: event.prefill });
    case "setWidget":
      return applySetWidget(state, event, now);
    default:
      // Other fire-and-forget methods: notify, setStatus, setTitle, set_editor_text.
      return state;
  }
}

/**
 * `setWidget` is fire-and-forget on the wire like the other widget/status
 * methods, but the one gentle-agents publishes under `widgetKey:
 * "gentle-agents"` carries this chat's per-chat helpers activity (M2), so
 * it folds into `helpers` instead of being dropped. Any other widgetKey
 * (a different extension's own widget) is still ignored — never a global
 * list, per the M2 objective (the parent-child relation stays direct).
 */
function applySetWidget(state: ChatState, event: FireAndForgetUIRequest, now: string | undefined): ChatState {
  if (event.widgetKey !== HELPERS_WIDGET_KEY) return state;

  const widgetLines = Array.isArray(event.widgetLines) ? toStringArray(event.widgetLines) : undefined;
  const parsed = parseHelpersActivity(widgetLines);
  // undefined means "malformed frame": keep the previous helpers state
  // rather than clobbering it with nothing (see helpersActivity.ts).
  if (!parsed) return state;

  const helpers: HelpersActivity = { summary: parsed.summary, tasks: mergeHelperTasks(state.helpers.tasks, parsed.tasks, now) };
  return { ...state, helpers };
}

/**
 * gentle-pi keeps a task's record in its in-memory store only while it is
 * running; once it finishes the record moves to disk and the next
 * `gentle-agents.activity/v1` frame simply omits it (`summary.finished`
 * still counts it, but `tasks` no longer carries it). Without this merge
 * the Helpers tab would show the finished count going up while the task
 * itself vanishes from the list.
 *
 * - A task present in `nextTasks` always replaces its previous record
 *   outright (the frame is authoritative for anything it still reports).
 * - A task from `previousTasks` missing from `nextTasks` is retained with
 *   its last known record: `running`/`waiting`/`queued` is promoted to
 *   `done` with `endedAt` filled from `now` (only if it didn't already have
 *   one), and `failed`/`cancelled`/`done` is kept exactly as it was — a
 *   terminal status is never re-derived.
 */
function mergeHelperTasks(previousTasks: readonly HelperTask[], nextTasks: readonly HelperTask[], now: string | undefined): HelperTask[] {
  const nextIds = new Set(nextTasks.map((task) => task.id));
  const retained = previousTasks.filter((task) => !nextIds.has(task.id)).map((task) => retainDroppedTask(task, now));
  return orderHelperTasks([...nextTasks, ...retained]);
}

const NON_TERMINAL_HELPER_STATUSES: ReadonlySet<HelperTask["status"]> = new Set([
  HELPER_STATUS.RUNNING,
  HELPER_STATUS.WAITING,
  HELPER_STATUS.QUEUED,
]);

function retainDroppedTask(task: HelperTask, now: string | undefined): HelperTask {
  if (!NON_TERMINAL_HELPER_STATUSES.has(task.status)) return task;
  return { ...task, status: HELPER_STATUS.DONE, endedAt: task.endedAt ?? now };
}

/** running, then waiting, then queued, then finished (done/failed/cancelled) sorted by `endedAt` desc. */
function orderHelperTasks(tasks: readonly HelperTask[]): HelperTask[] {
  const running: HelperTask[] = [];
  const waiting: HelperTask[] = [];
  const queued: HelperTask[] = [];
  const finished: HelperTask[] = [];

  for (const task of tasks) {
    switch (task.status) {
      case HELPER_STATUS.RUNNING:
        running.push(task);
        break;
      case HELPER_STATUS.WAITING:
        waiting.push(task);
        break;
      case HELPER_STATUS.QUEUED:
        queued.push(task);
        break;
      default:
        finished.push(task);
    }
  }

  finished.sort(compareEndedAtDesc);
  return [...running, ...waiting, ...queued, ...finished];
}

function compareEndedAtDesc(a: HelperTask, b: HelperTask): number {
  const aEnded = a.endedAt ?? "";
  const bEnded = b.endedAt ?? "";
  if (aEnded === bEnded) return 0;
  return aEnded > bEnded ? -1 : 1;
}

function toStringArray(value: readonly unknown[]): readonly string[] {
  return value.filter((item): item is string => typeof item === "string");
}

function pushDialog(state: ChatState, dialog: Dialog): ChatState {
  return { ...state, pendingDialogs: [...state.pendingDialogs, dialog] };
}

function replaceAt<T>(items: readonly T[], index: number, value: T): T[] {
  const copy = items.slice();
  copy[index] = value;
  return copy;
}
