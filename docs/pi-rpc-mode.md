# Pi RPC Mode

A project-agnostic reference for pi's `--mode rpc` JSON-line protocol: what it
is, how to launch it, which records cross the wire, and which client mistakes
break integrations.

This page describes **pi**, not this app. The application-specific
projections of the same protocol live in
[`architecture.md`](./architecture.md) (static structure and implemented
behaviour) and [`system-design.md`](./system-design.md)
(target-state integration design). Read this first
when the question is "what does pi actually support?", and those when the
question is "what does *this app* use?".

> Verified against the installed package `@earendil-works/pi-coding-agent`
> **0.87.1** (`pi --version`). Protocol details are version-specific: re-check
> `pi --help` and `docs/rpc-commands.md` from the package on major upgrades.

## 1. What it is

RPC mode runs pi as a **long-lived child process** controlled through
newline-delimited JSON on stdin and stdout. It is the process-boundary
alternative to embedding the agent in-process.

| Interface | Process boundary | Control model | Best fit |
| --- | --- | --- | --- |
| SDK | in process | TypeScript methods and events | Node.js / Bun hosts that want the full API |
| Print | one shot | final text on stdout | scripts, pipelines |
| JSON | one shot | JSONL events on stdout | structured progress, no control |
| **RPC** | child process | **JSONL commands, responses, events** | other languages, isolated processes, IDEs, custom UIs |

All four modes share the same agent, sessions, resources, and tools. The mode
only changes how input enters pi, how output is exposed, and whether the process
stays alive for more commands.

## 2. Launch

```bash
pi --mode rpc --no-session
```

Normal CLI options still select the working folder, model, tools, resources, and
session behaviour: `--provider`, `--model`, `--name`, `--no-session`,
`--session-dir`. `pi --help` is authoritative for the installed version.

- The only executable is `pi` (`dist/bundle/cli.js`); there is no separate
  `pi-rpc` binary.
- The subpath export `@earendil-works/pi-coding-agent/rpc-entry` is an
  **import-only** shortcut that runs `main(["--mode", "rpc", ...argv])` and sets
  `process.title = "pi-rpc"`.
- `@file` prompt arguments are **rejected** in RPC mode. Prompts go through the
  `prompt` command.
- The RPC entry point never resolves: the runtime lives until stdin is closed or
  a signal arrives.

## 3. Protocol records

Exactly four record families exist:

| Direction | Record | Purpose |
| --- | --- | --- |
| stdin | Command | Prompt, inspect state, change configuration, manage the session |
| stdout | `response` | Report one command's outcome and any data |
| stdout | Session event | Stream run, message, tool, queue, compaction, and retry activity |
| both | Extension UI record | Forward supported extension interactions |

Every command accepts an optional string `id`; the matching response repeats it.
Command handling is **asynchronous and concurrent**, so responses can interleave
in any order. Correlate by `id`, never by arrival order.

```json
{"id":"req-1","type":"get_state"}
{"id":"req-1","type":"response","command":"get_state","success":true,"data":{"...":"..."}}
```

Session events generally carry no command id because they describe session
activity. `bash_execution_update` is the exception: it repeats the id of the
originating `bash` command. `extension_ui_response` uses the id of the
`extension_ui_request` it answers and produces no normal command response.

## 4. Framing and process I/O

The stream is **strict JSONL, LF only**. Write one complete JSON object per
record and terminate it with `\n`.

- Read stdout as a byte or UTF-8 stream and split records **only on LF**. Strip
  an optional preceding carriage return to accept CRLF input.
- Do **not** use a generic line reader. Node.js `readline` also splits on
  `U+2028` and `U+2029`, which are valid inside JSON strings and will corrupt
  content.
- Read stdout continuously. Pi honours stdout backpressure, but a client that
  stops reading stalls the process. Honour stdin backpressure when writing.
- **stdout is exclusively protocol.** Pi rewrites `process.stdout.write` to
  stderr, so stray `console.log` output from extensions cannot corrupt records.
  Diagnostics and application logging belong on stderr.

