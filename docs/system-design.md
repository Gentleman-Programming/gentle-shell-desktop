# Gentle Shell System Design — memotux

A consolidated system design for the Gentle Shell desktop application. It
synthesizes four authoritative sources:

- [`pi-rpc-mode.md`](./pi-rpc-mode.md) — the pi RPC wire protocol (source of truth for the protocol).
- [`electron-system-design.md`](./electron-system-design.md) — the project-agnostic Electron process, IPC, security, debugging, and testing guide.
- [`pi-electron-session-process-design.md`](./pi-electron-session-process-design.md) — the integration decision: one main-owned supervisor, one RPC child per active session.
- [`frontend-renderer-design.md`](./frontend-renderer-design.md) — the renderer visual system, screens, and renderer/main boundary.

Where those documents differ in scope, the protocol document governs the wire
format, the Electron guide governs process and security discipline, the
session-process design governs the integration decision, and the renderer
design governs presentation. This document adds no new authority; it organizes
the whole system on one page.

### Document status and authority map

| Document | Status | Governs |
|---|---|---|
| [`architecture.md`](./architecture.md) | **Implemented** | The app as built today — static structure and implemented behaviour |
| This document | **Target state** | Consolidated integration and dynamic-behaviour design: where the implemented record and this design diverge (multi-session registry, Providers/Extensions screens, durable entry cursor), this design describes the intended evolution, not current behaviour |

---

## 1. Design principles applied

| Principle realized in this system | Where it lives |
|---|---|
| **Trust boundaries are explicit; capability is minimized per boundary** | Narrow preload API; sender/payload validation in main; renderer holds no node/fs/process authority |
| **One responsibility per component; keep ownership unambiguous** | Renderer = presentation; preload = capability bridge; main = session supervisor, credentials, validation; child = one agent runtime |
| **Failures are contained at a boundary, not shared** | One RPC child per active conversation; a child crash marks only its conversation disconnected |
| **Cheap evolvability: authority decisions separated from projected views** | Main projects pi protocol data into a small, typed application contract; renderer code does not encode protocol details |
| **Concurrency is correlated by identity, never by arrival order** | Command `id` correlation; generation/attachment tokens reject late events after reopen |
| **Every claim about the protocol is version-pinned and testable** | Transport/supervisor tested with fake children; recorded fixtures from the exact supported pi version; one real-child smoke test |

The recurring trade-off accepted across all documents: **more process
boundaries and narrower bridges cost resources and indirection, and buy
failure isolation, security, and independent evolution.** The design pays that
cost deliberately and re-visits it only on measured evidence (§8).

---

## 2. System overview

