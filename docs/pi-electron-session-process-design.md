# Pi Session Process Design for Electron

This document defines a clean-sheet design for hosting pi RPC sessions in an Electron application. It combines the pi wire-protocol reference in [`pi-rpc-mode.md`](./pi-rpc-mode.md) with the process-boundary and security guidance in [`electron-system-design.md`](./electron-system-design.md). It is an application integration design, not a description of historical milestone implementations.

## 1. Decision

**Run every active application chat session in its own long-lived pi RPC child process.** Electron's main process owns and supervises those children. A renderer never spawns pi, reads its streams, or receives a generic RPC/IPC escape hatch.

```text
┌──────────────────── Electron application ──────────────────────┐
│ Main process: session registry, lifecycle, authorization, logs  │
│   ├── pi RPC child A: session A (stdin/stdout/stderr)            │
│   ├── pi RPC child B: session B (stdin/stdout/stderr)            │
│   └── pi RPC child C: session C (stdin/stdout/stderr)            │
│          ▲                         │                            │
│     validated requests       typed state/events                 │
│          │                         ▼                            │
│ Preload: narrow, typed application API                           │
│          ▲                                                        │
│ Renderer: chat UI and user interaction                           │
└──────────────────────────────────────────────────────────────────┘
```

A pi process serves one app-owned active session for its lifetime. It is not shared between chats by sending `switch_session`. Reopening a persisted conversation starts a new process bound to that conversation's session file; it does not resurrect the old OS process.

This is a **process-isolation and ownership decision**, not a claim that every child must be an Electron Utility Process. The initial design uses ordinary child processes spawned by Electron main. A Utility Process is a separate option if later evidence justifies moving supervision or Node work out of main.

## 2. Terms and lifecycle

Use these terms consistently:

| Term | Meaning |
|---|---|
| **Conversation/session** | A pi conversation with its own identity and persisted session data. |
| **RPC child** | One operating-system process running `pi --mode rpc` and attached to one conversation. |
| **Open session** | A conversation currently attached to a live RPC child in this app instance. |
| **Persisted session** | A conversation that can be reopened from pi's session storage, whether or not a child is currently running. |
| **Session supervisor** | Main-process component that creates, routes to, monitors, and stops RPC children. |

Lifecycle mapping:

1. **Create:** allocate a conversation identity and start one RPC child for it.
2. **Open existing:** resolve the persisted session file, start one child with the session-selection CLI argument, then request the history/state needed by the UI.
3. **Interact:** route commands only to the child registered for that conversation; consume its independent event stream.
4. **Close conversation:** stop that conversation's child according to the product's close policy. The persisted conversation remains available unless the user explicitly deletes it.
5. **App shutdown:** stop all children with bounded graceful shutdown, then force-terminate any that exceed the bound.
6. **Unexpected child exit:** mark only its conversation disconnected/failed, reject or disable new commands for that child, settle pending operations, and allow the user to retry or reopen.

The product must decide whether switching away from a chat leaves its child running or stops it. The architecture supports either policy; it does not change the one-child-per-open-session invariant. A bounded active-process policy may stop background sessions when resource use becomes a concern, but must make that state visible and restore the session by starting a new child.

## 3. Why one child per active session

### Benefits

- **Failure containment:** a crash or protocol failure in one pi runtime need not corrupt another chat's in-memory state.
- **Simple routing:** a conversation ID selects exactly one supervisor entry and one process stream.
- **Independent execution:** concurrent chats do not compete for one RPC process's active prompt, queue, or session selection.
- **Clear lifecycle:** process exit, cancellation, and restart map to one conversation.
- **Protocol alignment:** RPC is explicitly a long-lived child-process control interface; each child has its own stdin/stdout/stderr streams.

### Costs and constraints

- Each active child consumes memory, file descriptors, and provider/runtime resources. The app should measure realistic use and set a policy if many sessions can remain open.
- Session discovery and persistence must not accidentally attach two live children to the same mutable session file. The supervisor should prevent duplicate ownership within one app instance, or define an explicit read-only/multi-attachment behavior.
- Process count is not a security sandbox. pi runs with the operating-system identity and environment granted by the app; protect secrets and constrain launch configuration accordingly.
- Independent processes do not by themselves solve provider rate limits, shared configuration races, or concurrent writes to common files.

