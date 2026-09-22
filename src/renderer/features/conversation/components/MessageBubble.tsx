import { MESSAGE_ROLE, type ChatMessage } from "@shared/bridge-types";
import "./MessageBubble.css";

export interface MessageBubbleProps {
  readonly message: ChatMessage;
}

// Presentational only. Plain-text rendering only — the "no tool output, no
// thinking shown" filtering happens in T2's reducer before a message ever
// reaches this component.
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === MESSAGE_ROLE.USER;

  return (
    <div className={`gc-message gc-message--${isUser ? "user" : "assistant"}`}>
      <p className="gc-message__text">{message.text}</p>
    </div>
  );
}
