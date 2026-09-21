import { useEffect, useState } from "react";
import type { ChatSummary } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { Button } from "@renderer/shared/ui/atoms/Button";
import { ChatListItem } from "./components/ChatListItem";
import "./ChatsContainer.css";

/**
 * Sidebar container: owns the bridge call, hands plain ChatSummary props
 * to the presentational ChatListItem (container/presentational split).
 * T1 renders a minimal shell with real styling; T3 adds chat.open/chat.new
 * wiring and T4 adds day/state grouping.
 */
export function ChatsContainer() {
  const bridge = useBridge();
  const [chats, setChats] = useState<ChatSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    bridge.listChats().then((loaded) => {
      if (!cancelled) setChats(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [bridge]);

  return (
    <aside className="gc-chats">
      <div className="gc-chats__header">
        <h2 className="gc-chats__heading">Chats</h2>
        <Button variant="ghost" type="button">
          New chat
        </Button>
      </div>
      <ul className="gc-chats__list">
        {chats.map((chat) => (
          <ChatListItem key={chat.id} chat={chat} />
        ))}
      </ul>
    </aside>
  );
}
