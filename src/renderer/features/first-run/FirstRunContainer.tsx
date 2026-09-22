import { useEffect, useState } from "react";
import type { HomeMode, PiDetection } from "@shared/bridge-types";
import { useBridge } from "@renderer/shared/bridge/useBridge";
import { FirstRun } from "./components/FirstRun";

export interface FirstRunContainerProps {
  /** Called once the user's choice has been persisted, so App.tsx can
   * switch to the normal chat layout. */
  readonly onDone: () => void;
}

const EMPTY_DETECTION: PiDetection = { found: false, dir: "", hasAuth: false, hasModels: false };

/**
 * First-run container: owns the bridge.setupStatus()/chooseHome() calls
 * and hands the plain detection to the presentational FirstRun
 * (container/presentational split, see src/README.md). App.tsx only
 * mounts this when SetupStatus.needsChoice was already true, so this
 * fetches setupStatus() again purely for its `detection` (the render
 * needed for the screen's own detection card), not to re-decide whether
 * to show itself.
 */
export function FirstRunContainer({ onDone }: FirstRunContainerProps) {
  const bridge = useBridge();
  const [detection, setDetection] = useState<PiDetection>(EMPTY_DETECTION);

  useEffect(() => {
    let cancelled = false;
    bridge.setupStatus().then((status) => {
      if (!cancelled) setDetection(status.detection);
    });
    return () => {
      cancelled = true;
    };
  }, [bridge]);

  const handleChoose = (mode: HomeMode): void => {
    void bridge.chooseHome(mode).then(onDone);
  };

  return <FirstRun detection={detection} onChoose={handleChoose} />;
}
