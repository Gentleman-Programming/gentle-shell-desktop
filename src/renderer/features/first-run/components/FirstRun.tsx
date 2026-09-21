import { HOME_MODE, type HomeMode, type PiDetection } from "@shared/bridge-types";
import { Button } from "@renderer/shared/ui/atoms/Button";
import "./FirstRun.css";

export interface FirstRunProps {
  readonly detection: PiDetection;
  readonly onChoose: (mode: HomeMode) => void;
  /** Set by FirstRunContainer when the last chooseHome() call rejected
   * (T6 follow-up); undefined otherwise. */
  readonly error?: string;
  /** Re-attempts the same mode that just failed. Only ever rendered
   * alongside `error`, so FirstRunContainer always provides both together. */
  readonly onRetry?: () => void;
}

/**
 * Presentational (FirstRunContainer owns the bridge call and the choice
 * callback): the M1 first-run screen's fixed copy (see the ODD task doc's
 * T5 mockup copy) — a detection card when pi was found, and the two
 * link/isolated option cards. App.tsx only mounts this when
 * SetupStatus.needsChoice is true, but the detection card still guards on
 * `detection.found` defensively (a stale/mocked status could report
 * needsChoice without a real detection).
 */
export function FirstRun({ detection, onChoose, error, onRetry }: FirstRunProps) {
  return (
    <div className="gc-first-run">
      <div className="gc-first-run__card">
        <h1 className="gc-first-run__title">Welcome to gentle shell</h1>
        <p className="gc-first-run__lead">Everything you need is already inside this app. One question before you start.</p>

        {error && (
          <div className="gc-first-run__error" role="alert">
            <p className="gc-first-run__error-message">{error}</p>
            <Button type="button" variant="ghost" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}

        {detection.found && (
          <div className="gc-first-run__detection">
            <p className="gc-first-run__detection-title">We found pi on this machine</p>
            <p className="gc-first-run__detection-detail">{detectionSummary(detection)}</p>
            <p className="gc-first-run__detection-path">{detection.dir}</p>
          </div>
        )}

        <div className="gc-first-run__options">
          <FirstRunOption
            title="Use my pi setup"
            recommended
            bullets={[
              "Your sign-ins, local models and chats appear here",
              "Chats you start here also show up in your terminal",
              "Your pi settings are never edited",
            ]}
            footnote="links to ~/.pi/agent"
            onChoose={() => onChoose(HOME_MODE.LINK)}
          />
          <FirstRunOption
            title="Keep it separate"
            bullets={[
              "A clean space with its own sign-ins and chats",
              "Nothing on this machine is touched",
              "You can link to pi later from Providers",
            ]}
            footnote="creates ~/.gentle-shell/agent"
            onChoose={() => onChoose(HOME_MODE.ISOLATED)}
          />
        </div>

        <p className="gc-first-run__fine-print">
          No pi on the machine? This screen is skipped and gentle shell starts in its own space.
        </p>
      </div>
    </div>
  );
}

function detectionSummary(detection: PiDetection): string {
  const found: string[] = [];
  if (detection.hasAuth) found.push("sign-ins");
  if (detection.hasModels) found.push("local models");
  return found.length > 0 ? `Found: ${found.join(" and ")}` : "No sign-ins or local models found yet";
}

interface FirstRunOptionProps {
  readonly title: string;
  readonly recommended?: boolean;
  readonly bullets: readonly string[];
  readonly footnote: string;
  readonly onChoose: () => void;
}

function FirstRunOption({ title, recommended = false, bullets, footnote, onChoose }: FirstRunOptionProps) {
  const classes = ["gc-first-run__option", recommended ? "gc-first-run__option--recommended" : ""].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="gc-first-run__option-header">
        <h2 className="gc-first-run__option-title">{title}</h2>
        {recommended && <span className="gc-first-run__option-badge">Recommended</span>}
      </div>
      <ul className="gc-first-run__option-bullets">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <p className="gc-first-run__option-footnote">{footnote}</p>
      <Button type="button" variant={recommended ? "primary" : "ghost"} onClick={onChoose}>
        {title}
      </Button>
    </div>
  );
}
