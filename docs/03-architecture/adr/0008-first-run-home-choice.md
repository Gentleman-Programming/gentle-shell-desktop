# 0008. First-run home choice: link to pi or keep a separate home

> Status: draft.

## Context

Users may already have a pi setup in `~/.pi/agent` with sign-ins and sessions. The gentle-shell launcher supports `--link` and `--isolated` (`odd/tasks/desktop-m1-chat-core.md:17`).

## Decision

T5 (`odd/tasks/desktop-m1-chat-core.md:41`, `:49`):

1. Detect `~/.pi/agent`.
2. If it exists, offer "Use my pi setup" or "Keep it separate". Skip the screen when no pi is found.
3. Save the choice in the app's `userData` config.
4. Pass it to the launcher as `--link` or `--isolated`.

## Consequences

- **Defaults.** With no saved choice, the app uses `isolated` (`src/main/domain/home/home.ts:17-19`).
- **Override.** `GENTLE_SHELL_HOME` overrides both modes with `--home <dir>` (`src/main/domain/home/home.ts:33-37`).
- **No restart needed.** Home flags are re-read on every spawn (`src/main/adapters/homeSettings.ts:5-17`). The listing directory is re-resolved on every list call (`src/main/adapters/piSessionStore.ts:44-58`, wired at `src/main/index.ts:63`).
- **Two saved choices.** gentle-shell saves its own home choice elsewhere ([audit A19](../audit.md#a19-two-persisted-home-choices)).
- **First run in an isolated home** triggers launcher provisioning with no visible progress ([audit A9](../audit.md#a9-launcher-first-run-provisioning-shows-no-progress)).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:41`, `:49`; `README.md:25-30`, `:42`)
