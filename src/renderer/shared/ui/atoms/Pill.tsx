import type { ReactNode } from "react";
import "./Pill.css";

export const PILL_TONE = {
  NEUTRAL: "neutral",
  WORKING: "working",
  NEEDS_YOU: "needs-you",
} as const;

export type PillTone = (typeof PILL_TONE)[keyof typeof PILL_TONE];

export interface PillProps {
  readonly children: ReactNode;
  readonly tone?: PillTone;
}

export function Pill({ children, tone = PILL_TONE.NEUTRAL }: PillProps) {
  return <span className={`gc-pill gc-pill--${tone}`}>{children}</span>;
}
