import type { HelpersActivity } from "@shared/bridge-types";
import "./HelpersStrip.css";

export interface HelpersStripProps {
  readonly helpers: HelpersActivity;
  readonly onOpen: () => void;
}

/**
 * Presentational: a compact affordance shown above the message thread
 * when this chat has spawned helpers, so they're discoverable without
 * switching tabs first (D3). Nested rows under the assistant message that
 * spawned them are out of scope — the gentle-agents payload has no
 * message linkage (see odd/tasks/desktop-m2-helpers.md's Scope) — this
 * strip is the whole-chat stand-in for that.
 */
export function HelpersStrip({ helpers, onOpen }: HelpersStripProps) {
  if (helpers.tasks.length === 0) return null;

  const { running } = helpers.summary;
  const label = running > 0 ? `Helpers · ${running} running` : `Helpers · ${helpers.tasks.length}`;

  return (
    <button type="button" className="gc-helpers-strip" onClick={onOpen}>
      {label}
    </button>
  );
}
