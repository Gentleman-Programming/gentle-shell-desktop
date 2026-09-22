import { useEffect, useState } from "react";
import type { ChatState, ChatSummary, DialogAnswer } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { Composer } from "./components/Composer";
import { ConversationHeader } from "./components/ConversationHeader";
import { MessageThread } from "./components/MessageThread";
import { StatusLine } from "./components/StatusLine";
import "./ConversationContainer.css";

/**
 * Which chat is open right now. App.tsx owns this as small local state (no
 * global store for M1, see odd/tasks/desktop-m1-chat-core.md) and passes it
 * down; ChatsContainer only reports selection intent up to App, it never
 * calls chat.open/chat.new itself, because GentleBridge tracks exactly one
 * "currently open" chat.
 */
export type ActiveChat = { readonly kind: "new" } | { readonly kind: "existing"; readonly chat: ChatSummary };

export interface ConversationContainerProps {
  readonly activeChat: ActiveChat;
}

function emptyChatState(): ChatState {
  return { messages: [], working: false, pendingDialogs: [], activity: 0 };
}

function errorText(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * Conversation container: ONE source of truth for the thread is the pushed
 * `ChatState` (messages, working, pendingDialogs, lastError) — nothing is
 * derived or invented locally. Errors (ChatState.lastError and
 * bridge.onError pushes) render in a dedicated StatusLine, never as a
 * synthetic ChatMessage appended to the thread.
 */
export function ConversationContainer({ activeChat }: ConversationContainerProps) {
  const bridge = useBridge();
  const [chatState, setChatState] = useState<ChatState>(emptyChatState());
  const [bridgeError, setBridgeError] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState("");

  // Subscribes once: GentleBridge pushes state/error for whichever chat is
  // currently open, independent of which activeChat this render owns.
  useEffect(() => {
    const unsubscribeState = bridge.onState(setChatState);
    const unsubscribeError = bridge.onError(setBridgeError);
    return () => {
      unsubscribeState();
      unsubscribeError();
    };
  }, [bridge]);

  // Opens (or starts) the selected chat whenever the selection changes.
  useEffect(() => {
    setBridgeError(undefined);
    const opening = activeChat.kind === "existing" ? bridge.openChat(activeChat.chat.id) : bridge.newChat();
    opening.then(setChatState).catch((cause: unknown) => setBridgeError(errorText(cause)));
  }, [bridge, activeChat]);

  const handleSend = (): void => {
    const text = draft.trim();
    if (text.length === 0 || chatState.working) return;

    setDraft("");
    bridge.sendMessage(text).catch((cause: unknown) => setBridgeError(errorText(cause)));
  };

  const handleAbort = (): void => {
    bridge.abort().catch((cause: unknown) => setBridgeError(errorText(cause)));
  };

  const handleAnswerDialog = (id: string, answer: DialogAnswer): void => {
    bridge.answerDialog(id, answer).catch((cause: unknown) => setBridgeError(errorText(cause)));
  };

  const title = activeChat.kind === "existing" ? activeChat.chat.title : "New chat";
  const error = bridgeError ?? chatState.lastError;

  return (
    <section className="gc-conversation">
      <ConversationHeader title={title} working={chatState.working} />
      <StatusLine error={error} />
      <MessageThread messages={chatState.messages} dialogs={chatState.pendingDialogs} onAnswerDialog={handleAnswerDialog} />
      <Composer value={draft} working={chatState.working} onChange={setDraft} onSend={handleSend} onAbort={handleAbort} />
    </section>
  );
}
