import { useEffect, useState } from "react";
import { HELPER_STATUS, type HelperTask, type HelpersActivity } from "@shared/bridge-types";
import { HelpersFooter } from "./components/HelpersFooter";
import { HelperList } from "./components/HelperList";
import { HelperThread } from "./components/HelperThread";
import { HelpersSummary } from "./components/HelpersSummary";
import "./HelpersContainer.css";

export interface HelpersContainerProps {
  readonly activity: HelpersActivity;
  readonly onBackToChat: () => void;
}

function pickDefaultTaskId(tasks: readonly HelperTask[]): string | undefined {
  const runningTask = tasks.find((task) => task.status === HELPER_STATUS.RUNNING);
  return (runningTask ?? tasks[0])?.id;
}

/**
 * Owns the Helpers pane's own local view state (selected helper, Follow
 * live, Show tool details) — no bridge calls: the data is
 * ChatState.helpers, already pushed into ConversationContainer. Left
 * pane: this chat's helper list (never a global list — see
 * odd/tasks/desktop-m2-helpers.md's Objective). Right pane: the selected
 * helper's thread plus the footer.
 */
export function HelpersContainer({ activity, onBackToChat }: HelpersContainerProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(() => pickDefaultTaskId(activity.tasks));
  const [followLive, setFollowLive] = useState(true);
  const [showToolDetails, setShowToolDetails] = useState(false);

  // Keeps the current selection while its task is still present (even
  // once it finishes); re-picks a default — preferring a running task —
  // once the previously selected task drops out of the list (e.g. the
  // chat reopened with a fresh activity snapshot).
  useEffect(() => {
    setSelectedTaskId((current) => {
      if (current && activity.tasks.some((task) => task.id === current)) return current;
      return pickDefaultTaskId(activity.tasks);
    });
  }, [activity.tasks]);

  const selectedTask = activity.tasks.find((task) => task.id === selectedTaskId);

  return (
    <div className="gc-helpers">
      <div className="gc-helpers__list-pane">
        <HelpersSummary summary={activity.summary} />
        <HelperList tasks={activity.tasks} selectedTaskId={selectedTaskId} onSelect={(task) => setSelectedTaskId(task.id)} />
      </div>
      <div className="gc-helpers__thread-pane">
        {selectedTask ? (
          <HelperThread task={selectedTask} showToolDetails={showToolDetails} followLive={followLive} />
        ) : (
          // Distinct wording from HelperList's own empty message (left
          // pane) so the two panes never render the exact same text twice.
          <p className="gc-helpers__empty">Nothing running for this chat yet.</p>
        )}
        <HelpersFooter
          followLive={followLive}
          showToolDetails={showToolDetails}
          onToggleFollowLive={setFollowLive}
          onToggleShowToolDetails={setShowToolDetails}
          onBackToChat={onBackToChat}
        />
      </div>
    </div>
  );
}
