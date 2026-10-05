# Roadmap — memotux

Target-state roadmap for the Gentle Shell desktop application. This document
owns **sequencing and intent** for the evolution described in
[`system-design.md`](./system-design.md) (target design);
[`architecture.md`](./architecture.md) remains the record of what is implemented
today. No calendar dates: milestones are ordered by dependency and risk, and the
horizon sharpens toward the frontier only.

**Authority map:** `architecture.md` (implemented, static structure) ·
`system-design.md` (target-state design) · this document (sequence and
rationale for getting from one to the other).

---

## 1. Sequencing strategy

Two rules order every milestone; anything else is negotiable:

1. **Dependency first** — work that unlocks or constrains later work comes early.
2. **Risk first** — the largest uncertainty is retired earliest, while changing
   course is cheap.

The three load-bearing dependencies in this system are:

- **Evidence before structure.** The riskiest planned change (multi-session
  registry) mutates the transport and supervisor. Building the fake-child test
  harness first means every later structural change carries evidence.
- **Concurrency-safe identity before concurrency.** Position-derived message
  ids (`msg-${state.messages.length}`) break under concurrent surfaces; the
  durable cursor migration must precede the registry, or milestone 3 ships a
  latent bug.
- **Contracts before screens.** Providers and Extensions screens are blocked on
  app-level contracts the source documents explicitly leave unspecified; the
  decision gate retires that uncertainty before any UI work.

Explicitly rejected sequencing: starting with visible screens (Providers,
Extensions) because they demo well — their contracts are the largest unknowns,
and building UI against an unconfirmed contract manufactures rework.

---

## 2. Milestones

### M0 — Decision gate (unlocks everything)

**Outcome:** no product policy becomes accidental behaviour in the process
manager or the UI.

Resolve the open decisions inherited from
[`system-design.md`](./system-design.md) §9 and
[`pi-electron-session-process-design.md`](./pi-electron-session-process-design.md)
§12, recording choice **and reason** for each:

| # | Decision | Blocks |
|---|---|---|
| 1 | Inactive conversation children: alive vs stop/reopen | M3 |
| 2 | Maximum active children; warning/queue/eviction policy | M3 |
| 3 | Multi-window attachment and dialog/close ownership | open tail |
| 4 | Session persistence, delete, duplicate-open, recovery semantics | M3 |
| 5 | Supported extension UI methods/widgets; timeout/cancel policy | M6 |
| 6 | Extension installation/permission/activation model | M6 |
| 7 | Provider catalog, auth flows, credential persistence, model availability | M5 |
| 8 | Supported pi version range; launcher-resolution/update policy | recurring gate |
| 9 | Supervisor in main vs Utility Process host | open tail (evidence-gated) |
| 10 | First-run setup detection summary and persistence | M7 |

**Exit evidence:** each decision has a written choice, reason, and rejected
options; decisions 1, 2, 4, 7 are resolved (hard blockers); 3, 5, 6, 9, 10 may
be resolved just-in-time before their consuming milestone.

**Risk retired:** the entire plan currently hangs on policies that do not exist.
This is the cheapest milestone and the highest-uncertainty one.

### M1 — Verification foundation

**Outcome:** every later structural change carries mechanical evidence instead
of hope.

Build the fake-child test harness and recorded protocol fixtures, per
[`pi-electron-session-process-design.md`](./pi-electron-session-process-design.md)
§10 and [`pi-rpc-mode.md`](./pi-rpc-mode.md) §10:

- pure protocol tests: LF-only framing, CRLF tolerance, embedded U+2028/U+2029,
  malformed/blank/unknown records (including undocumented `extension_error`),
  bounded input;
- transport tests with fake children: concurrent requests, out-of-order
  responses, id correlation, backpressure, stream close, stdout/stderr
  separation;
- supervisor tests on the **current single-session host**: idempotent stop,
  app-shutdown deadline, settled-vs-accepted state modelling;
- one real-child smoke test pinned to the supported pi version
  (`@earendil-works/pi-coding-agent` 0.87.1 today).

**Exit evidence:** the listed test layers pass without launching Electron;
a fake child proves the adapter contract and a real-child smoke proves
compatibility. This reuses and extends the existing hexagonal seam
(`ProcessSpawner` port) rather than adding a new one.

**Risk retired:** the adapter contract is currently proven only by the running
app; every milestone after this one mutates exactly that contract.

### M2 — Durable session cursor

**Outcome:** conversation history and catch-up are correct under any future
concurrency, across client restarts.

Migrate from position-derived message ids and `get_messages` backfill to the
`get_entries` `since`-cursor
([`system-design.md`](./system-design.md) §4), keeping
delta-reconstruction and `message_end` reconciliation semantics unchanged.

**Exit evidence:** cursor tests including unknown-`since` failure handling;
reopen/restart catch-up returns only newer entries; renderer id stability under
interleaved appends.

**Debt paid:** architecture limitation #4, retired *before* multi-session makes
it a live bug instead of a documented caveat.

### M3 — Multi-session registry (the target invariant)

**Outcome:** a user works across conversations with no cross-talk, no duplicate
writers, and independent failure containment per conversation.

Implement the main-process conversation registry — one RPC child per active
conversation, lifecycle policy from decisions 1–2, duplicate-ownership
prevention, idempotent cleanup, generation/attachment tokens rejecting late
events — and unify the session-identity seam: the current two access paths to
pi data (spawned CLI vs in-process `SessionManager.listAll()`) and the global
`PI_CODING_AGENT_DIR` env mutation converge on one home-consistent conversation
identity owned by the registry.

