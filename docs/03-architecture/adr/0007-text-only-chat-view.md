# 0007. The chat view shows user and assistant text only

> Status: draft.

## Context

The desktop targets people who want to get work done, not watch a terminal (`odd/tasks/desktop-m1-chat-core.md:11`).

## Decision

- **Scope.** M1 is a plain-text conversation: "No tool output, no thinking shown" (`odd/tasks/desktop-m1-chat-core.md:7`).
- **Reducer.** The T2 reducer "keeps only user/assistant text, working state, and dialogs" (`odd/tasks/desktop-m1-chat-core.md:38`).
- **Acceptance.** "thinking and tool events never appear" (`odd/tasks/desktop-m1-chat-core.md:47`).

## Consequences

- **What happens to the rest.** Tool and thinking events only bump an `activity` counter (`src/main/domain/rpc/chatReducer.ts:61-68`, `:93-104`), and history drops them (`src/main/domain/rpc/history.ts:11-19`).
- **What M2 added.** Subagent activity, in a separate Helpers tab ([0011](0011-helpers-scoped-per-chat.md)).
- **Side effect.** Non-assistant message events are ignored live ([audit A6](../audit.md#a6-reducer-drops-non-assistant-messages-from-the-live-view)).

## Later change

- **Assistant replies render as sanitized Markdown.** M2's real-run follow-ups record "#16 `53497af` sanitized Markdown replies" (`odd/tasks/desktop-m2-helpers.md:63`). The code parses assistant text with `marked` and sanitizes it with DOMPurify (`src/renderer/shared/markdown/renderMarkdown.ts:65-72`). `MessageBubble` renders user text as plain text and assistant text through `Markdown` (`src/renderer/features/conversation/components/MessageBubble.tsx:20`).
- **What did not change.** The view still shows only user and assistant text; tool and thinking events stay out of it. Only the "plain-text" rendering of assistant text was amended.

## Status

accepted, amended in part (recorded in `odd/tasks/desktop-m1-chat-core.md:7`, `:38`, `:47`; plain-text rendering of assistant replies amended by `odd/tasks/desktop-m2-helpers.md:63`)
