# Gentle Shell Desktop, M2: per-chat helpers

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop. Base: `main` (M1 merged as `874f30e`). Tracker: `feat/desktop-m2-helpers` (feature-branch-chain, cached choice), merged to `main` when M2 is done. Locator: `odd/tasks/desktop-m2-helpers.md`. Engram mirror: `odd/desktop-m2-helpers/tasks` (project `gentle-ai`). Planning issue: gentle-shell-desktop#2. Visual reference: the "Helpers" tab in https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL

## Objective

Inside each chat, a "Helpers" tab shows the subagents that chat started (queued, running, waiting, done, failed), the selected helper's thread as plain narration with tools collapsed to one line, and Follow live / Back to chat / Stop. Never a global list: the parent-child relation stays direct (maintainer decision, 2026-09-21).

## Prerequisites (gentle-shell, feature `rpc-interactive-host`)

- The app sets `GENTLE_SHELL_INTERACTIVE_HOST=1` on the pi process it spawns; only then gentle-pi enables RPC dialogs for `ask_user_question` / `ask_user_choice` and publishes subagent activity.
- gentle-agents publishes `extension_ui_request` with `method: "setWidget"`, `widgetKey: "gentle-agents"`, `widgetLines: [json]` where the JSON follows `gentle-agents.activity/v1`: `{ schema, summary: { running, queued, waiting, finished }, tasks: [{ summary: <TaskRecord whitelist: id, agent, label, prompt, status, createdAt, startedAt, endedAt, lastStep, lastActivityAt, turns, toolCalls, error>, thread: { version, dropped, items: [{ kind: text|thinking|tool|note, ... }] } }] }` (exact field list from the gentle-shell doc `docs/gentle-agents-activity.md` once P2 lands).

## Scope (authorized)

- D1 Protocol: decode `setWidget` requests with `widgetKey === "gentle-agents"` into a typed `HelpersActivity`; the chat reducer keeps `helpers: HelpersActivity` per chat; ignore other widget keys. Fixture-driven tests.
- D2 Host: `PiSession` env gains `GENTLE_SHELL_INTERACTIVE_HOST=1`; `ChatState` carries `helpers`; IPC/bridge unchanged except the state shape.
- D3 Renderer: `features/conversation` gains a `Chat | Helpers` tab in the header with the running count; `features/helpers/` (screaming: what the app does) with `HelpersContainer` → `HelperList` (status dot, elapsed, steps), `HelperThread` (Task, Plan, Step N collapsed tool lines with "Show tool details" toggle off by default, Note in amber), footer Follow live / Back to chat / Stop (Stop is a no-op until gentle-agents exposes a stop command over RPC; show it disabled with a tooltip). Helper rows under the assistant message that started them open the tab.
- D4 Mock bridge: a "working" chat with three helpers and a streaming thread so `pnpm dev:web` shows the tab; browser verification with screenshots.
- D5 Docs: README section for the Helpers tab and the environment variable.

Out of scope: stopping helpers (needs an RPC command in gentle-agents), notifications, ODD panel.

## Constraints

Same as M1: Electron + React + strict TypeScript, vitest strict TDD, Scope Rule and Screaming Architecture, container/presentational, atomic `shared/ui`, hexagonal main; browser verification after UI tasks; RDD on with pre-granted consent; English artifacts; Conventional Commits; never `--delete-branch` mid-chain; never `git checkout` while a writer is active.

Forecast: ~900 authored changed lines (protocol ~200, host ~100, renderer ~500, mock and docs ~100) → feature-branch-chain with tracker `feat/desktop-m2-helpers` and slices `-1-protocol`, `-2-ui`, `-3-mock-docs`.

## Tasks

- [x] D1 Protocol and reducer (main domain). Route: delegated writer. Checks: RED→GREEN with fixtures.
- [x] D2 Host env and state shape. Route: same writer as D1 (one slice). Checks: PiSession test asserts the env var on spawn.
- [x] D3 Helpers tab UI (also absorbing the D1 advisory: `toIsoString` must guard out-of-range or non-finite epoch values instead of throwing). Route: delegated writer. Checks: component tests; browser check.
- [x] D4 Mock bridge scenario. Route: same writer as D3. Checks: browser screenshots.
- [x] D5 Docs and the D3 advisory follow-up (move the Follow-live sentinel inside the scrolling `.gc-helper-thread__items` container, with a test that the sentinel is a descendant of the scroll container). Route: delegated writer. Checks: RED→GREEN, readback.

## Acceptance criteria

