# RPC contract

> Status: draft.

`gentle-shell --mode rpc` runs as a child process and speaks JSON, one message per line, over stdin/stdout. It is the only formal interface between the desktop and gentle-shell. It is not tRPC. The desktop also imports pi in-process to list sessions (see `03-architecture/current.md`), but that path is outside this contract.

## At a glance

| Question | Answer | Evidence |
|---|---|---|
| Who defines the protocol? | pi core (`@earendil-works/pi-coding-agent`), not gentle-shell. gentle-shell only adds extension UI traffic and environment-gated behavior on top. | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:20` |
| Which pi version answers the desktop's RPC? | pi **0.99.1 or newer**: the gentle-shell launcher refuses to start an older pi. The desktop's own locked pi 0.85.1 is used only for the in-process session list. | `gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:382`, `gentle-shell-desktop@5ab4a00:pnpm-lock.yaml:323` |
| How much of the protocol does the desktop use? | 3 of 33 commands (`prompt`, `abort`, `get_messages`) plus dialog responses; 13 stdout record types plus extension UI requests. | [Commands](#commands-desktop--runtime), [Events](#events-runtime--desktop) |
| Is there a version handshake? | No. Only the activity payload carries a schema tag (`gentle-agents.activity/v1`). | [Versioning](#versioning-and-compatibility) |
| Biggest gaps | Helper Stop, structured ODD state, providers/auth, extensions management, profile/RDD state. | [Gaps](#gaps-the-desktop-needs) |

**How to read citations.** Every claim cites `repo@shortsha:path:line`. Pinned SHAs: `gentle-shell-desktop@5ab4a00` (main), `gentle-shell@1162ce9` (npm package `gentle-pi` 3.7.0), `pi@d981de1` (pi 0.85.1), `pi@d86654a` (pi 0.99.1). Lines labelled `Inference:` are reasoning, not verified behavior. `UNVERIFIED:` marks claims checked but not confirmed.

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
| 5. Launcher resolves pi | `GENTLE_SHELL_PI`, then a bundled pi CLI, then `pi` on `PATH`. | `gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:358-369` |
| 6. Version gate | Launcher runs `pi --version` and exits with an error if pi is older than `MIN_PI_VERSION = "0.99.1"`. | `gentle-shell@1162ce9:bin/gentle-shell.mjs:1206-1215`, `gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:382`, `:406` |
| 7. Launch pi | The launcher spawns pi with `stdio: "inherit"`, so the desktop's pipes reach pi directly. It forwards `SIGINT`, `SIGTERM` and `SIGHUP` to pi. | `gentle-shell@1162ce9:bin/gentle-shell.mjs:1395`, `:1402-1407` |

### Environment variables on the contract

| Variable | Set by | Effect | Evidence |
|---|---|---|---|
| `GENTLE_SHELL_INTERACTIVE_HOST=1` | Desktop, on every spawn | Under `--mode rpc`, enables RPC dialogs for `ask_user_question`/`ask_user_choice` and the `gentle-agents` activity push. Only the exact value `"1"` counts. Stripped from subagent children. | `gentle-shell@1162ce9:lib/rpc-host.ts:8`, `:15-17`, `gentle-shell@1162ce9:lib/agents-runner.ts:471`, `gentle-shell@1162ce9:docs/readme-reference.md:374` |
| `GENTLE_SHELL_BIN` | User / dev script | Launcher path override for the desktop. | `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:19` |
| `ELECTRON_RUN_AS_NODE=1` | Desktop, only for a JS-entry `GENTLE_SHELL_BIN` | Runs the entry as plain Node under the Electron binary. | `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:38-41` |
| `GENTLE_SHELL_HOME` | User | When set, the desktop passes `--home <dir>` instead of `--link`/`--isolated`, and its in-process session list reads the same directory. | `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:28-31`, `:34-35`, `:61-62` |
| `GENTLE_SHELL_PI` | User | pi executable override inside the launcher. | `gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:359-360` |

### Framing

| Rule | Evidence (pi docs) | Desktop conformance |
|---|---|---|
| One JSON object per record, LF-terminated. | `pi@d86654a:packages/coding-agent/docs/rpc.md:52`, `pi@d981de1:packages/coding-agent/docs/rpc.md:30` | `encodeCommand` appends `\n` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:12-14`) |
| Split on LF only; strip an optional trailing `\r`; never use Node `readline` (it splits on U+2028/U+2029). | `pi@d86654a:packages/coding-agent/docs/rpc.md:52-54`, `pi@d981de1:packages/coding-agent/docs/rpc.md:32-37` | `LineSplitter` splits on `\n` and strips `\r` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:22-49`) |
| Stdout is reserved for protocol records; diagnostics go to stderr. | `pi@d86654a:packages/coding-agent/docs/rpc.md:56`; pi takes over stdout at start (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:55`) | Stderr is logged, never parsed (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:292-295`) |
| Read stdout continuously; pi honors backpressure. | `pi@d86654a:packages/coding-agent/docs/rpc.md:56` | `data` listener, never paused (`gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:78-82`) |

Framing code (`jsonl.ts`) is byte-identical between pi 0.85.1 and 0.99.1 (checked with `diff -q`).

### Correlation and errors

- Every command accepts an optional string `id`; the matching `response` repeats it (`pi@d86654a:packages/coding-agent/docs/rpc.md:37-44`). Correlate by `id`, not by order (`:44`).
- A failed command returns `{type:"response", command, success:false, error}` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:245`).
- Malformed JSON returns a response with `command: "parse"` and no `id` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:752-763`).
- An unknown `type` returns `Unknown command: <type>` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:715`).
- An `extension_ui_response` produces no response; one with an unknown `id` is silently dropped (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:767-781`).
- The desktop only sets `id` on `get_messages` (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:157-160`).