## 4. Process responsibilities and trust boundaries

### Electron main process — authority and supervisor

Main owns:

- the mapping from application conversation IDs to child handles and lifecycle state;
- executable resolution, arguments, working directory, environment construction, and home/session selection;
- the RPC transport and command correlation for each child;
- validation and authorization of renderer-originated operations;
- extension UI request routing and pending-dialog ownership;
- process logs, exit handling, cleanup, and app-wide shutdown;
- the projection of pi protocol data into the smaller application contract.

Do not block main with CPU-heavy parsing or other long synchronous work. Keep protocol handlers bounded and asynchronous. If actual workload shows the supervisor harms lifecycle responsiveness, consider a Utility Process that owns the registry and child processes, with main retaining app lifecycle and authorization responsibilities.

### Preload — narrow capability bridge

Preload exposes named operations such as `createConversation`, `sendMessage`, `abortRun`, `answerDialog`, `closeConversation`, and `onConversationState`. The exact API should match product needs, not mirror every pi RPC command.

It must not expose `ipcRenderer`, raw channel names, arbitrary process commands, arbitrary pi JSON, filesystem access, or a generic `send(channel, payload)` function. Event subscriptions return cleanup functions and forward only validated application data.

### Renderer — presentation and user intent

Renderer owns view state and presents messages, progress, dialogs, and errors. It identifies the conversation for each action but is not authoritative about session ownership, filesystem paths, process identity, sender trust, or permissions. It must not receive child-process objects, environment values, raw stderr, or unfiltered protocol records.

### pi child — agent runtime

Each child owns one pi runtime and the protocol state associated with its attached session. The child communicates through stdin/stdout/stderr. stdout is protocol-only; stderr is diagnostic output. Treat all child records as untrusted, versioned input even when the child executable is bundled or resolved locally.

## 5. Main-process session registry

Maintain a registry keyed by an opaque application conversation ID:

```text
conversationId -> {
  lifecycleState,
  childHandle,
  rpcTransport,
  pendingRequests,
  pendingDialogs,
  lastKnownApplicationState,
  timestamps
}
```

Do not key renderer authorization directly on a session file path or a child PID. Resolve those inside main and verify that the requested conversation is owned by the current app. The registry must enforce:

- at most one active child for each conversation ID;
- no accidental cross-routing between IDs;
- idempotent close/cleanup paths;
- pending requests and dialogs are settled or invalidated on exit;
- late output from a stopped or replaced child cannot update a newer attachment;
- child IDs and command IDs are scoped so independent processes cannot collide in pending-request maps.

If the app permits multiple windows, define whether they share a conversation attachment or one window owns it. A second renderer must not silently create a second writer for the same persisted session.

## 6. RPC transport contract

Implement one transport instance per child. Follow the protocol source of truth in [`pi-rpc-mode.md`](./pi-rpc-mode.md); the integration-specific requirements are:

- Write exactly one JSON object per LF-terminated stdin record.
- Read stdout continuously and split only on LF (accept and strip a preceding CR if desired); do not use a delimiter that treats U+2028/U+2029 as line breaks.
- Correlate command responses by request ID. Command processing is asynchronous and responses can arrive out of order.
- Handle responses, session events, and extension UI records as distinct record families. Ignore or safely retain unknown event types rather than crashing the child supervisor.
- Subscribe to the relevant event stream before sending a prompt.
- Treat a successful prompt response as acceptance/queueing, not completion. Use `agent_settled` when the UI needs to know that pi will not continue automatically.
- Reconstruct streaming content from deltas and reconcile with authoritative completion records as required by the installed protocol version.
- Honour stdin/stdout backpressure. Bound record sizes and reject malformed or excessive data safely.
- Keep stderr out of the protocol decoder and out of user-visible conversation content. Route it to structured diagnostics with redaction.

Every transport must be independently testable with a fake child implementation. Do not require a real Electron launch to validate JSONL framing, out-of-order responses, event handling, or child exit behavior.

## 7. Renderer-to-main request and event flows

### Send a prompt

