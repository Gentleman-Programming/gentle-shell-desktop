# 0003. Post-hoc audit by questions

> Status: proposed.

| Field | Value |
|---|---|
| Author | Matrak (community) |
| Source | Conversation with Matrak, 2026-10-01; context brief §2 |
| Status | `proposed` (only the maintainer moves it to `accepted` or `declined`) |
| Principles | vision P10 **[community]**; supports vision P7 **[maintainer]** (mockup intent), **[gentle-shell]** and vision P9 **[community]** |

## Problem

When an agent or helper finishes, the user sees the result: a message, a "done" helper, a task with a commit. They cannot easily ask **"why did you do it this way and not that way?"**

- Asking in the main chat adds the question to the working conversation and may start new work.
- The helper's reasoning and steps are not available to the desktop after it finishes: the activity payload keeps the last 40 thread items and omits the transcript path and the result ([gap G8](../04-rpc-contract.md#gaps-the-desktop-needs)).
- The desktop does not render tool calls or thinking even for the main agent (inventory C17, C18).

`Inference:` being able to question a finished agent turns "the agent says it is done" into something the user can check, which serves vision P7 (visible evidence) and vision P9 (learning from the work). A related concern was raised in the community thread: an agent can claim success without anyone verifying it (Discord, Rafael The Hutt, 2026-09-27); that thread proposes a different solution (gentle-mesh), which this proposal does not depend on.

## Proposal

On any finished node (a helper, or a finished turn of the main agent), an **Ask why** action opens a side conversation:

1. It starts from that agent's own transcript (its task, steps, tool calls, result).
2. The user asks questions; the agent answers from its transcript and cites the steps it refers to.
3. It does not change the main chat, the repository or the agent's original record. `Inference:` this needs a read-only run (no write or shell tools).
4. The exchange can be saved next to the original node, or discarded.

## Runtime requirements

| Need | Available today? | Evidence | Gap |
|---|---|---|---|
| A helper's full transcript and result | No over RPC: the payload omits `sessionPath` and `result`; threads keep 40 items | `gentle-shell@1162ce9:docs/gentle-agents-activity.md:62`, `:79` | **gap G8** |
| Finished helpers after the fact | On disk: one JSON per task in `<agent home>/gentle-agents/tasks/` (newest `history_max_tasks` kept, default 200), child sessions in `<agent home>/gentle-agents/sessions/` | `gentle-shell@1162ce9:docs/gentle-shell.md:232`; inventory A12 | `Inference:` the desktop could read them host-side. `UNVERIFIED:` the task JSON format is not documented as stable |
| Resume a finished helper with a question | Only as a model tool: `subagent_continue` "Resume a finished subagent task in its own session with a follow-up prompt" | `gentle-shell@1162ce9:extensions/gentle-agents.ts:1449-1451`; `gentle-shell@1162ce9:docs/gentle-shell.md:217`, `:232` | Inbound host channel (gap G1 shape). A continued helper keeps its normal tools, so it is not read-only (`Inference:`) |
| A read-only run on a saved session | `Inference:` (not run): spawn a separate pi process on the child session file with `--session <path>` (inventory S3) and restricted tools with `--tools` or `--no-tools` (inventory E9). Both are spawn-only flags | inventory S3, E9 | Desktop work, plus a decision on whether this is acceptable outside gentle-shell's own flows |
| Ask about the main agent without touching the chat | Partly: `fork` and `clone` exist over RPC, but in the live session they cancel all helpers as a side effect | inventory S11, S12; [gap G1](../04-rpc-contract.md#gaps-the-desktop-needs) | `Inference:` a separate process avoids the side effect |
| The agent's thinking | Yes for the main agent (`thinking_*` deltas); not rendered | inventory C18 | Desktop only. For helpers, thinking items are in the thread (40-item cap) |
| Link answers to ODD evidence (task, commit, review) | No structured ODD state | inventory O3, R5; [gap G2](../04-rpc-contract.md#gaps-the-desktop-needs) | gap G2 |
| Several side conversations at once | No: single session host | [audit A3](../03-architecture/audit.md#a3-single-session-host-with-positional-message-ids) | gap G9 (desktop work) |

## Prior art in the ecosystem

- **`subagent_continue` and `subagent_result`:** finished tasks "come back on demand for `subagent_result` and `subagent_continue`" (`gentle-shell@1162ce9:docs/gentle-shell.md:232`; tools at `gentle-shell@1162ce9:extensions/gentle-agents.ts:1414`, `:1449-1451`). This is the closest existing mechanism, driven by the model.
- **Open session in the agents overlay:** "Open writes a markdown transcript for `$EDITOR`, not a resumed child session" (`gentle-shell@1162ce9:docs/gentle-shell.md:226`). A read-only transcript, TUI only.
- **pi fork, clone and tree:** branch from an earlier message or duplicate a session (inventory S8, S11, S12), which keeps the original intact.
- **pi export:** `/export` writes a session as HTML or JSONL (inventory S13).

## Open questions

- Should "Ask why" use the agent's own session (`subagent_continue`, same model and context) or a fresh reader over the transcript?
- Is a read-only run a hard requirement, or is a warning enough?
- Where should saved answers live: in the chat, beside the helper, or in the feature document?
