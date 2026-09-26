# Gentle Shell Desktop, M1: chat core

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop. Tracker branch: `feat/desktop-m1-chat-core`. Locator: `odd/tasks/desktop-m1-chat-core.md`. Engram mirror: `odd/desktop-m1-chat-core/tasks` (project `gentle-ai`). Planning issue: gentle-shell-desktop#2. Visual reference: https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL

## Objective

A desktop window that lists pi chats, opens a new chat, and holds a plain-text conversation with Gentle through `gentle-shell --mode rpc`, answering extension dialogs inline, with the Gentleman-Cute look. No tool output, no thinking shown.

## Problem

Gentle Shell exists only inside pi's TUI. People who only want to get work done need a chat window, not a terminal.

## Why (evidence, 2026-09-21)

- pi `--mode rpc` (`packages/coding-agent/docs/rpc.md`): commands `prompt`, `abort`, `new_session`, `switch_session`, `get_state`, `get_messages`, `set_model`; events `agent_start`, `agent_settled`, `message_update` with `text_delta` separate from `thinking_delta`, `tool_execution_*` separate; dialogs as `extension_ui_request` (`select`, `confirm`, `input`, `editor`) answered by `extension_ui_response`; fire-and-forget `notify`, `setStatus`, `setWidget`.
- Sessions: `SessionManager.listAll()` from `@earendil-works/pi-coding-agent` returns id, cwd, name, created, modified, messageCount, firstMessage.
- Launcher (gentle-shell tracker `feat/gentle-shell-launcher`, tip `e78c6a12`): `gentle-shell [--link|--isolated|--home <dir>] --mode rpc` forwards flags to pi and sets `PI_CODING_AGENT_DIR`. Not yet on npm: depend on the git ref until a release ships.
- pi is a Node program, so Electron's bundled Node runs it in the main process without a sidecar (decision: Electron + React, chosen by the maintainer on 2026-09-21).

## Scope (authorized)

M1 only: scaffold, RPC adapter, session list, conversation UI with streaming and dialogs, first-run home choice, dev packaging. Out of scope for M1: helpers tab (M2), ODD panel (M3), providers and extensions screens (M4), signing and auto-update (M5), notifications and status bar (M6), reading the active pi theme (hardcode Gentleman-Cute tokens now).

## Constraints

- Stack: Electron + React + TypeScript (strict), Vite via `electron-vite`, pnpm, `electron-builder` for unsigned dev builds. Main process owns child processes and the session list; renderer is UI only; preload exposes a typed, minimal bridge.
- Strict TDD: enabled (source: user-level CLAUDE.md). Runner: `pnpm vitest run` (vitest, Node environment for main/protocol, jsdom for renderer). RED observed before implementation, GREEN, REFACTOR.
- Technical artifacts in English, neutral register. Conventional Commits. No AI attribution.
- Maintainer instructions (2026-09-21): verify the UI in a browser as work lands (renderer runs standalone with a mock bridge via `pnpm dev:web`; the orchestrator drives it with the browser tools and keeps screenshots as evidence); apply the maintainer's React skills: `react-19` code rules (named imports, no manual memoization, ref as prop) and the structure rules from the `angular` skill applied to React: Scope Rule (used by one feature → local; by two or more → `shared/`), Screaming Architecture (feature folders named by what the app does), container/presentational split, atomic design under `shared/ui`, hexagonal main process (domain, ports, adapters).
- Delivery strategy `ask-on-risk`; chain strategy cached from this session: `feature-branch-chain`. Tracker `feat/desktop-m1-chat-core`; slice branches `feat/desktop-m1-1-scaffold`, `-2-rpc`, `-3-sessions`, `-4-ui`, `-5-home`; PR1 targets the tracker, later PRs target the previous slice; only the tracker merges to `main`. Never merge a child with `--delete-branch` until the chain is complete.
- Receipt-driven development: on (global). After each work-unit commit run `gentle-ai review assess --cwd <repo> --agent claude-code --base-ref <last reviewed boundary> --committed-only --json`; consent for review is pre-granted by the maintainer (show the envelope, run `granted`). First boundary: `main` tip at feature start.
- Delivery so far: tracker PR #3 (draft, `feat/desktop-m1-chat-core`, opening commit) and PR #4 (slice 1, `c7972cb`, `type:feature` + `size:exception`).
- Forecast: ~2,500 authored changed lines across the milestone (scaffold ~300, protocol + adapter ~600, sessions ~250, UI ~900, home ~250, packaging ~150), excluding lockfiles and generated files.

## Tasks

