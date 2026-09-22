import { MESSAGE_ROLE, type ChatMessage, type Dialog } from "@shared/bridge-types";
import type { AssistantMessageEvent, RpcEvent, RpcExtensionUIRequest, RpcMessage } from "./types";

export interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly working: boolean;
  readonly pendingDialogs: readonly Dialog[];
  readonly lastError?: string;
  /**
   * Bumped on every thinking/toolcall/tool_execution event. Messages never
   * change for these (no thinking or tool output is shown, per the M1
   * objective); the counter exists only so a later UI can show "something
   * is happening" without re-deriving it from the raw event stream.
   */
  readonly activity: number;
}

export const INITIAL_CHAT_STATE: ChatState = {
  messages: [],
  working: false,
  pendingDialogs: [],
  activity: 0,
};

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
 * because each open appends exactly one message).
 */
export function reduceChat(state: ChatState, event: RpcEvent): ChatState {
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
      return applyExtensionUIRequest(state, event);
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

function applyExtensionUIRequest(state: ChatState, event: RpcExtensionUIRequest): ChatState {
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
    default:
      // Fire-and-forget: notify, setStatus, setWidget, setTitle, set_editor_text.
      return state;
  }
}

function pushDialog(state: ChatState, dialog: Dialog): ChatState {
  return { ...state, pendingDialogs: [...state.pendingDialogs, dialog] };
}

function replaceAt<T>(items: readonly T[], index: number, value: T): T[] {
  const copy = items.slice();
  copy[index] = value;
  return copy;
}
