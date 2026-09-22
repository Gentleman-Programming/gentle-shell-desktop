/**
 * Races an async `stop()` against a timeout so app shutdown (Electron's
 * `before-quit`, T5) never hangs waiting for a child process that refuses
 * to exit. Pure and dependency-free (no Electron/Node import) so it is
 * unit-testable with fake timers — see src/main/index.ts's before-quit
 * handler for the real caller.
 */
export async function boundedStop(stop: () => Promise<void>, timeoutMs: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });

  try {
    await Promise.race([stop(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
