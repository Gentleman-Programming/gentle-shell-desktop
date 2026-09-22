import { Pill, PILL_TONE } from "@renderer/shared/ui/atoms/Pill";
import "./ConversationHeader.css";

export const CONVERSATION_PANE = {
  CHAT: "chat",
  HELPERS: "helpers",
} as const;

/** Which pane the conversation view is showing — the plain thread/composer, or the D3 Helpers tab. Owned here (not ConversationContainer) because ConversationHeader owns the tab switch UI it names. */
export type ConversationPane = (typeof CONVERSATION_PANE)[keyof typeof CONVERSATION_PANE];

export interface ConversationHeaderProps {
  readonly title: string;
  readonly working: boolean;
  readonly pane: ConversationPane;
  readonly runningHelpersCount: number;
  readonly onSelectPane: (pane: ConversationPane) => void;
}

// Presentational: the active chat's title, a "Working…" pill while
// ChatState.working is true, and a pill-style Chat/Helpers tab switch
// (D3) with the running helper count in the Helpers tab label.
export function ConversationHeader({ title, working, pane, runningHelpersCount, onSelectPane }: ConversationHeaderProps) {
  return (
    <header className="gc-conversation-header">
      <h2 className="gc-conversation-header__title">{title}</h2>
      {working && <Pill tone={PILL_TONE.WORKING}>Working…</Pill>}
      <div className="gc-conversation-header__tabs" role="tablist">
        <PaneTab pane={CONVERSATION_PANE.CHAT} active={pane === CONVERSATION_PANE.CHAT} label="Chat" onSelectPane={onSelectPane} />
        <PaneTab
          pane={CONVERSATION_PANE.HELPERS}
          active={pane === CONVERSATION_PANE.HELPERS}
          label={runningHelpersCount > 0 ? `Helpers (${runningHelpersCount} running)` : "Helpers"}
          onSelectPane={onSelectPane}
        />
      </div>
    </header>
  );
}

interface PaneTabProps {
  readonly pane: ConversationPane;
  readonly active: boolean;
  readonly label: string;
  readonly onSelectPane: (pane: ConversationPane) => void;
}

function PaneTab({ pane, active, label, onSelectPane }: PaneTabProps) {
  const classes = ["gc-conversation-header__tab", active && "gc-conversation-header__tab--active"].filter(Boolean).join(" ");

  return (
    <button type="button" role="tab" aria-selected={active} className={classes} onClick={() => onSelectPane(pane)}>
      {label}
    </button>
  );
}
