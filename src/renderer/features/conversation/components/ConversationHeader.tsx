import { Pill, PILL_TONE } from "@renderer/shared/ui/atoms/Pill";
import "./ConversationHeader.css";

export interface ConversationHeaderProps {
  readonly title: string;
  readonly working: boolean;
}

// Presentational: the active chat's title plus a "Working…" pill while
// ChatState.working is true.
export function ConversationHeader({ title, working }: ConversationHeaderProps) {
  return (
    <header className="gc-conversation-header">
      <h2 className="gc-conversation-header__title">{title}</h2>
      {working && <Pill tone={PILL_TONE.WORKING}>Working…</Pill>}
    </header>
  );
}
