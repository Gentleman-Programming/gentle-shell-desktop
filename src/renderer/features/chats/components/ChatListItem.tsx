import { CHAT_STATE, type ChatSummary } from "@shared/bridge-types";
import { Pill, PILL_TONE, type PillTone } from "@renderer/shared/ui/atoms/Pill";
import "./ChatListItem.css";

const STATE_PILL_TONE: Record<ChatSummary["state"], PillTone> = {
  [CHAT_STATE.IDLE]: PILL_TONE.NEUTRAL,
  [CHAT_STATE.WORKING]: PILL_TONE.WORKING,
  [CHAT_STATE.NEEDS_YOU]: PILL_TONE.NEEDS_YOU,
};

const STATE_LABEL: Record<ChatSummary["state"], string> = {
  [CHAT_STATE.IDLE]: "idle",
  [CHAT_STATE.WORKING]: "working",
  [CHAT_STATE.NEEDS_YOU]: "needs you",
};

export interface ChatListItemProps {
  readonly chat: ChatSummary;
}

// Presentational only — receives props, talks to nothing. ChatsContainer
// owns the bridge call and passes ChatSummary values down.
export function ChatListItem({ chat }: ChatListItemProps) {
  return (
    <li className="gc-chat-list-item">
      <span className="gc-chat-list-item__title">{chat.title}</span>
      <Pill tone={STATE_PILL_TONE[chat.state]}>{STATE_LABEL[chat.state]}</Pill>
    </li>
  );
}
