import { useState } from "react";
import type { HelperTask } from "@shared/bridge-types";
import { formatEarlierDateHint } from "../format";
import { HelperListItem } from "./HelperListItem";
import "./HelperList.css";

export interface HelperListProps {
  readonly current: readonly HelperTask[];
  readonly earlier: readonly HelperTask[];
  readonly selectedTaskId?: string;
  readonly onSelect: (task: HelperTask) => void;
}

function isSelectedIn(tasks: readonly HelperTask[], selectedTaskId: string | undefined): boolean {
  return selectedTaskId !== undefined && tasks.some((task) => task.id === selectedTaskId);
}

// Presentational: this chat's helpers only — HelpersContainer passes the
// format.ts's partitionHelpers split of ChatState.helpers.tasks straight
// through. Never a global list: the parent-child relation stays direct
// (maintainer decision, 2026-09-21 — see odd/tasks/desktop-m2-helpers.md's
// Objective). `earlier` (helpers already finished when the chat was
// opened) renders under a collapsed "Earlier" group so a session with
// dozens of days-old finished helpers doesn't bury today's work
// (maintainer decision, 2026-09-22).
export function HelperList({ current, earlier, selectedTaskId, onSelect }: HelperListProps) {
  // Lazy initializer only: starts expanded when the default selection
  // landed on an earlier task (only possible when `current` was empty at
  // mount — see HelpersContainer's pickDefaultTaskId), or when the caller
  // otherwise pre-selects one. Purely local afterwards — the user's
  // collapse/expand choice is never overridden by a later activity push.
  const [earlierExpanded, setEarlierExpanded] = useState(() => isSelectedIn(earlier, selectedTaskId));

  if (current.length === 0 && earlier.length === 0) {
    return <p className="gc-helper-list__empty">No helpers in this chat yet.</p>;
  }

  const earlierDateHint = formatEarlierDateHint(earlier);

  return (
    <ul className="gc-helper-list">
      {current.map((task) => (
        <HelperListItem key={task.id} task={task} selected={task.id === selectedTaskId} onSelect={onSelect} />
      ))}
      {earlier.length > 0 && (
        <li className="gc-helper-list__earlier">
          <button
            type="button"
            className="gc-helper-list__earlier-toggle"
            aria-expanded={earlierExpanded}
            onClick={() => setEarlierExpanded((expanded) => !expanded)}
          >
            <span className="gc-helper-list__earlier-title">Earlier · {earlier.length} finished</span>
            {earlierDateHint && <span className="gc-helper-list__earlier-hint">{earlierDateHint}</span>}
          </button>
          {earlierExpanded && (
            <ul className="gc-helper-list__earlier-items">
              {earlier.map((task) => (
                <HelperListItem key={task.id} task={task} selected={task.id === selectedTaskId} onSelect={onSelect} />
              ))}
            </ul>
          )}
        </li>
      )}
    </ul>
  );
}