```text
Renderer                 Preload                 Main supervisor             RPC child
   │ sendMessage(id,text)   │                           │                         │
   ├───────────────────────>│                           │                         │
   │                        ├─ typed IPC request ──────>│                         │
   │                        │                           ├─ validate sender/data  │
   │                        │                           ├─ resolve owned session │
   │                        │                           ├─ encode prompt + id ───>│
   │                        │                           │<─ response/events ──────┤
   │                        │<─ typed state/events ─────┤                         │
   │<───────────────────────┤                           │                         │
```

The application-level request should resolve according to a documented contract—for example, “accepted by the local RPC transport” versus “rejected before dispatch.” Do not make it ambiguously mean “the model finished.” Streamed state and final completion are separate events.

### Extension UI request

When pi emits a blocking `extension_ui_request`, main validates its method, fields, size, and conversation ownership; assigns/retains a request identity; and sends a safe dialog model to the owning renderer. Preload exposes a typed answer operation. Main validates the answer against the original dialog's allowed values and sends the matching `extension_ui_response` to that same child. If the renderer closes or the child exits, resolve or cancel the dialog according to the protocol/product contract; never leave a promise or child blocked indefinitely without an explicit timeout policy.

Fire-and-forget extension UI calls such as notifications or widget updates need explicit product handling: allowlist and project the calls the UI supports; ignore unsupported calls safely. Do not interpret a generic widget payload as trusted application data.

### Event fan-out

Events from one child may only update its associated conversation. Main filters and reduces wire records into an application-facing state shape before sending them to renderer. Include a conversation identity and, where needed, a generation/attachment token to reject late events after reopen/restart. Clean up listeners when a renderer, conversation attachment, or child is disposed.

## 8. Startup, shutdown, and failure behavior

### Startup

1. Validate the requested operation and resolve the app-owned conversation record.
2. Resolve the pi launcher and selected home/session configuration in main.
3. Construct an allowlisted environment and explicit working directory; do not inherit sensitive ambient values by accident.
4. Spawn the RPC child with piped stdin, stdout, and stderr.
5. Attach exit, error, stdout, and stderr handlers immediately; establish the registry entry before accepting further commands.
6. If reopening a persisted session, request the needed history/state and correlate its response. Do not let a slow history read indefinitely block the UI.
7. Expose a ready or failed state to the renderer.

### Graceful stop

Close stdin to request orderly shutdown, wait for a bounded grace period, then terminate the process if needed. Handle OS signals and app shutdown. Cleanup is idempotent: close called twice, child exit racing with close, or spawn failing part-way through must not leak listeners, timers, dialogs, or pending requests.

### Failure matrix

| Failure | Main-process response | Renderer-facing result |
|---|---|---|
| Launcher resolution or spawn failure | Do not register a usable child; settle startup and clean partial resources | Conversation-specific launch error with retry path |
| Malformed JSON or invalid record | Reject/ignore according to record class; log bounded diagnostics; do not crash main | Usually a protocol/connection error, not raw payload |
| RPC command failure response | Correlate to that request and map to stable error result | Action-level failure; keep conversation usable if possible |
| Provider failure after prompt acceptance | Continue consuming events; identify terminal state according to protocol | Run failure/abort status, not a second prompt-command response |
| Child exits unexpectedly | Mark only its conversation disconnected; settle pending work and dialogs; remove child | Reconnect/reopen action and preserved last known conversation state |
| Stdin write fails or child already exited | Stop dispatch; reconcile with exit state; avoid unhandled stream errors | One visible failure, not duplicate error channels |
| App quits with active children | Stop all concurrently or under a bounded shutdown coordinator; enforce total deadline | No renderer dependency for final cleanup |

User-facing failures should be reported once per condition. Diagnostics should include conversation ID, process/child identity, command ID when present, phase, exit code/signal, and elapsed time; redact prompts, credentials, environment secrets, and arbitrary file content.

## 9. Security requirements

