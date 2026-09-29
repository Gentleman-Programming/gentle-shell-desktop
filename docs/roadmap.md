# Roadmap

This document is the **extracted roadmap** of `gentle-shell-desktop`: the
milestone sequence, its dependencies, and the structural debts that condition
the order. It is not invented strategy — every item is deduced from what the
project already states in [`architecture.md`](./architecture.md),
[`system-design.md`](./system-design.md), the [`README`](../README.md) and the
feature documents under [`odd/tasks/`](../odd/tasks/).

Static structure lives in `architecture.md`; dynamic behaviour in
`system-design.md`; this file tracks **direction**.

## 1. Vision

A thin Electron desktop client over the pi agent runtime: a plain-chat window
with **per-chat helpers (subagents), ODD progress, providers and extensions**.
The app never embeds the agent — it always speaks to the `gentle-shell --mode
rpc` launcher as a versioned contract, never to pi's module graph.

## 2. M1 — Chat core — delivered

- Scaffold, RPC adapter (pure JSON-line codec), day-grouped session list,
  conversation UI with streaming and dialogs, first-run home choice
  (link vs isolated), dev packaging.
- Feature document: [`odd/tasks/desktop-m1-chat-core.md`](../odd/tasks/desktop-m1-chat-core.md).

## 3. M2 — Per-chat helpers — delivered

- `Chat \| Helpers` tab per chat, `setWidget` / `gentle-agents.activity/v1`
  pipeline, reconciliation of the lossy publisher, narrated helper thread,
  Playwright smoke of the built bundle.
- Feature document: [`odd/tasks/desktop-m2-helpers.md`](../odd/tasks/desktop-m2-helpers.md).

## 4. M3 — ODD progress panel

- Explicitly deferred in M1's out-of-scope list and named in the M2 closing
  decision: *"plan M3 (ODD panel, **needs the structured ODD document
  format**)"*.
- Scope: expose the state of `odd/tasks/<feature>.md` (tasks, checks, commits)
  over RPC and render it in the renderer.
- **External dependency**: gentle-pi must first publish that structured format
  — the same versioned-contract coupling pattern M2 used.

## 5. M4 — Providers and extensions screens

- In-app screens for providers and extensions, replacing the current flow of
  "manage it through `gentle-shell` in the terminal".
- Again contract-first with the launcher: no RPC commands for this exist yet.

## 6. M5 — Serious distribution

- **Code signing, notarization and auto-update** (today: unsigned builds,
  tested only on macOS Apple silicon; `package:win` / `package:linux` are
  configured but unverified).
- Resolves the documented README frictions: empty `PATH` from Finder, Gatekeeper
  blocking unsigned apps, manual `GENTLE_SHELL_BIN` setup.

## 7. M6 — Notifications and status bar

- Named in the M1 scope split; no further detail recorded yet.
- **Also deferred**: the active pi theme — Gentleman-Cute tokens are hardcoded
  today; reading the real theme was deliberately postponed.

## 8. Debts and risks that condition the order

Self-documented in `architecture.md` §10 and `system-design.md` §13; listed
here as roadmap constraints, not oversights.

1. **Two data paths to pi** — the most fragile seam: chat runs through the
   spawned CLI while sessions are read in-process via `SessionManager.listAll()`
   with a global `PI_CODING_AGENT_DIR` mutation. Not concurrency-safe; **blocks
   any multi-home / multi-session feature**.
2. **Single-session host** — one live `PiSession`; multi-chat tabs need a
   session registry and would break the position-derived message ids
   (`msg-N`). This is the structural prerequisite for most future UI scaling.
3. **Helper Stop is disabled** — gentle-agents exposes no stop command over RPC
   yet (external dependency, not an internal gap).
4. **Small follow-ups with clear owners**: resolve the bounded history wait
   when the child dies; auto-expand the helpers "Earlier" group; test coverage
   for the `openedAt` path; surface old-gentle-pi detection in the UI (today it
   degrades to an empty tab silently).

## 9. Shape of the sequence

The project follows a repeating rhythm, and the roadmap inherits it:

**each milestone = contract-first with the launcher → pure testable domain →
UI → smoke of the real bundle**, with a feature document under `odd/tasks/`
recording scope, decisions, checks and evidence.

Consequently:

- **M3/M4 require extending gentle-pi's RPC contract first.**
- **M5 is orthogonal** (release engineering; no contract change).
- **Debts 1 and 2 are the gate** to any UI scaling beyond one session.

## 10. Immediate next actions

1. Design the structured ODD document format on the gentle-pi side — the
   declared dependency of M3.
2. Alternatively, decouple by clearing the small follow-ups from
   `system-design.md` §13, none of which need a new contract.
