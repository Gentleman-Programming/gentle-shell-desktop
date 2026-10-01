# 0002. Process roles and a typed, minimal preload bridge

> Status: draft.

## Context

Electron runs three JavaScript contexts that cannot share runtime state, only types (`src/README.md:7-10`).

## Decision

Each process has one role (`odd/tasks/desktop-m1-chat-core.md:26`):

- **Main** owns child processes and the session list.
- **Renderer** is UI only.
- **Preload** exposes "a typed, minimal bridge".

The contract shared by all three lives in `src/shared/bridge-types.ts` (`src/README.md:12-16`).

## Consequences

- **The bridge.** The renderer reaches main only through `window.gentle` (`GentleBridge`): 8 request channels and 2 push channels (`src/shared/bridge-types.ts:273-295`; `src/shared/ipc-channels.ts:8-23`).
- **Testable preload.** `createBridge` takes an injected IPC object, so it is tested without Electron (`src/preload/bridge.ts:10-19`).
- **Gaps.** Pushes carry no chat id, and IPC arguments are not validated. See [audit A3](../audit.md#a3-single-session-host-with-positional-message-ids) and [audit A14](../audit.md#a14-preload-and-ipc-hardening).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:26`, `src/README.md:5-19`)
