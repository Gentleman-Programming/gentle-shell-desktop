# Architecture decision records

> Status: draft.

This folder holds one ADR for each architecture decision that the desktop repo's own documents record as a decision. Each ADR cites where the decision is recorded. Choices that appear only in code, or were left open, are listed under [Undecided / not recorded](#undecided--not-recorded) and get no ADR.

**Format.** `NNNN-kebab-title.md` with Context, Decision, Consequences and Status. Status reads `accepted (recorded in <source>)`, or `accepted, amended in part (...)` when a later document changed part of the decision.

**Citations.** Paths without a repository prefix are in `gentle-shell-desktop@5ab4a00`. IDs from other pages are qualified (`audit A8`, `gap G9`); unqualified M1–M6 are the maintainer's milestones, and T-numbers are tasks inside them.

## Index

| ADR | Decision | Recorded in |
|---|---|---|
| [0001](0001-electron-react-typescript-stack.md) | Electron, React and TypeScript as the desktop stack | `odd/tasks/desktop-m1-chat-core.md:18`, `:26` |
| [0002](0002-process-roles-and-typed-preload-bridge.md) | Main owns processes, renderer is UI only, preload exposes a typed minimal bridge | `odd/tasks/desktop-m1-chat-core.md:26`; `src/README.md:5-19` |
| [0003](0003-hexagonal-main-process.md) | Hexagonal main process (domain, ports, adapters) | `odd/tasks/desktop-m1-chat-core.md:29`; `src/README.md:45-51` |
| [0004](0004-renderer-scope-rule-and-screaming-architecture.md) | Renderer: Scope Rule, Screaming Architecture, container/presentational, atomic `shared/ui` | `odd/tasks/desktop-m1-chat-core.md:29`; `src/README.md:21-43` |
| [0005](0005-gentle-shell-rpc-child-process.md) | Chat through a `gentle-shell --mode rpc` child process | `odd/tasks/desktop-m1-chat-core.md:7`, `:38-39` |
| [0006](0006-in-process-session-list.md) | Chat list through in-process `SessionManager.listAll()` | `odd/tasks/desktop-m1-chat-core.md:39` |
| [0007](0007-text-only-chat-view.md) | The chat view shows user and assistant text only (amended in part: assistant replies render as sanitized Markdown) | `odd/tasks/desktop-m1-chat-core.md:7`, `:38`, `:47`; `odd/tasks/desktop-m2-helpers.md:63` |
| [0008](0008-first-run-home-choice.md) | First-run home choice mapped to `--link` / `--isolated` | `odd/tasks/desktop-m1-chat-core.md:41`, `:49` |
| [0009](0009-hardcoded-gentleman-cute-theme.md) | Hardcode Gentleman-Cute theme tokens for now | `odd/tasks/desktop-m1-chat-core.md:22`, `:37` |
| [0010](0010-standalone-renderer-with-mock-bridge.md) | Renderer runs standalone against a mock bridge (`pnpm dev:web`) | `odd/tasks/desktop-m1-chat-core.md:29`; `odd/tasks/desktop-m2-helpers.md:19` |
| [0011](0011-helpers-scoped-per-chat.md) | Helpers are scoped to the chat that started them | `odd/tasks/desktop-m2-helpers.md:7`, `:16`, `:22` |
| [0012](0012-interactive-host-env-flag.md) | Set `GENTLE_SHELL_INTERACTIVE_HOST=1` on every spawn | `odd/tasks/desktop-m2-helpers.md:11`, `:17` |

## Undecided / not recorded

These are open questions. Each needs a maintainer decision before an ADR can be written.

| Candidate | What the repo shows | Why there is no ADR |
|---|---|---|
| **Bundled vs external runtime** | M1 says "Electron's bundled Node runs [pi] in the main process without a sidecar" (`odd/tasks/desktop-m1-chat-core.md:18`). The code requires an external launcher on `PATH` or `GENTLE_SHELL_BIN` (`src/main/adapters/launcherLocator.ts:16-31`; `README.md:12-17`). M1 also said to "depend on the git ref until a release ships" (`odd/tasks/desktop-m1-chat-core.md:17`). | The line in M1 is a reason for choosing Electron, not a decision about shipping gentle-shell or pi inside the app. No document decides bundling. The mockup's "the app runs its own copy of pi" is intent only. |
| **One child per chat vs a shared host** | `ChatHost` holds one session, with the comment "M1 scope: no multi-chat tabs" (`src/main/domain/session/ChatHost.ts:61-66`). | Recorded only as an M1 scope limit in a code comment. No document decides the multi-chat model. See [audit A3](../audit.md#a3-single-session-host-with-positional-message-ids). |
| **RPC-only vs mixed (RPC plus in-process pi)** | Chat uses RPC ([0005](0005-gentle-shell-rpc-child-process.md)); the list uses in-process pi ([0006](0006-in-process-session-list.md)). | Each path is recorded, but no document decides whether the desktop should stay off pi's module graph. See [audit A1](../audit.md#a1-two-data-paths-to-pi-and-a-global-pi_coding_agent_dir-mutation). |
| **Prompt while working: queue, steer or decline** | T3 says "queue it or reject" (`odd/tasks/desktop-m1-chat-core.md:39`). The code declines (`src/main/domain/session/PiSession.ts:163-180`; `src/shared/bridge-types.ts:94-105`). | Partial record only. T5 adds the follow-up "report a prompt-while-working once (not through error event plus rejection)" (`odd/tasks/desktop-m1-chat-core.md:41`). That line presumes the decline and fixes how it is reported; it does not weigh queue against reject, and no document discusses steer. See [audit A7](../audit.md#a7-prompts-declined-while-working-despite-steer-and-follow-up). |
| **Version compatibility policy** | A minimum is documented: "gentle-pi 3.7.0 or newer" (`README.md:12`, `:91`), repeated in the launcher-not-found error (`src/main/adapters/launcherLocator.ts:25-29`). No code checks it. | A documented minimum, not enforced; no document records a compatibility policy (what happens below the minimum, or across pi versions). See [audit A8](../audit.md#a8-no-version-handshake). |
| **Home choice shared with gentle-shell** | The desktop saves its own choice. gentle-shell keeps another in `~/.gentle-shell/config.json` (`gentle-shell@ac67159:lib/gentle-shell-launcher.ts:241-243`). | Not discussed. See [audit A19](../audit.md#a19-two-persisted-home-choices). |

Out of scope for ADRs: the delivery and review process (feature-branch chains, receipt-driven review, strict TDD) recorded in `odd/tasks/desktop-m1-chat-core.md:27`, `:30-31`. It governs how work ships, not the architecture.
