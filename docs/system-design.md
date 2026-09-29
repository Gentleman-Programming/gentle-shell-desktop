# System Design

This document describes the **dynamic behaviour** of `gentle-shell-desktop`: the
protocols, flows, lifecycle state machines, failure modes and the decisions
behind them. Static structure — processes, layers, folders, boundaries — lives in
[`architecture.md`](./architecture.md).

## 1. The wire contract

The app speaks pi's `--mode rpc` JSON-line protocol over the child process's
stdin/stdout. One JSON object per line, LF-terminated. The client deliberately
models **only what the chat window needs**.

### Commands sent (stdin)

| Command | When |
| --- | --- |
| `prompt { message }` | User sends a message |
| `abort` | Esc, or the composer's abort control |
| `get_messages { id }` | Reopening an existing chat, to backfill history |
| `extension_ui_response` | Answering a dialog: `{value}` / `{confirmed}` / `{cancelled}` |

`new_session` and `switch_session` are typed but not used: home isolation and
`--session <path>` at spawn time cover both needs.

### Events consumed (stdout)

| Event | Effect on `ChatState` |
| --- | --- |
| `agent_start` | `working = true` |
| `agent_end`, `agent_settled` | `working = false` |
| `message_start` (assistant) | Open a streaming `ChatMessage` |
| `message_update` (`text_delta`) | Append to the open assistant message |
| `message_update` (thinking/toolcall deltas) | Bump `activity` only — never rendered |
| `tool_execution_start/update/end` | Bump `activity` only |
| `message_end` (assistant) | Resync text from the authoritative message, close stream |
| `extension_ui_request` (dialog methods) | Push a `Dialog` to `pendingDialogs` |
| `extension_ui_request` (`setWidget`, key `gentle-agents`) | Fold into `helpers` |
| `extension_error` | `lastError` |
| `response` | Not folded by the reducer; `get_messages` handled separately |

Everything else — `bash_execution_update`, `compaction_*`, `auto_retry_*`,
`summarization_retry_*` — decodes to `{ kind: "unknown" }` and is ignored. The
decoder never throws: malformed JSON, a blank line, or an unmodeled event all
degrade to `unknown`.

### Framing decision

`LineSplitter` splits on `\n` only and strips a trailing `\r`. It deliberately
avoids Node's `readline`, which also splits on U+2028/U+2029 — characters that
are legal *inside* JSON strings and would corrupt a message body.

## 2. Session lifecycle

`ChatHost` owns exactly one live `PiSession`. Every open/new goes through a
serialized chain so two overlapping calls can never both spawn a child.

```
openChat(id) ─┐
              ├─> startSession(sessionPath)        [queued on startChain]
newChat()   ──┘         │
                        ▼
                 performStart
                 1. await current?.stop()          stop the previous child
                 2. new PiSession({ spawner, locator, homeArgs, sessionPath })
                 3. subscribe session "state" -> emitState  (broadcast)
                    subscribe session "error" -> emitError
                 4. session.start()
                    ├─ sessionPath set  -> waitForHistoryResponse, bounded 2s
                    └─ no sessionPath   -> return immediately
                 5. return session.getState()
```

Rationale for each guard:

- **`startChain` serialization.** Without it, two calls can both observe
  `current` as unset and each spawn a child, orphaning the first. The chain is
  kept alive on failure (`run.then(() => undefined, () => undefined)`) so one
  failed start cannot permanently wedge every later call behind a rejected
  promise.
- **Bounded history wait.** A slow or missing `get_messages` response must not
  block the renderer from opening the chat. `HISTORY_LOAD_TIMEOUT_MS` (2000) is
  enforced with the same `boundedStop` helper used for shutdown.
- **Listener-before-start.** The history listener is attached *before*
  `start()` so it can never miss a response that arrives immediately.

## 3. History backfill and its race

The subtlety worth naming: the renderer starts with an empty thread, and the
child already holds the conversation, so the app requests history — while the
user may already have typed.

```
requestHistory():  id = "history-N"; pendingHistoryRequestId = id
                   send { type: "get_messages", id }

applyHistoryResponse(state, response):
   response.command !== "get_messages"          -> ignore
   response.id !== pendingHistoryRequestId      -> ignore (stale/unrelated)
   !response.success                            -> lastError, keep state
   state.messages.length > 0                    -> keep state (do NOT clobber)
   otherwise                                    -> seed messages from history
```

