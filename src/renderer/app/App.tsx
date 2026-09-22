import { useState } from "react";
import type { ChatSummary } from "@shared/bridge-types";
import { ChatsContainer } from "@renderer/features/chats/ChatsContainer";
import { ConversationContainer, type ActiveChat } from "@renderer/features/conversation/ConversationContainer";
import "./App.css";

const NEW_CHAT: ActiveChat = { kind: "new" };

// App shell: composes feature-level containers only (Scope Rule — layout
// wiring lives here, feature internals stay inside their own folder).
// Holds the small `activeChat` selection as local state (no global store
// for M1, see odd/tasks/desktop-m1-chat-core.md's "Selected chat" note) —
// both ChatsContainer (highlighting) and ConversationContainer (which chat
// to open) need it. First-run (link vs isolated) is T5 scope; the shell
// below is what renders once that choice, or its absence, has already been
// resolved.
export function App() {
  const [activeChat, setActiveChat] = useState<ActiveChat>(NEW_CHAT);

  const handleSelectChat = (chat: ChatSummary): void => {
    setActiveChat({ kind: "existing", chat });
  };

  const handleNewChat = (): void => {
    setActiveChat(NEW_CHAT);
  };

  return (
    <div className="gc-app">
      <ChatsContainer
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        selectedChatId={activeChat.kind === "existing" ? activeChat.chat.id : undefined}
      />
      <ConversationContainer activeChat={activeChat} />
    </div>
  );
}
