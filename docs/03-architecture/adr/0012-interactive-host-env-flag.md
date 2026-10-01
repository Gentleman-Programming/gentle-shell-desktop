# 0012. Opt into interactive-host features with `GENTLE_SHELL_INTERACTIVE_HOST=1`

> Status: draft.

## Context

Under `--mode rpc`, gentle-pi enables RPC dialogs for `ask_user_question` and `ask_user_choice`, and publishes subagent activity, only when the host says it is interactive (`odd/tasks/desktop-m2-helpers.md:11`).

## Decision

The app sets `GENTLE_SHELL_INTERACTIVE_HOST=1` on the process it spawns (`odd/tasks/desktop-m2-helpers.md:11`, `:17`; `README.md:89-91`). In code, the flag is applied last in the env merge, so nothing can override it (`src/main/domain/session/PiSession.ts:59-67`, `:134`).

## Consequences

- **Older gentle-pi.** With gentle-pi older than 3.7.0, the Helpers tab stays empty (`README.md:89-91`). The desktop does not detect this ([audit A8](../audit.md#a8-no-version-handshake)).
- **Contract details.** Exact value, gating and the activity schema are in [04-rpc-contract.md](../../04-rpc-contract.md#environment-variables-on-the-contract).

## Status

accepted (recorded in `odd/tasks/desktop-m2-helpers.md:11`, `:17`)
