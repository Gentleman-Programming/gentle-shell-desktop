import { useEffect, useRef } from "react";
import type { ChatMessage, Dialog, DialogAnswer } from "@shared/bridge-types";
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

  const isEmpty = messages.length === 0 && dialogs.length === 0;

  return (
    <div className="gc-thread" data-testid="gc-message-thread">
      {isEmpty ? (
        <p className="gc-thread__empty">Start a conversation with Gentle.</p>
      ) : (
        <>
          {messages.map((message) => (
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
