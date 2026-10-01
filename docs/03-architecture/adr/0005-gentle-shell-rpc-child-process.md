# 0005. Talk to Gentle Shell through a `gentle-shell --mode rpc` child process

> Status: draft.

## Context

pi offers `--mode rpc` with commands, events and extension dialogs (`odd/tasks/desktop-m1-chat-core.md:15`). The gentle-shell launcher accepts `[--link|--isolated|--home <dir>] --mode rpc`, forwards the flags to pi and sets `PI_CODING_AGENT_DIR` (`odd/tasks/desktop-m1-chat-core.md:17`).

## Decision

The conversation runs "through `gentle-shell --mode rpc`" (`odd/tasks/desktop-m1-chat-core.md:7`). T2 defines a `PiSession` that:

- spawns `gentle-shell --mode rpc` with the chosen home flags;
- streams events;
- sends `prompt`, `abort` and `extension_ui_response`;
- shuts down cleanly.

Source: `odd/tasks/desktop-m1-chat-core.md:38`. JS launcher entries run under Electron with `ELECTRON_RUN_AS_NODE=1` and `process.execPath`, never as a bare Electron spawn (`odd/tasks/desktop-m1-chat-core.md:39`).

## Consequences

- **Protocol.** The contract is pi's RPC protocol, with gentle-shell extensions on top ([04-rpc-contract.md](../../04-rpc-contract.md)).
- **External launcher.** The launcher is found on `PATH` or through `GENTLE_SHELL_BIN` (`src/main/adapters/launcherLocator.ts:16-31`). M1 also says that "Electron's bundled Node runs [pi] in the main process without a sidecar" (`odd/tasks/desktop-m1-chat-core.md:18`), but the code runs an external launcher. See [Undecided](README.md#undecided--not-recorded).
- **Known problems.** Windows `.cmd` spawning ([audit A4](../audit.md#a4-windows-cmd-launcher-spawned-without-a-shell)) and the lack of a version handshake ([audit A8](../audit.md#a8-no-version-handshake)).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:7`, `:38-39`)