- [x] T1 Scaffold: `electron-vite` project (main, preload, renderer), TypeScript strict, React, vitest with one smoke test per process, `pnpm dev`, `pnpm build`, `pnpm test`, `.gitignore`, `README` dev section, Gentleman-Cute design tokens as CSS variables (from gentle-pi `themes/Gentleman-Cute.json`) and the three font families. Route: delegated writer. Checks: `pnpm test`, `pnpm build`, `pnpm typecheck`.
- [x] T2 RPC protocol and adapter (main): pure codec for pi RPC JSON lines (encode commands, decode events, typed `ChatEvent` reducer that keeps only user/assistant text, working state, and dialogs), and a `PiSession` class that spawns `gentle-shell --mode rpc` with the chosen home flags, streams events, sends `prompt`/`abort`/`extension_ui_response`, and shuts down cleanly. Route: delegated writer. Checks: codec and reducer unit tests with recorded fixtures; adapter tests against a fake RPC script.
- [x] T3 Sessions (main + IPC), also absorbing the T2 advisory follow-ups: spawn JS launcher entries with a Node runtime under Electron (`ELECTRON_RUN_AS_NODE=1` with `process.execPath`, never a bare Electron spawn); route child stderr to a log instead of `lastError`; on unexpected exit reset `working`, drop pending dialogs and clear the process; guard `start()` against double start; do not append a user message while the assistant is streaming (queue it or reject): list sessions with `SessionManager.listAll()` under the resolved home, expose `sessions.list`, `chat.open(id)`, `chat.new()`, `chat.send`, `chat.abort`, `dialog.answer` through the preload bridge with typed IPC. Route: delegated writer. Checks: unit tests for the session mapping and the IPC contract.
- [x] T4 Renderer (also absorbs the T1 and T3 renderer follow-ups: one source of truth for the thread (pushed `ChatState` only; errors shown from `lastError`, not synthetic messages); `ConversationContainer` tests; register Testing Library `cleanup` in `test/setup.ts` or enable vitest globals; test the conversation reducer logic; make the theme test read the committed `gentleman-cute.json` fixture): sidebar with chats grouped by day and state (working / needs you / idle), conversation with streaming assistant text, "Working" pill, dialog cards (select, confirm, input) answered inline, composer (Enter sends, Shift+Enter newline, Esc aborts), Gentleman-Cute styling. Route: delegated writer. Checks: component tests with testing-library against the reducer state.
- [x] T5 First run and home, also absorbing the T3 host follow-ups and the T4 renderer follow-up (guard the chat-open effect against stale resolutions when the selection changes): serialize `ChatHost.startSession` (overlapping open/new calls), keep and call the `registerHandlers` unsubscribe when the window closes, await `chatHost.stop()` on `before-quit` with `preventDefault` and a bounded timeout, wire `onLog` to a main-process logger, report a prompt-while-working once (not through error event plus rejection), reset `working`/dialogs on a clean self-exit too: detect `~/.pi/agent`, offer "Use my pi setup" vs "Keep it separate", persist the choice in the app's userData config, pass `--link` / `--isolated` to the launcher; skip the screen when no pi is found. Route: delegated writer. Checks: unit tests for detection and config; component test for the screen.
- [x] T6 Dev packaging, also absorbing the T5 advisory follow-ups (handle `chooseHome` rejection with a visible message and retry; make `ChatHost.stop()` join the start chain; single source for the default-home and pi-dir rules; isolate mock bridge tests from module state) and the cosmetic polish seen in the browser (user bubble on raised background with accent border instead of solid accent; state pills never wrap): `electron-builder` config for unsigned macOS/Windows/Linux builds, app icon from gentle-pi assets, `pnpm package`. Route: inline or delegated. Checks: `pnpm package` produces an artifact on macOS.

## Acceptance criteria

- `pnpm dev` opens a window listing existing pi chats and lets the user start a new chat.
- Sending a message streams the assistant's text; thinking and tool events never appear.
- A `select`, `confirm` or `input` dialog from an extension renders as a card and its answer reaches pi.
- First run offers link vs isolated when `~/.pi/agent` exists; the choice persists and maps to launcher flags.
- `pnpm test`, `pnpm typecheck`, `pnpm build` pass; `pnpm package` produces an unsigned build.

## Progress and evidence

