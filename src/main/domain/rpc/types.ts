/**
 * Pure protocol types for pi's `--mode rpc` JSON-line protocol. No Node or
 * Electron imports: this file, codec.ts and chatReducer.ts must stay
 * testable without spawning a real gentle-shell process (hexagonal main
 * process, see src/README.md).
 *
 * Mirrors the authoritative shapes in the local pi checkout:
 * - packages/coding-agent/docs/rpc.md (wire examples, extension UI protocol)
 * - packages/coding-agent/src/modes/rpc/rpc-types.ts (RpcCommand,
 *   RpcExtensionUIRequest/Response)
 * - packages/agent/src/types.ts (AgentEvent) and
 *   packages/coding-agent/src/modes/json-event.ts (the RPC-mode-specific
 *   `message_update` shape, which strips the cumulative `message` field and
 *   the `partial` snapshot that the core AgentEvent still carries)
 *
 * Only the commands/events the desktop chat window needs are modeled here.
 * Everything else (bash_execution_update, queue_update, compaction_*,
 * auto_retry_*, summarization_retry_*, and any command outside the ones
 * below) decodes to `{ kind: "unknown" }` in codec.ts rather than being
 * typed — this client never sends bash or compaction commands in M1.
 */

// ---------------------------------------------------------------------------
// Commands (stdin)
// ---------------------------------------------------------------------------

export type RpcCommand =
  | { readonly type: "prompt"; readonly message: string }
  | { readonly type: "abort" }
  | { readonly type: "new_session" }
  | { readonly type: "switch_session"; readonly sessionPath: string }
  | { readonly type: "get_state" }
  | { readonly type: "get_messages" }
  | RpcExtensionUIResponse;

/**
 * Mirrors rpc-types.ts `RpcExtensionUIResponse` exactly: `confirm` dialogs
 * reply with `confirmed` (boolean), `select`/`input`/`editor` reply with
 * `value` (string), and any dialog can be dismissed with `cancelled: true`.
 * (The task brief shorthanded this as `{id, value|cancelled}`; the
 * authoritative rpc-types.ts has a third `confirmed` variant, which this
 * type follows so a future `confirm` dialog can be answered correctly.)
 */
export type RpcExtensionUIResponse =
  | { readonly type: "extension_ui_response"; readonly id: string; readonly value: string }
  | { readonly type: "extension_ui_response"; readonly id: string; readonly confirmed: boolean }
  | { readonly type: "extension_ui_response"; readonly id: string; readonly cancelled: true };

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * An `AgentMessage` (UserMessage | AssistantMessage | ToolResultMessage |
 * BashExecutionMessage). Only `role` is modeled; the chat reducer reads
 * `content` off assistant messages defensively at the call site instead of
 * fully typing every message variant, per the "do not over-model" scope.
 */
export interface RpcMessage {
  readonly role: string;
  readonly [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// message_update deltas (`assistantMessageEvent`), RPC-mode shape: `partial`
// is always stripped, and `toolcall_start` carries `id`/`toolName` instead
// (see json-event.ts `toJsonAssistantMessageEvent`).
// ---------------------------------------------------------------------------

export type AssistantMessageEvent =
  | { readonly type: "text_start"; readonly contentIndex: number }
  | { readonly type: "text_delta"; readonly contentIndex: number; readonly delta: string }
  | { readonly type: "text_end"; readonly contentIndex: number; readonly content: string }
  | { readonly type: "thinking_start"; readonly contentIndex: number }
  | { readonly type: "thinking_delta"; readonly contentIndex: number; readonly delta: string }
  | { readonly type: "thinking_end"; readonly contentIndex: number; readonly content: string }
  | {
      readonly type: "toolcall_start";
      readonly contentIndex: number;
      readonly id: string;
      readonly toolName: string;
    }
  | { readonly type: "toolcall_delta"; readonly contentIndex: number; readonly delta: string }
  | { readonly type: "toolcall_end"; readonly contentIndex: number; readonly toolCall: unknown };

// ---------------------------------------------------------------------------
// Extension UI requests (stdout). Dialog methods (select, confirm, input,
// editor) block for a response; the rest are fire-and-forget.
// ---------------------------------------------------------------------------

export type DialogMethod = "select" | "confirm" | "input" | "editor";
export type FireAndForgetMethod = "notify" | "setStatus" | "setWidget" | "setTitle" | "set_editor_text";

export type RpcExtensionUIRequest =
  | {
      readonly type: "extension_ui_request";
      readonly id: string;
      readonly method: "select";
      readonly title: string;
      readonly options: readonly string[];
      readonly timeout?: number;
    }
  | {
      readonly type: "extension_ui_request";
      readonly id: string;
      readonly method: "confirm";
      readonly title: string;
      readonly message: string;
      readonly timeout?: number;
    }
  | {
      readonly type: "extension_ui_request";
      readonly id: string;
      readonly method: "input";
      readonly title: string;
      readonly placeholder?: string;
      readonly timeout?: number;
    }
  | {
      readonly type: "extension_ui_request";
      readonly id: string;
      readonly method: "editor";
      readonly title: string;
      readonly prefill?: string;
    }
  | {
      readonly type: "extension_ui_request";
      readonly id: string;
      readonly method: FireAndForgetMethod;
      readonly [key: string]: unknown;
    };

// ---------------------------------------------------------------------------
// Events (stdout)
// ---------------------------------------------------------------------------

export type RpcEvent =
  | { readonly type: "agent_start" }
  | { readonly type: "agent_end"; readonly willRetry?: boolean }
  | { readonly type: "agent_settled" }
  | { readonly type: "turn_start" }
  | { readonly type: "turn_end" }
  | { readonly type: "message_start"; readonly message: RpcMessage }
  | { readonly type: "message_update"; readonly assistantMessageEvent: AssistantMessageEvent }
  | { readonly type: "message_end"; readonly message: RpcMessage }
  | { readonly type: "tool_execution_start"; readonly toolCallId: string; readonly toolName: string }
  | { readonly type: "tool_execution_update"; readonly toolCallId: string; readonly toolName: string }
  | {
      readonly type: "tool_execution_end";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly isError: boolean;
    }
  | RpcExtensionUIRequest
  | { readonly type: "extension_error"; readonly extensionPath: string; readonly event: string; readonly error: string }
  | RpcResponse;

/** Command acknowledgement envelope. The chat reducer does not act on it
 * today (M1 never correlates a command to its response), but the codec
 * still decodes it instead of falling back to `unknown` so nothing on the
 * wire silently vanishes from view. */
export type RpcResponse =
  | {
      readonly type: "response";
      readonly id?: string;
      readonly command: string;
      readonly success: true;
      readonly data?: unknown;
    }
  | { readonly type: "response"; readonly id?: string; readonly command: string; readonly success: false; readonly error: string };

export type DecodedLine = RpcEvent | { readonly kind: "unknown"; readonly raw: string };
