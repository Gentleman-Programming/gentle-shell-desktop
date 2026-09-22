import type {
  AssistantMessageEvent,
  DecodedLine,
  RpcCommand,
  RpcEvent,
  RpcExtensionUIRequest,
  RpcMessage,
  RpcResponse,
} from "./types";

/** One JSON command line, LF-terminated per rpc.md framing rules. */
export function encodeCommand(command: RpcCommand): string {
  return `${JSON.stringify(command)}\n`;
}

/**
 * Splits raw stdout/stderr chunks into complete lines. Mirrors rpc.md's
 * `attachJsonlReader` example: split on `\n` only (never Node `readline`,
 * which also splits on U+2028/U+2029 that are valid inside JSON strings),
 * and strip an optional trailing `\r` per line.
 */
export class LineSplitter {
  private buffer = "";

  /** Feed a chunk, get back every complete line it produced. */
  push(chunk: string): string[] {
    this.buffer += chunk;
    const lines: string[] = [];
    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      lines.push(stripTrailingCarriageReturn(this.buffer.slice(0, newlineIndex)));
      this.buffer = this.buffer.slice(newlineIndex + 1);
      newlineIndex = this.buffer.indexOf("\n");
    }
    return lines;
  }

  /** Flush whatever is left in the buffer (e.g. on stream end) as one final line, if non-empty. */
  flush(): string[] {
    if (this.buffer.length === 0) return [];
    const remainder = stripTrailingCarriageReturn(this.buffer);
    this.buffer = "";
    return [remainder];
  }
}

function stripTrailingCarriageReturn(line: string): string {
  return line.endsWith("\r") ? line.slice(0, -1) : line;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

/**
 * Decodes one JSONL line into a typed RpcEvent, or `{ kind: "unknown" }`
 * for a blank line, malformed JSON, or a syntactically valid event this
 * client does not model (see the scope note in types.ts). Never throws.
 */
export function decodeLine(line: string): DecodedLine {
  if (line.trim().length === 0) return { kind: "unknown", raw: line };

  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return { kind: "unknown", raw: line };
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") {
    return { kind: "unknown", raw: line };
  }

  const event = toRpcEvent(parsed);
  return event ?? { kind: "unknown", raw: line };
}

function toRpcEvent(parsed: Record<string, unknown>): RpcEvent | undefined {
  switch (parsed.type) {
    case "agent_start":
    case "agent_settled":
    case "turn_start":
    case "turn_end":
      return { type: parsed.type };
    case "agent_end":
      return { type: "agent_end", willRetry: typeof parsed.willRetry === "boolean" ? parsed.willRetry : undefined };
    case "message_start":
    case "message_end":
      return toMessageEvent(parsed.type, parsed.message);
    case "message_update":
      return toMessageUpdateEvent(parsed.assistantMessageEvent);
    case "tool_execution_start":
      return typeof parsed.toolCallId === "string" && typeof parsed.toolName === "string"
        ? { type: "tool_execution_start", toolCallId: parsed.toolCallId, toolName: parsed.toolName }
        : undefined;
    case "tool_execution_update":
      return typeof parsed.toolCallId === "string" && typeof parsed.toolName === "string"
        ? { type: "tool_execution_update", toolCallId: parsed.toolCallId, toolName: parsed.toolName }
        : undefined;
    case "tool_execution_end":
      return typeof parsed.toolCallId === "string" && typeof parsed.toolName === "string"
        ? {
            type: "tool_execution_end",
            toolCallId: parsed.toolCallId,
            toolName: parsed.toolName,
            isError: parsed.isError === true,
          }
        : undefined;
    case "extension_ui_request":
      return toExtensionUIRequest(parsed);
    case "extension_error":
      return typeof parsed.error === "string"
        ? {
            type: "extension_error",
            extensionPath: asString(parsed.extensionPath) ?? "",
            event: asString(parsed.event) ?? "",
            error: parsed.error,
          }
        : undefined;
    case "response":
      return toRpcResponse(parsed);
    default:
      return undefined;
  }
}

function toMessageEvent(
  type: "message_start" | "message_end",
  message: unknown,
): RpcEvent | undefined {
  if (!isRecord(message) || typeof message.role !== "string") return undefined;
  return { type, message: message as RpcMessage };
}

function toMessageUpdateEvent(assistantMessageEvent: unknown): RpcEvent | undefined {
  if (!isRecord(assistantMessageEvent) || typeof assistantMessageEvent.type !== "string") return undefined;
  return { type: "message_update", assistantMessageEvent: assistantMessageEvent as AssistantMessageEvent };
}

function toExtensionUIRequest(parsed: Record<string, unknown>): RpcExtensionUIRequest | undefined {
  if (typeof parsed.id !== "string" || typeof parsed.method !== "string") return undefined;
  const { id, method } = parsed;

  switch (method) {
    case "select":
      return typeof parsed.title === "string" && Array.isArray(parsed.options)
        ? {
            type: "extension_ui_request",
            id,
            method,
            title: parsed.title,
            options: parsed.options as string[],
            timeout: asNumber(parsed.timeout),
          }
        : undefined;
    case "confirm":
      return typeof parsed.title === "string" && typeof parsed.message === "string"
        ? {
            type: "extension_ui_request",
            id,
            method,
            title: parsed.title,
            message: parsed.message,
            timeout: asNumber(parsed.timeout),
          }
        : undefined;
    case "input":
      return typeof parsed.title === "string"
        ? {
            type: "extension_ui_request",
            id,
            method,
            title: parsed.title,
            placeholder: asString(parsed.placeholder),
            timeout: asNumber(parsed.timeout),
          }
        : undefined;
    case "editor":
      return typeof parsed.title === "string"
        ? { type: "extension_ui_request", id, method, title: parsed.title, prefill: asString(parsed.prefill) }
        : undefined;
    case "notify":
    case "setStatus":
    case "setWidget":
    case "setTitle":
    case "set_editor_text":
      return { type: "extension_ui_request", id, method, ...parsed };
    default:
      return undefined;
  }
}

function toRpcResponse(parsed: Record<string, unknown>): RpcResponse | undefined {
  if (typeof parsed.command !== "string" || typeof parsed.success !== "boolean") return undefined;
  const id = asString(parsed.id);

  if (parsed.success) {
    return { type: "response", id, command: parsed.command, success: true, data: parsed.data };
  }
  return typeof parsed.error === "string"
    ? { type: "response", id, command: parsed.command, success: false, error: parsed.error }
    : undefined;
}