### Startup and shutdown

| Phase | pi behavior | Desktop behavior |
|---|---|---|
| Startup | No dedicated "ready" record exists. `Inference:` the only `output(...)` call sites in `runRpcMode` are command responses, session events, extension UI requests and `extension_error` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:59-61`, `:129`, `:349`, `:356`). Extensions may emit UI requests at `session_start` (gentle-agents does, `gentle-shell@1162ce9:extensions/gentle-agents.ts:1499`, `:1532-1546`). | Writes commands immediately after spawn; sends `get_messages` right away when reopening (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:147`). |
| Orderly stop | Closing stdin triggers `shutdown()`, which disposes the runtime and exits (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:802-805`, `:726-743`; documented at `pi@d86654a:packages/coding-agent/docs/rpc.md:93`). | `endStdin()`, wait up to 3 s, then `kill()` (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:214-235`). |
| Signals | `SIGTERM` exits 143; `SIGHUP` (not on win32) exits 129 (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:366-380`). | `kill()` with no argument (Node default `SIGTERM`), forwarded by the launcher. |
| Extension-requested shutdown | Completes after the current command or after `agent_settled` (`pi@d86654a:packages/coding-agent/docs/rpc.md:95`). | Any exit not requested by `stop()` resets `working` and drops pending dialogs (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:309-324`). |

The pi 0.85.1 docs do not describe shutdown; the code path is the same (`pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-mode.ts:728`, `:807`).

## Commands (desktop → runtime)

The `RpcCommand` union is identical in pi 0.85.1 and 0.99.1, at the same line numbers (`diff` of `rpc-types.ts` differs only at line 10 and in the prompting responses at lines 117-126). Rows cite 0.99.1; the same line holds in `pi@d981de1`.

**Desktop column:** **sent** = written to stdin today; **typed** = in the desktop's `RpcCommand` type but never sent; **–** = not used.