```text
┌────────────────────────────── Electron application ─────────────────────────────┐
│                                                                                │
│  Main process (Node.js, one per app)                                           │
│    Session supervisor: conversation registry -> child handles, transport,      │
│    pending requests/dialogs, lifecycle state                                   │
│    Authority: launcher resolution, child environment, credential/config        │
│    services, extension-UI validation, authorization of all renderer requests   │
│    ├── RPC child A: gentle-shell --mode rpc (session A)                         │
│    ├── RPC child B: gentle-shell --mode rpc (session B)                        │
│    └── RPC child C: gentle-shell --mode rpc (session C)                        │
│          ▲ validated named operations      │ typed project/app data            │
│          │                                 ▼                                   │
│  Preload: narrow typed application API (no raw ipcRenderer, no generic send)    │
│          ▲                                                                      │
│  Renderer (Chromium, sandboxed): shell + Chat / Providers / Extensions /        │
│  First run — view state and user intent only                                   │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Core invariant

**One pi RPC child per active application conversation, owned and supervised by
Electron main.** A child serves one conversation for its lifetime; it is never
shared via `switch_session`. Reopening a persisted conversation starts a new
child bound to that session file. This is a process-isolation and ownership
decision, not a claim that every child must be an Electron Utility Process:
ordinary children spawned by main are the starting point.

In this project the child executable is **not bare `pi`**: main spawns the
**`gentle-shell` launcher** shipped by `gentle-pi` (documented contract:
gentle-pi 3.7.0 or newer), run as `gentle-shell --mode rpc`. The launcher
indirection buys home selection without the desktop app knowing pi internals
(`--link` reuses `~/.pi/agent`, `--isolated` uses `~/.gentle-shell/agent`) and
decouples the desktop app from pi's module graph. Main remains the sole owner
of launcher resolution and home configuration (§3.3, §5.3).

> **Target-state note.** The implemented app today runs a single-session host
> — `ChatHost` owns exactly one `PiSession` with no registry
> ([`architecture.md`](./architecture.md) §10, limitation 3). The conversation registry
> below is the target state that generalizes it; open decisions 1–2 (§9)
> govern the migration.

### Roles

| Component | Owns | Must never do |
|---|---|---|
| **Renderer** | View state, conversation navigation, composer, dialogs presentment, setup choice intent | Spawn processes, choose executables/args/env/session paths, see raw RPC records, child handles, stderr, credentials, or generic IPC |
| **Preload** | Named operations: `createConversation`, `sendMessage`, `abortRun`, `answerDialog`, `closeConversation`, `onConversationState`, plus provider/extension/setup operations as product needs are confirmed | Expose `ipcRenderer`, raw channels, arbitrary `send(channel, payload)`, arbitrary pi JSON, filesystem access |
| **Main** | Conversation registry, lifecycle, launcher/env resolution, RPC transport per child, request correlation, extension-UI request validation/routing, credential/config authority, logs, shutdown | Block on CPU-heavy or synchronous work; trust renderer claims |
| **pi child** | One agent runtime, one session's protocol state | Be treated as trusted: all child records are untrusted, versioned input |

---

## 3. Process and session architecture

### 3.1 Session lifecycle

| Term | Meaning |
|---|---|
| Conversation/session | A pi conversation with persisted session data |
| RPC child | One OS process running `gentle-shell --mode rpc` (the gentle-pi launcher wrapping pi) attached to one conversation |
| Open session | A conversation with a live child in this app instance |
| Persisted session | A conversation reopenable from pi session storage |
| Session supervisor | Main-process component: create, route, monitor, stop children |

Lifecycle: **Create** (allocate identity, start child) → **Open existing**
(resolve session file, start child with session-selection argument, fetch
history/state without blocking the UI indefinitely) → **Interact** (route
commands only to the child registered for that conversation; consume its
independent event stream) → **Close** (per product close policy; persisted
conversation survives unless deleted) → **Shutdown** (bounded graceful stop of
all children, then force-terminate stragglers) → **Unexpected exit** (mark only
that conversation disconnected, settle pending work, offer retry/reopen).

### 3.2 Main-process registry

Keyed by an opaque application conversation ID:

```text
conversationId -> {
  lifecycleState, childHandle, rpcTransport,
  pendingRequests, pendingDialogs,
  lastKnownApplicationState, timestamps
}
```

Registry invariants:

- at most one active child per conversation; duplicate ownership of one
  mutable session file is prevented (or multi-attachment is explicitly defined);
- no cross-routing between conversation IDs; child IDs and command IDs are
  scoped so independent processes cannot collide;
- idempotent close/cleanup: double close, exit racing close, or partial spawn
  failure leak no listeners, timers, dialogs, or pending requests;
- pending requests and dialogs are settled or invalidated on exit; late output
  from a stopped/replaced child cannot update a newer attachment;
- renderer authorization resolves conversation ownership inside main — never
  keyed on a session file path or child PID.

If multiple windows are permitted, one window owns a conversation's dialog
interaction and close behavior; a second renderer must not silently create a
second writer for one session file.

### 3.3 Child launch (startup sequence)

1. Validate the operation and resolve the app-owned conversation record.
2. Resolve the **`gentle-shell` launcher** and selected home/session
   configuration in main (`--link` / `--isolated`; `GENTLE_SHELL_HOME`
   overrides to an explicit `--home <dir>`).
3. Construct an **allowlisted environment** and explicit working directory —
   no accidental inheritance of ambient secrets.
4. Spawn with piped stdin/stdout/stderr; attach exit/error/stream handlers
   immediately; establish the registry entry before accepting commands.
5. On reopen, request needed history/state with bounded waiting.
6. Expose ready/failed state to the renderer.

Graceful stop: close stdin (pi disposes the runtime), wait a bounded grace
period, then force-terminate. App shutdown enforces a total deadline and needs
no renderer cooperation.

---

## 4. Protocol transport (per child)

Follow [`pi-rpc-mode.md`](./pi-rpc-mode.md) exactly; verified against
`@earendil-works/pi-coding-agent` **0.87.1**. Key facts the transport must
implement:

> **Target-state note (protocol subset).** The implemented client deliberately
> models only what the chat window needs — `prompt`, `abort`, `get_messages`,
> `extension_ui_response` — and types but does not use `new_session`/
> `switch_session` (see [`architecture.md`](./architecture.md), domain
> inventory). This design treats the full command/event surface as *available*, not as a mandate to
> expose it; the app contract still projects only what the product needs.

**Framing.** Strict JSONL, one JSON object per LF-terminated record. Split
stdout on **LF only** — never Node `readline`, which also splits on U+2028/U+2029
inside JSON strings and corrupts content. Strip an optional preceding CR. Read
stdout continuously (a stalled reader stalls pi); honour stdin backpressure;
**stdout is exclusively protocol** (pi redirects `process.stdout.write` to
stderr); stderr is diagnostics only, routed to structured logs with redaction.

**Records.** Four families: stdin *commands*; stdout *responses*, *session
events*, and *extension UI* records (both directions). Correlate responses by
request `id` — handling is concurrent, so responses interleave. Handle
unknown record types safely (e.g. `extension_error` is real but undocumented in
`rpc-types.d.ts`) — never crash the supervisor on an unrecognized `type`.

**Run lifecycle semantics that drive UI state.**

- A successful `prompt` response means *accepted/queued*, not completion.
- Subscribe to events **before** sending the prompt (fast completions are missed otherwise).
- `agent_end` closes only one low-level run — retries, overflow recovery
  (`willRetry: true`), compaction, and steering may continue.
- **`agent_settled`** is the sole "pi will not continue automatically" signal.
- `message_update` is **delta-only**: buffer `text_delta`/`thinking_delta`/
  `toolcall_delta`, then reconcile against `text_end`/`thinking_end`/
  `toolcall_end` and the authoritative `message_end.message`.
- `get_entries` with the last-seen `since` id is the durable catch-up cursor
  across restarts; unknown `since` ids fail the command. *Target-state note:*
  this supersedes the implemented position-derived message ids
  (`msg-${state.messages.length}`), which are valid only under controlled
  single-session append order and break on a concurrent multi-session surface.

**Degraded extension surface in RPC mode.** Dialogs (`select`, `confirm`,
`input`, `editor`) block on `extension_ui_request` until answered via
`extension_ui_response` (`{id, value}` | `{id, confirmed}` | `{id, cancelled}`);
timeout dialogs self-resolve agent-side. Fire-and-forget calls (`notify`,
`setStatus`, `setWidget`, `setTitle`, `set_editor_text`) are allowlisted and
projected or safely ignored. TUI-only features must be guarded by
`ctx.mode === "tui"`, **not** `hasUI` (which is `true` in RPC).

---

## 5. Application data flow and IPC design

IPC is a public API surface: named channels, validated inputs, authorized
callers, defined result and failure contracts. Use `invoke`/`handle` for
request/response, never synchronous IPC; subscriptions return cleanup
functions; renderer-to-renderer traffic goes through a main broker.

### 5.1 Prompt flow

```text
Renderer → preload.sendMessage(convId, text) → main: validate sender/data →
resolve owned session → encode prompt + id ≫ child ;
child responses/events → main filters/reduces to application state
(conversation-scoped, with generation/attachment identity) → preload → renderer
```

The application-level result means "accepted by the local transport" or
"rejected before dispatch" — never "the model finished". Streaming, settled
state, and failure are separate, distinct events.

### 5.2 Extension UI dialog flow

Main validates the `extension_ui_request` (method, fields, size, conversation
ownership), assigns a request identity, and sends a safe dialog model to the
owning renderer only. Preload exposes a typed answer operation; main validates
the answer against the original dialog's allowed values and sends the matching
`extension_ui_response` to that same child. Renderer close or child exit
resolves or cancels the dialog per protocol/product contract — a child is never
blocked indefinitely without an explicit timeout policy. Unsupported
fire-and-forget calls are ignored safely.

### 5.3 Renderer ownership model

| Concern | Owner | Renderer receives |
|---|---|---|
| Conversation registry and lifecycle | Main | Conversation identity + projected lifecycle state |
| RPC transport and correlation | Main supervisor | Stable operation outcomes and app events |
| Credentials and child environment | Main/config services | Safe provider labels and connection status only |
| Extension UI validation and response routing | Main, bound to owning conversation/child | Supported, validated dialog models and choices |
| View state and interaction | Renderer | Typed app data, no process/fs authority |
| Setup choice | Renderer expresses intent; main resolves/persists | Detected setup summary and result |

Security baseline (applies to every renderer): `nodeIntegration: false`,
`contextIsolation: true`, `sandbox: true`, restrictive CSP; sender
frame/origin and payload validation in main; channel names are not
authorization; renderer input never selects an executable, CLI arguments,
environment variables, session file path, or raw RPC record; navigation and
external links constrained; no tokens, credentials, environment maps, or
untrusted markup ever reach the renderer. Precise claim: process isolation
gives **lifecycle separation**, not a privilege boundary against same-user code.

---

## 6. Renderer design

### 6.1 Visual system (provisional — refine against source assets before canon)

Dark plum palette as semantic tokens, never per-component colors:

| Token | Value | Use |
|---|---|---|
| `background` | `#080609` | Main canvas |
| `surface` | `#110B11` | Sidebar, cards, composer, status surfaces |
| `border` | `#492334` | Card/control outlines, separators |
| `text-primary` / `text-secondary` | `#F4EDF2` / `#B39BAE` | Content / metadata |
| `accent-pink` | `#E77CC2` | Active navigation, toggles, markers |
| `state-success` / `state-warning` | `#A7DDBF` / `#E9B75B` | Healthy / attention |
| `action-blue` | `#A8C9F7` | Primary actions (Send, Sign in) |

