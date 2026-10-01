# Ecosystem

> Status: draft.

Gentle Desktop sits on top of four other pieces: **pi**, the agent runtime; **gentle-shell**, the launcher plus the pi package `gentle-pi`; **gentle-ai**, the Go CLI gentle-shell pins; and the **companion packages** gentle-ai installs. This page shows how they connect, who owns each one, which versions fit together, what the desktop takes from each, and which repository a change belongs in. Terms are defined in the [glossary](01-glossary.md).

## At a glance

| Question | Answer | Evidence |
|---|---|---|
| Are gentle-pi and gentle-shell different pieces? | No. They are one repository and one npm package: `gentle-pi` is the package name, `gentle-shell` the binary and the product. | `gentle-shell@1162ce9:package.json:2-9` |
| What does the desktop talk to? | The `gentle-shell` launcher over RPC, which runs pi ≥ 0.99.1. It also imports pi 0.85.1 in-process to list sessions. | [current.md §Data paths to pi](03-architecture/current.md#data-paths-to-pi) |
| Does anything negotiate versions? | No. There is no handshake; only the launcher enforces a pi floor. | [04 §Versioning](04-rpc-contract.md#versioning-and-compatibility) |
| Where does a new RPC command go? | pi (`earendil-works/pi`), which owns the `RpcCommand` union. | [Where each change belongs](#where-each-change-belongs) |

**How to read citations.** Same keys as the [glossary](01-glossary.md#how-to-read-citations): `D:` = `gentle-shell-desktop@5ab4a00:src/`, `GS:` = `gentle-shell@1162ce9:`, `GA:` = `gentle-ai@6dee8f8:` (v3.7.0), `PI:` = `pi@d86654a:packages/coding-agent/`. `Inference:` marks reasoning; `UNVERIFIED:` marks claims checked but not confirmed.

## Map of pieces

```mermaid
flowchart TB
  subgraph DESK["gentle-shell-desktop (Gentleman-Programming)"]
    D["Electron app<br/>main, preload, renderer"]
  end
  subgraph GSR["gentle-shell repo (Gentleman-Programming), npm gentle-pi 3.7.0"]
    L["gentle-shell launcher<br/>bin/gentle-shell.mjs"]
    P["gentle-pi pi package<br/>extensions, themes, skills, prompt"]
    B["package-local gentle-ai binary<br/>pinned v3.7.0"]
  end
  subgraph PIR["pi repo (earendil-works)"]
    RPC["pi --mode rpc<br/>0.99.1 or newer"]
    LIB["pi-coding-agent library<br/>0.85.1, in-process"]
  end
  GA["gentle-ai repo (Gentleman-Programming)<br/>Go CLI"]
  C["Companion pi packages<br/>gentle-engram, pi-mcp-adapter,<br/>pi-web-access, pi-btw"]
  H[("Agent home<br/>~/.pi/agent or ~/.gentle-shell/agent")]
  D -- "spawn --mode rpc, JSON lines" --> L
  L -- "spawn, stdio inherit, loads package" --> RPC
  RPC -- "runs extensions" --> P
  P -- "review and telemetry calls" --> B
  L -- "setup: install --agent pi" --> B
  GA -.->|"release v3.7.0"| B
  B -- "pi install" --> C
  C --> H
  RPC -- "sessions, settings, auth" --> H
  D -- "dynamic import, list sessions" --> LIB
  LIB -- "reads sessions" --> H
```

| Edge | Evidence |
|---|---|
| Desktop spawns the launcher with `--mode rpc` | `D:main/domain/session/PiSession.ts:127-134` |
| Launcher spawns pi with inherited stdio and loads gentle-pi with `-e <package root>` | `GS:bin/gentle-shell.mjs:1395`; [05 L8](05-capability-inventory.md#launcher-and-homes) |
| gentle-pi calls its package-local gentle-ai for review and telemetry | `GS:scripts/install-gentle-ai.mjs:12` ("native review operations will fail with package-local-binary-missing"); `GS:docs/readme-reference.md:1035` |
| Setup runs gentle-ai `install --agent pi --scope global` | `GS:bin/gentle-shell.mjs:819-821` |
| The pinned binary is gentle-ai release v3.7.0 | `GS:scripts/gentle-ai-installer.mjs:39-40`, `:48-50` |
| gentle-ai runs `pi install <source>` for each managed package | `GA:internal/agents/pi/adapter.go:264-273` |
| Desktop imports pi 0.85.1 to list sessions | `D:main/adapters/piSessionStore.ts:30-35` |

## Pieces

| Piece | What it is | Distribution | Evidence |
|---|---|---|---|
| **pi** | "A minimal, extensible AI agent for the terminal." It owns the runtime, sessions, providers, packages and the RPC protocol. | npm `@earendil-works/pi-coding-agent`, bin `pi` | `PI:README.md:15`; `PI:package.json:2`, `:9-11` |
| **gentle-shell / gentle-pi** | A launcher (homes, setup, package loading) plus a pi package: 17 extension entry points, 3 themes, 12 skills, 1 prompt template. | npm `gentle-pi`, bin `gentle-shell` | `GS:package.json:2-9`, `:59-73`; counts in [05 §At a glance](05-capability-inventory.md#at-a-glance-gentle-shell-and-gentle-ai) |
| **gentle-ai** | A Go CLI that configures AI agents, including pi. It owns native review (RDD) and telemetry. gentle-shell installs a package-local copy at postinstall. | GitHub releases; Go module `github.com/gentleman-programming/gentle-ai/v3` | `GA:README.md:10`; `GA:go.mod:1`; `GS:package.json:46`; `GS:scripts/gentle-ai-installer.mjs:40` |
| **Companion packages** | Pi packages gentle-ai installs into a home. See [Companion packages](#companion-packages). | npm | `GA:internal/agents/pi/adapter.go:57-63` |
| **Bundled dependency** | `@heyhuynhgiabuu/pi-pretty` 0.6.27, a runtime dependency of gentle-pi, loaded through `extensions/pi-pretty.ts`. `UNVERIFIED:` what it registers (the package is not installed in the reference checkout). | npm, installed with gentle-pi | `GS:package.json:74-76`; [05 V15](05-capability-inventory.md#shell-experience) |
| **Gentle Desktop** | An Electron app: "Desktop chat window for Gentle Shell / pi." | Source only; unsigned local builds | `gentle-shell-desktop@5ab4a00:package.json:7`; `gentle-shell-desktop@5ab4a00:README.md:7` |

### Companion packages

gentle-shell does not keep its own list. Its docs say "the companion list above is not maintained in gentle-shell itself — it is the managed Pi stack of the pinned package-local gentle-ai" (`GS:docs/readme-reference.md:302`). At the pinned gentle-ai v3.7.0:

| Package | What happens during setup | Evidence |
|---|---|---|
| `npm:gentle-pi` | Installed by gentle-ai, then **removed** by gentle-shell right after, because the launcher always loads its own copy. | `GA:internal/agents/pi/adapter.go:58`; `GS:lib/gentle-shell-launcher.ts:541-555` |
| `npm:gentle-engram` | Installed. Persistent memory (Engram). | `GA:internal/agents/pi/adapter.go:23`, `:59`; `GA:TRADEMARKS.md:9` |
| `npm:pi-mcp-adapter` | Installed, followed by `npm exec --yes --package gentle-engram@latest -- pi-engram init`. | `GA:internal/agents/pi/adapter.go:21`, `:60`, `:268-269`, `:276` |
| `npm:pi-web-access` | Installed. | `GA:internal/agents/pi/adapter.go:61` |
| `npm:pi-btw` | Installed. | `GA:internal/agents/pi/adapter.go:62` |
| `npm:@juicesharp/rpiv-ask-user-question` | **Retired** by gentle-ai v3.7.0, and removed by gentle-shell if declared. It conflicts with gentle-pi's own `ask_user_question` tool. | `GA:internal/agents/pi/adapter.go:47-55`; `GS:lib/gentle-shell-launcher.ts:553` |

**Completeness evidence.** gentle-ai's pi adapter builds its install commands only from `managedPackageSources`: one `pi install <source>` per entry, plus the engram init after `pi-mcp-adapter` (`GA:internal/agents/pi/adapter.go:264-273`). That slice has 5 entries (`:57-63`). After gentle-ai finishes, gentle-shell removes the packages in its 2-row removal table (`GS:lib/gentle-shell-launcher.ts:552-555`) and re-applies its default theme if gentle-ai's install wrote a different theme into a home that had none (`GS:docs/readme-reference.md:348`). Besides the package installs, the code read shows these files written into the home when gentle-ai's Engram component runs:

- `settings.json` (adds `npm:pi-mcp-adapter` to `packages`) and `<agentDir>/npm/package.json` (adds dependency `pi-mcp-adapter: ^2.6.0`), both written by gentle-ai's `ProvisionEngramMCP`, called from the Engram component's injector (`GA:internal/agents/pi/adapter.go:400-412`, `:440`; `GA:internal/components/engram/inject.go:306-307`);
- `mcp.json`, written only by `pi-engram init`, per gentle-ai's own comment (`GA:internal/agents/pi/adapter.go:397-399`).

gentle-ai also writes the shared `~/.pi/gentle-ai/persona.json` and `~/.gentle-ai/state.json`, which gentle-shell snapshots and restores (`GS:docs/readme-reference.md:298`). `UNVERIFIED:` whether other gentle-ai components (for example the system prompt file `APPEND_SYSTEM.md` the pi adapter names at `GA:internal/agents/pi/adapter.go:27`, `:289-290`) write further files during `install --agent pi`; only the pi adapter and the Engram injector entry point were read.

**Known doc drift (gentle-shell).** `GS:docs/readme-reference.md:284` still lists `npm:@juicesharp/rpiv-ask-user-question` among the packages setup installs, and a launcher comment says "gentle-ai's own managed Pi stack still installs" it (`GS:lib/gentle-shell-launcher.ts:532-533`), but gentle-ai v3.7.0 marks it retired (`GA:internal/agents/pi/adapter.go:51-55`).

`gentle-ai@b388eb3` (latest `main`) has already retired `pi-mcp-adapter` ([05 GA1](05-capability-inventory.md#gentle-ai-outside-the-session)). gentle-shell 3.7.0 does not use that version.

## Ownership

Names are given only where repository files state them.

| Piece | Repository | Owner or maker per repository files | Evidence |
|---|---|---|---|
| pi | `earendil-works/pi` | Package `author`: Mario Zechner. LICENSE: "Copyright (c) 2025 Mario Zechner". | `PI:package.json:99`, `:103`; `pi@d86654a:LICENSE:3` |
| gentle-shell / gentle-pi | `Gentleman-Programming/gentle-shell` | README: "built by Alan Buscaglia". TRADEMARKS: Alan Buscaglia owns the gentle-shell and gentle-pi marks. The LICENSE line reads "Copyright (c) 2025 Mario Zechner"; no inference is drawn from this. | `GS:package.json:25`; `GS:README.md:350`; `GS:TRADEMARKS.md:7`; `GS:LICENSE:3` |
| gentle-ai | `Gentleman-Programming/gentle-ai` | README: "Built by Alan Buscaglia (Gentleman Programming)". Listed under "Maintainer" in CONTRIBUTORS. LICENSE: "Copyright (c) 2025 Gentleman Programming". | `GS:scripts/gentle-ai-installer.mjs:40`; `GA:README.md:259`; `GA:CONTRIBUTORS.md:5-9`; `GA:LICENSE:3` |
| Engram (`gentle-engram`) | `UNVERIFIED:` repository not checked | TRADEMARKS: Alan Buscaglia owns the Engram mark. | `GA:TRADEMARKS.md:9` |
| `pi-mcp-adapter`, `pi-web-access`, `pi-btw`, `@heyhuynhgiabuu/pi-pretty` | `UNVERIFIED:` third-party npm packages; none is checked out in the references | — | — |
| Gentle Desktop | `Gentleman-Programming/gentle-shell-desktop` | Package `author`: "Gentleman-Programming". LICENSE: "Copyright (c) 2026 Gentleman Programming". No maintainer is named in repository files; see [08-team.md](08-team.md). | `gentle-shell-desktop@5ab4a00:README.md:35`; `gentle-shell-desktop@5ab4a00:package.json:8`; `gentle-shell-desktop@5ab4a00:LICENSE:3` |

## Versions and compatibility

| Relationship | Constraint | Enforced? | Evidence |
|---|---|---|---|
| Desktop → pi library | `^0.85.1`, locked to `0.85.1` | Lockfile only | `gentle-shell-desktop@5ab4a00:package.json:42`; `gentle-shell-desktop@5ab4a00:pnpm-lock.yaml:323` |
| Desktop → gentle-pi | "gentle-pi 3.7.0 or newer" (also needed for the Helpers tab) | No. Documented and shown in an error message only. | `gentle-shell-desktop@5ab4a00:README.md:12`, `:89-91`; `D:main/adapters/launcherLocator.ts:26-28` |
| gentle-pi → pi | Peer `>=0.99.1`; development pin `0.99.1` | **Yes.** The launcher exits if pi is older than `MIN_PI_VERSION = "0.99.1"`. | `GS:package.json:78`, `:95`; `GS:lib/gentle-shell-launcher.ts:382` |
| gentle-pi → gentle-ai | Pins `INSTALLER_VERSION = "3.7.0"`; tag `v3.7.0` resolves to commit `6dee8f8` | Partly. Installed at postinstall. Darwin/Linux release archives are checked against pinned SHA-256 digests; the Windows Go source build is also checked for the exact version (`GENTLE_AI_VERSION_MISMATCH`). `GENTLE_PI_SKIP_GENTLE_AI_INSTALL=1` skips the install. | `GS:package.json:46`; `GS:scripts/gentle-ai-installer.mjs:39`, `:48-50`, `:57`, `:70-73`, `:111-115`, `:392-396`; `GS:scripts/install-gentle-ai.mjs:11-12` |
| gentle-pi setup → gentle-ai | Pin must be 3.6.0 or newer | Yes. Setup refuses otherwise. | `GS:lib/gentle-shell-launcher.ts:418`; `GS:bin/gentle-shell.mjs:811` |
| gentle-ai v3.7.0 → companions | Sources have no version (`npm:pi-web-access`); engram init uses `gentle-engram@latest`; `ProvisionEngramMCP` writes `pi-mcp-adapter: ^2.6.0` into `<agentDir>/npm/package.json`. The constant `piMCPAdapterVersion = "2.6.0"` is declared but referenced nowhere else. | Only the `^2.6.0` range, as an npm manifest dependency | `GA:internal/agents/pi/adapter.go:25-26`, `:57-63`, `:276`, `:400-412`; `GA:internal/components/engram/inject.go:307` |
| Node.js | `>=22.19.0` for gentle-pi; "Node.js 22.19 or newer" for the desktop | Not by gentle-pi code. Declared in gentle-pi's `engines`, which npm reports as a warning by default rather than enforcing (general npm behavior, not a repository fact). No Node version check was found in the launcher (`bin/`, `lib/`). | `GS:package.json:101-103`; `gentle-shell-desktop@5ab4a00:README.md:11` |
| Handshake between desktop and runtime | None. The only versioned payload is `gentle-agents.activity/v1`. | — | [04 §Versioning](04-rpc-contract.md#versioning-and-compatibility) |

The consequence that matters to the desktop: the chat list runs on pi 0.85.1 while the chat itself runs on pi ≥ 0.99.1 ([audit A2](03-architecture/audit.md#a2-pi-version-skew-between-the-two-paths)). The RPC differences between those two versions are in [04](04-rpc-contract.md#differences-between-pi-0851-and-0991-commands).

## What the desktop consumes from each piece

| Piece | What the desktop uses | How | Evidence |
|---|---|---|---|
| gentle-shell launcher | Launch, home selection, pi resolution and version gate, first-run provisioning | Spawns `gentle-shell [--link\|--isolated\|--home <dir>] --mode rpc [--session <path>]` with `GENTLE_SHELL_INTERACTIVE_HOST=1` | [04 §Process chain](04-rpc-contract.md#process-chain); `D:main/domain/session/PiSession.ts:127-134` |
| pi, over RPC | 3 commands (`prompt`, `abort`, `get_messages`), dialog answers, 13 stdout record types | JSON lines on stdin/stdout | [04 §At a glance](04-rpc-contract.md#at-a-glance) |
| pi, in-process (0.85.1) | `SessionManager.listAll()` for the sidebar | Dynamic import, with `PI_CODING_AGENT_DIR` set temporarily | `D:main/adapters/piSessionStore.ts:30-39`; [audit A1](03-architecture/audit.md#a1-two-data-paths-to-pi-and-a-global-pi_coding_agent_dir-mutation) |
| gentle-pi extensions | `ask_user_question` / `ask_user_choice` dialogs, helper activity (`gentle-agents.activity/v1`), `/gentle:*` commands typed as text | `extension_ui_request` and `prompt` | [04 §gentle-shell additions](04-rpc-contract.md#gentle-shell-additions-over-rpc) |
| gentle-pi theme | A copy of the Gentleman-Cute tokens | Hardcoded in the renderer | `D:renderer/shared/theme/theme.ts:1-8`; [ADR 0009](03-architecture/adr/0009-hardcoded-gentleman-cute-theme.md) |
| Agent home on disk | Whether `~/.pi/agent` (or `PI_CODING_AGENT_DIR`) exists, and whether `auth.json` and `models.json` exist | File checks at first run | `D:main/domain/home/home.ts:84-87` |
| gentle-ai | Nothing directly. It runs inside gentle-shell commands and launcher provisioning. | — | [05 GA1–GA5](05-capability-inventory.md#gentle-ai-outside-the-session) |
| Companion packages | Nothing directly. `Inference:` their model tools reach the desktop only as `tool_execution_*` events, which it does not render ([05 C17](05-capability-inventory.md#conversation-and-input)). | — | Search Q33 finds no Engram handling ([05](05-capability-inventory.md#desktop-searches-gentle-shell-part)) |

## Where each change belongs

`Inference:` this table is derived from the layer analysis in [04](04-rpc-contract.md#gaps-the-desktop-needs) (closing paragraph of §Gaps, itself labelled `Inference` there) and from each repository's contribution rules in [04 §How to propose contract changes upstream](04-rpc-contract.md#how-to-propose-contract-changes-upstream).

| If the change… | It belongs in | Why | Evidence | Examples |
|---|---|---|---|---|
| Adds or changes an RPC command, event or response shape | **pi** (`earendil-works/pi`), through a Contribution Proposal issue; PRs need prior maintainer approval | pi owns the `RpcCommand` union; gentle-shell adds no command or event type | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:20-74`; `pi@d86654a:CONTRIBUTING.md:31-34`, `:58` | G3 sign-in, G4 default model, G5 packages, G10 version handshake |
| Publishes new data from a gentle-shell feature | **gentle-shell**, as a `setWidget` `string[]` payload with a documented schema, like the activity schema | Needs no pi change | `GS:docs/gentle-agents-activity.md:13`; [04 §Gaps](04-rpc-contract.md#gaps-the-desktop-needs) | G2 ODD state, G6 profile, G7 status-bar fields, G8 helper result |
| Lets the host act on a gentle-shell feature | **gentle-shell**, plus an inbound channel. Today the only inbound channels to an extension are `prompt` and dialog responses. `Inference:` a new command type would also need pi. | No host command reaches extensions | [04 §Gaps](04-rpc-contract.md#gaps-the-desktop-needs) | G1 stop a helper |
| Makes a gentle-shell command work under RPC | **gentle-shell** | The command uses `ctx.ui.custom()` or a TUI-only gate | [05 P1, P3, Y4, R3](05-capability-inventory.md#profiles-models-and-persona) | `/gentle:profiles`, `/gentle:models`, YOLO |
| Changes launcher behavior (setup progress, home semantics, version output) | **gentle-shell** launcher | The launcher owns homes, setup and the pi gate | [05 L5, L12](05-capability-inventory.md#launcher-and-homes) | Machine-readable setup progress |
| Changes which companion packages a home gets | **gentle-ai** managed pi stack, then a gentle-pi pin bump | gentle-shell does not keep its own list | `GS:docs/readme-reference.md:302` | Retiring a plugin |
| Renders or acts on data already on the wire, or changes desktop process, IPC or packaging | **Gentle Desktop** | No upstream dependency | [05](05-capability-inventory.md) rows with upstream "none"; [audit](03-architecture/audit.md) | `notify` toasts (C20), tool cards (C17), steering (C4), multi-chat (A3), Windows spawn (A4) |

## Community projects outside scope

[gentle-mesh](01-glossary.md#community-terms-outside-scope) (an agent-to-agent protocol proposal) and Herdr-related tools come up in the community thread. They are not part of the pinned ecosystem, and this page does not map them.

## Open questions

- `UNVERIFIED:` the repositories and owners of `gentle-engram`, `pi-mcp-adapter`, `pi-web-access`, `pi-btw` and `@heyhuynhgiabuu/pi-pretty`.
- `UNVERIFIED:` whether `gentle-ai install --agent pi` writes files beyond the package list, persona, state, `settings.json`, `npm/package.json` and `mcp.json` (see [Companion packages](#companion-packages)).