## 5. Run lifecycle

A successful `prompt` response means the prompt was **accepted, queued, or
handled**. It does not mean model work finished.

```json
{"id":"req-2","type":"prompt","message":"Review this repository"}
{"id":"req-2","type":"response","command":"prompt","success":true}
```

After that response, keep consuming events:

- `agent_end` closes one low-level agent run — retries, overflow recovery,
  compaction, steering, and follow-ups may still continue.
- **`agent_settled`** is the event that means pi will not continue
  automatically. Wait for it when completion matters.

Subscribe **before** sending a prompt, or a fast completion can be missed
entirely. The `RpcClient.promptAndWait()` helper does this internally; with
separate calls, install the listener first and call `waitForIdle()` only while a
run is active.

### Shutdown

Close the child's stdin to request an orderly shutdown; pi disposes the active
runtime before exiting. An extension can also request shutdown, which pi defers
until the current command finishes or the active run emits `agent_settled`.
Clients must still handle signals and unexpected exits.

### Errors

A failed command returns one response with `success: false`:

```json
{"id":"req-3","type":"response","command":"set_model","success":false,"error":"Model not found: invalid/model"}
```

Malformed JSON produces a parse response **with no request id**:

```json
{"type":"response","command":"parse","success":false,"error":"Failed to parse command: ..."}
```

A success response only covers command handling. Provider failures and aborts
that happen after a prompt is accepted appear in the message and event stream,
never as a second response for the same id. Do not parse stderr as protocol
data.

## 6. Commands (stdin)

Commands are grouped below; full field lists and response shapes live in
`docs/rpc-commands.md` inside the installed package.

| Group | Commands |
| --- | --- |
| Prompting | `prompt`, `steer`, `follow_up`, `abort`, `clear_queue` |
| State and messages | `get_state`, `get_messages`, `get_entries`, `get_tree`, `get_last_assistant_text`, `get_session_stats` |
| Session | `new_session`, `switch_session`, `fork`, `clone`, `get_fork_messages`, `export_html`, `set_session_name` |
| Model and thinking | `set_model`, `cycle_model`, `get_available_models`, `set_thinking_level`, `cycle_thinking_level`, `get_available_thinking_levels` |
| Queue modes | `set_steering_mode`, `set_follow_up_mode` (`all` \| `one-at-a-time`) |
| Compaction and retry | `compact`, `set_auto_compaction`, `set_auto_retry`, `abort_retry` |
| Bash | `bash`, `abort_bash` |
| Discovery | `get_commands` |

Details worth knowing:

- **Streaming prompts.** While the agent streams, `prompt` requires
  `streamingBehavior`: `"steer"` is delivered after the current assistant turn
  finishes its tool calls, before the next LLM call; `"followUp"` waits until
  the agent stops. Omitting it during streaming is an error. Extension commands
  (`/mycommand`) execute immediately even while streaming.
- **Images.** `prompt`, `steer`, and `follow_up` accept an optional `images`
  array of `{"type":"image","data":"<base64>","mimeType":"image/png"}`.
- **Queues.** `clear_queue` returns the pending text so a client can emulate
  interactive Esc: clear, `abort`, then restore the text into the editor.
- **`get_entries` is a durable cursor.** The session is an append-only tree with
  stable ids, so passing the last-seen id as `since` returns only newer entries —
  even across client restarts — while `get_messages` returns the live
  conversation. An unknown `since` fails the command.
- **`bash` reaches the model on the next prompt**, not immediately: pi stores a
  bash execution message and converts it into a user message when the next
  `prompt` is sent, unless `excludeFromContext` is set.
- **`get_commands`** reports extension commands, prompt templates, and skills
  (as `skill:<name>`) with source metadata. Built-in TUI commands such as
  `/settings` are **not** included and would not execute through `prompt`.

## 7. Session events (stdout)