Define hover, focus, disabled, error, and high-contrast states; never convey
status by color alone.

### 6.2 Shell and screens

Shared shell: title bar (identity, window controls, notifications) ·
conversation navigation (New chat, recency groups, run/status indicators) ·
primary navigation (Chats / Providers / Extensions, with counts/update
indicators) · profile/account area · status bar (workspace, branch, model,
effort/profile, context/cost, workflow indicators) · dismissible notification
stack. First run uses a reduced shell (identity + notifications only).

> **Target-state note (screens).** The implemented renderer ships the chat,
> conversation, helpers, and first-run features
> ([`architecture.md`](./architecture.md) §5). The Providers and Extensions
> screens are target state pending the separate app-level contracts named in
> open decisions 6–7 (§9).

| Screen | Purpose | Boundary contract |
|---|---|---|
| **Chat** | Navigate conversations, interact with one session, see live progress | Conversation-scoped projection of messages/progress/dialogs/lifecycle; distinct acceptance vs streaming vs settled vs failure states; actions only via named preload methods |
| **Providers** | Connect/manage model providers, sign in, add keys | Safe display data and operation outcomes only — no keys, tokens, credential files, or child environment; main owns credential/config authority at child launch |
| **Extensions** | Manage packages, enable/disable, built-in settings | Explicit scoped validated operations; package strings and local paths are untrusted input; app-level package install/permission semantics are a separate contract (§8) |
| **First run** | Choose sourcing of existing vs separate pi configuration/sessions | Present detection summary and collect intent; main resolves launcher, home/session config, persists the choice as app config, applies it at session launch |