Two invariants make this safe:

1. **Correlation.** Any other `get_messages`-shaped response — stale, replayed,
   from a prior session — is rejected by id.
2. **Never clobber live text.** A prompt that landed while the request was in
   flight wins. History only seeds an empty thread.

Seeded ids are assigned *by position in the filtered output* (`msg-0`, `msg-1`,
...), which is what keeps them compatible with the reducer's
`msg-${state.messages.length}` scheme: N seeded messages mean the next live
message is `msg-N`, with no gap and no collision — even when tool-result and
thinking-only messages were skipped.

## 4. Turn fold: the streaming state machine

`reduceChat` is pure and total. The assistant text path is a small state machine
designed so that a lossy stream still converges on the authoritative content.

```
              message_start(assistant)
                      │
                      ▼
            ┌─── streaming bubble ───┐
            │ text_delta  -> append  │
            │ thinking_*  -> activity│
            │ toolcall_*  -> activity│
            └───────────┬────────────┘
                        │ message_end(assistant)
                        ▼
        authoritative text = joined text blocks
              │                        │
      non-empty                       empty after trim
              │                        │
     finalize (streaming=false)    drop the bubble
```

Design decisions embedded here:

- **Streaming is a heuristic; `message_end` is truth.** The accumulated delta
  text is *resynced* from `message_end.message`'s text blocks when present,
  because that is the authoritative form per the protocol.
- **Empty assistant messages are dropped.** A message that only ever carried
  thinking/toolCall parts would otherwise render as an empty bubble. Dropping
  the last element shrinks the length by one, so the id scheme immediately
  reuses the freed id for the next assistant message — no separate bookkeeping.
- **Thinking and tool output are never rendered.** They increment `activity`
  (an opaque counter) only. This is an explicit product objective, not a gap:
  "no tool output, no thinking shown".
- **Purity.** No `Date.now()`, no `crypto`, no I/O. The one wall-clock
  dependency (the helpers retention fallback) is passed in as `now` by
  `PiSession`, the impure boundary.

## 5. Prompting and the report-once policy

M1 has no queue. A prompt sent while the assistant is working is **declined**,
not buffered.

```
prompt(text):
   working -> { queued: false, reason: "Gentle is still working" }
              + set lastError + emit state        (no error event)
   else    -> append user message, emit state, send command
              -> { queued: true }
```

The return value is a resolved `PromptResult`, not a rejection, and no `error`
event is emitted. `ChatHost.sendMessage` passes it straight through. Rejecting
*and* emitting would report the same condition twice — once through the IPC
error path and once through the status line. The rule is: **a condition is
reported exactly once.**

## 6. Dialogs

`extension_ui_request` with a blocking method (`select`, `confirm`, `input`,
`editor`) is pushed to `pendingDialogs` and rendered as a card. Answering it:

```
answerDialog(id, answer):
   remove dialog from pendingDialogs, emit state
   "cancelled" in answer -> extension_ui_response { id, cancelled: true }
   "confirmed" in answer -> extension_ui_response { id, confirmed }
   else                  -> extension_ui_response { id, value }
```

The optimistic removal is fine because the child is the authority on whether the
dialog is satisfied; the local list exists only to render cards.

## 7. Helpers pipeline (M2)

The Helpers tab does **not** use request/response RPC. It rides a fire-and-forget
push that most clients would discard.

```
gentle-agents (in the child)
   extension_ui_request { method: "setWidget",
                          widgetKey: "gentle-agents",
                          widgetLines: ["<json>"] }
        │  schema: gentle-agents.activity/v1
        ▼
   chatReducer.applySetWidget
        │  other widgetKey -> ignored (never a global helper list)
        │  malformed frame -> keep previous helpers state
        ▼
   parseHelpersActivity -> { summary, tasks[] }
        │
        ▼
   mergeHelperTasks(previous, next, now)
        │
        ▼
   ChatState.helpers -> pushed to renderer -> HelpersContainer
```

### Reconciliation semantics

