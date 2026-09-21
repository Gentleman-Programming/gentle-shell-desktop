import "./StatusLine.css";

export interface StatusLineProps {
  readonly error?: string;
}

// Presentational: the dedicated status line ConversationContainer renders
// errors into (ChatState.lastError or a bridge.onError push) — never a
// synthetic ChatMessage appended to the thread.
export function StatusLine({ error }: StatusLineProps) {
  if (!error) return null;

  return (
    <p role="status" className="gc-status-line">
      {error}
    </p>
  );
}