- Keep renderer `nodeIntegration` disabled, `contextIsolation` and sandboxing enabled, and use a restrictive CSP.
- Validate sender frame/origin and payloads in main. Channel names are not authorization.
- Allowlist RPC operations exposed to the renderer. Never let renderer input choose an executable, arbitrary CLI arguments, environment variables, session file path, or raw RPC record.
- Treat pi event text, extension UI requests, widget content, and stderr as untrusted. Sanitize rendered markup and avoid unsafe URLs or HTML.
- Build the child environment deliberately. Do not log or return tokens, provider credentials, or full environment maps.
- Constrain navigation and external links; do not expose privileged bridge methods to remote or user-provided content.
- Keep process isolation claims precise: a child process gives lifecycle separation, not a privilege boundary against code running with the same user identity.

## 10. Verification plan

| Layer | Evidence to collect |
|---|---|
| Pure protocol tests | LF-only framing; CRLF handling; embedded U+2028/U+2029; malformed/blank/unknown records; bounded input behavior |
| Transport tests with fake children | Concurrent requests and out-of-order responses; IDs; backpressure/error paths; stream close; stdout/stderr separation |
| Supervisor tests | One child per active session; independent routing; duplicate ownership prevention; reopen; exit isolation; idempotent stop; app shutdown deadline |
| IPC/preload tests | Allowed methods only; sender validation; malformed/oversized input; listener cleanup; stable result/error contract |
| UI/component tests | Streaming, settled state, dialog cancellation/answer, child disconnect, retry, multiple conversations without cross-talk |
| Electron integration | Real main/preload/renderer request path and child spawn; window disposal; app quit with active children |
| Packaged smoke | Launcher resolution and resource paths in a packaged build; supported platform startup and clean shutdown |

Use recorded protocol fixtures from the exact supported pi version where possible. A fake child proves the adapter contract, not compatibility with a real pi release; retain at least one real-child smoke test for upgrades or release qualification.

## 11. Tradeoffs and alternatives

| Option | Advantages | Disadvantages | Guidance |
|---|---|---|---|
| One child per active conversation, spawned by main | Direct ownership; independent RPC streams and failure state; simple routing | Main supervises many children; aggregate resource use | Recommended starting point; measure main responsiveness and active-session scale |
| One shared child for many conversations using `switch_session` | Fewer processes | Shared active-run/queue state; switching races; session identity and event routing become more complex | Do not choose unless resource evidence outweighs isolation and the concurrency model is rigorously specified |
| pi embedded in Electron main via SDK | Direct in-process API | Couples app to pi module/runtime; agent work shares main's failure and event loop boundary | Not selected for an RPC-based integration |
| One Utility Process hosting a session registry | Keeps child orchestration away from main; can improve crash isolation | Adds another IPC hop and lifecycle protocol; still needs per-session RPC children if the invariant remains | Defer until measured workload or reliability needs justify it |

The proposed one-child-per-session model trades higher resource use for independent lifecycle and simpler ownership. It does not require one utility process per chat: the OS child itself is the session boundary.

## 12. Decisions to confirm before implementation

These are product/operational policies, not reasons to weaken the one-child-per-active-session rule:

1. Does a child stay alive when its conversation is not the selected view, or stop and reopen on demand?
2. How many simultaneous active children should the app support before it warns, queues, or evicts idle children?
3. Can multiple windows attach to one conversation, and if so, which window owns dialog interaction and close behavior?
4. What are the exact persistence, delete, duplicate-open, and recovery semantics for a session file?
5. Which extension UI methods and widget schemas are supported in the desktop UI, and what are the timeout/cancel policies?
6. What supported pi version range and launcher-resolution/update policy will the app promise?
7. Should the supervisor remain in main, or should load/failure evidence trigger a Utility Process host?

Resolve these questions in product design before they become accidental behavior in the process manager.

## 13. Relationship to the reference documents

- [`pi-rpc-mode.md`](./pi-rpc-mode.md) remains authoritative for pi RPC protocol details and version-specific behavior.
- [`electron-system-design.md`](./electron-system-design.md) remains the project-agnostic reference for Electron process roles, IPC, security, debugging, and testing.
- This document is the integration decision: one main-owned supervisor and one RPC child per active app conversation, with a narrow preload API and application-specific projections of the protocol.
- [`architecture.md`](./architecture.md), when maintained for the application,
  should link here rather than duplicate the full generic guidance.