| Command | Payload fields (besides optional `id`) | Response `data` | Purpose | Desktop | Source |
|---|---|---|---|---|---|
| `prompt` | `message`, `images?`, `streamingBehavior?: "steer"\|"followUp"` | 0.85.1: none. 0.99.1: `{disposition}` | Send a user prompt; `/command` extension commands run immediately, even during streaming. | **sent** (`PiSession.ts:184`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:22` |
| `steer` | `message`, `images?` | 0.99.1: `{disposition}` | Queue a message for delivery before the next LLM call. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:23` |
| `follow_up` | `message`, `images?` | 0.99.1: `{disposition}` | Queue a message for after the run ends. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:24` |
| `abort` | – | – | Abort the current run. | **sent** (`PiSession.ts:189`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:25` |
| `clear_queue` | – | `{steering, followUp}` | Drop queued steering/follow-up messages. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:26` |
| `new_session` | `parentSession?` | `{cancelled}` | Start a new session in the same process. | typed (`types.ts:30`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:27` |
| `get_state` | – | `RpcSessionState` | Model, thinking level, streaming/compacting flags, queue modes, session file/id/name, counts. | typed (`types.ts:32`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:30`, `:96-109` |
| `set_model` | `provider`, `modelId` | `Model` | Switch model. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:33` |
| `cycle_model` | – | `{model, thinkingLevel, isScoped}\|null` | Cycle scoped models. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:34` |
| `get_available_models` | – | `{models}` | List models usable with current auth. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:35` |
| `set_thinking_level` | `level` | – | Set thinking level ("effort"). | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:38` |
| `cycle_thinking_level` | – | `{level}\|null` | Cycle thinking level. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:39` |
| `get_available_thinking_levels` | – | `{levels}` | List thinking levels. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:40` |
| `set_steering_mode` | `mode: "all"\|"one-at-a-time"` | – | Steering queue delivery mode. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:43` |
| `set_follow_up_mode` | `mode: "all"\|"one-at-a-time"` | – | Follow-up queue delivery mode. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:44` |
| `compact` | `customInstructions?` | `CompactionResult` | Manual compaction. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:47` |
| `set_auto_compaction` | `enabled` | – | Toggle auto-compaction. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:48` |
| `set_auto_retry` | `enabled` | – | Toggle auto-retry. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:51` |
| `abort_retry` | – | – | Cancel a pending auto-retry. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:52` |
| `bash` | `command`, `excludeFromContext?` | `BashResult` | Run a shell command directly; output streams as `bash_execution_update`. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:55` |
| `abort_bash` | – | – | Abort the running `bash` command. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:56` |
| `get_session_stats` | – | `SessionStats` (tokens, `cost`, `contextUsage?`) | Usage and cost for the session. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:59`; fields at `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:321-338` |
| `export_html` | `outputPath?` | `{path}` | Export the session as HTML. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:60` |
| `switch_session` | `sessionPath` | `{cancelled}` | Switch to another session file in the same process. | typed (`types.ts:31`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:61` |
| `fork` | `entryId` | `{text, cancelled}` | Fork from an entry. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:62` |
| `clone` | – | `{cancelled}` | Clone the session. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:63` |
| `get_fork_messages` | – | `{messages: [{entryId, text}]}` | Candidate fork points. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:64` |
| `get_entries` | `since?` | `{entries, leafId}` | Raw session entries. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:65` |
| `get_tree` | – | `{tree, leafId}` | Session tree. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:66` |
| `get_last_assistant_text` | – | `{text\|null}` | Last assistant text. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:67` |
| `set_session_name` | `name` | – | Rename the session. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:68` |
| `get_messages` | – | `{messages}` | Full message history. | **sent** with `id` (`PiSession.ts:159`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:71` |
| `get_commands` | – | `{commands: RpcSlashCommand[]}` (`name`, `description?`, `source`, `sourceInfo`) | Discover extension commands, prompt templates and skills invocable via `prompt`. | – | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:74`, `:81-90` |
| `extension_ui_response` | `id` + one of `value` / `confirmed` / `cancelled: true` | none | Answer a dialog request. See [Extension UI requests](#extension-ui-requests). | **sent** (`PiSession.ts:201-205`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:294-297` |

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

No command was added or removed between the two versions.

## Events (runtime → desktop)

Events are every `AgentSessionEvent`, serialized through `toJsonEvent` and written to stdout (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:355-356`). `toJsonEvent` is identical in both versions (`json-event.ts`, checked with `diff`). Events carry no `id`, except `bash_execution_update` (`pi@d86654a:packages/coding-agent/docs/rpc.md:46`).

**Desktop column:** what `codec.ts` decodes and what `chatReducer.ts` does with it. Anything not decoded becomes `{kind:"unknown"}` and is dropped (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:130-131`, `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:248`).

| Event | Fields | Purpose | Desktop | Source (0.99.1) |
|---|---|---|---|---|
| `agent_start` | – | A low-level run started. | Sets `working: true` (`chatReducer.ts:54`) | `pi@d86654a:packages/agent/src/types.ts:516` |
| `agent_end` | `messages`, `willRetry` | One low-level run ended; retries or queued work may follow. | Sets `working: false` (`chatReducer.ts:56`) | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:192-196` |
| `agent_settled` | – | Nothing more will run automatically. | Sets `working: false` (`chatReducer.ts:57`) | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:197` |
| `turn_start` | – | One assistant turn started. | Decoded, ignored (`codec.ts:90`) | `pi@d86654a:packages/agent/src/types.ts:519` |
| `turn_end` | `message`, `toolResults` | One assistant turn ended. | Decoded without fields, ignored (`codec.ts:91`) | `pi@d86654a:packages/agent/src/types.ts:520` |
| `message_start` | `message` | A message started. | Opens an assistant bubble (`chatReducer.ts:59`) | `pi@d86654a:packages/agent/src/types.ts:522` |
| `message_update` | `usage`, `assistantMessageEvent` (no cumulative `message`) | Streaming delta; see delta table below. | Appends `text_delta`; thinking/toolcall deltas bump an activity counter (`chatReducer.ts:61`, `:93-104`) | `pi@d86654a:packages/coding-agent/src/modes/json-event.ts:11-15` |
| `message_end` | `message` | Message completed; authoritative. | Resyncs final text (`chatReducer.ts:63`) | `pi@d86654a:packages/agent/src/types.ts:525` |
| `tool_execution_start` | `toolCallId`, `toolName`, `args`, `parentToolCallId?` (0.99.1) | Tool execution started. | Bumps activity counter only (`chatReducer.ts:65`) | `pi@d86654a:packages/agent/src/types.ts:527`, `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:183-187` |
| `tool_execution_update` | `toolCallId`, `toolName`, `args`, `partialResult`, `parentToolCallId?` (0.99.1) | Partial tool result. | Bumps activity counter only (`chatReducer.ts:66`) | `pi@d86654a:packages/agent/src/types.ts:528` |
| `tool_execution_end` | `toolCallId`, `toolName`, `result`, `isError`, `parentToolCallId?` (0.99.1) | Tool finished. | Bumps activity counter only (`chatReducer.ts:67`) | `pi@d86654a:packages/agent/src/types.ts:529` |
| `queue_update` | `steering`, `followUp` | Queue contents changed (full snapshot). | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:198-202` |
| `entry_appended` | `entry` | An extension appended a custom session entry. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:204` |
| `session_info_changed` | `name` | Session display name changed. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:205` |
| `thinking_level_changed` | `level` | Thinking level changed. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:206` |
| `compaction_start` | `reason: "manual"\|"threshold"\|"overflow"` | Compaction began. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:203` |
| `compaction_end` | `reason`, `result`, `aborted`, `willRetry`, `errorMessage?` | Compaction finished. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:207-214` |
| `auto_retry_start` | `attempt`, `maxAttempts`, `delayMs`, `errorMessage` | Retry after a transient error. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:215` |
| `auto_retry_end` | `success`, `attempt`, `finalError?` | Retry loop finished. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:216` |
| `summarization_retry_scheduled` | `attempt`, `maxAttempts`, `delayMs`, `errorMessage` | Summarization retry scheduled. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:217-223` |
| `summarization_retry_attempt_start` | `source: "branchSummary"`, or `source: "compaction"` + `reason` | Summarization retry started. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:224-229` |
| `summarization_retry_finished` | – | Summarization retry loop done. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:230` |
| `bash_execution_update` | `id?`, `delta` | Output chunk of a direct `bash` command. | – | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:231` |
| `extension_error` | `extensionPath`, `event`, `error` | An extension threw. Emitted by `rpc-mode.ts`, not by the session. | Sets `lastError` (`chatReducer.ts:71`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:348-350` |
| `response` | See [Correlation and errors](#correlation-and-errors) | Command acknowledgement. | Decoded; only the `get_messages` response is acted on (`PiSession.ts:257`, `:272-284`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:116-245` |
| `extension_ui_request` | See next section | Extension UI sub-protocol. | See next section | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:252-287` |

Desktop references in this table: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts`, `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts`, `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts`.

### `message_update` delta types

`assistantMessageEvent.type` is one of `text_start`, `text_delta`, `text_end`, `thinking_start`, `thinking_delta`, `thinking_end`, `toolcall_start` (adds `id`, `toolName` on the wire), `toolcall_delta`, `toolcall_end` (`pi@d981de1:packages/coding-agent/docs/rpc.md:965-973`). The 0.99.1 docs also list `start`, `done` and `error` (`pi@d86654a:packages/coding-agent/docs/json.md:78-89`). The desktop models only the nine `text_*`/`thinking_*`/`toolcall_*` types (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:77-91`).

### Differences between pi 0.85.1 and 0.99.1 (events)

| Area | pi 0.85.1 | pi 0.99.1 | Evidence |
|---|---|---|---|
| `parentToolCallId` on `tool_execution_*` | Absent. | Optional; set for nested tool calls (`ctx.executeTool`, MCP codemode). Nested `toolCallId` is `<parent id>/<n>`. | `pi@d981de1:packages/coding-agent/src/core/agent-session.ts:145`; `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:183-191`, `pi@d86654a:packages/coding-agent/docs/extensions.md:148` |
| `entry_appended`, `session_info_changed`, `thinking_level_changed` | Emitted (`pi@d981de1:packages/coding-agent/src/core/agent-session.ts:158-160`, `:1809`, `:2597`, `:3093`) but **not listed** in the RPC event table (`pi@d981de1:packages/coding-agent/docs/rpc.md:859-883`). | Emitted and documented. | `pi@d86654a:packages/coding-agent/docs/json.md:122-124` |
| `system` message role | Absent: `Message` is `UserMessage \| AssistantMessage \| ToolResultMessage`; message events cover user, assistant and toolResult messages. | Adds `SystemMessage` (`role: "system"`) to `Message`; message lifecycle events are documented as emitted for system messages too. `Inference:` a host that switches on `message.role` may see a fourth role. | `pi@d981de1:packages/ai/src/types.ts:470`, `pi@d981de1:packages/agent/src/types.ts:438`; `pi@d86654a:packages/ai/src/types.ts:523`, `:610`, `pi@d86654a:packages/agent/src/types.ts:521` |
| `entry_appended` emission sites | 1 site found. | 5 sites, including the cache warmer. | `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:461`, `:793`, `:986`, `:1208`, `:3325` |

## Extension UI requests

Extensions call `ctx.ui.*`. In RPC mode, supported calls become `extension_ui_request` records on stdout; dialogs block until an `extension_ui_response` with the same `id` arrives on stdin (`pi@d86654a:packages/coding-agent/docs/rpc-extension-ui.md:5-8`). If a dialog has `timeout`, pi resolves it with a default value on its own (`:10`; `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:115-120`). The method set and fields are identical in both versions (0.85.1 lines are 6 lower: `pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-types.ts:246-291`).

| Method | Kind | Fields | Expected response | Desktop (main process) | Source (0.99.1) |
|---|---|---|---|---|---|
| `select` | Dialog | `title`, `options: string[]`, `timeout?` | `{value}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:167`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:253` |
| `confirm` | Dialog | `title`, `message`, `timeout?` | `{confirmed}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:169`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:254` |
| `input` | Dialog | `title`, `placeholder?`, `timeout?` | `{value}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:171`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:255-262` |
| `editor` | Dialog | `title`, `prefill?` (no `timeout`) | `{value}` or `{cancelled:true}` | Pushed to `pendingDialogs` (`chatReducer.ts:178`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:263` |
| `notify` | Fire-and-forget | `message`, `notifyType?: "info"\|"warning"\|"error"` | none | Ignored (`chatReducer.ts:182-184`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:264-270` |
| `setStatus` | Fire-and-forget | `statusKey`, `statusText` (`undefined` clears) | none | Ignored | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:271-277` |
| `setWidget` | Fire-and-forget | `widgetKey`, `widgetLines: string[]\|undefined`, `widgetPlacement?: "aboveEditor"\|"belowEditor"` | none | Only `widgetKey: "gentle-agents"` is parsed; other keys ignored (`chatReducer.ts:32`, `:180`, `:196-206`) | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:278-285` |
| `setTitle` | Fire-and-forget | `title` | none | Ignored | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:286` |
| `set_editor_text` | Fire-and-forget | `text` | none | Ignored | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:287` |

Desktop references: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts`. Whether the renderer can answer every dialog kind is out of scope here; see `03-architecture/current.md`.

### What RPC mode drops

These `ctx.ui` calls do nothing or degrade under `--mode rpc` (`pi@d86654a:packages/coding-agent/docs/rpc-extension-ui.md:14-23`; 0.85.1 lists a shorter set at `pi@d981de1:packages/coding-agent/docs/rpc.md:1194-1203`):

- `custom()` returns `undefined`: no custom TUI component reaches the host (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:228-231`).
- `setWidget` with a component factory instead of `string[]` is silently ignored (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:194-207`).
- `setFooter`, `setHeader`, `setEditorComponent`, `setWorkingMessage`, `setWorkingIndicator`, `setToolsExpanded`, `setWorkingVisible`, `setHiddenThinkingLabel` and `addAutocompleteProvider` are no-ops in both versions. The last three are no-ops in 0.85.1 code too (`pi@d981de1:packages/coding-agent/src/modes/rpc/rpc-mode.ts:183`, `:191`, `:273`); only the 0.85.1 docs omit them.
- `getEditorText()` returns `""`. `get theme()` returns the real theme, but `getAllThemes()` returns `[]` and `getTheme()` returns `undefined`. `setTheme()` returns `{success:false}` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:286-301`).

### gentle-shell additions over RPC

gentle-shell adds no RPC command or event type of its own. Everything it adds rides on `extension_ui_request` or on `prompt`-invoked extension commands, and most of it requires `GENTLE_SHELL_INTERACTIVE_HOST=1`.

| Addition | Wire shape | Gate | Evidence |
|---|---|---|---|
| `ask_user_question` dialogs | One `select` per question; multi-select loops `select` over toggle options. | Interactive host. Without it the tool returns an "unavailable" result. | `gentle-shell@1162ce9:extensions/ask-user-question.ts:118`, `:137`, `:157-170`, `:267-268` |
| `ask_user_choice` dialogs | One `select`; an `input` follows when a custom response is allowed. | Interactive host. Without it the tool throws. | `gentle-shell@1162ce9:extensions/ask-user-choice.ts:205`, `:208`, `:229-231` |
| Helper activity (`gentle-agents.activity/v1`) | `setWidget` with `widgetKey: "gentle-agents"` and `widgetLines` holding exactly one JSON string. Coalesced to one push per 150 ms. Bounded to 256 KiB. | Interactive host, started on `session_start`. | `gentle-shell@1162ce9:docs/gentle-agents-activity.md:11-24`, `:80`, `:119`; `gentle-shell@1162ce9:extensions/gentle-agents.ts:1532-1546`; `gentle-shell@1162ce9:lib/agents-rpc-publisher.ts:12`, `:16`, `:32` |
| Activity push failure | `notify` with `notifyType: "warning"`, deduplicated per message. | Interactive host. | `gentle-shell@1162ce9:extensions/gentle-agents.ts:1539-1544` |
| Extension commands (`/gentle:*`) | Sent as `prompt` text; dialogs they open use `select`/`confirm`/`input`. Example: `/gentle:persona` opens a `select`. Commands built on `ctx.ui.custom()` get no UI: `/gentle:profiles` opens its panel with `custom()`, which returns `undefined` under RPC, and the handler then reads `result.type` with no mode guard. `Inference:` (not run) the command throws a `TypeError`. | None at the RPC layer. | `pi@d86654a:packages/coding-agent/docs/rpc-commands.md:31`; `gentle-shell@1162ce9:extensions/gentle-ai.ts:9584-9594`, `:4653-4655` (persona), `:4631-4638`, `:4052` (profiles); `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:228-231` |
| YOLO indicator (`/gentle:yolo`) | `setStatus` and `setWidget` (`string[]`) with key `gentle:yolo`, text `YOLO_STATUS_TEXT`; cleared with `undefined`. | None: `publish` has no mode or interactive-host check. `Inference:` (not run) both requests reach an RPC host; the desktop ignores `setStatus` and every `setWidget` key except `gentle-agents`. | `gentle-shell@1162ce9:lib/yolo-session-policy.ts:5-6`, `:105-108` |

**`gentle-agents.activity/v1` payload.** `{schema, summary:{running,queued,waiting,finished}, tasks:[{summary, thread}]}`. Each task `summary` whitelists `id`, `agent`, `label`, `prompt`, `status`, `createdAt`, `startedAt`, `endedAt`, `lastStep`, `lastActivityAt`, `turns`, `toolCalls`, `error`. It deliberately omits `cwd`, `parentSessionId`, `mode`, `model`, `thinking`, `sessionPath`, `result`, `tokens`, `cost` (`gentle-shell@1162ce9:docs/gentle-agents-activity.md:62`). Thread items are `{kind, text}` for text/thinking/note, and `{kind:"tool", name, args, running, isError, output}` for tools, with `args` stringified (`:64`; `gentle-shell@1162ce9:lib/agents-rpc-publisher.ts:96-108`). The desktop parser lives at `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:38-55`.

### gentle-shell surfaces that do not reach an RPC host

`Inference:` these features render through TUI-only APIs that RPC mode drops (see [What RPC mode drops](#what-rpc-mode-drops)), so a desktop host sees nothing of them today.

| Surface | Why it is TUI-only | Evidence |
|---|---|---|
| ODD phase label | Rendered by `GentlePromptEditor`, installed via `setEditorComponent`. That editor is the only reader of the phase registry, so phases inferred from tool activity never leave the process. Partial exception: when the model calls the `gentle_odd_phase` tool, the call and its `phase` argument are visible to an RPC host as `tool_execution_*` events. | `gentle-shell@1162ce9:extensions/gentle-shell.ts:1088`, `:1100`, `:2331-2335`; `gentle-shell@1162ce9:extensions/gentle-ai.ts:8994`, `:9000`; `gentle-shell@1162ce9:lib/odd-phase.ts:1-8` |
| Todo widget (`gentle-todo`) | `setWidget` with a component factory. | `gentle-shell@1162ce9:extensions/gentle-todo.ts:161-165` |
| Changes widget | `setWidget` with a component factory. | `gentle-shell@1162ce9:extensions/gentle-shell.ts:1313-1320` |
| Dev-binary notice widget | `setWidget` with a component factory. | `gentle-shell@1162ce9:extensions/gentle-shell.ts:1840-1845` |
| Custom footer and startup header | `setFooter` / `setHeader`. | `gentle-shell@1162ce9:extensions/gentle-shell.ts:1768`; `gentle-shell@1162ce9:extensions/startup-banner.ts:750` |
| Agents overlay (`/gentle:agents`), including per-helper Stop | Returns early with a "requires TUI mode" notice when `ctx.mode !== "tui"`. | `gentle-shell@1162ce9:extensions/gentle-agents.ts:917-922` |

## Versioning and compatibility

### Is there a version handshake?

**No.** What was checked:

- pi's RPC layer: a case-insensitive search for `version` in `packages/coding-agent/src/modes/rpc/` returns nothing in either pi version. `RpcSessionState` has no version field (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:96-109`). No startup record announces a version (see [Startup and shutdown](#startup-and-shutdown)).
- Desktop: `src/main` never runs `--version` and never compares versions. The only reference is the error message "gentle-pi 3.7.0 or newer" when no launcher is found (`gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:26-28`).
- The one versioned payload is the activity schema. The desktop rejects any frame whose `schema` is not exactly `gentle-agents.activity/v1` and keeps the previous state (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:19`, `:48`).
- The only enforced version check in the chain is the launcher's pi floor of 0.99.1 (`gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:382`, `:395-408`).

### Effective versions

| Component | Version | Evidence |
|---|---|---|
| pi answering RPC (via gentle-shell 3.7.0) | ≥ 0.99.1, enforced at launch | `gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:382`; `gentle-shell@1162ce9:package.json:78` (peer `>=0.99.1`), `:95` (dev `0.99.1`) |
| pi imported in-process by the desktop | 0.85.1 (locked) | `gentle-shell-desktop@5ab4a00:package.json:42`, `gentle-shell-desktop@5ab4a00:pnpm-lock.yaml:323` |
| pi the desktop's RPC types were written against | `UNVERIFIED:` the header names "the local pi checkout" without a version. `Inference:` the modeled subset matches both versions' shapes. | `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:7` |

### Compatibility observations

| # | Observation | Impact | Evidence |
|---|---|---|---|
| 1 | The 0.99.1 `prompt` response adds `data.disposition`. The desktop decodes `data?: unknown` and ignores prompt responses. | Compatible. | `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:175`, `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:201-210` |
| 2 | gentle-shell's tool thread items carry no `callId`, but the desktop parser requires a string `callId` for `kind: "tool"`. | `Inference:` real tool items are dropped from the Helpers thread. The desktop fixture includes `callId`, so its tests do not catch this. | `gentle-shell@1162ce9:lib/agents-rpc-publisher.ts:96-108`, `gentle-shell@1162ce9:docs/gentle-agents-activity.md:64`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:107-108`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/__fixtures__/helpers-activity.jsonl:2` |
| 3 | The desktop clears `working` on `agent_end`, even when `willRetry` is true. pi says to wait for `agent_settled`. | `Inference:` during an auto-retry the composer re-enables. A prompt sent then has no `streamingBehavior`, so pi rejects it with an error. | `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:56-58`; `pi@d86654a:packages/coding-agent/docs/rpc.md:69`; `pi@d86654a:packages/coding-agent/docs/rpc-commands.md:29` |
| 4 | A `prompt` that is `"handled"` (for example a `/gentle:*` command) starts no run. | `Inference:` no `agent_start` arrives, so `working` never turns on. This is harmless for the current reducer. | `pi@d86654a:packages/coding-agent/docs/rpc.md:67` |
| 5 | `parentToolCallId` and the three state events are not modeled. | No breakage: the codec drops unknown fields and types (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:100-116`, `:130-131`). | — |
| 6 | Task status sets differ. gentle-shell statuses are `queued`, `running`, `waiting`, `completed`, `failed`, `cancelled`, `timed_out`, published unchanged in each task `summary.status`. The desktop accepts only `queued`, `running`, `waiting`, `done`, `failed`, `cancelled`, and `toTask` drops a task whose status is not in that set. | Likely desktop bug. `Inference:` (not run) completed and timed-out helpers vanish from the Helpers list, while the `summary.finished` counter (parsed separately) still counts them. The desktop fixture uses `done`, so its tests do not catch this. | `gentle-shell@1162ce9:lib/agents-protocol.ts:9-17`, `gentle-shell@1162ce9:lib/agents-rpc-publisher.ts:116`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:21`, `:83-85`, `:87-95`, `:139-141`; `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/__fixtures__/helpers-activity.jsonl` |
| 7 | Session listing uses in-process pi 0.85.1 while the RPC peer runs ≥ 0.99.1. | `UNVERIFIED:` whether the session file format differs between those versions was not checked here. See `03-architecture/audit.md`. | `gentle-shell-desktop@5ab4a00:src/main/adapters/piSessionStore.ts:30` |

## Gaps the desktop needs

A gap is a capability the desktop needs that the RPC contract does not offer. **Basis** says where the need comes from:

- **stated**: the desktop repo states the need.
- **intent-driven**: derived from the concept mockup (intent, not spec).
- **community proposal**: not maintainer intent.

Absence is checked against the full command list (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:20-74`) and the extension UI method list (`:252-287`).

| # | Gap | Basis | Need evidence | Absence evidence | Partial workaround today |
|---|---|---|---|---|---|
| G1 | **Stop a helper** (one subagent, or all) | stated | `gentle-shell-desktop@5ab4a00:README.md:62`, `:85-86`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:18`, `:22`; mockup Stop button `gs-mockup.html:603` | No RPC command targets subagents. gentle-agents stops tasks only from the TUI overlay (`gentle-shell@1162ce9:extensions/gentle-agents.ts:831`, `:856`, `:917-922`) or a TUI shortcut (`:1492-1496`). `subagent_cancel` is a model tool, not a host command (`:1438`). | `Inference:` RPC `abort` cancels **foreground** subagents through the tool-call abort handler (`gentle-shell@1162ce9:extensions/gentle-agents.ts:1207-1214`). Background tasks return before that handler is wired (`:1202`), so a single background helper cannot be stopped over RPC. Stop-all exists only as a destructive side effect: `new_session`, `switch_session`, `fork`, `clone` and closing stdin all emit `session_shutdown` (`pi@d86654a:packages/coding-agent/src/core/agent-session-runtime.ts:167-177`, `:212`, `:245`, `:299`, `:320`, `:334`, `:404-407`; RPC `clone` calls `fork`, `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:624`), and gentle-agents answers it with `runner.cancelAll(...)` (`gentle-shell@1162ce9:extensions/gentle-agents.ts:1549`, `:1568`). Asking the model via `prompt` to call `subagent_cancel` is indirect and not a control. |
| G2 | **Structured ODD state** (feature, phase, tasks, checks) | stated + intent-driven | `gentle-shell-desktop@5ab4a00:README.md:63`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:69` ("needs the structured ODD document format"); mockup ODD panel `gs-mockup.html:614-640` | No ODD command or event. The phase label is TUI-only (see [TUI surfaces](#gentle-shell-surfaces-that-do-not-reach-an-rpc-host)). | Phase only, and only when the model reports it: `gentle_odd_phase` calls (with their `phase` argument) arrive as `tool_execution_*` events (`gentle-shell@1162ce9:extensions/gentle-ai.ts:8994`, `:9000`). Phases inferred from tool activity stay TUI-only (`gentle-shell@1162ce9:lib/odd-phase.ts:1-8`). `Inference:` `get_entries` / `entry_appended` expose session entries, but no evidence shows ODD state is written there. |
| G3 | **Providers and sign-in** | stated + intent-driven | `gentle-shell-desktop@5ab4a00:README.md:63` ("no providers ... screens (M4): sign in ... through `gentle-shell` in the terminal"); mockup `gs-mockup.html:695-723` | No auth or login command. Only `get_available_models` and `set_model` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:33-35`). | Model choice per session works; credentials do not. |
| G4 | **Default model for new chats** | intent-driven | mockup `gs-mockup.html:730-731` | `set_model` acts on the running session only: RPC calls `session.setModel(model)` without `persist` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:476`), and `setModel` writes the default model only when `options.persist` is true (`pi@d86654a:packages/coding-agent/src/core/agent-session.ts:2401-2404`). No command persists a default. | `--model` CLI flag at spawn (`pi@d86654a:packages/coding-agent/docs/rpc.md:18`). |
| G5 | **Extensions and packages** (install, update, remove, enable) | stated + intent-driven | `gentle-shell-desktop@5ab4a00:README.md:63`; mockup `gs-mockup.html:754-797` | No package command in `RpcCommand`. `get_commands` lists commands, prompts and skills only (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:81-90`). | None over RPC. |
| G6 | **Profiles** (read active, switch) | intent-driven; core gentle-shell concept per the corpus brief | mockup status bar `gs-mockup.html:819`, `:731` | No profile state in `RpcSessionState` (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:96-109`). | None. `/gentle:profiles` is not reachable over RPC today: its panel uses `ctx.ui.custom()` (`gentle-shell@1162ce9:extensions/gentle-ai.ts:4052`), which returns `undefined` under RPC (`pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:228-231`), and the handler then reads `result.type` (`gentle-shell@1162ce9:extensions/gentle-ai.ts:4638`). `Inference:` (not run) it throws a `TypeError`. The active profile cannot be read as data either. |
| G7 | **Status bar data** | intent-driven | mockup `gs-mockup.html:813-822` | Model and thinking level: `get_state` plus `thinking_level_changed` (available). Cost and context usage: `get_session_stats` (pull only; `pi@d86654a:packages/coding-agent/src/core/agent-session.ts:336-337`). cwd and branch: not in `RpcSessionState`. `ODD · RDD on`: no RPC state; RDD is read via the `/gentle:review-mode` command (`gentle-shell@1162ce9:docs/readme-reference.md:395`). | Partly available; the desktop uses none of it today. |
| G8 | **Helper transcript and result** (for audit or "why did it do that") | community proposal | Context brief §2 (Matrak's proposals); skeleton note in this file | The activity payload omits `sessionPath`, `result`, `tokens`, `cost` (`gentle-shell@1162ce9:docs/gentle-agents-activity.md:62`). Threads keep the last 40 items (`:79`). | `subagent_result` is a model tool, not a host command (`gentle-shell@1162ce9:extensions/gentle-agents.ts:1414`). |
| G9 | **Several chats at once** | intent-driven | mockup sidebar status "needs you" `gs-mockup.html:486`; toast styles `gs-mockup.html:308-323` | Not a protocol gap: one pi process serves one session, and nothing prevents spawning several. The desktop keeps a single `current` session (`gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:70`). | Desktop architecture work, not an upstream change. |
| G10 | **Version handshake** | `Inference:` derived from the skew above, not stated anywhere | See [Versioning](#versioning-and-compatibility) | No version field anywhere in the protocol. | Run `gentle-shell --version` out of band (`gentle-shell@1162ce9:bin/gentle-shell.mjs:1217-1219`). |

Mockup lines refer to `~/bitacoras/gs-desktop/gs-mockup.html` (rendered DOM of https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL). The mockup is intent, not spec.

`Inference` (layer that owns each gap): pi core owns the `RpcCommand` union, so new host commands (G3, G4, G5, G10) need a pi change. gentle-shell can push new data without touching pi by using `setWidget` `string[]` payloads, as the activity schema does (`gentle-shell@1162ce9:docs/gentle-agents-activity.md:13`). That route fits G2, G6, G7 and G8. A host action such as G1, however, needs an inbound channel. Today the only inbound channels to an extension are `prompt` (extension commands) and dialog responses.

## How to propose contract changes upstream

### pi (`earendil-works/pi`): owns the RPC protocol

`CONTRIBUTING.md` is identical at both pinned versions. What it says:

| Rule | Evidence |
|---|---|
| The core is minimal. Features that do not belong in core should be extensions, and extension hook points must be "well considered and discussed". | `pi@d86654a:CONTRIBUTING.md:7-11` |
| Issues and PRs from new contributors are auto-closed by default. Maintainers review auto-closed **issues** daily and reopen worthwhile ones. | `pi@d86654a:CONTRIBUTING.md:23`, `:27` |
| Issues must use "one of the two GitHub issue templates", be short, and be in your own voice. Note: both pinned SHAs actually ship three issue forms, `bug.yml`, `contribution.yml` and `package-report.yml`, plus `config.yml`. | `pi@d86654a:CONTRIBUTING.md:38-46`; `pi@d86654a:.github/ISSUE_TEMPLATE/`, `pi@d981de1:.github/ISSUE_TEMPLATE/` |
| No PR without prior maintainer approval (`lgtm`); `lgtmi` approves issues only. | `pi@d86654a:CONTRIBUTING.md:31-34`, `:58` |
| Before a PR: `npm run check` and `./test.sh`. Do not edit `CHANGELOG.md`. | `pi@d86654a:CONTRIBUTING.md:62-69` |
| Larger changes are discussed as RFCs at rfc.earendil.com. | `pi@d86654a:CONTRIBUTING.md:101-102` |

The proposal template is `Contribution Proposal`, with the fields "What do you want to change?", "Why?" and "How? (optional)" (`pi@d86654a:.github/ISSUE_TEMPLATE/contribution.yml:1-36`). Blank issues are disabled; questions go to Discord (`pi@d86654a:.github/ISSUE_TEMPLATE/config.yml:1-5`).

### gentle-shell (`Gentleman-Programming/gentle-shell`, package `gentle-pi`): owns the extension-level additions

- No `CONTRIBUTING.md` exists at `1162ce9` (checked with `fd` at depth 3).
- Issue forms: `bug_report.yml` and `feature_request.yml` (`gentle-shell@1162ce9:.github/ISSUE_TEMPLATE/`). The feature form asks for "Problem or opportunity", "Proposed outcome", "Alternatives considered" and "Additional context", requires a duplicate search and a sensitive-data check, and labels issues `enhancement` and `status:needs-review` (`gentle-shell@1162ce9:.github/ISSUE_TEMPLATE/feature_request.yml:1-43`).
- No document describes a process specific to RPC or interactive-host contract changes. The existing precedent is the activity schema doc itself (`gentle-shell@1162ce9:docs/gentle-agents-activity.md`) and the desktop M2 prerequisites that reference gentle-shell issues #1328 and #1329 (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:59`).
