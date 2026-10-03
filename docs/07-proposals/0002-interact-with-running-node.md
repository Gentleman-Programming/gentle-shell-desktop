# 0002. Interact with a running node

> Status: proposed.

| Field | Value |
|---|---|
| Author | Matrak (community) |
| Source | Conversation with Matrak, 2026-10-01; context brief §2 |
| Status | `proposed` (only the maintainer moves it to `accepted` or `declined`) |
| Principles | vision P10 **[community]**; extends vision P6 **[gentle-shell]**, **[maintainer]** (mockup intent) |

## Problem

Once an agent is running, the desktop user can only watch it:

- The main agent can be stopped with Escape, but the composer is read-only while it works, so it cannot be steered (`gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/components/Composer.tsx:53`; [inventory C4](../05-capability-inventory.md#conversation-and-input); [audit A7](../03-architecture/audit.md#a7-prompts-declined-while-working-despite-steer-and-follow-up)).
- A helper cannot be stopped: the Stop button is disabled (`gentle-shell-desktop@5ab4a00:src/renderer/features/helpers/components/HelpersFooter.tsx:36`).
- A helper cannot be redirected, and its questions arrive as ordinary dialog cards with no link to the helper that asked ([inventory A5, A6](../05-capability-inventory.md#helpers-subagents)).

In gentle-shell's terminal, the user can stop helpers from the overlay or a shortcut (inventory A4), and the model can steer them with a tool (inventory A6). The desktop offers neither.

## Proposal

Select any running node (the main agent or one helper) and act on it in place:

| Action | Main agent | Helper |
|---|---|---|
| **Stop** | Exists (Escape, inventory C3) | Stop button in the helper thread (mockup `gs-mockup.html:603`) |
| **Steer** ("change course before your next step") | Composer stays usable while working; message marked as steering or queued | Message box in the helper thread |
| **Answer its question** | Question card in the chat (exists, inventory C19) | Question card inside the helper's thread, naming the helper |
| **Inspect** | Current step, tool calls, thinking (behind a toggle, UX U2) | Current step and tool calls (exists in part) |

Steering text goes to the selected node only. The user sees the message in that node's thread, so the record shows who redirected what.

## Runtime requirements

| Need | Available today? | Evidence | Gap |
|---|---|---|---|
| Stop the main agent | Yes: `abort` | inventory C3 | — |
| Steer or queue for the main agent | Yes over RPC: `steer`, `follow_up`, `clear_queue`, `queue_update` | inventory C4–C6 | Desktop only (audit A7). Behavior to decide: [vision Q5](../00-vision.md#open-questions-for-the-maintainer) |
| Stop one helper | No host command; `subagent_cancel` is a model tool. `Inference:` `abort` cancels foreground helpers only, so a background helper cannot be stopped over RPC | [gap G1](../04-rpc-contract.md#gaps-the-desktop-needs) | **gap G1** (gentle-shell, plus an inbound host channel) |
| Steer one helper | Only by asking the model: `subagent_send_message` "Steer a running subagent with a message delivered before its next model call" is a model tool (`gentle-shell@ac67159:extensions/gentle-agents.ts:1608`) | inventory A6 | Inbound host channel (same shape as gap G1) |
| Answer a helper's question in its thread | Partly: a task-mode child's dialog reaches the parent as an ordinary dialog; a background child's question is dismissed (`gentle-shell@ac67159:docs/gentle-shell.md:214`) | inventory A5 | Helper id on the dialog request (new, gentle-shell). `UNVERIFIED:` whether the forwarded dialog carries any child identity; not checked in code |
| Reply to a helper's `subagent_parent_message` query | Only through the model: `subagent_reply`, one reply, within 30 seconds (`gentle-shell@ac67159:docs/gentle-shell.md:224`) | inventory A5 | Inbound host channel |
| Inspect a helper's steps | Partly: thread items are in the activity payload, but gentle-shell tool items carry no `callId`, which the desktop requires, so `Inference:` (not run) every tool item is dropped | [audit A5](../03-architecture/audit.md#a5-helper-status-set-and-tool-items-do-not-match-gentle-shell) | Desktop fix first |
| Inspect the main agent's tool calls and thinking | Yes over RPC: `tool_execution_*`, `thinking_*` deltas | inventory C17, C18 | Desktop only |

`Inference:` (from [04 gap ownership](../04-rpc-contract.md#gaps-the-desktop-needs)) gentle-shell can push new data to the host without a pi change, but host *actions* on helpers need an inbound channel. pi already routes host text to extension code; among other paths, `prompt` reaches extension commands and `input` handlers, `steer` and `follow_up` reach `input` handlers, `bash` reaches `user_bash` handlers, and dialog responses answer dialogs ([04 §Host and extension channels](../04-rpc-contract.md#host-and-extension-channels)). A `/gentle:*` command or an `input` handler that stops or steers a helper by id is one candidate shape and needs no pi change; it is not designed or agreed upstream, and which channel to use is open ([ADR: Undecided](../03-architecture/adr/README.md#undecided--not-recorded)).

## Prior art in the ecosystem

- **Stop in the gentle-shell agents overlay:** **Stop** (`s`) for owned active tasks, and `alt+s` to stop the current active or queued helpers (`gentle-shell@ac67159:docs/gentle-shell.md:227`, `:232`; inventory A4). TUI only.
- **Steering a helper:** `subagent_send_message` (`gentle-shell@ac67159:extensions/gentle-agents.ts:1608-1610`; `gentle-shell@ac67159:docs/gentle-shell.md:218`, "steer a running child").
- **Steering the main agent:** pi sends Enter-while-streaming as `prompt` with `streamingBehavior: "steer"` (`pi@a13d35a:packages/coding-agent/src/modes/interactive/interactive-mode.ts:3317-3324`; inventory C4).
- **Answering a helper's question:** task-mode child dialogs surface as parent dialogs (`gentle-shell@ac67159:docs/gentle-shell.md:214`).

## Open questions

- Should steering a helper go through the parent agent (so it knows), or straight to the helper?
- What should a prompt sent while the main agent works do: steer, queue or be declined ([vision Q5](../00-vision.md#open-questions-for-the-maintainer))?
- Should Stop on a helper ask for confirmation, as `alt+s` does in the terminal?