**Exit evidence:** supervisor tests for one-child-per-session, independent
routing, reopen, exit isolation, bounded shutdown; UI test: multiple
conversations without cross-talk; no global env mutation remains.

**Debt paid:** architecture limitations #1, #2 (fragile seam, env race) and #3
(single-session host — resolved by this milestone's design).

**Why not first:** this is the highest-risk structural change in the plan; M1
supplies its evidence engine and M2 removes its known correctness trap.

### M4 — Providers screen and credential contract

**Outcome:** users connect and manage model providers with credentials that
never cross the renderer boundary.

Implement the Providers screen against the contract resolved in M0 decision 7:
safe provider display data, sign-in/key-entry operations as named validated
preload methods, main-owned credential handling applied at child launch.

**Exit evidence:** provider screen tests; negative security tests proving no
keys, tokens, credential files, or environment values reach the renderer; main
applies provider configuration via controlled launch configuration only.

**Dependencies:** M0 (decision 7). Independently sequenced from Extensions;
the two may swap order without structural impact — the reason Providers is
first is that its contract is the larger unknown and M0 should retire it while
attention is fresh.

### M5 — Extensions screen and package contract

**Outcome:** users manage extension packages and settings safely, and extension
dialogs are always answerable or timed out.

Implement the Extensions screen against decisions 5–6: package
install/update/removal model, permission model, activation semantics ("applies
to new chats" confirmed as product rule), plus the runtime half already
specified — main validates `extension_ui_request` against the allowlist,
binds dialogs to the originating conversation/child, validates answers against
original allowed values, enforces explicit timeout/cancel policies.

**Exit evidence:** dialog answer-validation tests bound to the owning child;
unsupported-method handling tests; cancellation/timeout tests proving no child
blocks indefinitely.

**Dependencies:** M0 (decisions 5–6); M3 for dialog-to-conversation binding at
scale.

### M6 — Theme canon and shell polish

**Outcome:** the provisional visual system becomes production-grade and
reviewable.

Confirm the provisional tokens against source design assets, define semantic
hover/focus/disabled/error/high-contrast states, enforce the "never status by
color alone" rule, and complete the shared-shell components from
[`frontend-renderer-design.md`](./frontend-renderer-design.md) with its
acceptance checklist.

**Exit evidence:** checklist items checked in the renderer design doc; theme
resolution tests; contrast verification.

**Parallel-capable:** this milestone has no structural dependency; it can run
alongside M3–M5 whenever capacity allows. It is sequenced last among the
committed milestones because it blocks nothing — ordering by dependency and
risk means non-blocking polish waits.

---

## 3. Recurring gate — release qualification (every release, not a milestone)

Not a milestone: a gate that re-runs at every release.

- Re-verify the protocol against the installed pi version
  ([`pi-rpc-mode.md`](./pi-rpc-mode.md): details are version-specific; re-check
  `pi --help` and package docs on major upgrades) and refresh recorded fixtures.
- Real-child smoke + packaged smoke on supported platforms (launcher resolution,
  resource paths, startup, clean shutdown).
- Security review per
  [`electron-system-design.md`](./electron-system-design.md): fuses, packaged
  configuration, dependency currency, and the denied-path tests.
- Surface the supported-version detection in the UI (decision 8's user-facing
  half; today an older launcher silently degrades helper features to an empty
  tab — architecture limitation #5's visible half).

---

## 4. Open tail (deliberately uncommitted)

Intent-level themes, no scope, no sequence promises:

- **Multi-window support** (decision 3) — attachment sharing, dialog/close
  ownership. Waits for M3's registry to exist and for a user case.
- **Utility Process host** (decision 9) — adopt only on measured evidence that
  the main-process supervisor harms lifecycle responsiveness or reliability.
  The architecture must not grow this hop speculatively.
- **Launcher update policy** (decision 8's operational half) — resolution and
  update mechanics for the gentle-pi launcher contract.

---

## 5. Debt register

Known structural debts, each with its paydown milestone or an explicit reason
for deferral. A debt without a row here is invisible scope creep.

| Debt (from [`architecture.md`](./architecture.md) §10) | Paydown |
|---|---|
| #1 Two access paths to pi data (CLI vs in-process) — most fragile seam | **M3** (session-identity unification) |
| #2 Global env mutation for session listing; concurrent homes race | **M3** |
| #3 Single-session host, no registry | **M3** (by design) |
| #4 Position-derived message ids break under concurrency | **M2** (durable cursor) |
| #5 Version coupling to launcher; degradation not surfaced in UI | **Recurring gate** (UI surfacing); full policy in open tail |

---

## 6. Invariants (do not move without major cause)

These sequence decisions are structural; re-sequencing them invalidates the
plan rather than adjusting it:

1. **M1 before M3** — the multi-session registry is the riskiest change and
   must land with an evidence engine already in place.
2. **M2 before M3** — concurrency must not be built on position-derived ids.
3. **M0's hard decisions (1, 2, 4, 7) before their consuming milestones** —
   unresolved policy must not become accidental behaviour.
4. **Renderer authority ceiling** (from
   [`system-design.md`](./system-design.md) §5.3) — no
   milestone ships a screen by weakening the renderer's capability boundary.

## 7. Change protocol

The roadmap is renegotiated, not executed blindly. Re-sequencing triggers:

- a **failed assumption**: an M0 decision resolves differently than the
  milestone assumed;
- a **pi version change**: major upgrade forces a recurring-gate re-run before
  further feature milestones;
- an **incident** in a debt area: the owning milestone pulls forward;
- new **evidence** on decision 9: measured supervisor load promotes the open
  tail into a committed milestone.

Authority: the maintainer decides; this document records the change and its
reason as a new row in each affected milestone's decision log, never as silent
edits to sequence.
