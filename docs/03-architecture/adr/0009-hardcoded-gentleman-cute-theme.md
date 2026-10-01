# 0009. Hardcode the Gentleman-Cute theme tokens for now

> Status: draft.

## Context

pi has themes; gentle-pi ships `themes/Gentleman-Cute.json` (`odd/tasks/desktop-m1-chat-core.md:37`).

## Decision

- **Out of M1 scope:** reading the active pi theme. The decision is to "hardcode Gentleman-Cute tokens now" (`odd/tasks/desktop-m1-chat-core.md:22`).
- **In T1:** the Gentleman-Cute tokens as CSS variables, plus the three font families (`odd/tasks/desktop-m1-chat-core.md:37`).

## Consequences

- **Where the theme lives.** `src/renderer/shared/theme/gentleman-cute.json` and `tokens.css`. A user's pi theme is not reflected.
- **Fonts.** They load from Google Fonts at runtime (`src/renderer/index.html:11-16`), so an offline launch loses them ([audit A14](../audit.md#a14-preload-and-ipc-hardening)).
- **Deferred, not closed.** Reading the active theme was deferred. No later document decides it.

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:22`, `:37`)
