# 0003. Post-hoc audit by questions

> Status: proposed.

| Field | Value |
|---|---|
| Author | Matrak (community) |
| Source | Conversation with Matrak, 2026-10-01 (not published); [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28) |
| Status | `proposed` (only the maintainer moves it to `accepted` or `declined`) |
| Principles | vision P10 **[community]** (asking a finished helper why; P10 means a helper, not the main session, since the review of 2026-10-03); supports vision P7 **[maintainer]** (mockup intent), **[gentle-shell]** and vision P9 **[community]** |

## Problem

When a helper (a subagent the main agent delegated to) finishes, the user sees the result: a "done" helper, its answer in the chat, a task with a commit. They cannot easily ask that helper **"why did you do it this way and not that way?"**

- Asking in the main chat adds the question to the working conversation and may start new work. `Inference:` the main agent would also answer from its own context, which holds the helper's result but not its steps.
- The helper's reasoning and steps are not available to the desktop after it finishes: the activity payload keeps the last 40 thread items and omits the transcript path and the result ([gap G8](../04-rpc-contract.md#gaps-the-desktop-needs)).
- The desktop does not render tool calls or thinking even for the main agent (inventory C17, C18).

`Inference:` being able to question a finished helper turns "the agent says it is done" into something the user can check, which serves vision P7 (visible evidence) and vision P9 (learning from the work). A related concern was raised in the community thread: an agent can claim success without anyone verifying it (Discord, Rafael The Hutt, 2026-09-27); that thread proposes a different solution (gentle-mesh), which this proposal does not depend on.

## Proposal

**Primary scope (vision P10):** on a finished helper, an **Ask why** action opens a side conversation. **Extension beyond vision P10 [community]:** the same action on a finished turn of the main agent. P10 leaves it out, because the main session can simply be asked ([issue #28, "Author's framing: review of the vision (2026-10-03)"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28), item 1); it is kept only as an optional variant, and its requirement row below is marked "Extension".

1. It starts from that helper's own transcript (its task, steps, tool calls, result).
2. The user asks questions; the helper answers from its transcript and cites the steps it refers to.
3. It does not change the main chat, the repository or the helper's original record. `Inference:` this needs a read-only run (no write or shell tools).
4. The exchange can be saved next to the original node, or discarded.

## Runtime requirements

| Need | Available today? | Evidence | Gap |
|---|---|---|---|
| A helper's full transcript and result | No over RPC: the payload omits `sessionPath` and `result`; threads keep 40 items (activity schema unchanged from 3.7.0 (`1162ce9`) through the 4.0.0 release (`1f35ab1`) and `main` (`ac67159`)) | `gentle-shell@ac67159:docs/gentle-agents-activity.md:62`, `:79` | **gap G8** |
| Finished helpers after the fact | On disk: one JSON per task in `<agent home>/gentle-agents/tasks/` (newest `history_max_tasks` kept, default 200). Each helper is its own pi session: a separate pi process run with `--mode rpc --session-dir <agent home>/gentle-agents/sessions` | `gentle-shell@ac67159:docs/gentle-shell.md:233`; `gentle-shell@ac67159:lib/agents-runner.ts:258-259`, `:501-502`; `gentle-shell@ac67159:extensions/gentle-agents.ts:124-127`, `:1266`; inventory A12 | `Inference:` the desktop could read them host-side. `UNVERIFIED:` the task JSON format is not documented as stable |
| Resume a finished helper with a question | Only as a model tool of the main agent: `subagent_continue` "Resume a finished subagent task in its own session with a follow-up prompt" refuses a task that is unfinished or has no session path, else relaunches it with `--session <sessionPath>`. Helper processes (`GENTLE_PI_AGENTS_CHILD=1`) do not register it | `gentle-shell@ac67159:extensions/gentle-agents.ts:1613-1615`, `:1622`, `:1631`, `:152`, `:338-345`; `gentle-shell@ac67159:lib/agents-runner.ts:261`; `gentle-shell@ac67159:docs/gentle-shell.md:218`, `:233` | Inbound host channel (gap G1 shape). A continued helper keeps its normal tools, so it is not read-only (`Inference:`) |
| A read-only run on a saved session | `Inference:` (not run): spawn a separate pi process on the helper's session file with `--session <path>`, which "Opens by file path" (`pi@a13d35a:packages/coding-agent/docs/cli.md:90-91`; inventory S3), and restricted tools with `--tools` or `--no-tools` (inventory E9). Both are spawn-only flags. `UNVERIFIED:` that pi reopens a helper session file this way; not run | inventory S3, E9; [vision §Product principles, "Asking a finished helper"](../00-vision.md#product-principles) | Desktop work, plus a decision on whether this is acceptable outside gentle-shell's own flows |
| **Extension** (beyond vision P10, **[community]**): ask about the main agent without touching the chat | Partly: `fork` and `clone` exist over RPC, but in the live session they cancel all helpers as a side effect | inventory S11, S12; [gap G1](../04-rpc-contract.md#gaps-the-desktop-needs) | `Inference:` a separate process avoids the side effect |
| The helper's thinking | Partly: thinking items are in the helper's thread (40-item cap). For the main-turn extension: yes (`thinking_*` deltas), not rendered | `gentle-shell@ac67159:docs/gentle-agents-activity.md:64`, `:79`; inventory C18; [gap G8](../04-rpc-contract.md#gaps-the-desktop-needs) | Desktop only for what the thread holds; older items need gap G8 |
| Link answers to ODD evidence (task, commit, review) | No structured ODD state | inventory O3, R5; [gap G2](../04-rpc-contract.md#gaps-the-desktop-needs) | gap G2 |
| Several side conversations at once | No: single session host | [audit A3](../03-architecture/audit.md#a3-single-session-host-with-positional-message-ids) | gap G9 (desktop work) |

## Prior art in the ecosystem

- **`subagent_continue` and `subagent_result`:** finished tasks "come back on demand for `subagent_result` and `subagent_continue`" (`gentle-shell@ac67159:docs/gentle-shell.md:233`; tools at `gentle-shell@ac67159:extensions/gentle-agents.ts:1578`, `:1613-1615`). This is the closest existing mechanism, driven by the main agent's model.
- **Open session in the agents overlay:** "Open writes a markdown transcript for `$EDITOR`, not a resumed child session" (`gentle-shell@ac67159:docs/gentle-shell.md:227`). A read-only transcript, TUI only.
- **pi fork, clone and tree:** branch from an earlier message or duplicate a session (inventory S8, S11, S12), which keeps the original intact.
- **pi export:** `/export` writes a session as HTML or JSONL (inventory S13).

## Open questions

- Should "Ask why" use the helper's own session (`subagent_continue`, same model and context) or a fresh reader over the transcript?
- Is a read-only run a hard requirement, or is a warning enough?
- Where should saved answers live: in the chat, beside the helper, or in the feature document?
- Is the main-turn extension wanted at all, given that vision P10 covers finished helpers only?
