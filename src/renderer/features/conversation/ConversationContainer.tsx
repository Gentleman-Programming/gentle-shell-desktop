import { useEffect, useState } from "react";
import type { ChatState, ChatSummary, DialogAnswer } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { HelpersContainer } from "@renderer/features/helpers/HelpersContainer";
import { Composer } from "./components/Composer";
import { CONVERSATION_PANE, ConversationHeader, type ConversationPane } from "./components/ConversationHeader";
import { HelpersStrip } from "./components/HelpersStrip";
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
  return {
    messages: [],
    working: false,
    pendingDialogs: [],
    activity: 0,
    helpers: { summary: { running: 0, queued: 0, waiting: 0, finished: 0 }, tasks: [] },
  };
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
  const [pane, setPane] = useState<ConversationPane>(CONVERSATION_PANE.CHAT);
  // The moment this chat became active — HelpersContainer's line between
  // "current" helpers and the collapsed "Earlier" group (format.ts's
  // partitionHelpers). Set once per activeChat change, not per pane
  // switch, so opening the Helpers tab later doesn't move the line.
  const [helpersOpenedAt, setHelpersOpenedAt] = useState<string>(() => new Date().toISOString());

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
  // Guarded against stale resolutions: if the selection changes again
  // before this request settles (e.g. quickly clicking two chats), its
  // resolved/rejected result must not clobber the state that belongs to
  // the newer selection.
  // Reset to the chat pane whenever the selected chat changes — a helper
  // tab left open on the previous chat must never bleed into the next one.
  useEffect(() => {
    setPane(CONVERSATION_PANE.CHAT);
    setHelpersOpenedAt(new Date().toISOString());
  }, [activeChat]);

  useEffect(() => {
    setBridgeError(undefined);
    let cancelled = false;
    const opening = activeChat.kind === "existing" ? bridge.openChat(activeChat.chat.id) : bridge.newChat();
    opening
      .then((state) => {
        if (!cancelled) setChatState(state);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setBridgeError(errorText(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [bridge, activeChat]);

  const handleSend = (): void => {
    const text = draft.trim();
    if (text.length === 0 || chatState.working) return;

    setDraft("");
    bridge
      .sendMessage(text)
      .then((result) => {
        if (!result.queued) setBridgeError(result.reason ?? "Gentle did not send the message");
      })
      .catch((cause: unknown) => setBridgeError(errorText(cause)));
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
      <ConversationHeader
        title={title}
        working={chatState.working}
        pane={pane}
        runningHelpersCount={chatState.helpers.summary.running}
        onSelectPane={setPane}
      />
      <StatusLine error={error} />
      {pane === CONVERSATION_PANE.HELPERS ? (
        <HelpersContainer
          activity={chatState.helpers}
          onBackToChat={() => setPane(CONVERSATION_PANE.CHAT)}
          openedAt={helpersOpenedAt}
        />
      ) : (
        <>
          <HelpersStrip helpers={chatState.helpers} onOpen={() => setPane(CONVERSATION_PANE.HELPERS)} />
          <MessageThread messages={chatState.messages} dialogs={chatState.pendingDialogs} onAnswerDialog={handleAnswerDialog} />
          <Composer value={draft} working={chatState.working} onChange={setDraft} onSend={handleSend} onAbort={handleAbort} />
        </>
      )}
    </section>
  );
}
