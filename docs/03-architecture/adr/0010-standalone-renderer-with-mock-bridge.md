# 0010. Run the renderer standalone against a mock bridge

> Status: draft.

## Context

The maintainer asked for the UI to be verified in a browser as work lands (`odd/tasks/desktop-m1-chat-core.md:29`). Browser automation cannot attach to an Electron `BrowserWindow` (`vite.web.config.ts:5-7`).

## Decision

The renderer runs standalone with a mock bridge via `pnpm dev:web`, and the UI is driven with browser tools, with screenshots kept as evidence (`odd/tasks/desktop-m1-chat-core.md:29`). M2 extended the mock with a helpers scenario (`odd/tasks/desktop-m2-helpers.md:19`).

## Consequences

- **One code path.** `useBridge()` returns `window.gentle` when present and `mockBridge` otherwise, so the same code runs in both modes (`src/renderer/shared/bridge/useBridge.ts:4-12`).
- **Mock size.** The mock is 489 lines and must track the real bridge.
- **Real data drifts.** The mock encodes the desktop's own assumptions, such as the `done` status and `callId`. See [audit A5](../audit.md#a5-helper-status-set-and-tool-items-do-not-match-gentle-shell).
- **No guard.** The fallback has no environment guard ([audit A15](../audit.md#a15-silent-mock-bridge-fallback-in-packaged-builds)).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:29`; `odd/tasks/desktop-m2-helpers.md:19`)
