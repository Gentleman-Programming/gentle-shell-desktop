import { useEffect, useState } from "react";
import type { ChatState } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { Composer } from "./components/Composer";
import { MessageBubble } from "./components/MessageBubble";
import "./ConversationContainer.css";

function emptyChatState(): ChatState {
  return { messages: [], working: false, pendingDialogs: [], activity: 0 };
}

function errorText(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * Conversation container: ONE source of truth for the thread is the pushed
 * `ChatState` (messages, working, pendingDialogs, lastError) — nothing is
 * derived or invented locally. Errors (both ChatState.lastError and
 * bridge.onError pushes) render in a dedicated status line, never as a
 * synthetic ChatMessage appended to the thread; a failed send/newChat no
 * longer fabricates an "assistant" bubble that pi never sent.
 *
 * T4 absorbs the T1/T3 renderer follow-ups: this is the ONE-source-of-truth
 * refactor. Chat selection (activeChat prop), dialogs, composer key
 * handling and the extracted ConversationHeader/MessageThread/StatusLine
 * components are the feat commit that follows.
 */
export function ConversationContainer() {
  const bridge = useBridge();
  const [chatState, setChatState] = useState<ChatState>(emptyChatState());
  const [bridgeError, setBridgeError] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const unsubscribeState = bridge.onState(setChatState);
    const unsubscribeError = bridge.onError(setBridgeError);

    bridge.newChat().then(setChatState).catch((cause: unknown) => setBridgeError(errorText(cause)));

    return () => {
      unsubscribeState();
      unsubscribeError();
    };
  }, [bridge]);

  const handleSubmit = (): void => {
    const text = draft.trim();
    if (text.length === 0 || chatState.working) return;

    setDraft("");
    bridge.sendMessage(text).catch((cause: unknown) => setBridgeError(errorText(cause)));
  };

  const error = bridgeError ?? chatState.lastError;

  return (
    <section className="gc-conversation">
      <div className="gc-conversation__thread">
        {error && (
          <p role="status" className="gc-conversation__status">
            {error}
          </p>
        )}
        {chatState.messages.length === 0 ? (
          <p className="gc-conversation__empty">Start a conversation with Gentle.</p>
        ) : (
          chatState.messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </div>
      <Composer value={draft} disabled={chatState.working} onChange={setDraft} onSubmit={handleSubmit} />
    </section>
  );
}