The publisher is **lossy by design**: gentle-pi keeps a task record in memory
only while it runs, then persists it and omits it from the next frame. The client
therefore reconciles rather than replaces:

- A task present in the new frame **replaces** its previous record outright — the
  frame is authoritative for anything it still reports.
- A task missing from the new frame but previously known is **retained** with its
  last record. A non-terminal status (`running`/`waiting`/`queued`) is promoted
  to `done` with `endedAt = now`; a terminal status (`done`/`failed`/`cancelled`)
  is kept exactly as it was. **A terminal status is never re-derived.**
- Ordering is semantic: `running`, then `waiting`, then `queued`, then finished
  sorted by `endedAt` descending.

Without this merge the UI would show the finished count climbing while the task
itself vanished from the list.

### Parser tolerance

`parseHelpersActivity` ignores unknown fields, defaults a missing thread to
empty, and returns `undefined` for malformed JSON or a wrong `schema` so the
caller **keeps the previous state** instead of clobbering it with a partial
frame. An empty `widgetLines` is a documented "clear the widget" and decodes to
an empty activity. Timestamps accept ISO strings and epoch milliseconds, and
guard non-finite or out-of-range values that would make `Date.toISOString()`
throw.

### View-only partitioning

"Earlier" versus "current" helpers is a **renderer view concern**, not backend
state. `HelpersContainer` receives `openedAt` (the moment the chat became active)
and partitions terminal tasks finished before it into a collapsed group. A real
session can carry days-old finished helpers; folding them keeps today's work
visible. The boundary is set once per chat activation, not per pane switch.

### Why the tab is per chat

`widgetKey: "gentle-agents"` frames are session-scoped, and the desktop app runs
one session at a time, so the parent-child relation stays direct: a helper only
ever appears under the chat that started it. There is no global aggregation step
to get wrong.

## 8. First run and home selection

```
App mount
   └─ bridge.setupStatus()
         ├─ needsChoice = (no persisted choice) AND (pi home detected)
         ├─ needsChoice  -> FirstRun screen
         │                    "Use my pi setup"      -> chooseHome("link")
         │                    "Keep it separate"     -> chooseHome("isolated")
         │                    -> onDone -> chat shell
         └─ else         -> chat shell
        on error        -> chat shell (fail open)
```

- The screen is skipped entirely when no pi is found: with nothing to reuse,
  isolated is the only sensible start.
- `needsChoice` is a conjunction, not the mere absence of a choice.
- A failed config write is wrapped into a human-readable message, because the
  IPC error path carries only the message text.
- Fail-open matters: a broken setup check must never prevent the app from
  starting.
- The choice is re-resolved on every session spawn and every session list read
  (`createDynamicPiSessionStore`, `homeSettings.homeArgs()`), so a mid-session
  choice takes effect without restart.

## 9. Failure modes and recovery

The overarching rule: **`PiSession` never throws from a public method.** This
runs inside Electron's main process, where an uncaught exception takes down the
whole app. Everything becomes `lastError` plus an `error` event.

| Failure | Detection | Response |
| --- | --- | --- |
| Launcher not found | `LauncherLocator.locate()` throws | `lastError` + error event; message names both `GENTLE_SHELL_BIN` and `PATH` |
| Spawn failure (ENOENT) | child `error` / `close` | `exited` resolves with `error` set (never hangs); state emitted |
| Child exits non-zero | `close` with `code !== 0` | `process` cleared, `working=false`, dialogs dropped, error surfaced |
| Child exits cleanly on its own | `close` with `code === 0` | `process` cleared, `working=false`, dialogs dropped, **no** error |
| Write after child death | guarded `stdin` error handler | Routed to error handlers instead of crashing main |
| Send with no process | `send()` guard | `surfaceError`, no throw |
| Double `start()` | `process` already set | `surfaceError`; does **not** spawn a second child |
| Stderr output | `onStderrLine` | Routed to a logger, **never** `lastError` (routine pi logging is not failure) |
| Malformed wire line | `decodeLine` | `{ kind: "unknown" }`, ignored |
| Malformed helpers frame | `parseHelpersActivity` | `undefined`; previous helpers state retained |
| History request fails/times out | response or `boundedStop` | `lastError` for a failed response; a timeout simply returns |
| Dialog left open when the child dies | `handleExit` | `pendingDialogs` cleared — the child that would answer is gone |

