import { useEffect, useRef } from "react";
import { HELPER_STATUS, type HelperTask } from "@shared/bridge-types";
import { Pill, PILL_TONE, type PillTone } from "@renderer/shared/ui/atoms/Pill";
import { labelThreadItems, statusLabel, type LabeledThreadItem } from "../format";
import { HelperThreadItem } from "./HelperThreadItem";
import "./HelperThread.css";

const STATUS_PILL_TONE: Record<HelperTask["status"], PillTone> = {
  [HELPER_STATUS.QUEUED]: PILL_TONE.NEUTRAL,
  [HELPER_STATUS.RUNNING]: PILL_TONE.RUNNING,
  [HELPER_STATUS.WAITING]: PILL_TONE.WAITING,
  [HELPER_STATUS.DONE]: PILL_TONE.DONE,
  [HELPER_STATUS.FAILED]: PILL_TONE.FAILED,
  [HELPER_STATUS.CANCELLED]: PILL_TONE.NEUTRAL,
};

export interface HelperThreadProps {
  readonly task: HelperTask;
  readonly showToolDetails: boolean;
  readonly followLive: boolean;
}

function itemKey(entry: LabeledThreadItem, index: number): string {
  return entry.item.kind === "tool" ? entry.item.callId : `${entry.item.kind}-${index}`;
}

// Presentational: the selected helper's narrated thread — a small header
// (title, status pill, "started from this chat · <agent>") followed by
// Task/Plan/Step N/Update/Note rows (see format.ts's labelThreadItems),
// auto-scrolling to the bottom while `followLive` is on. Same auto-scroll
// pattern as MessageThread's bottomRef.
export function HelperThread({ task, showToolDetails, followLive }: HelperThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const labeled = labelThreadItems(task.thread.items);

  useEffect(() => {
    if (followLive) bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [task.thread.items, followLive]);

  return (
    <div className="gc-helper-thread" data-testid="gc-helper-thread">
      <header className="gc-helper-thread__header">
        <h3 className="gc-helper-thread__title">{task.label}</h3>
        <Pill tone={STATUS_PILL_TONE[task.status]}>{statusLabel(task.status)}</Pill>
        <span className="gc-helper-thread__origin">started from this chat · {task.agent}</span>
      </header>
      <div className="gc-helper-thread__items">
        {labeled.length === 0 ? (
          <p className="gc-helper-thread__empty">No activity yet.</p>
        ) : (
          labeled.map((entry, index) => (
            <HelperThreadItem key={itemKey(entry, index)} entry={entry} showToolDetails={showToolDetails} />
          ))
        )}
        <div ref={bottomRef} data-testid="helper-thread-end" />
      </div>
    </div>
  );
}
