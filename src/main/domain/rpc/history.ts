import { MESSAGE_ROLE, type ChatMessage } from "@shared/bridge-types";
import type { RpcMessage } from "./types";

/**
 * Converts a `get_messages` response's `data.messages` (pi's `AgentMessage[]`
 * on the wire — `UserMessage | AssistantMessage | ToolResultMessage | ...`,
 * decoded here defensively as `RpcMessage` like the rest of this file, per
 * the "do not over-model" scope note in chatReducer.ts) into the
 * `ChatMessage[]` the renderer's thread already understands.
 *
 * - `user`: keeps `content` as-is when it is a plain string, or the joined
 *   `text` of its `{ type: "text", text }` content parts when it is an
 *   array (image parts are skipped).
 * - `assistant`: joins the `text` of its `{ type: "text", text }` content
 *   parts only — `thinking` and `toolCall` parts never render in the
 *   M1/M2 thread (see the desktop-m1-chat-core objective: "No tool output,
 *   no thinking shown").
 * - `toolResult` and any other role: skipped entirely.
 *
 * ids are `msg-<index>`, assigned by POSITION IN THE RETURNED ARRAY (not
 * the raw index into `messages`, since a skipped entry never occupies a
 * slot) so they stay consistent with chatReducer's own
 * `msg-${state.messages.length}` scheme: seeding a chat's history with N
 * `ChatMessage`s first means the next live message the reducer appends
 * gets `msg-${N}`, continuing the same sequence with no collision or gap.
 */
export function historyToMessages(messages: readonly RpcMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (const message of messages) {
    const chatMessage = toChatMessage(message, result.length);
    if (chatMessage) result.push(chatMessage);
  }
  return result;
}

function toChatMessage(message: RpcMessage, index: number): ChatMessage | undefined {
  if (message.role === MESSAGE_ROLE.USER) {
    return { id: `msg-${index}`, role: MESSAGE_ROLE.USER, text: extractText(message) };
  }
  if (message.role === MESSAGE_ROLE.ASSISTANT) {
    const text = extractText(message);
    // An assistant message whose content was only thinking/toolCall parts
    // (or whitespace-only text) has nothing left to show once those parts
    // are filtered out above: skip it like a toolResult, instead of
    // rendering an empty bubble. `result.length` in historyToMessages still
    // assigns the next id, so this never leaves a gap.
    if (text.trim().length === 0) return undefined;
    return { id: `msg-${index}`, role: MESSAGE_ROLE.ASSISTANT, text, streaming: false };
  }
  return undefined;
}

/** Plain string content is kept as-is; array content keeps only `text` parts, joined. */
function extractText(message: RpcMessage): string {
  const content = message.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter(isTextBlock).map((block) => block.text).join("");
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

/**
 * Safely pulls `data.messages` off a `get_messages` response's `data`
 * (typed `unknown` in `RpcResponse`). Tolerant like the rest of this
 * codec/domain layer: malformed or missing data decodes to an empty array
 * instead of throwing, and entries without a string `role` are dropped.
 */
export function extractHistoryMessages(data: unknown): readonly RpcMessage[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return [];
  const messages = (data as Record<string, unknown>).messages;
  if (!Array.isArray(messages)) return [];
  return messages.filter(isRpcMessage);
}

function isRpcMessage(value: unknown): value is RpcMessage {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as Record<string, unknown>).role === "string";
}
