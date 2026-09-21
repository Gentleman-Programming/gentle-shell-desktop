import { useState } from "react";
import { MESSAGE_ROLE, type ChatMessage } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { Composer } from "./components/Composer";
import { MessageBubble } from "./components/MessageBubble";
import "./ConversationContainer.css";

// T3 has not wired real session selection yet, so T1 previews against a
// single fixed conversation id; T3 replaces this with the selected chat.
const PREVIEW_CHAT_ID = "chat-preview";

let nextMessageId = 0;

function makeId(prefix: string): string {
  nextMessageId += 1;
  return `${prefix}-${nextMessageId}`;
}

/**
 * Conversation container: owns the message list, the draft text, and the
 * bridge call. Streaming render mid-reply, dialog cards and keyboard
 * shortcuts (Enter to send, Shift+Enter newline, Esc to abort) are T4
 * scope — this is the composer + thread skeleton.
 */
export function ConversationContainer() {
  const bridge = useBridge();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = (): void => {
    const text = draft.trim();
    if (text.length === 0 || sending) return;

    const userMessage: ChatMessage = {
      id: makeId("user"),
      role: MESSAGE_ROLE.USER,
      text,
    };
    const assistantId = makeId("assistant");

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: MESSAGE_ROLE.ASSISTANT, text: "" },
    ]);
    setDraft("");
    setSending(true);

    bridge
      .sendMessage(PREVIEW_CHAT_ID, text, (delta) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, text: message.text + delta }
              : message,
          ),
        );
      })
      .catch((cause: unknown) => {
        const failure = cause instanceof Error ? cause.message : String(cause);
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, text: `Message could not be sent: ${failure}` } : message,
          ),
        );
      })
      .finally(() => setSending(false));
  };

  return (
    <section className="gc-conversation">
      <div className="gc-conversation__thread">
        {messages.length === 0 ? (
          <p className="gc-conversation__empty">
            Start a conversation with Gentle.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>
      <Composer
        value={draft}
        disabled={sending}
        onChange={setDraft}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
