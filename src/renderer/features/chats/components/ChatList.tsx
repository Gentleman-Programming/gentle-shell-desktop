import type { ChatSummary } from "@shared/bridge-types";
import { groupChatsByDay } from "@shared/chatGrouping";
import { ChatListItem } from "./ChatListItem";
import "./ChatList.css";

export interface ChatListProps {
  readonly chats: readonly ChatSummary[];
  readonly selectedId?: string;
  readonly onSelect: (chat: ChatSummary) => void;
  /** Injected for deterministic day-bucketing in tests; defaults to `new Date()`. */
  readonly now?: Date;
}

// Presentational: groups chats by day (@shared/chatGrouping, moved out of
// src/main/domain/session/sessionList.ts once this feature needed it too)
// and renders a ChatListItem per chat. ChatsContainer owns the bridge call
// and the selected-chat callback.
export function ChatList({ chats, selectedId, onSelect, now }: ChatListProps) {
  const groups = groupChatsByDay(chats, now);

  return (
    <div className="gc-chat-list">
      {groups.map((group) => (
        <section key={group.label} className="gc-chat-list__group">
          <h3 className="gc-chat-list__day">{group.label}</h3>
          <ul className="gc-chat-list__items">
            {group.chats.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} selected={chat.id === selectedId} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