---

## 7. Verification strategy

Use the cheapest test that yields real evidence; every layer has named
evidence. The transport and supervisor must be testable with a **fake child** —
no Electron launch required for framing, ordering, or lifecycle logic. A fake
child proves the adapter contract, not compatibility with a real pi release:
retain at least one real-child smoke test for upgrades.

| Layer | Evidence |
|---|---|
| Pure protocol tests | LF-only framing; CRLF tolerance; embedded U+2028/U+2029; malformed/blank/unknown records; bounded input |
| Transport (fake children) | Concurrent requests, out-of-order responses, id correlation, backpressure/error paths, stream close, stdout/stderr separation |
| Supervisor (fake children) | One child per active session; duplicate-ownership prevention; independent routing; reopen; exit isolation; idempotent stop; app-shutdown deadline |
| IPC/preload | Allowed methods only; sender validation; malformed/oversized input; listener cleanup; stable result/error contract |
| UI/component | Streaming, settled state, dialog answer/cancel, child disconnect, retry, multi-conversation without cross-talk |
| Electron integration | Real main/preload/renderer path + child spawn; window disposal; quit with active children |
| Packaged smoke | Launcher resolution and resource paths in the packaged build; per-platform startup and clean shutdown |

Debugging discipline: classify the owning process first (renderer DevTools vs
IPC boundary vs main inspector vs child process), trace boundaries with
correlation/request IDs, log lifecycle and failure signals, redact prompts and
secrets, and always test the packaged configuration.

