import { MESSAGE_ROLE, type ChatMessage } from "@shared/bridge-types";
import { Markdown } from "@renderer/shared/markdown/Markdown";
import "./MessageBubble.css";

export interface MessageBubbleProps {
  readonly message: ChatMessage;
}

// Presentational only. The "no tool output, no thinking shown" filtering
// happens in T2's reducer before a message ever reaches this component.
// Assistant replies render through <Markdown> (sanitized HTML — see
// renderMarkdown.ts) since a model naturally replies in Markdown
// (`**bold**`, `` `code` ``, `- lists`); user messages stay literal plain
// text so nothing the human typed is ever reinterpreted as markup.
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === MESSAGE_ROLE.USER;

  return (
    <div className={`gc-message gc-message--${isUser ? "user" : "assistant"}`}>
      {isUser ? <p className="gc-message__text">{message.text}</p> : <Markdown text={message.text} />}
    </div>
  );
}
