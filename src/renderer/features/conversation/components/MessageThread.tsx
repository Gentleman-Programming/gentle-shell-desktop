import { useEffect, useRef } from "react";
import { MESSAGE_ROLE, type ChatMessage, type Dialog, type DialogAnswer } from "@shared/bridge-types";
import { DialogCard } from "./DialogCard";
import { MessageBubble } from "./MessageBubble";
import "./MessageThread.css";

export interface MessageThreadProps {
  readonly messages: readonly ChatMessage[];
  readonly dialogs: readonly Dialog[];
  readonly onAnswerDialog: (id: string, answer: DialogAnswer) => void;
}

// Presentational: renders message bubbles in order, then any pending
// dialog cards (pi blocks on these, so they read as the newest thing in
// the thread), and auto-scrolls to the bottom whenever either changes.
export function MessageThread({ messages, dialogs, onAnswerDialog }: MessageThreadProps) {
  // React 19: ref is a normal prop/hook value, no forwardRef needed.
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, dialogs]);

  // Safety net for the domain-level fix in chatReducer.ts/history.ts: an
  // assistant message that finalized (streaming !== true) with nothing but
  // whitespace text renders as an empty grey bubble. It should already have
  // been dropped upstream, but this belongs here too so no other producer
  // of `messages` can reintroduce the same empty bubble. A still-streaming
  // empty assistant message stays visible as the typing placeholder; user
  // messages are never filtered.
  const visibleMessages = messages.filter(
    (message) => message.role !== MESSAGE_ROLE.ASSISTANT || message.streaming === true || message.text.trim().length > 0,
  );
  const isEmpty = visibleMessages.length === 0 && dialogs.length === 0;

  return (
    <div className="gc-thread" data-testid="gc-message-thread">
      {isEmpty ? (
        <p className="gc-thread__empty">Start a conversation with Gentle.</p>
      ) : (
        <>
          {visibleMessages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {dialogs.map((dialog) => (
            <DialogCard key={dialog.id} dialog={dialog} onAnswer={(answer) => onAnswerDialog(dialog.id, answer)} />
          ))}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
