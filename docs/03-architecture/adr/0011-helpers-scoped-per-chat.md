# 0011. Helpers are scoped to the chat that started them

> Status: draft.

## Context

gentle-agents runs subagents ("helpers") and, with an interactive host, publishes their activity over RPC as `gentle-agents.activity/v1` (`odd/tasks/desktop-m2-helpers.md:9-12`).

## Decision

Each chat has a Helpers tab that shows only the subagents that chat started. It is "Never a global list: the parent-child relation stays direct" (maintainer decision, 2026-09-21; `odd/tasks/desktop-m2-helpers.md:7`). The reducer keeps `helpers` per chat and ignores other widget keys (`odd/tasks/desktop-m2-helpers.md:16`). Stopping helpers is out of scope until gentle-agents exposes an RPC command (`odd/tasks/desktop-m2-helpers.md:22`).

## Consequences

- **Where state lives.** Helper state is part of `ChatState` (`src/shared/bridge-types.ts:128`). The renderer shows it in `features/helpers`, opened only from `conversation` (`src/README.md:28-32`).
- **Stop disabled.** The Stop button is disabled (`src/renderer/features/helpers/components/HelpersFooter.tsx:36-38`; `README.md:62`).
- **Retention.** Finished helpers are kept by a retention merge, because gentle-agents drops them from frames (`odd/tasks/desktop-m2-helpers.md:57`; `src/main/domain/rpc/chatReducer.ts:209-229`).

## Status

accepted (recorded in `odd/tasks/desktop-m2-helpers.md:7`, `:16`, `:22`)
