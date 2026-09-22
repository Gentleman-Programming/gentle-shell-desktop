import type { HelpersSummary as HelpersSummaryType } from "@shared/bridge-types";
import { formatSummaryLine } from "../format";
import "./HelpersSummary.css";

export interface HelpersSummaryProps {
  readonly summary: HelpersSummaryType;
}

// Presentational: the "2 running · 1 queued · 1 finished" line above the
// helper list (format.ts's formatSummaryLine).
export function HelpersSummary({ summary }: HelpersSummaryProps) {
  return <p className="gc-helpers-summary">{formatSummaryLine(summary)}</p>;
}
