# Roadmap

This roadmap summarizes the project’s stated direction, ordering constraints, and
open dependencies. It is derived from [`architecture.md`](./architecture.md),
[`system-design.md`](./system-design.md), the [`README`](../README.md), and the
feature records under [`odd/tasks/`](../odd/tasks/). It does not replace those
sources: architecture describes static structure; system design describes
runtime behavior; this document describes direction.

> **Proposed update:** Success checks below are suggestions for making milestones
> verifiable. They should be confirmed by the project owner before being treated
> as commitments. Timing and ownership are intentionally unspecified because the
> source documents do not establish them.

## Vision

A thin Electron desktop client over the pi agent runtime: a plain-chat window
with per-chat helpers (subagents), ODD progress, providers, and extensions.
The app never embeds the agent; it communicates with the `gentle-shell --mode
rpc` launcher through a versioned contract, not pi’s module graph.

## Milestones

Status: **Delivered** means documented as complete; **Next candidate** means a
possible next step, not a scheduled commitment; **Planned** means recorded for
future consideration; **Blocked** means an external or structural prerequisite
is outstanding.

### M1 — Chat core · Delivered

- **Purpose:** Establish the Electron chat client over RPC.
- **Scope delivered:** Scaffold, RPC adapter (pure JSON-line codec), day-grouped
  session list, streaming conversation UI and dialogs, first-run home choice
  (link vs isolated), and development packaging.
- **Suggested success check:** A user can choose a home, send a message, and see
  a streamed response in the Electron window.
- **Record:** [`odd/tasks/desktop-m1-chat-core.md`](../odd/tasks/desktop-m1-chat-core.md)

### M2 — Per-chat helpers · Delivered

- **Purpose:** Show helper activity in the context of a chat.
- **Scope delivered:** `Chat | Helpers` tab, `setWidget` /
  `gentle-agents.activity/v1` pipeline, reconciliation of the lossy publisher,
  narrated helper thread, and a Playwright smoke test of the built bundle.
- **Suggested success check:** Helper activity and its thread appear in the
  Helpers tab, and the documented built-bundle smoke test passes.
- **Record:** [`odd/tasks/desktop-m2-helpers.md`](../odd/tasks/desktop-m2-helpers.md)

### M3 — ODD progress panel · Blocked on contract

- **Purpose:** Show task, check, and commit state for a feature in the desktop
  app.
- **Recorded scope:** Expose `odd/tasks/<feature>.md` state over RPC and render
  it in the renderer.
- **Suggested success check:** The displayed task/check/commit state agrees
  with the structured source document.
- **Prerequisite:** gentle-pi must publish a structured ODD document format as
  a versioned RPC contract. The M2 closing decision explicitly says this panel
  needs that format.
- **Next decision:** Agree on the data contract with gentle-pi before estimating
  or committing to renderer scope.

### M4 — Providers and extensions screens · Planned; scope open

- **Purpose:** Provide in-app screens for provider and extension management,
  replacing the currently documented terminal-based management flow.
- **Known constraint:** No RPC commands for this exist in the current launcher
  contract, so contract work is a prerequisite.
- **Open scope questions:** Which provider and extension operations should the
  screens support? The source documents do not yet define this.
- **Next decision:** Define the user operations and contract before writing
  acceptance criteria or treating this as schedulable work.

### M5 — Distribution · Planned

- **Purpose:** Address the distribution gaps documented by the project.
- **Recorded scope:** Code signing, notarization, and auto-update; verify the
  configured Windows and Linux package targets, which are currently unverified.
- **Known user frictions:** Finder’s empty `PATH`, Gatekeeper blocking unsigned
  apps, and manual `GENTLE_SHELL_BIN` setup (as documented in the README).
- **Suggested success check:** Define a first-run and upgrade test for each
  supported platform, including the documented launch/setup frictions.
- **Dependencies and unknowns:** This is orthogonal to the M3/M4 RPC contract
  work. Signing credentials, update hosting, platform support, and the exact
  release process are not established in the source documents.

### M6 — Notifications and status bar · Planned; scope open

- **Recorded scope:** Notifications and a status bar, named in the M1 scope
  split. Further detail is not recorded.
- **Related deferred work:** Reading the active pi theme was deliberately
  postponed; Gentleman-Cute tokens are hardcoded today.
- **Open questions:** Which events should notify the user, what status should be
  shown, and whether theme support belongs in this milestone.
- **Next decision:** Define the user problem and observable behavior before
  estimating or committing to scope.

## Ordering constraints

The project’s documented implementation rhythm is:

```text
launcher contract → pure testable domain → UI → smoke test of the real bundle
```

- M3 and M4 require launcher contract work first.
- M5 does not depend on those contract changes and may be considered separately.
- The structural debts below constrain future multi-session or broader UI work.

## Structural debts and risks

These are documented in `architecture.md` §10 and `system-design.md` §13. They
are ordering constraints, not newly discovered scope.

| Debt | Consequence |
|---|---|
| Two data paths to pi: chat uses a spawned CLI, while session listing uses in-process `SessionManager.listAll()` and a global `PI_CODING_AGENT_DIR` mutation. The mutation is not concurrency-safe. | Blocks multi-home/multi-session work. |
| One live `PiSession`; multi-chat tabs need a session registry and would conflict with position-derived message IDs (`msg-N`). | Structural prerequisite for scaling beyond the current single-session host. |
| Helper Stop is disabled because gentle-agents exposes no stop command over RPC. | User-initiated helper cancellation depends on an external contract change. |
| Follow-ups: resolve the bounded history wait when the child dies; auto-expand the Helpers “Earlier” group; test the `openedAt` path; surface old-gentle-pi detection instead of silently showing an empty tab. | Small robustness and polish items; see `system-design.md` §13 for ownership/context. |

## Immediate next steps

1. Decide whether to pursue the gentle-pi structured ODD document contract for
   M3, and agree on its shape before desktop implementation.
2. While that dependency is unresolved, decide whether to take up the documented
   small follow-ups that do not require a new contract.
3. Define M4–M6 scope and observable success checks before assigning dates or
   making delivery commitments.

## Roadmap maintenance

- Treat statuses as direction, not dates or delivery promises; add a time horizon
  only when the project has made that decision.
- Before promoting a milestone to committed work, record its scope, dependencies,
  and observable success checks in a feature document under `odd/tasks/`.
- When a milestone closes, link its feature record and verification evidence.
- When scope or ordering changes, record the rationale here and update the
  relevant source document if the underlying project decision changed.
