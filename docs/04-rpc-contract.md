# RPC contract

> Status: draft.

`gentle-shell --mode rpc` runs as a child process and speaks JSON, one message per line, over stdin/stdout. It is the only formal interface between the desktop and gentle-shell. It is not tRPC. The desktop also imports pi in-process to list sessions (see `03-architecture/current.md`), but that path is outside this contract.

## At a glance

| Question | Answer | Evidence |
|---|---|---|
| Who defines the protocol? | pi core (`@earendil-works/pi-coding-agent`), not gentle-shell. gentle-shell adds no command or event type; its traffic rides on pi's extension channels (extension UI requests, extension commands, custom messages, session entries), some of it environment-gated ([Host and extension channels](#host-and-extension-channels)). | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:20` |
| Which pi version answers the desktop's RPC? | pi **0.99.1 or newer**: the gentle-shell launcher refuses to start an older pi. gentle-shell 4.0.0 develops against pi 1.0.0, whose RPC layer is byte-identical to 0.99.1. The desktop's own locked pi 0.85.1 is used only for the in-process session list. | `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`, `gentle-shell@ac67159:package.json:78`, `:95-97`, `gentle-shell-desktop@5ab4a00:pnpm-lock.yaml:323` |
| How much of the protocol does the desktop use? | 3 of 33 commands (`prompt`, `abort`, `get_messages`) plus dialog responses; 13 stdout record types plus extension UI requests. | [Commands](#commands-desktop--runtime), [Events](#events-runtime--desktop) |
| Is there a version handshake? | No. Only the activity payload carries a schema tag (`gentle-agents.activity/v1`). | [Versioning](#versioning-and-compatibility) |
| Biggest gaps | Helper Stop, structured ODD state, providers/auth, extensions management, profile/RDD state. | [Gaps](#gaps-the-desktop-needs) |

**How to read citations.** Every claim cites `repo@shortsha:path:line`. Pinned SHAs (refreshed 2026-10-03): `gentle-shell-desktop@5ab4a00` (main), `gentle-shell@ac67159` (gentle-shell `main`, package version 4.0.0, 19 commits after the 4.0.0 release commit `1f35ab1`; facts from those commits are marked as post-release), `pi@a13d35a` (pi 1.0.0), `pi@d981de1` (pi 0.85.1, the desktop's in-process copy). `pi@d86654a` (pi 0.99.1) and `gentle-shell@1162ce9` (3.7.0) appear only in explicit version comparisons. Lines labelled `Inference:` are reasoning, not verified behavior. `UNVERIFIED:` marks claims checked but not confirmed. IDs from other pages are qualified (`audit A5`, `inventory Y4`); bare G1–G10 are this page's gaps.

## Transport and framing

### Process chain

```text
Electron main (desktop)
  └─ spawn: <gentle-shell launcher> [--home <dir>|--link|--isolated] --mode rpc [--session <path>]
       └─ spawn (stdio: inherit): pi --mode rpc ...   ← the RPC peer
```

| Step | What happens | Evidence |
|---|---|---|
| 1. Locate launcher | `GENTLE_SHELL_BIN` first (a `.mjs`/`.js`/`.cjs` entry runs under `process.execPath` with `ELECTRON_RUN_AS_NODE=1`), else `gentle-shell` on `PATH` (`.cmd`/`.exe` candidates on win32). | `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:19`, `:41`, `:48` |
| 2. Build argv | Launcher args, then home flags, then `--mode rpc`, then `--session <path>` when reopening a chat. Home flags are `--home <dir>` when `GENTLE_SHELL_HOME` is set, otherwise `--link` or `--isolated`. | `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:127-133`, `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:34-36` |
| 3. Build env | Inherited env, then launcher env, then `GENTLE_SHELL_INTERACTIVE_HOST=1` applied last so nothing can override it. | `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:67`, `:134` |
| 4. Spawn | `child_process.spawn` with `stdio: ["pipe","pipe","pipe"]` and no `shell` option. | `gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:10` |
| 5. Launcher resolves pi | `GENTLE_SHELL_PI`, then a bundled pi CLI, then `pi` on `PATH`. | `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:368-379` |
| 6. Version gate | Launcher runs `pi --version` and exits with an error if pi is older than `MIN_PI_VERSION = "0.99.1"`. | `gentle-shell@ac67159:bin/gentle-shell.mjs:1206-1215`, `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`, `:416` |
| 7. Launch pi | The launcher spawns pi with `stdio: "inherit"`, so the desktop's pipes reach pi directly. It forwards `SIGINT`, `SIGTERM` and `SIGHUP` to pi. | `gentle-shell@ac67159:bin/gentle-shell.mjs:1396`, `:1403-1408` |

### Environment variables on the contract

| Variable | Set by | Effect | Evidence |
|---|---|---|---|
| `GENTLE_SHELL_INTERACTIVE_HOST=1` | Desktop, on every spawn | Under `--mode rpc`, enables RPC dialogs for `ask_user_question`/`ask_user_choice` and the `gentle-agents` activity push. Only the exact value `"1"` counts. Stripped from subagent children. | `gentle-shell@ac67159:lib/rpc-host.ts:8`, `:15-17`, `gentle-shell@ac67159:lib/agents-runner.ts:471`, `gentle-shell@ac67159:docs/readme-reference.md:376` |
| `GENTLE_SHELL_BIN` | User / dev script | Launcher path override for the desktop. | `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:19` |
| `ELECTRON_RUN_AS_NODE=1` | Desktop, only for a JS-entry `GENTLE_SHELL_BIN` | Runs the entry as plain Node under the Electron binary. | `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:38-41` |
| `GENTLE_SHELL_HOME` | User | When set, the desktop passes `--home <dir>` instead of `--link`/`--isolated`, and its in-process session list reads the same directory. | `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:28-31`, `:34-35`, `:61-62` |
| `GENTLE_SHELL_PI` | User | pi executable override inside the launcher. | `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:369-370` |

### Framing

| Rule | Evidence (pi docs) | Desktop conformance |
|---|---|---|
| One JSON object per record, LF-terminated. | `pi@a13d35a:packages/coding-agent/docs/rpc.md:52`, `pi@d981de1:packages/coding-agent/docs/rpc.md:30` | `encodeCommand` appends `\n` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:12-14`) |
| Split on LF only; strip an optional trailing `\r`; never use Node `readline` (it splits on U+2028/U+2029). | `pi@a13d35a:packages/coding-agent/docs/rpc.md:52-54`, `pi@d981de1:packages/coding-agent/docs/rpc.md:32-37` | `LineSplitter` splits on `\n` and strips `\r` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:22-49`) |
| Stdout is reserved for protocol records; diagnostics go to stderr. | `pi@a13d35a:packages/coding-agent/docs/rpc.md:56`; pi takes over stdout at start (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:55`) | Stderr is logged, never parsed (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:292-295`) |
| Read stdout continuously; pi honors backpressure. | `pi@a13d35a:packages/coding-agent/docs/rpc.md:56` | `data` listener, never paused (`gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:78-82`) |

Framing code (`jsonl.ts`) is byte-identical in pi 0.85.1, 0.99.1 and 1.0.0 (checked with `git diff --quiet d981de1 a13d35a`).

### Correlation and errors

- Every command accepts an optional string `id`; the matching `response` repeats it (`pi@a13d35a:packages/coding-agent/docs/rpc.md:37-44`). Correlate by `id`, not by order (`:44`).
- A failed command returns `{type:"response", command, success:false, error}` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:245`).
- Malformed JSON returns a response with `command: "parse"` and no `id` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:752-763`).
- An unknown `type` returns `Unknown command: <type>` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:715`).
- An `extension_ui_response` produces no response; one with an unknown `id` is silently dropped (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:767-781`).
- The desktop only sets `id` on `get_messages` (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:157-160`).

### Startup and shutdown

| Phase | pi behavior | Desktop behavior |
|---|---|---|
| Startup | No dedicated "ready" record exists. `Inference:` the only `output(...)` call sites in `runRpcMode` are command responses, session events, extension UI requests and `extension_error` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:59-61`, `:129`, `:349`, `:356`). Extensions may emit UI requests at `session_start` (gentle-agents does, `gentle-shell@ac67159:extensions/gentle-agents.ts:1663`, `:1697-1711`). | Writes commands immediately after spawn; sends `get_messages` right away when reopening (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:147`). |
| Orderly stop | Closing stdin triggers `shutdown()`, which disposes the runtime and exits (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:802-805`, `:726-743`; documented at `pi@a13d35a:packages/coding-agent/docs/rpc.md:93`). | `endStdin()`, wait up to 3 s, then `kill()` (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:214-235`). |
| Signals | `SIGTERM` exits 143; `SIGHUP` (not on win32) exits 129 (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:366-380`). | `kill()` with no argument (Node default `SIGTERM`), forwarded by the launcher. |
| Extension-requested shutdown | Completes after the current command or after `agent_settled` (`pi@a13d35a:packages/coding-agent/docs/rpc.md:95`). | Any exit not requested by `stop()` resets `working` and drops pending dialogs (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:309-324`). |

The pi 0.85.1 docs do not describe shutdown; the code path is the same (`pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-mode.ts:728`, `:807`).

## Commands (desktop → runtime)

The `RpcCommand` union is identical in pi 0.85.1 and 0.99.1, at the same line numbers (`diff` of `rpc-types.ts` differs only at line 10 and in the prompting responses at lines 117-126). Between 0.99.1 and 1.0.0 the RPC sources (`rpc-types.ts`, `rpc-mode.ts`, `rpc-client.ts`, `jsonl.ts`) and the RPC docs are byte-identical (`git diff --stat d86654a a13d35a` is empty for them). Rows cite 1.0.0; the same line holds in `pi@d86654a` and `pi@d981de1`.

**Desktop column:** **sent** = written to stdin today; **typed** = in the desktop's `RpcCommand` type but never sent; **–** = not used.

| Command | Payload fields (besides optional `id`) | Response `data` | Purpose | Desktop | Source |
|---|---|---|---|---|---|
| `prompt` | `message`, `images?`, `streamingBehavior?: "steer"\|"followUp"` | 0.85.1: none. 0.99.1: `{disposition}` | Send a user prompt; `/command` extension commands run immediately, even during streaming. | **sent** (`PiSession.ts:184`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:22` |
| `steer` | `message`, `images?` | 0.99.1: `{disposition}` | Queue a message for delivery before the next LLM call. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:23` |
| `follow_up` | `message`, `images?` | 0.99.1: `{disposition}` | Queue a message for after the run ends. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:24` |
| `abort` | – | – | Abort the current run. | **sent** (`PiSession.ts:189`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:25` |
| `clear_queue` | – | `{steering, followUp}` | Drop queued steering/follow-up messages. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:26` |
| `new_session` | `parentSession?` | `{cancelled}` | Start a new session in the same process. | typed (`types.ts:30`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:27` |
| `get_state` | – | `RpcSessionState` | Model, thinking level, streaming/compacting flags, queue modes, session file/id/name, counts. | typed (`types.ts:32`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:30`, `:96-109` |
| `set_model` | `provider`, `modelId` | `Model` | Switch model. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:33` |
| `cycle_model` | – | `{model, thinkingLevel, isScoped}\|null` | Cycle scoped models. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:34` |
| `get_available_models` | – | `{models}` | List models usable with current auth. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:35` |
| `set_thinking_level` | `level` | – | Set thinking level ("effort"). | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:38` |
| `cycle_thinking_level` | – | `{level}\|null` | Cycle thinking level. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:39` |
| `get_available_thinking_levels` | – | `{levels}` | List thinking levels. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:40` |
| `set_steering_mode` | `mode: "all"\|"one-at-a-time"` | – | Steering queue delivery mode. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:43` |
| `set_follow_up_mode` | `mode: "all"\|"one-at-a-time"` | – | Follow-up queue delivery mode. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:44` |
| `compact` | `customInstructions?` | `CompactionResult` | Manual compaction. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:47` |
| `set_auto_compaction` | `enabled` | – | Toggle auto-compaction. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:48` |
| `set_auto_retry` | `enabled` | – | Toggle auto-retry. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:51` |
| `abort_retry` | – | – | Cancel a pending auto-retry. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:52` |
| `bash` | `command`, `excludeFromContext?` | `BashResult` | Run a shell command directly; output streams as `bash_execution_update`. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:55` |
| `abort_bash` | – | – | Abort the running `bash` command. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:56` |
| `get_session_stats` | – | `SessionStats` (tokens, `cost`, `contextUsage?`) | Usage and cost for the session. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:59`; fields at `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:326-343` |
| `export_html` | `outputPath?` | `{path}` | Export the session as HTML. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:60` |
| `switch_session` | `sessionPath` | `{cancelled}` | Switch to another session file in the same process. | typed (`types.ts:31`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:61` |
| `fork` | `entryId` | `{text, cancelled}` | Fork from an entry. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:62` |
| `clone` | – | `{cancelled}` | Clone the session. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:63` |
| `get_fork_messages` | – | `{messages: [{entryId, text}]}` | Candidate fork points. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:64` |
| `get_entries` | `since?` | `{entries, leafId}` | Raw session entries. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:65` |
| `get_tree` | – | `{tree, leafId}` | Session tree. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:66` |
| `get_last_assistant_text` | – | `{text\|null}` | Last assistant text. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:67` |
| `set_session_name` | `name` | – | Rename the session. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:68` |
| `get_messages` | – | `{messages}` | Full message history. | **sent** with `id` (`PiSession.ts:159`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:71` |
| `get_commands` | – | `{commands: RpcSlashCommand[]}` (`name`, `description?`, `source`, `sourceInfo`) | Discover extension commands, prompt templates and skills invocable via `prompt`. | – | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:74`, `:81-90` |
| `extension_ui_response` | `id` + one of `value` / `confirmed` / `cancelled: true` | none | Answer a dialog request. See [Extension UI requests](#extension-ui-requests). | **sent** (`PiSession.ts:201-205`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:294-297` |

Desktop file references in this table are under `gentle-shell-desktop@5ab4a00:src/main/domain/session/` (`PiSession.ts`) and `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/` (`types.ts`).

### Differences between pi 0.85.1 and 0.99.1 (commands)

| Area | pi 0.85.1 | pi 0.99.1 | Evidence |
|---|---|---|---|
| `prompt` success response | `{type:"response", command:"prompt", success:true}`, no `data`. | Adds `data.disposition`: `"started"`, `"queued"` or `"handled"`. | `pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-types.ts:118`, `pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-mode.ts:403-407`; `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:118`, `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:403-406`, `pi@d86654a:packages/coding-agent/docs/rpc-commands.md:40` |
| `prompt` failure response | Same in both: the success response is emitted only after preflight succeeds; a failing prompt throws, and the `.catch` emits an error response if no success was sent yet. | Same. pi 0.99.1 calls `preflightResult` only with a success disposition. | `pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-mode.ts:395-412`; `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:395-411`, `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:1896`, `:1915`, `:1939`, `:2024` |
| `steer` / `follow_up` response | No `data`. | `data.disposition`: `"handled"` or `"queued"`. | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:119-126`, `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:289-290` |
| "handled" semantics | Not documented. | If `"handled"`, no run started, so a client must not wait for `agent_settled`. | `pi@d86654a:packages/coding-agent/docs/rpc.md:67` |
| Documentation layout | One file, `docs/rpc.md` (1,618 lines). | Split into `rpc.md`, `rpc-commands.md`, `rpc-extension-ui.md`, with events in `json.md`. | `pi@d86654a:packages/coding-agent/docs/rpc.md:134-142` |
| `RpcClient` (TypeScript) | `prompt()` returns `void`. | `prompt()` takes `streamingBehavior?` and returns the disposition. | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-client.ts:198-204` |

No command was added or removed between 0.85.1 and 0.99.1, and nothing in the RPC layer changed between 0.99.1 and 1.0.0 (see above), so the 0.99.1 column also describes 1.0.0.

## Events (runtime → desktop)

Events are every `AgentSessionEvent`, serialized through `toJsonEvent` and written to stdout (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:355-356`). `toJsonEvent` is identical in pi 0.85.1, 0.99.1 and 1.0.0 (`json-event.ts`, checked with `git diff --quiet d981de1 a13d35a`); the event types in `packages/agent/src/types.ts` and the event union in `agent-session.ts` did not change in 1.0.0. Events carry no `id`, except `bash_execution_update` (`pi@a13d35a:packages/coding-agent/docs/rpc.md:46`).

**Desktop column:** what `codec.ts` decodes and what `chatReducer.ts` does with it. Anything not decoded becomes `{kind:"unknown"}` and is dropped (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:130-131`, `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:248`).

| Event | Fields | Purpose | Desktop | Source (1.0.0) |
|---|---|---|---|---|
| `agent_start` | – | A low-level run started. | Sets `working: true` (`chatReducer.ts:54`) | `pi@a13d35a:packages/agent/src/types.ts:516` |
| `agent_end` | `messages`, `willRetry` | One low-level run ended; retries or queued work may follow. | Sets `working: false` (`chatReducer.ts:56`) | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:192-196` |
| `agent_settled` | – | Nothing more will run automatically. | Sets `working: false` (`chatReducer.ts:57`) | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:197` |
| `turn_start` | – | One assistant turn started. | Decoded, ignored (`codec.ts:90`) | `pi@a13d35a:packages/agent/src/types.ts:519` |
| `turn_end` | `message`, `toolResults` | One assistant turn ended. | Decoded without fields, ignored (`codec.ts:91`) | `pi@a13d35a:packages/agent/src/types.ts:520` |
| `message_start` | `message` | A message started. | Opens an assistant bubble (`chatReducer.ts:59`) | `pi@a13d35a:packages/agent/src/types.ts:522` |
| `message_update` | `usage`, `assistantMessageEvent` (no cumulative `message`) | Streaming delta; see delta table below. | Appends `text_delta`; thinking/toolcall deltas bump an activity counter (`chatReducer.ts:61`, `:93-104`) | `pi@a13d35a:packages/coding-agent/src/modes/json-event.ts:11-15` |
| `message_end` | `message` | Message completed; authoritative. | Resyncs final text (`chatReducer.ts:63`) | `pi@a13d35a:packages/agent/src/types.ts:525` |
| `tool_execution_start` | `toolCallId`, `toolName`, `args`, `parentToolCallId?` (since 0.99.1) | Tool execution started. | Bumps activity counter only (`chatReducer.ts:65`) | `pi@a13d35a:packages/agent/src/types.ts:527`, `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:183-187` |
| `tool_execution_update` | `toolCallId`, `toolName`, `args`, `partialResult`, `parentToolCallId?` (since 0.99.1) | Partial tool result. | Bumps activity counter only (`chatReducer.ts:66`) | `pi@a13d35a:packages/agent/src/types.ts:528` |
| `tool_execution_end` | `toolCallId`, `toolName`, `result`, `isError`, `parentToolCallId?` (since 0.99.1) | Tool finished. | Bumps activity counter only (`chatReducer.ts:67`) | `pi@a13d35a:packages/agent/src/types.ts:529` |
| `queue_update` | `steering`, `followUp` | Queue contents changed (full snapshot). | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:198-202` |
| `entry_appended` | `entry` | An extension appended a custom session entry. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:204` |
| `session_info_changed` | `name` | Session display name changed. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:205` |
| `thinking_level_changed` | `level` | Thinking level changed. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:206` |
| `compaction_start` | `reason: "manual"\|"threshold"\|"overflow"` | Compaction began. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:203` |
| `compaction_end` | `reason`, `result`, `aborted`, `willRetry`, `errorMessage?` | Compaction finished. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:207-214` |
| `auto_retry_start` | `attempt`, `maxAttempts`, `delayMs`, `errorMessage` | Retry after a transient error. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:215` |
| `auto_retry_end` | `success`, `attempt`, `finalError?` | Retry loop finished. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:216` |
| `summarization_retry_scheduled` | `attempt`, `maxAttempts`, `delayMs`, `errorMessage` | Summarization retry scheduled. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:217-223` |
| `summarization_retry_attempt_start` | `source: "branchSummary"`, or `source: "compaction"` + `reason` | Summarization retry started. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:224-229` |
| `summarization_retry_finished` | – | Summarization retry loop done. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:230` |
| `bash_execution_update` | `id?`, `delta` | Output chunk of a direct `bash` command. | – | `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:231` |
| `extension_error` | `extensionPath`, `event`, `error` | An extension threw. Emitted by `rpc-mode.ts`, not by the session. | Sets `lastError` (`chatReducer.ts:71`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:348-350` |
| `response` | See [Correlation and errors](#correlation-and-errors) | Command acknowledgement. | Decoded; only the `get_messages` response is acted on (`PiSession.ts:257`, `:272-284`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:116-245` |
| `extension_ui_request` | See next section | Extension UI sub-protocol. | See next section | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:252-287` |

Desktop references in this table: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts`, `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts`, `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts`.

### `message_update` delta types

`assistantMessageEvent.type` is one of `text_start`, `text_delta`, `text_end`, `thinking_start`, `thinking_delta`, `thinking_end`, `toolcall_start` (adds `id`, `toolName` on the wire), `toolcall_delta`, `toolcall_end` (`pi@d981de1:packages/coding-agent/docs/rpc.md:965-973`). The 0.99.1 and 1.0.0 docs also list `start`, `done` and `error` (`pi@a13d35a:packages/coding-agent/docs/json.md:78-89`). The desktop models only the nine `text_*`/`thinking_*`/`toolcall_*` types (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:77-91`).

### Differences between pi 0.85.1 and 0.99.1 (events)

| Area | pi 0.85.1 | pi 0.99.1 | Evidence |
|---|---|---|---|
| `parentToolCallId` on `tool_execution_*` | Absent. | Optional; set for nested tool calls (`ctx.executeTool`, MCP codemode). Nested `toolCallId` is `<parent id>/<n>`. | `pi@d981de1:packages/coding-agent/src/core/agent-session.ts:145`; `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:183-191`, `pi@d86654a:packages/coding-agent/docs/extensions.md:148` |
| `entry_appended`, `session_info_changed`, `thinking_level_changed` | Emitted (`pi@d981de1:packages/coding-agent/src/core/agent-session.ts:158-160`, `:1809`, `:2597`, `:3093`) but **not listed** in the RPC event table (`pi@d981de1:packages/coding-agent/docs/rpc.md:859-883`). | Emitted and documented. | `pi@d86654a:packages/coding-agent/docs/json.md:122-124` |
| `system` message role | Absent: `Message` is `UserMessage \| AssistantMessage \| ToolResultMessage`; message events cover user, assistant and toolResult messages. | Adds `SystemMessage` (`role: "system"`) to `Message`; message lifecycle events are documented as emitted for system messages too. `Inference:` a host that switches on `message.role` may see a fourth role. | `pi@d981de1:packages/ai/src/types.ts:470`, `pi@d981de1:packages/agent/src/types.ts:438`; `pi@d86654a:packages/ai/src/types.ts:523`, `:610`, `pi@d86654a:packages/agent/src/types.ts:521` |
| `entry_appended` emission sites | 1 site found. | 5 sites, including the cache warmer. | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:461`, `:793`, `:986`, `:1208`, `:3325` |

## Extension UI requests

Extensions call `ctx.ui.*`. In RPC mode, supported calls become `extension_ui_request` records on stdout; dialogs block until an `extension_ui_response` with the same `id` arrives on stdin (`pi@a13d35a:packages/coding-agent/docs/rpc-extension-ui.md:5-8`). If a dialog has `timeout`, pi resolves it with a default value on its own (`:10`; `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:115-120`). The method set and fields are identical in 0.85.1, 0.99.1 and 1.0.0 (0.85.1 lines are 6 lower: `pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-types.ts:246-291`).

| Method | Kind | Fields | Expected response | Desktop (main process) | Source (1.0.0) |
|---|---|---|---|---|---|
| `select` | Dialog | `title`, `options: string[]`, `timeout?` | `{value}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:167`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:253` |
| `confirm` | Dialog | `title`, `message`, `timeout?` | `{confirmed}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:169`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:254` |
| `input` | Dialog | `title`, `placeholder?`, `timeout?` | `{value}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:171`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:255-262` |
| `editor` | Dialog | `title`, `prefill?` (no `timeout`) | `{value}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:178`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:263` |
| `notify` | Fire-and-forget | `message`, `notifyType?: "info"\|"warning"\|"error"` | none | Ignored (`chatReducer.ts:182-184`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:264-270` |
| `setStatus` | Fire-and-forget | `statusKey`, `statusText` (`undefined` clears) | none | Ignored | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:271-277` |
| `setWidget` | Fire-and-forget | `widgetKey`, `widgetLines: string[]\|undefined`, `widgetPlacement?: "aboveEditor"\|"belowEditor"` | none | Only `widgetKey: "gentle-agents"` is parsed; other keys ignored (`chatReducer.ts:32`, `:180`, `:196-206`) | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:278-285` |
| `setTitle` | Fire-and-forget | `title` | none | Ignored | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:286` |
| `set_editor_text` | Fire-and-forget | `text` | none | Ignored | `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:287` |

Desktop references: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts`. Whether the renderer can answer every dialog kind is out of scope here; see `03-architecture/current.md`.

### What RPC mode drops

These `ctx.ui` calls do nothing or degrade under `--mode rpc` (`pi@a13d35a:packages/coding-agent/docs/rpc-extension-ui.md:14-23`; 0.85.1 lists a shorter set at `pi@d981de1:packages/coding-agent/docs/rpc.md:1194-1203`):

- `custom()` returns `undefined`: no custom TUI component reaches the host (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:228-231`).
- `setWidget` with a component factory instead of `string[]` is silently ignored (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:194-207`).
- `setFooter`, `setHeader`, `setEditorComponent`, `setWorkingMessage`, `setWorkingIndicator`, `setToolsExpanded`, `setWorkingVisible`, `setHiddenThinkingLabel` and `addAutocompleteProvider` are no-ops in both versions. The last three are no-ops in 0.85.1 code too (`pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-mode.ts:183`, `:191`, `:273`); only the 0.85.1 docs omit them.
- `getEditorText()` returns `""`. `get theme()` returns the real theme, but `getAllThemes()` returns `[]` and `getTheme()` returns `undefined`. `setTheme()` returns `{success:false}` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:286-301`).

### gentle-shell additions over RPC

gentle-shell adds no RPC command or event type of its own. The additions in this table ride on `extension_ui_request` or on `prompt`-invoked extension commands, and most of them require `GENTLE_SHELL_INTERACTIVE_HOST=1`. gentle-shell also reaches an RPC host through custom messages and session entries (for example `gentle-agents.result` and `gentle-pi.session-change/v1`); those, and the other extension channels pi carries over RPC, are listed in [Host and extension channels](#host-and-extension-channels).

| Addition | Wire shape | Gate | Evidence |
|---|---|---|---|
| `ask_user_question` dialogs | One `select` per question; multi-select loops `select` over toggle options. | Interactive host. Without it the tool returns an "unavailable" result. | `gentle-shell@ac67159:extensions/ask-user-question.ts:118`, `:137`, `:157-170`, `:267-268` |
| `ask_user_choice` dialogs | One `select`; an `input` follows when a custom response is allowed. | Interactive host. Without it the tool throws. | `gentle-shell@ac67159:extensions/ask-user-choice.ts:205`, `:208`, `:229-231` |
| Helper activity (`gentle-agents.activity/v1`) | `setWidget` with `widgetKey: "gentle-agents"` and `widgetLines` holding exactly one JSON string. Coalesced to one push per 150 ms. Bounded to 256 KiB. | Interactive host, started on `session_start`. | `gentle-shell@ac67159:docs/gentle-agents-activity.md:11-24`, `:80`, `:119`; `gentle-shell@ac67159:extensions/gentle-agents.ts:1697-1711`; `gentle-shell@ac67159:lib/agents-rpc-publisher.ts:12`, `:16`, `:32` |
| Activity push failure | `notify` with `notifyType: "warning"`, deduplicated per message. | Interactive host. | `gentle-shell@ac67159:extensions/gentle-agents.ts:1704-1709` |
| Extension commands (`/gentle:*`) | Sent as `prompt` text; dialogs they open use `select`/`confirm`/`input`. Example: `/gentle:persona` opens a `select`. Commands built on `ctx.ui.custom()` get no UI: `/gentle:profiles` opens its panel with `custom()`, which returns `undefined` under RPC, and the handler then reads `result.type` with no mode guard. `Inference:` (not run) the command throws a `TypeError`. | None at the RPC layer. | `pi@a13d35a:packages/coding-agent/docs/rpc-commands.md:31`; `gentle-shell@ac67159:extensions/gentle-ai.ts:9924-9934`, `:4754-4756` (persona), `:4732-4739`, `:4070` (profiles); `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:228-231` |
| YOLO indicator (`/gentle:yolo`) | `setStatus` and `setWidget` (`string[]`) with key `gentle:yolo`, text `YOLO_STATUS_TEXT`; cleared with `undefined`. | None: `publish` has no mode or interactive-host check. `Inference:` (not run) both requests reach an RPC host, but never as active: activation captures a session identity that requires `ctx.mode === "tui"`, so YOLO cannot be activated over RPC and an RPC host only receives the cleared (`undefined`) indicator. The desktop ignores `setStatus` and every `setWidget` key except `gentle-agents`. See [inventory Y4](05-capability-inventory.md#safety-and-permissions). | `gentle-shell@ac67159:lib/yolo-session-policy.ts:5-6`, `:105-108`, `:115-118`, `:172`; `gentle-shell@ac67159:lib/review-session-standing-permission.ts:144-162` |

**`gentle-agents.activity/v1` payload.** `{schema, summary:{running,queued,waiting,finished}, tasks:[{summary, thread}]}`. Each task `summary` whitelists `id`, `agent`, `label`, `prompt`, `status`, `createdAt`, `startedAt`, `endedAt`, `lastStep`, `lastActivityAt`, `turns`, `toolCalls`, `error`. It deliberately omits `cwd`, `parentSessionId`, `mode`, `model`, `thinking`, `sessionPath`, `result`, `tokens`, `cost` (`gentle-shell@ac67159:docs/gentle-agents-activity.md:62`). Thread items are `{kind, text}` for text/thinking/note, and `{kind:"tool", name, args, running, isError, output}` for tools, with `args` stringified (`:64`; `gentle-shell@ac67159:lib/agents-rpc-publisher.ts:96-108`). The desktop parser lives at `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:38-55`.

### gentle-shell surfaces that do not reach an RPC host

`Inference:` these features render through TUI-only APIs that RPC mode drops (see [What RPC mode drops](#what-rpc-mode-drops)), so a desktop host sees nothing of them today.

| Surface | Why it is TUI-only | Evidence |
|---|---|---|
| ODD phase label | Rendered by `GentlePromptEditor`, installed via `setEditorComponent`. That editor is the only reader of the phase registry, so phases inferred from tool activity never leave the process. Partial exception: when the model calls the `gentle_odd_phase` tool, the call and its `phase` argument are visible to an RPC host as `tool_execution_*` events. | `gentle-shell@ac67159:extensions/gentle-shell.ts:1108`, `:1120`, `:2383-2387`; `gentle-shell@ac67159:extensions/gentle-ai.ts:9330`, `:9336`; `gentle-shell@ac67159:lib/odd-phase.ts:1-8` |
| Todo widget (`gentle-todo`) | `setWidget` with a component factory. | `gentle-shell@ac67159:extensions/gentle-todo.ts:168-172` |
| Changes widget | `setWidget` with a component factory. | `gentle-shell@ac67159:extensions/gentle-shell.ts:1333-1343` |
| Dev-binary notice widget | `setWidget` with a component factory. On gentle-shell `main` (`ac67159`), after the 4.0.0 release (#1652), the `notify` fallback for an active or invalid override is sent only when the shell is disabled (`GENTLE_PI_SHELL=0`, or inside a helper); a failed override check still sends a `notify` whenever `ctx.hasUI` holds. `Inference:` by default no dev-binary notice reaches an RPC host unless that check fails. In the 4.0.0 release and in 3.7.0 an active or invalid override also arrived as `notify` (`gentle-shell@1f35ab1:extensions/gentle-ai.ts:9368-9370`; `gentle-shell@1162ce9:extensions/gentle-ai.ts:9369-9370`). | `gentle-shell@ac67159:extensions/gentle-shell.ts:1890-1895`; `gentle-shell@ac67159:extensions/gentle-ai.ts:9706-9713`; `gentle-shell@ac67159:lib/shell-bar.ts:107-111` |
| Custom footer, shell header and startup header | `setFooter`, a component-factory `setWidget` for the shell header (`HEADER_WIDGET_KEY`), and `setHeader` for the startup banner. | `gentle-shell@ac67159:extensions/gentle-shell.ts:1789`, `:1852-1874`; `gentle-shell@ac67159:extensions/startup-banner.ts:750` |
| Agents overlay (`/gentle:agents`), including per-helper Stop; stats overlay (`/gentle:stats`, new in 4.0.0) | Each returns early with a "requires TUI mode" notice when `ctx.mode !== "tui"`. | `gentle-shell@ac67159:extensions/gentle-agents.ts:1081-1086`; `gentle-shell@ac67159:extensions/gentle-stats.ts:49-54` |

## Versioning and compatibility

### Is there a version handshake?

**No.** What was checked:

- pi's RPC layer: a case-insensitive search for `version` in `packages/coding-agent/src/modes/rpc/` returns nothing at 0.85.1 or 0.99.1, and nothing again at 1.0.0 (re-run with `git grep -i version a13d35a -- packages/coding-agent/src/modes/rpc/` on 2026-10-03). `RpcSessionState` has no version field (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:96-109`). No startup record announces a version (see [Startup and shutdown](#startup-and-shutdown)).
- Desktop: `src/main` never runs `--version` and never compares versions. The only reference is the error message "gentle-pi 3.7.0 or newer" when no launcher is found (`gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:26-28`).
- The one versioned payload is the activity schema. The desktop rejects any frame whose `schema` is not exactly `gentle-agents.activity/v1` and keeps the previous state (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:19`, `:48`).
- The only enforced version check in the chain is the launcher's pi floor of 0.99.1 (`gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`, `:405-418`).

### Effective versions

| Component | Version | Evidence |
|---|---|---|
| pi answering RPC (via gentle-shell 4.0.0) | ≥ 0.99.1, enforced at launch; gentle-shell develops against ≥ 1.0.0. The RPC sources are byte-identical in 0.99.1 and 1.0.0, so the contract on this page holds for both. (gentle-shell 3.7.0 also enforced 0.99.1 and pinned dev `0.99.1`: `gentle-shell@1162ce9:package.json:95`.) | `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`; `gentle-shell@ac67159:package.json:78` (peer `>=0.99.1`), `:95-97` (dev `>=1.0.0`) |
| pi imported in-process by the desktop | 0.85.1 (locked) | `gentle-shell-desktop@5ab4a00:package.json:42`, `gentle-shell-desktop@5ab4a00:pnpm-lock.yaml:323` |
| pi the desktop's RPC types were written against | `UNVERIFIED:` the header names "the local pi checkout" without a version. `Inference:` the modeled subset matches both versions' shapes. | `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:7` |

### Compatibility observations

| # | Observation | Impact | Evidence |
|---|---|---|---|
| 1 | The 0.99.1 `prompt` response adds `data.disposition`. The desktop decodes `data?: unknown` and ignores prompt responses. | Compatible. | `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:175`, `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:201-210` |
| 2 | gentle-shell's tool thread items carry no `callId`, but the desktop parser requires a string `callId` for `kind: "tool"`. | `Inference:` real tool items are dropped from the Helpers thread. The desktop fixture includes `callId`, so its tests do not catch this. | `gentle-shell@ac67159:lib/agents-rpc-publisher.ts:96-108`, `gentle-shell@ac67159:docs/gentle-agents-activity.md:64`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:107-108`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/__fixtures__/helpers-activity.jsonl:2` |
| 3 | The desktop clears `working` on `agent_end`, even when `willRetry` is true. pi says to wait for `agent_settled`. | `Inference:` during an auto-retry the composer re-enables. A prompt sent then has no `streamingBehavior`, so pi rejects it with an error. | `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:56-58`; `pi@a13d35a:packages/coding-agent/docs/rpc.md:69`; `pi@a13d35a:packages/coding-agent/docs/rpc-commands.md:29` |
| 4 | A `prompt` that is `"handled"` (for example a `/gentle:*` command) starts no run. | `Inference:` no `agent_start` arrives, so `working` never turns on. This is harmless for the current reducer. | `pi@a13d35a:packages/coding-agent/docs/rpc.md:67` |
| 5 | `parentToolCallId` and the three state events are not modeled. | No breakage: the codec drops unknown fields and types (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:100-116`, `:130-131`). | — |
| 6 | Task status sets differ. gentle-shell statuses are `queued`, `running`, `waiting`, `completed`, `failed`, `cancelled`, `timed_out`, published unchanged in each task `summary.status`. The desktop accepts only `queued`, `running`, `waiting`, `done`, `failed`, `cancelled`, and `toTask` drops a task whose status is not in that set. | Likely desktop bug. `Inference:` (not run) the reducer's retention merge keeps a task that was seen while running and later dropped from the frame, and turns `running` into `done`. So the visible effect is mostly a wrong status: a timed-out helper shows as done (`completed` ends up as done by accident). Only a helper first seen already `completed` or `timed_out`, for example after opening a chat, vanishes from the list, while the `summary.finished` counter (parsed separately) still counts it. The desktop fixture uses `done`, so its tests do not catch this. See [audit A5](03-architecture/audit.md#a5-helper-status-set-and-tool-items-do-not-match-gentle-shell). | `gentle-shell@ac67159:lib/agents-protocol.ts:9-17`, `gentle-shell@ac67159:lib/agents-rpc-publisher.ts:116`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:21`, `:83-85`, `:87-95`, `:139-141`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:225-240`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/__fixtures__/helpers-activity.jsonl` |
| 7 | Session listing uses in-process pi 0.85.1 while the RPC peer runs ≥ 0.99.1. | `UNVERIFIED:` whether the session file format differs between those versions was not checked here. See `03-architecture/audit.md`. The inventory settles it for the fields the list uses: same `CURRENT_SESSION_VERSION`, identical `listAll()` interface ([05 §Differences between pi 0.85.1 and 0.99.1](05-capability-inventory.md#differences-between-pi-0851-and-0991-that-matter-to-the-desktop)). | `gentle-shell-desktop@5ab4a00:src/main/adapters/piSessionStore.ts:30` |

## Gaps the desktop needs

A gap is a capability the desktop needs that the RPC contract does not offer. **Basis** says where the need comes from:

- **stated**: the desktop repo states the need.
- **intent-driven**: derived from the concept mockup (intent, not spec).
- **community proposal**: not maintainer intent.

Absence is checked against the full command list (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:20-74`) and the extension UI method list (`:252-287`).

| # | Gap | Basis | Need evidence | Absence evidence | Partial workaround today |
|---|---|---|---|---|---|
| G1 | **Stop a helper** (one subagent, or all) | stated | `gentle-shell-desktop@5ab4a00:README.md:62`, `:85-86`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:18`, `:22`; mockup Stop button `gs-mockup.html:603` | No RPC command targets subagents. gentle-agents stops tasks only from the TUI overlay (`gentle-shell@ac67159:extensions/gentle-agents.ts:995`, `:1020`, `:1081-1086`) or a TUI shortcut (`:1656-1660`). `subagent_cancel` is a model tool, not a host command (`:1602`). | `Inference:` RPC `abort` cancels **foreground** subagents through the tool-call abort handler (`gentle-shell@ac67159:extensions/gentle-agents.ts:1371-1378`). Background tasks return before that handler is wired (`:1366`), so a single background helper cannot be stopped over RPC. Stop-all exists only as a destructive side effect: `new_session`, `switch_session`, `fork`, `clone` and closing stdin all emit `session_shutdown` (`pi@a13d35a:packages/coding-agent/src/core/agent-session-runtime.ts:167-177`, `:212`, `:245`, `:299`, `:320`, `:334`, `:404-407`; RPC `clone` calls `fork`, `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:624`), and gentle-agents answers it with `runner.cancelAll(...)` (`gentle-shell@ac67159:extensions/gentle-agents.ts:1714`, `:1734`). Asking the model via `prompt` to call `subagent_cancel` is indirect and not a control. |
| G2 | **Structured ODD state** (feature, phase, tasks, checks) | stated + intent-driven | `gentle-shell-desktop@5ab4a00:README.md:63`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:69` ("needs the structured ODD document format"); mockup ODD panel `gs-mockup.html:614-640` | No ODD command or event. The phase label is TUI-only (see [TUI surfaces](#gentle-shell-surfaces-that-do-not-reach-an-rpc-host)). | Phase only, and only when the model reports it: `gentle_odd_phase` calls (with their `phase` argument) arrive as `tool_execution_*` events (`gentle-shell@ac67159:extensions/gentle-ai.ts:9330`, `:9336`). Phases inferred from tool activity stay TUI-only (`gentle-shell@ac67159:lib/odd-phase.ts:1-8`). `get_entries` / `entry_appended` would carry ODD state if gentle-shell appended it as a session entry ([Host and extension channels](#host-and-extension-channels)), but it does not: the only custom entry types gentle-shell appends are `gentle-pi.session-change/v1`, `gentle-pi.session-worktree/v1`, `gentle-ai-elapsed-timing/v1`, `gentle-pi.review-reminder-receipt/v1` and `gentle-agents.stale-result` (`gentle-shell@ac67159:lib/session-changes.ts:8`, `lib/session-change-capture.ts:28`; `lib/session-worktree-registry.ts:6`, `:114`; `lib/gentle-ai-elapsed-store.ts:1`, `:84`; `lib/review-reminder-receipt.ts:5`, `:107`, `:113`; `extensions/gentle-agents.ts:59`, `:720`; every `appendEntry(` call in `extensions/` and `lib/`, searched with `rg` on 2026-10-03). |
| G3 | **Providers and sign-in** | stated + intent-driven | `gentle-shell-desktop@5ab4a00:README.md:63` ("no providers ... screens (M4): sign in ... through `gentle-shell` in the terminal"); mockup `gs-mockup.html:695-723` | No auth or login command. Only `get_available_models` and `set_model` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:33-35`). Radius OAuth sign-in already exists in pi 0.99.1 (`pi@d86654a:packages/ai/src/auth/oauth/radius.ts`); pi 1.0.0 moves it to the top level of the interactive `/login` and offers to set up the Radius MCP server, with no RPC counterpart (`pi@a13d35a:packages/coding-agent/CHANGELOG.md:25`; inventory M7). | Model choice per session works; credentials do not. |
| G4 | **Default model for new chats** | intent-driven | mockup `gs-mockup.html:730-731` | `set_model` acts on the running session only: RPC calls `session.setModel(model)` without `persist` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:476`), and `setModel` writes the default model only when `options.persist` is true (`pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:2439-2442`). No command persists a default. | `--model` CLI flag at spawn (`pi@a13d35a:packages/coding-agent/docs/rpc.md:18`). |
| G5 | **Extensions and packages** (install, update, remove, enable) | stated + intent-driven | `gentle-shell-desktop@5ab4a00:README.md:63`; mockup `gs-mockup.html:754-797` | No package command in `RpcCommand`. `get_commands` lists commands, prompts and skills only (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:81-90`). | None over RPC. |
| G6 | **Profiles** (read active, switch) | intent-driven; core gentle-shell concept per the corpus brief | mockup status bar `gs-mockup.html:819`, `:731` | No profile state in `RpcSessionState` (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts:96-109`). | None. `/gentle:profiles` is not reachable over RPC today: its panel uses `ctx.ui.custom()` (`gentle-shell@ac67159:extensions/gentle-ai.ts:4070`), which returns `undefined` under RPC (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:228-231`), and the handler then reads `result.type` (`gentle-shell@ac67159:extensions/gentle-ai.ts:4739`). `Inference:` (not run) it throws a `TypeError`. The active profile cannot be read as data either. |
| G7 | **Status bar data** | intent-driven | mockup `gs-mockup.html:813-822` | Model and thinking level: `get_state` plus `thinking_level_changed` (available). Cost and context usage: `get_session_stats` (pull only; `pi@a13d35a:packages/coding-agent/src/core/agent-session.ts:341-342`). cwd and branch: not in `RpcSessionState`. `ODD · RDD on`: no RPC state; RDD is read via the `/gentle:review-mode` command (`gentle-shell@ac67159:docs/readme-reference.md:397`). | Partly available; the desktop uses none of it today. |
| G8 | **Helper transcript and result** (for audit or "why did it do that") | community proposal | Context brief §2 (Matrak's proposals); skeleton note in this file | The activity payload omits `sessionPath`, `result`, `tokens`, `cost` (`gentle-shell@ac67159:docs/gentle-agents-activity.md:62`). Threads keep the last 40 items (`:79`). | `subagent_result` is a model tool, not a host command (`gentle-shell@ac67159:extensions/gentle-agents.ts:1578`). |
| G9 | **Several chats at once** | intent-driven | mockup sidebar status "needs you" `gs-mockup.html:486`; toast styles `gs-mockup.html:308-323` | Not a protocol gap: one pi process serves one session, and nothing prevents spawning several. The desktop keeps a single `current` session (`gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:70`). | Desktop architecture work, not an upstream change. |
| G10 | **Version handshake** | `Inference:` derived from the skew above, not stated anywhere | See [Versioning](#versioning-and-compatibility) | No version field anywhere in the protocol. | Run `gentle-shell --version` out of band (`gentle-shell@ac67159:bin/gentle-shell.mjs:1217-1219`). |

Mockup lines refer to `~/bitacoras/gs-desktop/gs-mockup.html` (rendered DOM of https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL). The mockup is intent, not spec.

`Inference` (layer that owns each gap): pi core owns the `RpcCommand` union, so new host commands (G3, G4, G5, G10) need a pi change. gentle-shell can push new data without touching pi by using `setWidget` `string[]` payloads, as the activity schema does (`gentle-shell@ac67159:docs/gentle-agents-activity.md:13`), or the custom messages and session entries listed in [Host and extension channels](#host-and-extension-channels). That route fits G2, G6, G7 and G8. A host action such as G1 needs an inbound channel, and pi already routes host text to extension code; among other paths, `prompt` reaches extension commands and `input` handlers, `steer` and `follow_up` reach `input` handlers, `bash` reaches `user_bash` handlers, and `extension_ui_response` answers dialogs (same section). So G1 could be met inside gentle-shell with no pi change, for example by a command or an `input` handler that stops a helper by id. No such handler exists at `ac67159`: gentle-agents registers one command, the TUI-only overlay (`gentle-shell@ac67159:extensions/gentle-agents.ts:1646`, `:1081-1086`), and no `input` handler is registered in `extensions/` or `lib/` (`rg` on 2026-10-03). Which channel a host should use is an open question: see [Alternatives for a host channel to gentle-shell features](#alternatives-for-a-host-channel-to-gentle-shell-features) and [ADR: Undecided](03-architecture/adr/README.md#undecided--not-recorded).

### Host and extension channels

pi offers no way for a host to call extension code by name over RPC, but several RPC inputs reach extension handlers, and several extension APIs reach the host. gentle-shell also runs channels of its own outside pi's stdio. Verified at pi 1.0.0 (`pi@a13d35a`) and gentle-shell `main` (`gentle-shell@ac67159`); `PC` below abbreviates `pi@a13d35a:packages/coding-agent/`, `GS` abbreviates `gentle-shell@ac67159:`.

**No passthrough.**

- `RpcCommand` has no generic or extension variant (PC`src/modes/rpc/rpc-types.ts:20-74`). An unknown `type` falls to the `default` branch and returns `Unknown command: <type>`; no extension code runs on that path (PC`src/modes/rpc/rpc-mode.ts:713-716`).
- The `ExtensionAPI` registration methods cover tools, commands, shortcuts, flags, renderers, providers, MCP servers and virtual models; none registers an RPC command or event (PC`src/core/extensions/types.ts:1619-1859`).
- `pi.events` is an in-process `EventEmitter` bus for "Communicate with another extension" (PC`src/core/event-bus.ts:1-6`; PC`src/core/extensions/types.ts:1862`; PC`docs/extensions.md:86`). `rpc-mode.ts` does not reference it.
- RPC mode redirects `process.stdout.write` to stderr and writes its own records through `writeRawStdout` (PC`src/modes/rpc/rpc-mode.ts:55`, `:61`; PC`src/core/output-guard.ts:45-70`, `:85-93`). `Inference:` an extension that writes to `process.stdout` cannot add records to the RPC stream.

**Inbound: RPC inputs that reach extension code.**

| RPC input | Extension code reached | What the extension receives | Evidence |
|---|---|---|---|
| `prompt` starting with `/name` | The registered command handler. It runs before the compaction and streaming checks ("execute immediately, even during streaming"); the response reports `disposition: "handled"`. | The argument string | PC`src/modes/rpc/rpc-mode.ts:394-414`; PC`src/core/agent-session.ts:1928-1936`, `:2069-2083`; PC`docs/rpc-commands.md:40` |
| `prompt` with other text | `input` handlers, with `source: "rpc"`. Each returns `continue`, `transform` or `handled`; `handled` ends the prompt (disposition `handled`), and this runs before the "already processing" rejection. A prompt that starts a run also fires `before_agent_start`. | `text`, `images`, `source`, `streamingBehavior` | PC`src/modes/rpc/rpc-mode.ts:402`; PC`src/core/agent-session.ts:1945-1955`, `:1870-1888`, `:1966-1969`, `:2012-2019`; PC`src/core/extensions/types.ts:1116-1135`; PC`src/core/extensions/runner.ts:1510-1536` |
| `steer`, `follow_up` | `input` handlers (`source: "rpc"`); text starting with an extension command is rejected. pi 0.86.0 fixed these commands "bypassing extension `input` handlers", so this holds above the launcher's 0.99.1 floor. | As above | PC`src/modes/rpc/rpc-mode.ts:416-424`; PC`src/core/agent-session.ts:2126-2142`, `:2169`, `:2185`; PC`CHANGELOG.md:340` (section `:270`) |
| `bash` | `user_bash` handlers; a handler may return the result itself. | `command`, `excludeFromContext`, `cwd` | PC`src/modes/rpc/rpc-mode.ts:561-579`; PC`src/core/extensions/runner.ts:1253-1260`; PC`src/core/extensions/types.ts:1101-1109` |
| `extension_ui_response` | Only the pending dialog with the same `id`; other ids are ignored. | The dialog answer | PC`src/modes/rpc/rpc-mode.ts:122-128`, `:767-779` |
| `compact` | `session_before_compact` (reason `manual`), then `session_compact` after the compaction is saved. | `customInstructions` and the compaction preparation | PC`src/modes/rpc/rpc-mode.ts:533-535`; PC`src/core/agent-session.ts:2745-2754`, `:2811-2817` |
| `set_session_name` | `session_info_changed` (also written to stdout). | `name` | PC`src/modes/rpc/rpc-mode.ts:659-665`; PC`src/core/agent-session.ts:3893-3897`; PC`src/core/extensions/types.ts:730-734` |
| `set_model`, `cycle_model`, `set_thinking_level`, `cycle_thinking_level`, `new_session`, `switch_session`, `fork`, `clone` | Lifecycle events: `model_select` (source `set` or `cycle`), `thinking_level_select`, `session_before_switch`, `session_before_fork`, `session_shutdown`, `session_start`. `session_shutdown` with reason `quit` also fires when stdin closes, which is not a command. | State changes; `switch_session` passes its target path | PC`src/core/agent-session.ts:2410-2421`, `:2472-2479`, `:2518`, `:2550`, `:2579-2586`, `:2594-2603`; PC`src/modes/rpc/rpc-mode.ts:435-442`, `:480-486`, `:502-503`, `:603-629`; PC`src/core/agent-session-runtime.ts:138-172` (`:142-146` target path), `:218`, `:251`, `:305`, `:326`, `:345`; stdin close: PC`src/modes/rpc/rpc-mode.ts:802-805`, `:736`; PC`src/core/agent-session-runtime.ts:404-408` |

`Inference:` free-form host text reaches extension code only through `prompt`, `steer`, `follow_up`, `bash`, `extension_ui_response`, `compact` and `set_session_name`; the remaining commands carry at most identifiers, paths or settings.

**Outbound: extension APIs that reach the host.**

| Extension API | Host record | Kept in the session? | Evidence |
|---|---|---|---|
| `ctx.ui` dialogs and fire-and-forget methods | `extension_ui_request` ([Extension UI requests](#extension-ui-requests)); `setWidget` carries `string[]` only | No | PC`src/modes/rpc/rpc-mode.ts:136-311`; PC`docs/rpc-extension-ui.md:7-8` |
| `pi.sendMessage` | `message_start` / `message_end` with `role: "custom"`, `customType`, `content`, `display`, `details`. `content` is converted to a user message for the model; `details` is not sent to the model. Delivery while streaming follows `deliverAs`. | Yes, as a `custom_message` entry. `Inference:` it is also returned by `get_messages`. | PC`src/core/agent-session.ts:2246-2294`; PC`src/modes/rpc/rpc-mode.ts:355-356`, `:672-673`; PC`docs/message-types.md:207-217`; PC`src/core/session-manager.ts:453-455` |
| `pi.appendEntry(customType, data)` | `entry_appended` with the entry; replayable with `get_entries` and a `since` cursor | Yes; "not sent to LLM" | PC`src/core/agent-session.ts:3359-3364`; PC`docs/json.md:122`; PC`src/modes/rpc/rpc-mode.ts:636-647`; PC`docs/rpc-commands.md:689-717`; PC`src/core/extensions/types.ts:1691-1692` |
| `pi.sendUserMessage` | Runs a prompt with `source: "extension"`. `Inference:` the host sees it as an ordinary user `message_start` / `message_end`, with nothing marking the extension as its author. | `Inference:` yes, as a user message | PC`src/core/agent-session.ts:3350-3357`, `:2342-2347` |
| `pi.setSessionName` | `session_info_changed` with `name` | Yes, as session info | PC`src/core/agent-session.ts:3366-3368`, `:3893-3896`; PC`docs/json.md:123` |
| A handler throws | `extension_error` with `extensionPath`, `event`, `error` | No | PC`src/modes/rpc/rpc-mode.ts:348-350`; PC`docs/json.md:190-194` |
| A registered tool runs | `tool_execution_*` with `args` and `result.details` | As tool messages | PC`docs/json.md:111-114` |

gentle-shell already uses the custom-message, user-message and entry rows:

- entries, for example `gentle-pi.session-change/v1` and `gentle-agents.stale-result` (GS`lib/session-changes.ts:8`; GS`lib/session-change-capture.ts:28`; GS`extensions/gentle-agents.ts:59`, `:720`; full list in gap G2 above);
- custom messages, all four types it sends: `gentle-agents.result`, `gentle-agents.message`, `gentle-agents.orchestrator-message` and `gentle-pi.review-preflight` (GS`extensions/gentle-agents.ts:56-58`, `:501`, `:700-703`, `:712`, `:725`; GS`extensions/gentle-ai.ts:9843-9850`; every `sendMessage(` call in `extensions/` and `lib/`, searched with `rg` on 2026-10-03);
- user messages: the idle-parent wake text, a command picked in the command palette (it uses `ctx.ui.custom()`, so `Inference:` never under RPC), and queued prompt text (GS`extensions/gentle-agents.ts:691`; GS`extensions/gentle-shell.ts:1325`, `:2405`).

**gentle-shell's own channels, outside pi's stdio.**

- **Helper runner.** gentle-agents is itself an RPC client: each helper runs `--mode rpc` with three piped stdio streams and a Node `ipc` channel, plus an fd 3 permission pipe when a parent permission channel exists (GS`lib/agents-runner.ts:258-259`, `:475`, `:502-507`, `:530-535`). It sends `steer`, `get_state`, `prompt` and `abort` and answers `extension_ui_response` (GS`lib/agents-runner.ts:441`, `:560`, `:573`, `:830`, `:863`). The `ipc` frames are `notification` and `query` with bounded size (GS`lib/agents-messaging.ts:1-30`, `:84-90`).
- **Cross-session transport.** Unix-domain sockets in a private `/tmp/gentle-pi-<uid>/<profile hash>/` directory, with presence records under the profile (GS`lib/agents-session-transport.ts:6-7`, `:64-78`, `:85-87`, `:433`); private named pipes through a PowerShell helper on Windows (GS`docs/gentle-shell.md:219`). Frames carry `version: 1` and are bounded to 64 KiB (GS`lib/agents-session-transport.ts:253-257`). It is "notification-and-ACK transport only", and outbound sends need interactive human consent (GS`docs/gentle-shell.md:219`). On POSIX, socket endpoints and private directories are checked to be owned by the current OS user (GS`lib/agents-session-transport.ts:22-23`, `:44`, `:52`, `:210`, `:440`). It starts on `session_start` of any non-child process with gentle-agents enabled, with no mode check: `startSessionTransport` tests neither `ctx.mode` nor `ctx.hasUI` (GS`extensions/gentle-agents.ts:151-154`, `:336-347`, `:468-520`, `:1663`, `:1689`). An incoming notification becomes a custom message delivered as a follow-up that triggers a turn (GS`extensions/gentle-agents.ts:498-501`). `Inference:` (not run) the desktop's RPC child opens this listener too.
- **File presence.** Presence files under the profile's `gentle-agents/presence`, written atomically; a "Same-profile OS-user trust boundary, not an authorization channel" (GS`lib/orchestrator-presence.ts:6-7`, `:106-107`, `:148-155`, `:258-262`).

**Schema precedent.** `gentle-agents.activity/v1` is the one documented schema for host-facing data (GS`docs/gentle-agents-activity.md:9-24`; GS`lib/agents-rpc-publisher.ts:12`, `:16`, `:29-32`). It is outbound only, and the desktop rejects any other `schema` value ([Is there a version handshake?](#is-there-a-version-handshake)). `Inference:` the document states no rule for evolving the schema (no such rule found in GS`docs/gentle-agents-activity.md`).

#### Alternatives for a host channel to gentle-shell features

Detail for the open question [Host channel to gentle-shell features](03-architecture/adr/README.md#undecided--not-recorded). No alternative is recommended here; judgments are labelled `Inference:`.

| Alternative | Which repository changes, and its process | Inbound (host → gentle-shell) | Outbound (gentle-shell → host) | Costs and risks |
|---|---|---|---|---|
| **A. Extend pi's `RpcCommand`** | pi, then gentle-shell to implement and the desktop to consume. pi's core is minimal and extension hook points "should be well considered and discussed" (`pi@a13d35a:CONTRIBUTING.md:7-11`); a new contributor files a `Contribution Proposal` issue, "required for new contributors before submitting a PR" (`pi@a13d35a:.github/ISSUE_TEMPLATE/contribution.yml:1-2`) and needs `lgtm` before a PR (`pi@a13d35a:CONTRIBUTING.md:29-34`, `:58`); larger changes go through RFCs (`:101-102`). | Typed commands with a correlated `response`, either one per feature or a generic extension passthrough; both are new (PC`src/modes/rpc/rpc-types.ts:20-74`; PC`src/modes/rpc/rpc-mode.ts:713-716`). | New typed event types, if pi accepts them. | `Inference:` it needs an upstream pi review before gentle-shell can implement it, and may be declined under pi's minimal-core rule. `Inference:` the desktop would depend on a pi release above today's floor of 0.99.1 (`gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`) with no version handshake to detect it ([Versioning](#versioning-and-compatibility)). `UNVERIFIED:` no RPC stability or compatibility policy was found for pi; its changelog records additive RPC changes (PC`CHANGELOG.md:129`, pi 0.99.0) and notes when "the supported local SDK and stdio RPC API are unchanged" (`:371`, pi 0.85.1). |
| **B. Existing pi extension channels, with versioned schemas** | gentle-shell (plus the desktop); no pi change. gentle-shell has no `CONTRIBUTING.md` and takes feature requests through its issue form ([gentle-shell process](#gentle-shell-gentleman-programminggentle-shell-package-gentle-pi-owns-the-extension-level-additions)). | `prompt` `/command args` (runs even while streaming), `input` handlers on `prompt`, `steer` and `follow_up`, `user_bash`, dialog responses ([inbound table](#host-and-extension-channels)). | `extension_ui_request` (`setWidget` `string[]`, `notify`, `setStatus`), custom messages, user messages (`sendUserMessage`), `session_info_changed` (`setSessionName`), `entry_appended` with `get_entries` replay, `tool_execution_*` ([outbound table](#host-and-extension-channels)). | Inbound is text (plus images on prompts), not typed fields: a command or `input` payload shares the user's prompt text space, and the `prompt` response carries only a `disposition`, not a result (PC`docs/rpc-commands.md:40`); `Inference:` results and errors need a separate outbound record and a correlation id defined by the schema. Custom message `content` goes to the model (PC`docs/message-types.md:217`) and entries persist in the session file (PC`src/core/extensions/types.ts:1691-1692`); `Inference:` each outbound route trades model context or session size against `setWidget`, which keeps neither. `Inference:` no schema-evolution rule exists yet (activity schema precedent above). |
| **C. A gentle-shell channel of its own outside pi's stdio** | gentle-shell (plus the desktop); no pi change; same gentle-shell process as B. | Anything the new protocol defines. | Anything the new protocol defines. | A second transport beside stdio. The existing transport is per platform (Unix sockets; named pipes through a PowerShell helper on Windows), carries notifications and ACKs only, and needs interactive consent to send (GS`docs/gentle-shell.md:219`). Its access control is ownership by the current OS user on POSIX (GS`lib/agents-session-transport.ts:22-23`, `:210`, `:440`), and the presence files beside it are a "Same-profile OS-user trust boundary, not an authorization channel" (GS`lib/orchestrator-presence.ts:6`). Its incoming messages reach the model as follow-ups that trigger a turn (GS`extensions/gentle-agents.ts:501`), so it is not a host control channel today. `Inference:` the desktop would need endpoint discovery, authentication and ordering against the stdio stream, and the statement that RPC is "the only formal interface between the desktop and gentle-shell" (line 5 of this page) would no longer hold. |

## How to propose contract changes upstream

### pi (`earendil-works/pi`): owns the RPC protocol

`CONTRIBUTING.md` is identical at pi 0.85.1, 0.99.1 and 1.0.0 (`git diff --quiet d981de1 a13d35a -- CONTRIBUTING.md`). What it says:

| Rule | Evidence |
|---|---|
| The core is minimal. Features that do not belong in core should be extensions, and extension hook points must be "well considered and discussed". | `pi@a13d35a:CONTRIBUTING.md:7-11` |
| Issues and PRs from new contributors are auto-closed by default. Maintainers review auto-closed **issues** daily and reopen worthwhile ones. | `pi@a13d35a:CONTRIBUTING.md:23`, `:27` |
| Issues must use "one of the two GitHub issue templates", be short, and be in your own voice. Note: pi 0.85.1 and 1.0.0 (identical directories) actually ship three issue forms, `bug.yml`, `contribution.yml` and `package-report.yml`, plus `config.yml`. | `pi@a13d35a:CONTRIBUTING.md:38-46`; `pi@a13d35a:.github/ISSUE_TEMPLATE/`, `pi@d981de1:.github/ISSUE_TEMPLATE/` |
| No PR without prior maintainer approval (`lgtm`); `lgtmi` approves issues only. | `pi@a13d35a:CONTRIBUTING.md:31-34`, `:58` |
| Before a PR: `npm run check` and `./test.sh`. Do not edit `CHANGELOG.md`. | `pi@a13d35a:CONTRIBUTING.md:62-69` |
| Larger changes are discussed as RFCs at rfc.earendil.com. | `pi@a13d35a:CONTRIBUTING.md:101-102` |

The proposal template is `Contribution Proposal`, with the fields "What do you want to change?", "Why?" and "How? (optional)" (`pi@a13d35a:.github/ISSUE_TEMPLATE/contribution.yml:1-36`). Blank issues are disabled; questions go to Discord (`pi@a13d35a:.github/ISSUE_TEMPLATE/config.yml:1-5`).

### gentle-shell (`Gentleman-Programming/gentle-shell`, package `gentle-pi`): owns the extension-level additions

- No `CONTRIBUTING.md` exists at `ac67159` (checked with `fd` at depth 3 on 2026-10-03).
- Issue forms: `bug_report.yml` and `feature_request.yml` (`gentle-shell@ac67159:.github/ISSUE_TEMPLATE/`). The feature form asks for "Problem or opportunity", "Proposed outcome", "Alternatives considered" and "Additional context", requires a duplicate search and a sensitive-data check, and labels issues `enhancement` and `status:needs-review` (`gentle-shell@ac67159:.github/ISSUE_TEMPLATE/feature_request.yml:1-43`).
- No document describes a process specific to RPC or interactive-host contract changes. The existing precedent is the activity schema doc itself (`gentle-shell@ac67159:docs/gentle-agents-activity.md`) and the desktop milestone M2 prerequisites that reference gentle-shell issues #1328 and #1329 (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:59`).
