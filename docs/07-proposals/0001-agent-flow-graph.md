# 0001. Agent flow as a graph

> Status: proposed.

| Field | Value |
|---|---|
| Author | Matrak (community) |
| Source | Conversation with Matrak, 2026-10-01; context brief §2 |
| Status | `proposed` (only the maintainer moves it to `accepted` or `declined`) |
| Principles | vision P10 **[community]**; must respect vision P4 **[maintainer]** |

## Problem

A chat can start several helpers, and helpers can ask the parent questions and send results back. Today that flow is shown as a flat list:

- The desktop's Helpers pane lists the chat's helpers and one thread at a time (`gentle-shell-desktop@5ab4a00:src/renderer/features/helpers/HelpersContainer.tsx`; [screens SCR-03](../06-ux/screens.md#scr-03-helpers-pane)).
- The mockup shows the same list, plus helper rows under the message that started them (`gs-mockup.html:545-550`, `:572-578`).
- gentle-shell's own overlay is a list beside a thread ([inventory A3](../05-capability-inventory.md#helpers-subagents)).

A list answers "what is running". It does not show **who delegated what, from which message, in what order, and what came back**. `Inference:` that relation is the part of the workflow a terminal shows least well, which makes it a candidate for vision P10.

## Proposal

A per-chat graph view of the agent flow:

- **Nodes:** the chat's main agent, each helper, and (where known) the user message that led to a delegation.
- **Edges:** delegation (parent starts helper); question and reply (helper asks the parent, inventory A5); result returned (inventory A7); steering sent (inventory A6).
- **Node state:** queued, running, waiting, done, failed, with elapsed time; selecting a node opens its thread in the existing Helpers pane.
- **Time:** nodes ordered by start time, so the graph also reads as a timeline.

**Scope.** One chat at a time. The maintainer decided "Never a global list: the parent-child relation stays direct" (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:7`; [ADR 0011](../03-architecture/adr/0011-helpers-scoped-per-chat.md)). A cross-chat graph (for example of `orchestrator_*` messages between sessions, inventory A9) would conflict with that decision; it is left as an open question, not part of this proposal.

## Runtime requirements

| Need | Available today? | Evidence | Gap |
|---|---|---|---|
| List of the chat's helpers with status and timestamps | Yes, over the interactive host: `gentle-agents.activity/v1` has `id`, `agent`, `label`, `status`, `createdAt`, `startedAt`, `endedAt` | [04, gentle-shell additions](../04-rpc-contract.md#gentle-shell-additions-over-rpc) | Desktop parser mismatches first ([audit A5](../03-architecture/audit.md#a5-helper-status-set-and-tool-items-do-not-match-gentle-shell)) |
| Which session or task started a helper | No: `TaskRecord` has `parentSessionId` (`gentle-shell@1162ce9:lib/agents-protocol.ts:124`), but the payload deliberately omits it (`gentle-shell@1162ce9:docs/gentle-agents-activity.md:62`) | — | New field. `Inference:` same route as gap G8 (a `setWidget` payload change in gentle-shell) |
| Which user message led to a delegation | No: the payload has no message linkage (`gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/components/HelpersStrip.tsx:9-16`) | — | New field (gentle-shell); the desktop also needs stable message ids ([audit A3](../03-architecture/audit.md#a3-single-session-host-with-positional-message-ids)) |
| Helpers started by helpers | `Inference:` (read, not run) no. The runner launches every child with `GENTLE_PI_AGENTS_CHILD=1` (`gentle-shell@1162ce9:lib/agents-runner.ts:216`, `:473`); `agentsEnabled` returns false for it (`gentle-shell@1162ce9:extensions/gentle-agents.ts:145-146`), and `gentleAgents` returns early for such a process (`:332-339`), after registering at most the child messaging tool `subagent_parent_message` (`:189-190`) and before the `subagent_*` tools are registered (`:1238-1239`) | — | None while this holds; a parent task id is needed only if nested delegation is added |
| Question, reply, result and steering edges | Partly: task-mode child dialogs reach the parent as ordinary dialogs, with no helper link (inventory A5); results arrive as `gentle-agents.result` custom messages (inventory A7), which the desktop drops ([audit A6](../03-architecture/audit.md#a6-reducer-drops-non-assistant-messages-from-the-live-view)); steering is a model tool (inventory A6) | inventory A5–A7 | Helper id on dialog requests (new); desktop must keep custom messages |
| Model, tokens and cost per node | No: omitted from the payload | `gentle-shell@1162ce9:docs/gentle-agents-activity.md:62`; inventory A2 | gap G8 |
| Finished helpers from earlier sessions | No over RPC; on disk in `<agent home>/gentle-agents/tasks/` | inventory A12 | gap G8 |
| Several chats each with its own graph | No: single session host | [audit A3](../03-architecture/audit.md#a3-single-session-host-with-positional-message-ids) | gap G9 (desktop work) |

## Prior art in the ecosystem

- **gentle-shell agents overlay** (`/gentle:agents`, `alt+a`): split view of tasks and the selected thread, Follow, Open session, Stop, and a Scope switch between "this session's direct active children and all open orchestrators" (`gentle-shell@1162ce9:docs/gentle-shell.md:225-226`). A list, not a graph; TUI only over RPC ([inventory A3](../05-capability-inventory.md#helpers-subagents)).
- **pi session tree** (`/tree`): navigates a session's branches as a tree (inventory S8, `pi@d86654a:packages/coding-agent/src/modes/interactive/interactive-mode.ts:3180`). A tree of one conversation's entries, not of agents.
- No graph view of agents was found. `rg -il '\bgraph\b'` over gentle-shell's `extensions/`, `lib/`, `docs/` and `README.md` hits only unrelated uses (the GitHub contributors graph, the review authority graph, pi's module graph). `rg -il 'agent graph|graph view|flow graph'` over gentle-shell, `pi@d86654a:packages/coding-agent/src` and `gentle-ai@6dee8f8` has 0 hits.

## Open questions

- Is a per-chat graph useful enough over the existing list to justify the upstream fields?
- Should cross-session messaging (inventory A9) ever appear, given vision P4?
- Graph or timeline first? A timeline needs only the fields available today.
