# 0004. Renderer structure: Scope Rule, Screaming Architecture, container/presentational

> Status: draft.

## Context

The maintainer asked for his React skills to be applied, and for the structure rules of his `angular` skill to be applied to React (`odd/tasks/desktop-m1-chat-core.md:29`).

## Decision

**React code rules:** named imports, no manual memoization, ref as a prop (`odd/tasks/desktop-m1-chat-core.md:29`).

**Structure rules** (`odd/tasks/desktop-m1-chat-core.md:29`; `src/README.md:21-43`):

| Rule | Meaning |
|---|---|
| Scope Rule | Code used by one feature stays local; code used by two or more goes to `shared/`. |
| Screaming Architecture | Feature folders are named after what the app does. |
| Container/presentational | `<Feature>Container.tsx` owns state and calls `useBridge()`; components under `components/` only take props. |
| Atomic design | Reusable atoms live under `shared/ui`. |

## Consequences

- **Features.** `chats`, `conversation`, `first-run` and `helpers`. `helpers` gets its own folder even though only `conversation` opens it (`src/README.md:28-32`).
- **Bridge in one place.** Bridge calls stay in containers, so presentational components are tested without Electron (`src/README.md:39-43`).
- **Drift.** `shared/markdown` has a single consumer ([audit A17](../audit.md#a17-drift-from-the-stated-structure-rules)).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:29`, `src/README.md:21-43`)