- With gentle-pi P2 installed and the variable set, starting a subagent in a chat shows it in that chat's Helpers tab within a second, with live thread updates.
- The tab never shows helpers from other chats.
- Tool details are hidden by default and shown on toggle.
- `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm smoke:electron` pass.

## Progress and evidence

| Task | Route | Commit | Checks | Review |
|---|---|---|---|---|
| D1 | delegated writer (sonnet) | `a5a115d` on `feat/desktop-m2-1-protocol` | RED→GREEN (68 rpc tests); note: commit 1 alone does not typecheck, fixed by commit 2 | slice reviewed together with D2 |
| D2 | same writer | `b7dc77b` | RED→GREEN (17 PiSession tests); `pnpm test` 236, typecheck and build clean; parent spot check 236/236 | assess: medium (`slice_budget_reached`); consent granted (standing instruction); 1 lens → `approved`, 3 advisory findings; acknowledged, authority burned (lineage `review-0bc93d94e9b019aa`). Reviewed boundary → `b7dc77b` |
| D3 | delegated writer (sonnet) | `2732df0` (timestamp guard), `bca53cd` on `feat/desktop-m2-2-ui` | RED→GREEN per component; parent spot check 284/284; browser check with ego-browser: Chat/Helpers tabs, summary line, list with running/waiting/done, thread rows Task/Plan/Step/Update (screenshots `m2-chat-strip.png`, `m2-helpers.png`) | slice reviewed with D4 |
| D4 | same writer | `b2d3dbf` | RED→GREEN (mock scenario tests); `pnpm test` 284, typecheck and build clean | assess: medium (`slice_budget_reached`); consent granted (standing instruction); 1 lens → `approved`, 5 advisory findings; acknowledged, authority burned (lineage `review-0d19f812b8b0fc06`). Reviewed boundary → `b2d3dbf` |
| D5 | delegated writer (sonnet) | `0cfe5f4`, `137250b` on `feat/desktop-m2-3-docs` | RED→GREEN (sentinel inside the scroll container, scrollIntoView gated by Follow live); wrap fix CSS-only; `pnpm test` 286, typecheck and build clean; parent browser check: thread pane scrollWidth == clientWidth (no horizontal overflow) | assess: medium, `under_budget` (82 lines), no review due; boundary stays `b2d3dbf` with this slice pending in the budget |

## Close (2026-09-22)

End-to-end run against a real pi (gentle-pi worktree `test/desktop-integration` = launcher tracker + rpc-interactive-host, isolated home seeded with the maintainer's credentials): a delegation prompt showed `Helpers (1 running)` within 15 s and the reply arrived at ~30 s. Follow-up merged into the tracker: `b2d0a95` retains finished helpers (gentle-agents drops them from memory once persisted). `pnpm dev:local-pi` (`c14bda6`) runs the app against the worktree. Link mode now works with the gentle-pi worktree (`test/desktop-integration` at `38f18ab4`: launcher take-over for path-declared packages, loose extensions injected file by file). Second M1 gap fixed and merged: opening an existing chat now loads its history (`c0d4b92`, review-803a7950db0f7527; follow-ups: reject history responses when none is pending, resolve the history wait on error/exit).

All five tasks done; 286 tests, typecheck, build green; Helpers tab verified in the browser with the mock scenario. Real data requires gentle-pi with `rpc-interactive-host` (gentle-shell #1328, #1329, P3 pending). Chain merged into tracker `feat/desktop-m2-helpers` (PRs #10, #11, #12).

## Real-run follow-ups merged into the tracker (2026-09-22)

- #13 `b2d0a95` retain finished helpers; #14 `c0d4b92` load history when opening a chat; #15 `f96d29f` drop empty assistant messages; #16 `53497af` sanitized Markdown replies; #17 `e3b5570` Earlier group for helpers finished before the chat was opened (maintainer choice). Tracker at `2bdd92a`, 348 tests. gentle-shell side: #1333, #1334, #1335 (launcher link-mode take-over and loose extensions), #1337 (session-scope tests); worktree `test/desktop-integration` at `731cb9e6`.
- Verified against the maintainer's real home: session-scoped helper frames (26 of 200 stored tasks), link mode without tool conflicts, loose extensions loaded.
- Open follow-ups: history-response correlation with no pending request; history wait resolving on error/exit; Earlier group auto-expanding when the selection moves into it; tests for unparseable timestamps and `openedAt` wiring.

## Next step

Maintainer decision: merge tracker `feat/desktop-m2-helpers` to `main`. Then verify end to end with a real pi and gentle-pi from the P3 branch (`GENTLE_SHELL_BIN`), and plan M3 (ODD panel, needs the structured ODD document format).