Include negative tests: invalid IPC input, untrusted sender, denied permission,
child failure, app shutdown during work.

---

## 8. Accepted trade-offs and deferred options

| Option | Assessment |
|---|---|
| **One child per active conversation, spawned by main** (selected) | Costs: main supervises many children; aggregate memory/fd/resource use. Buys: failure containment, one-lookup routing, independent execution, clear lifecycle. Measure main responsiveness and active-session scale. |
| One shared child via `switch_session` | Rejected unless resource evidence outweighs isolation: shared run/queue state, switching races, complex event routing. |
| pi embedded in main via SDK | Rejected for an RPC integration: couples the app to the module runtime; agent work shares main's event loop and failure boundary. |
| Utility Process hosting the session registry | Deferred: adopt only on measured workload or reliability evidence; adds an IPC hop and lifecycle protocol, and still needs per-session RPC children if the invariant holds. |

---

## 9. Open decisions to resolve before implementation

These are product/operational policies; they must not become accidental
behavior in the UI or process manager.

1. Inactive conversation children: stay alive, or stop and reopen on demand?
2. Maximum simultaneous active children — warning, queueing, or eviction policy?
3. Multi-window attachment to one conversation: which window owns dialogs and close?
4. Exact session persistence, delete, duplicate-open, and recovery semantics.
5. Supported extension UI methods/widgets and their timeout/cancel policies.
6. Extension installation/update/permission model and activation semantics (separate app-level contract).
7. Provider catalog, authentication flows, credential persistence, account switching, model availability (separate app-level contract).
8. Supported pi version range and launcher-resolution/update policy.
9. Supervisor in main vs Utility Process host (evidence-driven, §8).
10. How detected pi setup is summarized, selected, and persisted in first run.

---

## 10. Design review checklist

- [ ] Every component has an explicit responsibility and capability level; main stays responsive and is the sole authority for privileged actions.
- [ ] Preload exposes narrow named operations only; no generic IPC bridge.
- [ ] All IPC validates caller and payload; errors have stable contracts; listeners are cleaned up.
- [ ] One child per active session holds; registry invariants (§3.2) are enforced and tested.
- [ ] Protocol facts pinned to the supported pi version; delta reconstruction and `agent_settled` semantics implemented per §4.
- [ ] Chat distinguishes accepted / streaming / settled / failed / disconnected.
- [ ] Extension dialogs are bound to their originating conversation/child; answers validated against allowed values; no indefinitely blocked children.
- [ ] Renderer never receives process, filesystem, credential, or raw-RPC authority; security baseline (§5.3) verified explicitly, not assumed.
- [ ] Server-free setup choice resolved and persisted by main-owned code.
- [ ] Open decisions (§9) resolved before they become implicit behavior.
- [ ] Fake-child tests cover transport/supervisor contracts; real-child smoke retained; packaged smoke on target platforms.