| Task | Route | Commit | Checks | Review |
|---|---|---|---|---|
| T1 | delegated writer (sonnet) | `f553ac1` + correction `c7972cb` on `feat/desktop-m1-1-scaffold` | RED→GREEN for theme, bridge and App tests (5), then 8 after the fix; typecheck clean; build ok; parent spot check `pnpm test` 8/8; browser check with ego-browser on `pnpm dev:web` (127.0.0.1:5174): sidebar, chats with state pills, composer and mock streamed reply render (screenshots `t1-scaffold.png`, `t1-after-send.png` in the session scratchpad) | assess: medium, `slice_budget_reached`; consent granted (standing instruction); 1 lens (reliability) → `correction_required` R3-electron-mount-crash CRITICAL (preload threw synchronously, no catch, blank window in Electron); plan 120 lines, fix `c7972cb` (119); scope changed → maintainer-authorized recovery to successor lineage `review-9b98b3cdc2e626c2-r1`; approved with 5 advisory findings; acknowledged, authority burned. Reviewed boundary → `c7972cb` |
| T2 | delegated writer (sonnet) | `222fcc6`, `8e7a6fa`, correction `394e7b1` on `feat/desktop-m1-2-rpc` | RED observed by stashing the implementation after writing it (not test-first order; recorded honestly), GREEN 52 + 10 new tests, then 73 total after the fix; typecheck and build clean; parent spot check 70/70 then 73/73 | assess: high (`process_boundary`); consent granted (standing instruction); 4 lenses → `correction_required` (3 CRITICAL: spawn failure never resolves `exited`, stdin write-after-end, writes after child death); plan 180 lines, fix `394e7b1` (111, no new files); targeted validation → `approved` with 24 advisory findings; acknowledged, authority burned. Reviewed boundary → `394e7b1` |
| T3 | delegated writer (sonnet) | `cf779f8`, `080dcd5`, `d32462d` on `feat/desktop-m1-3-sessions` | RED→GREEN per commit (7, 22, 19 new tests), 115 total; typecheck and build clean; parent spot check 115/115; browser check on the preview with the final bridge (screenshot `t3-preview.png`) | assess: high (`process_boundary`); consent granted (standing instruction); 4 lenses → `approved` without correction, 26 advisory findings; acknowledged, authority burned (lineage `review-f49ce88b954e723a`). Reviewed boundary → `d32462d` |
| T4 | delegated writer (sonnet) | `485dc04`, `427b836` on `feat/desktop-m1-4-ui` | RED→GREEN per component, 162 tests total; typecheck and build clean; parent spot check 162/162; browser check with ego-browser on the preview: day grouping with three state pills, question → select dialog card → answer (screenshots `t4-initial.png`, `t4-dialog.png`, `t4-answered.png`) | assess: medium (`slice_budget_reached`); consent granted (standing instruction); 1 lens → `approved`, 6 advisory findings; acknowledged, authority burned (lineage `review-71601674e9d356b7`). Reviewed boundary → `427b836` |
| T5 | delegated writer (sonnet) | `6bd9277`, `7f3dcf5`, `17ca575` on `feat/desktop-m1-5-home` | RED→GREEN per commit, 209 tests total; typecheck and build clean; parent spot check 209/209; browser check: first-run screen with the mockup copy, choosing "Use my pi setup" enters the chat layout (screenshots `t5-first-run.png`, `t5-after-choice.png`) | assess: high (`process_boundary`); consent granted (standing instruction); 4 lenses → `approved` without correction, 17 advisory findings; acknowledged, authority burned (lineage `review-fe3073bbdac55f2d`). Reviewed boundary → `17ca575` |
| T6 | delegated writer (sonnet) | `45be599`, `dad5b1b`, `33cdd85` on `feat/desktop-m1-6-packaging` | RED→GREEN for the follow-ups (218 tests total); typecheck and build clean; `pnpm smoke:electron` OK in real Electron (title "gentle shell", first-run screen rendered, `release/smoke.png`); `pnpm package:mac` produced `release/gentle shell-0.1.0-arm64.dmg` (156 MiB, unsigned); parent spot check 218/218 and artifact check. The smoke check exposed two dev-invisible bugs fixed in the same commit: `__dirname` redeclaration in the built ESM bundle and a missing `main` field in package.json | assess: medium (`slice_budget_reached`, configuration change); consent granted (standing instruction); 1 lens → `approved`, 4 advisory findings; acknowledged, authority burned (lineage `review-24823f558ee0fedd`). Reviewed boundary → `33cdd85` |

## Close (2026-09-22)

All six tasks done. Acceptance criteria met in the browser preview and in real Electron (smoke check); `pnpm test` 218, `pnpm typecheck`, `pnpm build`, `pnpm package:mac` pass. Not yet exercised: a real chat against pi through the launcher (needs the user's sign-ins in link mode or credentials in the isolated home; the launcher is resolved through `GENTLE_SHELL_BIN` until gentle-pi ships the bin on npm). Windows and Linux packages not built on this host.

Follow-ups for M2 (advisory, from lineage review-24823f558ee0fedd): `ChatHost.stop()` must swallow a rejected start chain before stopping; Electron prefixes IPC rejection messages with "Error invoking remote method", so the first-run error text should strip that prefix.

## Merged (2026-09-22)

Maintainer instruction: #4 to #9 merged into the tracker in order with merge commits (each next child retargeted to the tracker before its merge; slice branches deleted at the end). Tracker PR #3 then merged into `main` as `874f30e` (maintainer instruction); tracker branch deleted. M2 starts from `main`.

## Next step

Maintainer decisions: review and merge the chain (#4 → tracker, then #5, #6, #7, #8, #9, then tracker #3 → `main`); try a real chat with `GENTLE_SHELL_BIN=<gentle-pi>/bin/gentle-shell.mjs pnpm dev`. Then M2 (per-chat helpers) with the gentle-shell prerequisites: gentle-agents publisher over the RPC UI channel and the ask-user-question/choice RPC fallback.