The event set is shared with JSON mode (see the package's `docs/json.md`), minus
the session header, which RPC does not emit — use `get_state` for the current
session id and file.

| Family | Events |
| --- | --- |
| Agent and turn | `agent_start`, `agent_end`, `agent_settled`, `turn_start`, `turn_end` |
| Message | `message_start`, `message_update`, `message_end` |
| Tools | `tool_execution_start`, `tool_execution_update`, `tool_execution_end` |
| Queue and state | `queue_update`, `entry_appended`, `session_info_changed`, `thinking_level_changed` |
| Compaction | `compaction_start`, `compaction_end` |
| Retry | `auto_retry_start`, `auto_retry_end`, `summarization_retry_scheduled`, `summarization_retry_attempt_start`, `summarization_retry_finished` |
| RPC only | `bash_execution_update`, `extension_error` |

### Reconstructing streaming messages

On the wire, `message_update` is **delta-only**: the cumulative `message` field
and every `assistantMessageEvent.partial` snapshot are stripped so the stream
stays linear in size. A naive client that expects the SDK's cumulative snapshot
will render nothing.

Buffer `delta` from `text_delta`, `thinking_delta`, and `toolcall_delta`, then
replace the reconstructed data with the authoritative content from `text_end`,
`thinking_end`, `toolcall_end`, and finally `message_end.message`. Top-level
`usage` is the latest cumulative provider-reported usage for the response and may
stay zero until completion.

### Compaction and retry

```json
{"type":"compaction_start","reason":"manual"}
{"type":"compaction_end","reason":"manual","result":{"...":"..."},"aborted":false,"willRetry":false}
{"type":"auto_retry_start","attempt":1,"maxAttempts":3,"delayMs":2000,"errorMessage":"529 overloaded"}
{"type":"auto_retry_end","success":true,"attempt":2}
```

`compaction_end` reports `result` on success, `aborted: true` when cancelled, and
`errorMessage` on failure. Successful overflow recovery sets `willRetry: true`
before pi retries the prompt — another reason `agent_end` is not the end.

## 8. Extension UI subprotocol

Extensions interact through `ctx.ui`. In RPC mode the supported calls become a
request/response subprotocol running alongside commands and events.

**Dialogs** (`select`, `confirm`, `input`, `editor`) emit
`extension_ui_request` on stdout and block until the client answers with an
`extension_ui_response` carrying the matching id. A dialog that declares
`timeout` is auto-resolved **agent-side** with the default value when it expires;
the client does not need to track timeouts.

```json
{"type":"extension_ui_request","id":"uuid-1","method":"select","title":"Allow dangerous command?","options":["Allow","Block"],"timeout":10000}
{"type":"extension_ui_response","id":"uuid-1","value":"Allow"}
```

Responses are one of `{id, value}`, `{id, confirmed}`, or
`{id, cancelled: true}`. Cancellation resolves the extension's `select` /
`input` / `editor` with `undefined` and `confirm` with `false` — it does not
reject.

**Fire-and-forget** calls (`notify`, `setStatus`, `setWidget`, `setTitle`,
`set_editor_text`) emit a request and expect no response. A client may display
them or ignore them.

### Degraded in RPC mode

Extensions keep working, including events, `registerCommand`, and tool
blocking, but anything needing direct terminal control degrades:

| Call | Behaviour |
| --- | --- |
| `custom()` | returns `undefined` |
| `onTerminalInput()` | returns a no-op unsubscribe |
| `setWorkingMessage`, `setWorkingVisible`, `setWorkingIndicator`, `setHiddenThinkingLabel`, `setFooter`, `setHeader`, `addAutocompleteProvider`, `setEditorComponent`, `setToolsExpanded` | no-ops |
| `getEditorText()` / `getEditorComponent()` | `""` / `undefined` |
| `getToolsExpanded()` | `false` |
| `pasteToEditor()` | degrades to `setEditorText()` |
| `getAllThemes()` / `getTheme()` / `setTheme()` | `[]` / `undefined` / `{ success: false, error: "Theme switching not supported in RPC mode" }` |
| `setWidget` | only string arrays; component factories are ignored |

Note the trap: `ctx.mode === "rpc"` but **`ctx.hasUI` is `true`**, because dialogs
and notifications are functional over the subprotocol. Guard TUI-only features
with `ctx.mode === "tui"`, not `hasUI`.

## 9. Clients

### TypeScript: `RpcClient`

Exported from `@earendil-works/pi-coding-agent`. It spawns
`node <cliPath> --mode rpc ...`, correlates requests, exposes typed methods for
the commands, and delivers events to listeners.

```ts
import { RpcClient } from "@earendil-works/pi-coding-agent";

const client = new RpcClient({ cliPath: "dist/cli.js", args: ["--no-session"] });
const unsubscribe = client.onEvent((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await client.start();
await client.promptAndWait("Explain this repository");
unsubscribe();
await client.stop();
```

Known limitations in the shipped client, worth knowing before relying on it:

- It has a **single listener channel** (`onEvent`); there are no named events.
- It **never answers `extension_ui_request`**. A dialog reaches the listener as an
  event, so an extension waiting on a dialog blocks until its own timeout unless
  the host answers manually.
- `bash()` does not forward `excludeFromContext`, although the protocol supports
  it.
- `getData()` throws on `success: false`; non-JSON stdout lines are silently
  ignored; id-less responses (parse errors) reach listeners, not pending
  requests.

### Any other language

Implement the framing rules in §4 directly over the child process. A Python
skeleton:

```python
import json, subprocess

process = subprocess.Popen(
    ["pi", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
)

process.stdin.write(json.dumps({"id": "p1", "type": "prompt", "message": "Hello"}).encode() + b"\n")
process.stdin.flush()

while line := process.stdout.readline():          # binary read: splits on LF only
    record = json.loads(line)
    if record.get("type") == "message_update":
        update = record["assistantMessageEvent"]
        if update["type"] == "text_delta":
            print(update["delta"], end="", flush=True)
    elif record.get("type") == "agent_settled":
        break

process.stdin.close()
process.wait()
```

### Checking a running process by hand

```bash
printf '%s\n' '{"id":"1","type":"get_state"}' '{"id":"2","type":"get_session_stats"}' \
  | pi --mode rpc --no-session
```

## 10. Checklist for a new client

1. Binary/UTF-8 reader that splits **only on LF** — never `readline`.
2. Read stdout continuously; reserve stderr for diagnostics.
3. Unique `id` on every command; correlate responses by id, not order.
4. Subscribe to events **before** the first prompt.
5. Wait for **`agent_settled`**, not `agent_end`.
6. Reassemble text from `message_update` deltas, then trust `message_end`.
7. Answer every dialog `extension_ui_request` you display, or let it time out.
8. Close stdin to shut down; still handle signals and unexpected exits.

## 11. Where each claim comes from

| Claim area | Source in the installed package |
| --- | --- |
| Mode overview, framing, lifecycle, shutdown | `docs/rpc.md`, `docs/cli-integration.md` |
| Commands, responses, model object | `docs/rpc-commands.md` |
| Events, delta-only `message_update` | `docs/json.md` |
| Extension UI requests, responses, limitations | `docs/rpc-extension-ui.md` |
| Authoritative TypeScript protocol types | `dist/modes/rpc/rpc-types.d.ts` |
| `RpcClient` behaviour and caveats | `dist/modes/rpc/rpc-client.d.ts`, `.js` |
| Framing, backpressure, stdout guard | `dist/modes/rpc/jsonl.js`, `dist/core/output-guard.js` |
| Reference clients | `examples/rpc-client.ts`, `examples/rpc-extension-ui.ts`, `examples/extensions/rpc-demo.ts` |

Known documentation gap: `extension_error` is emitted on stdout but is absent
from the `rpc-types.d.ts` unions. Treat it as an undocumented record and ignore
unknown `type` values rather than failing.
