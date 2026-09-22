import type { HelperTask } from "@shared/bridge-types";
import { formatMetaLine } from "../format";
import "./HelperListItem.css";

export interface HelperListItemProps {
  readonly task: HelperTask;
  readonly selected: boolean;
  readonly onSelect: (task: HelperTask) => void;
}

// Presentational: status dot, title, meta line ("running · 1m 40s · 6
// steps" — format.ts's formatMetaLine). A <button> (not a clickable
// <div>), same keyboard-/screen-reader-navigable pattern as ChatListItem.
export function HelperListItem({ task, selected, onSelect }: HelperListItemProps) {
  const classes = ["gc-helper-list-item", selected && "gc-helper-list-item--selected"].filter(Boolean).join(" ");

  return (
    <li>
      <button type="button" className={classes} aria-current={selected || undefined} onClick={() => onSelect(task)}>
        <span className={`gc-helper-list-item__dot gc-helper-list-item__dot--${task.status}`} aria-hidden="true" />
        <span className="gc-helper-list-item__body">
          <span className="gc-helper-list-item__title">{task.label}</span>
          <span className="gc-helper-list-item__meta">{formatMetaLine(task)}</span>
        </span>
      </button>
    </li>
  );
}
