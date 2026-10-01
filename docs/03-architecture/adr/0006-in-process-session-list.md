# 0006. List chats in-process with pi's `SessionManager.listAll()`

> Status: draft.

## Context

`SessionManager.listAll()` from `@earendil-works/pi-coding-agent` returns id, cwd, name, created, modified, message count and first message (`odd/tasks/desktop-m1-chat-core.md:16`).

## Decision

T3 lists sessions "with `SessionManager.listAll()` under the resolved home" and exposes them as `sessions.list` (`odd/tasks/desktop-m1-chat-core.md:39`).

## Consequences

- **A second path to pi.** The desktop has a second data path to pi besides RPC, with its own pi version: 0.85.1 locked (`package.json:42`; `pnpm-lock.yaml:323`), against at least 0.99.1 over RPC.
- **A process-global variable.** `listAll()` reads the agent dir from `PI_CODING_AGENT_DIR`, so the adapter sets that process-global variable around each call. Its comment records this as "a real, accepted M1 limitation" (`src/main/adapters/piSessionStore.ts:18-25`).
- See [audit A1](../audit.md#a1-two-data-paths-to-pi-and-a-global-pi_coding_agent_dir-mutation) and [A2](../audit.md#a2-pi-version-skew-between-the-two-paths).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:39`)