Note the asymmetry between a clean self-exit (no error) and a non-zero exit
(error): stderr output and a clean exit are *not* by themselves evidence of
failure, and the code refuses to conflate them. A spawn failure is not
re-reported by `handleExit` because `onError` already surfaced the real cause.

## 10. Shutdown

```
before-quit
   ├─ already quitting? -> return (guards re-entrant app.quit())
   └─ preventDefault()
      |- boundedStop(() => chatHost.stop(), 4000ms)
      |     └─ stop() joins startChain first, then stops current session
      |           └─ PiSession.stop(): endStdin, wait 3s, then kill
      └─ app.quit()
```

Two bounds, in order: `PiSession.stop()` grants the child a 3-second grace
period after stdin closes, then kills it; `before-quit` caps the whole sequence
at 4 seconds so a child that refuses to exit can never hang shutdown.
`ChatHost.stop()` joins `startChain` first, so a queued open/new in flight is
stopped too rather than leaking a child that outlives the app.

## 11. Design decisions and tradeoffs

| Decision | Rationale | Cost |
| --- | --- | --- |
| Spawn the launcher instead of embedding pi | Decoupling, home modes, no sidecar | Version coupling to gentle-pi |
| One session at a time | Matches M1 scope, keeps the IPC surface thin | No tabs; revisit needs a session registry |
| Pure reducer with `now` injected | Testable without clocks or processes | Slightly awkward signatures |
| Tolerant decoding everywhere | A version-skewed pi cannot crash the UI | Unknown events are silently dropped |
| Reconcile helper frames instead of replacing | Lossy publisher otherwise loses finished tasks | Heuristic `endedAt = now` for dropped tasks |
| Report-once errors | Avoids double-reporting through two paths | Callers must check `PromptResult`, not catch |
| Position-derived message ids | No id allocator, drop-and-reuse works cleanly | Sensitive to append ordering |
| Sanitize Markdown with a tight allowlist | Model output is untrusted | Some legitimate rich content is stripped (notably images) |

## 12. Verification strategy

The design is shaped to be verifiable at each level, and the levels are chosen
so that each catches what the one below cannot:

| Level | Tooling | What it proves |
| --- | --- | --- |
| Codec and reducer | vitest, recorded `.jsonl` fixtures under `domain/rpc/__fixtures__/` | Wire handling and fold semantics against real recorded streams |
| Domain and adapters | vitest with fakes and injected `env`/`exists` | Lifecycle, guards, home rules — no real process |
| Components | Testing Library against reducer state | UI behaviour without mocking Electron |
| Renderer in a browser | `pnpm dev:web` with `mockBridge` | Real layout/interaction QA |
| Built app | `pnpm smoke:electron` (Playwright driving real Electron) | The genuine main + preload + BrowserWindow path |
| Package | `pnpm package:*` | A shippable artifact exists |

The smoke check is not ceremonial: it is what caught two bugs invisible to
`pnpm dev` because they only exist in the built bundle — a top-level `__dirname`
redeclaration injected by electron-vite's ESM shim, and a missing `main` field in
`package.json`. The lesson is recorded in `src/main/index.ts`.

## 13. Open questions and known risks

1. **History wait on error/exit.** The bounded wait resolves on a matching
   response; resolving it promptly when the child dies is an open follow-up.
2. **`openedAt` wiring and the Earlier group.** Auto-expanding the Earlier group
   when the selection moves into it is an acknowledged follow-up.
3. **Unparseable timestamps.** Covered for the parser; test coverage for the
   `openedAt` path is listed as outstanding.
4. **Helper Stop.** The footer control ships disabled with a tooltip because
   gentle-agents exposes no stop command over RPC yet.
5. **Two data paths to pi.** Chat via the spawned CLI, session listing via the
   in-process `SessionManager`, plus a global `PI_CODING_AGENT_DIR` mutation for
   the listing call. Works today because one home is ever in play; it is the
   strongest argument for consolidating session access later.
6. **`process.env` mutation is not concurrency-safe.** Accepted and documented;
   would need revisiting before any feature reads two homes at once.
