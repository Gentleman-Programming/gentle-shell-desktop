import type { ReactNode } from "react";
import "./Pill.css";

export const PILL_TONE = {
  NEUTRAL: "neutral",
  WORKING: "working",
  NEEDS_YOU: "needs-you",
  /** D3 Helpers tab: a running helper's status pill (HelperThread header). */
  RUNNING: "running",
  /** D3 Helpers tab: a helper waiting on a dialog answer. */
  WAITING: "waiting",
  /** D3 Helpers tab: a finished, successful helper. */
  DONE: "done",
  /** D3 Helpers tab: a helper that errored out. */
  FAILED: "failed",
} as const;

export type PillTone = (typeof PILL_TONE)[keyof typeof PILL_TONE];

export interface PillProps {
  readonly children: ReactNode;
  readonly tone?: PillTone;
}

export function Pill({ children, tone = PILL_TONE.NEUTRAL }: PillProps) {
  return <span className={`gc-pill gc-pill--${tone}`}>{children}</span>;
}
