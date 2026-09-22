import type { HelperThreadItem as ThreadItem } from "@shared/bridge-types";
import type { LabeledThreadItem } from "../format";
import { summarizeTool } from "../format";
import "./HelperThreadItem.css";

export interface HelperThreadItemProps {
  readonly entry: LabeledThreadItem;
  readonly showToolDetails: boolean;
}

// Presentational: one narrated row (label column + body). `tool` items
// collapse to a single summarized line by default (D3 scope: "tools
// collapsed to one line") and expand into an args/output mono block only
// when `showToolDetails` is on.
export function HelperThreadItem({ entry, showToolDetails }: HelperThreadItemProps) {
  const { item, label } = entry;

  return (
    <div className={`gc-helper-thread-item gc-helper-thread-item--${item.kind}`}>
      <span className="gc-helper-thread-item__label">{label}</span>
      <div className="gc-helper-thread-item__body">{renderBody(item, showToolDetails)}</div>
    </div>
  );
}

function renderBody(item: ThreadItem, showToolDetails: boolean) {
  switch (item.kind) {
    case "text":
      return <p className="gc-helper-thread-item__text">{item.text}</p>;
    case "thinking":
      return <p className="gc-helper-thread-item__thinking">{item.text}</p>;
    case "note":
      return <p className="gc-helper-thread-item__note">{item.text}</p>;
    case "tool":
      return <ToolBody item={item} showToolDetails={showToolDetails} />;
    default:
      return null;
  }
}

interface ToolBodyProps {
  readonly item: Extract<ThreadItem, { kind: "tool" }>;
  readonly showToolDetails: boolean;
}

function ToolBody({ item, showToolDetails }: ToolBodyProps) {
  return (
    <div className="gc-helper-thread-item__tool">
      <span className="gc-helper-thread-item__tool-line">
        {item.running ? (
          <span className="gc-helper-thread-item__tool-dot" aria-hidden="true" />
        ) : item.isError ? (
          <span className="gc-helper-thread-item__tool-error" aria-hidden="true">
            ✕
          </span>
        ) : (
          <span className="gc-helper-thread-item__tool-check" aria-hidden="true">
            ✓
          </span>
        )}
        {summarizeTool(item)}
      </span>
      {showToolDetails && (
        <pre className="gc-helper-thread-item__tool-details">{JSON.stringify({ args: item.args, output: item.output }, null, 2)}</pre>
      )}
    </div>
  );
}
