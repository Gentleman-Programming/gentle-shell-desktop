import type { ChangeEvent } from "react";
import { Button } from "@renderer/shared/ui/atoms/Button";
import "./HelpersFooter.css";

export interface HelpersFooterProps {
  readonly followLive: boolean;
  readonly showToolDetails: boolean;
  readonly onToggleFollowLive: (value: boolean) => void;
  readonly onToggleShowToolDetails: (value: boolean) => void;
  readonly onBackToChat: () => void;
}

// Presentational: Follow live / Show tool details toggles (plain
// checkboxes — a single-feature control, no shared Checkbox atom exists
// yet and only this feature needs one), Back to chat, and a Stop button
// that stays disabled until gentle-agents exposes a stop command over RPC
// (out of scope — see odd/tasks/desktop-m2-helpers.md's Scope).
export function HelpersFooter({ followLive, showToolDetails, onToggleFollowLive, onToggleShowToolDetails, onBackToChat }: HelpersFooterProps) {
  const handleFollowLive = (event: ChangeEvent<HTMLInputElement>): void => onToggleFollowLive(event.target.checked);
  const handleShowToolDetails = (event: ChangeEvent<HTMLInputElement>): void => onToggleShowToolDetails(event.target.checked);

  return (
    <footer className="gc-helpers-footer">
      <label className="gc-helpers-footer__toggle">
        <input type="checkbox" checked={followLive} onChange={handleFollowLive} />
        Follow live
      </label>
      <label className="gc-helpers-footer__toggle">
        <input type="checkbox" checked={showToolDetails} onChange={handleShowToolDetails} />
        Show tool details
      </label>
      <div className="gc-helpers-footer__actions">
        <Button type="button" variant="ghost" onClick={onBackToChat}>
          Back to chat
        </Button>
        <Button type="button" variant="ghost" disabled title="Stopping helpers is not available yet">
          Stop
        </Button>
      </div>
    </footer>
  );
}
