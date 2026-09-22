import type { HelperTask } from "@shared/bridge-types";
import { HelperListItem } from "./HelperListItem";
import "./HelperList.css";

export interface HelperListProps {
  readonly tasks: readonly HelperTask[];
  readonly selectedTaskId?: string;
  readonly onSelect: (task: HelperTask) => void;
}

// Presentational: this chat's helpers only — HelpersContainer passes
// ChatState.helpers.tasks straight through. Never a global list: the
// parent-child relation stays direct (maintainer decision, 2026-09-21 —
// see odd/tasks/desktop-m2-helpers.md's Objective).
export function HelperList({ tasks, selectedTaskId, onSelect }: HelperListProps) {
  if (tasks.length === 0) {
    return <p className="gc-helper-list__empty">No helpers in this chat yet.</p>;
  }

  return (
    <ul className="gc-helper-list">
      {tasks.map((task) => (
        <HelperListItem key={task.id} task={task} selected={task.id === selectedTaskId} onSelect={onSelect} />
      ))}
    </ul>
  );
}
