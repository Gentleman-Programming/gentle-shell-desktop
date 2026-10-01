# 0003. Hexagonal main process

> Status: draft.

## Context

The maintainer asked for the structure rules from his skills to be applied, including a "hexagonal main process (domain, ports, adapters)" (`odd/tasks/desktop-m1-chat-core.md:29`). M2 kept the same constraints (`odd/tasks/desktop-m2-helpers.md:26`).

## Decision

Main-process code is split into three folders (`src/README.md:45-51`):

- `src/main/domain`: pure types and logic.
- `src/main/ports`: the interfaces the domain depends on.
- `src/main/adapters`: the Electron/Node implementations.

The goal is a domain free of Electron imports, so the RPC codec and reducer can be tested without spawning a real `gentle-shell` (`src/README.md:45-51`).

## Consequences

- **Ports.** There are five: `ProcessSpawner`, `LauncherLocator`, `SessionStore`, `HomeSettings` and `SetupService` (`src/main/ports/index.ts:15-97`). [current.md](../current.md#ports-and-adapters) lists their adapters.
- **Fake-driven tests.** `PiSession` and `ChatHost` depend only on ports and are tested with fakes or a fake script (`src/main/domain/session/PiSession.ts:69-76`).
- **Drift.** `domain/home/home.ts` imports Node modules ([audit A17](../audit.md#a17-drift-from-the-stated-structure-rules)).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:29`, `src/README.md:45-51`)
