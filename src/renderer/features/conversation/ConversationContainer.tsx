import { useEffect, useState } from "react";
import { MESSAGE_ROLE, type ChatMessage } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { Composer } from "./components/Composer";
import { MessageBubble } from "./components/MessageBubble";
import "./ConversationContainer.css";

let nextErrorId = 0;

function errorMessage(text: string): ChatMessage {
  nextErrorId += 1;
  return { id: `error-${nextErrorId}`, role: MESSAGE_ROLE.ASSISTANT, text: `Message could not be sent: ${text}` };
}

/**
 * Conversation container: owns the message list and the draft text. T3
 * wires it to the finalized bridge shape — onState pushes replace T1's
 * streamed-callback shape (sendMessage no longer takes a chatId or an
 * onTextDelta callback; ChatHost pushes ChatState for whichever chat is
 * currently open, and openChat/newChat return the initial state). Real
 * chat selection from the sidebar is T4 scope; this opens a fresh chat on
 * mount so `pnpm dev:web` keeps behaving the same way it did in T1.
 */
export function ConversationContainer() {
  const bridge = useBridge();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [working, setWorking] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const unsubscribeState = bridge.onState((state) => {
      setMessages([...state.messages]);
      setWorking(state.working);
    });
    const unsubscribeError = bridge.onError((message) => {
      setMessages((current) => [...current, errorMessage(message)]);
    });

    bridge.newChat().catch((cause: unknown) => {
      setMessages((current) => [...current, errorMessage(cause instanceof Error ? cause.message : String(cause))]);
    });

    return () => {
      unsubscribeState();
      unsubscribeError();
    };
  }, [bridge]);

  const handleSubmit = (): void => {
    const text = draft.trim();
    if (text.length === 0 || working) return;

    setDraft("");
    bridge.sendMessage(text).catch((cause: unknown) => {
      setMessages((current) => [...current, errorMessage(cause instanceof Error ? cause.message : String(cause))]);
    });
  };

  return (
    <section className="gc-conversation">
      <div className="gc-conversation__thread">
        {messages.length === 0 ? (
          <p className="gc-conversation__empty">Start a conversation with Gentle.</p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </div>
      <Composer value={draft} disabled={working} onChange={setDraft} onSubmit={handleSubmit} />
    </section>
  );
}
