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
  readonly selected?: boolean;
  readonly onSelect: (chat: ChatSummary) => void;
}

// Presentational only — receives props, talks to nothing. ChatsContainer
// (through ChatList) owns the bridge call and passes ChatSummary values
// down. A <button> (not a clickable <div>) so the list is keyboard- and
// screen-reader-navigable without extra ARIA plumbing.
export function ChatListItem({ chat, selected = false, onSelect }: ChatListItemProps) {
  const classes = ["gc-chat-list-item", selected && "gc-chat-list-item--selected"].filter(Boolean).join(" ");

  return (
    <li>
      <button
        type="button"
        className={classes}
        aria-current={selected || undefined}
        onClick={() => onSelect(chat)}
      >
        <span className="gc-chat-list-item__title">{chat.title}</span>
        <Pill tone={STATE_PILL_TONE[chat.state]}>{STATE_LABEL[chat.state]}</Pill>
      </button>
    </li>
  );
}
