# Team and governance

> Status: draft (community proposal, awaiting group and maintainer review).

> **Community draft.** This page proposes how a community working group could split the work on Gentle Desktop and how decisions get made. Nothing here is decided until the group and the maintainer agree. No person is assigned to any area: every owner is `TBD`, and people self-nominate later.

**In one paragraph.** The maintainer asked the community to present a roadmap, divide the tasks and present PRs **[maintainer]** (Discord, Alan Buscaglia, 2026-09-27). A community member proposed a working group with areas of competence, each with an owner, plus a roadmap and an MVP, presented to the maintainers as a group **[community proposal]** (Discord, Matrak, 2026-09-27). This page fills in those areas from the corpus evidence: seven areas plus three cross-cutting concerns, with scope tied to audit findings, RPC gaps, ADRs, inventory rows and screens.

## How to read this page

| Tag | Source | Weight |
|---|---|---|
| **[maintainer]** | Alan Buscaglia's Discord messages and the maintainer-authored desktop repo documents (`README.md`, `odd/tasks/desktop-m1-*.md`, `odd/tasks/desktop-m2-*.md`) | Stated intent or recorded practice. |
| **[upstream]** | The upstream repositories' own files (pi, gentle-shell) | Rules the desktop group does not control. |
| **[community proposal]** | This page, other corpus pages, and Discord messages from members other than the maintainer | Proposed. Not decided. |

`Inference:` marks reasoning, not stated fact. `UNVERIFIED:` marks a claim that was checked but not confirmed.

**Citation keys.** `gentle-shell-desktop@5ab4a00:` is the desktop repo `main`. Paths such as `03-architecture/audit.md` are corpus pages in `docs/`. Discord dates are converted from the thread's `d/m/yy` format (saved copy of the thread "Gentle Desktop", not in the repository). IDs from other pages carry their page (`audit A3`, `gap G9`, `inventory C20`, `vision Q1`, `UX U9`, `design D1`, `SCR-01`); a qualifier covers the IDs after it (`audit A3, A11`). Unqualified M1 and M2 are the maintainer's milestones, not inventory rows; D1–D12 are this page's governance rules.

**IDs.** Corpus IDs collide across pages, so this page always qualifies them: `audit A3` ([audit](03-architecture/audit.md#summary)), `gap G1` ([RPC contract](04-rpc-contract.md#gaps-the-desktop-needs)), `inventory C17` ([capability inventory](05-capability-inventory.md)), `UX U11` ([UX principles](06-ux/principles.md)), `design D5` ([design-system differences](06-ux/design-system.md#differences)), `ADR 0005` ([ADR index](03-architecture/adr/README.md#index)), `SCR-03` ([screens](06-ux/screens.md#at-a-glance)), `vision Q2` ([vision](00-vision.md#open-questions-for-the-maintainer)).

**Repository files name no maintainer for the desktop** ([02-ecosystem §Ownership](02-ecosystem.md#ownership)). This page uses "maintainer" for Alan Buscaglia, as the Discord thread labels him and as the M1 and M2 documents refer to "Maintainer instructions" and "Maintainer decisions" (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:29`, `:75`).

## At a glance

| Area | Leads on | Owner | Headcount **[community proposal]** |
|---|---|---|---|
| [Core and RPC contract](#core-and-rpc-contract) | Main process, session host, protocol parsing, IPC | `TBD` | 2–3 |
| [Upstream integration](#upstream-integration-pi--gentle-shell--gentle-ai) | Changes the desktop needs in pi, gentle-shell or gentle-ai | `TBD` | 2–3 |
| [Frontend](#frontend) | Renderer: screens and components | `TBD` | 2–4 |
| [UX and design](#ux-and-design) | Principles, screen specs, design tokens | `TBD` | 1–2 |
| [QA and end-to-end testing](#qa-and-end-to-end-testing) | Fixtures, contract tests, smoke, real-runtime checks | `TBD` | 1–2 |
| [Platform and distribution](#platform-and-distribution) | Windows/Linux/macOS, packaging, CI infrastructure | `TBD` | 1–2 |
| [Docs and community](#docs-and-community) | This corpus, roadmap upkeep, contributor docs, channels | `TBD` | 1–2 |
| [Cross-cutting concerns](#cross-cutting-concerns) | Accessibility, performance, security | `TBD` steward each | 0 dedicated |

Headcount ranges are a proposal. Each one is derived from the amount of evidence in scope (counts below), not from who is available. `Inference:` a person may cover more than one area while the group is small.

## Areas of responsibility

The seven areas come from this page's skeleton. Matrak's message named "UX, accesibilidad, performance, diseño" as examples of areas (Discord, Matrak, 2026-09-27). This draft merges UX and design into one area, because the corpus covers both in one folder ([06-ux](06-ux/)). It treats accessibility and performance as [cross-cutting concerns](#cross-cutting-concerns) rather than areas, because each touches every area and the audit did not cover either (`03-architecture/audit.md:18`), so there is no evidence yet to size a separate area.

### How inventory rows are allocated

**[community proposal]** The [capability inventory](05-capability-inventory.md#coverage-summary) has 158 rows (81 pi core, 77 gentle-shell and gentle-ai; recounted after the 2026-10-03 refresh, which added inventory V19 and Y6). Its "Exposed over RPC" column decides who leads a row:

| "Exposed over RPC" | Rows | Lead | Partner |
|---|---|---|---|
| yes | 43 | Core (wire the data) | Frontend (surface) |
| partial | 38 | Core | Upstream integration (missing part), Frontend |
| no | 47 | Upstream integration | Core, Frontend once the upstream change lands |
| host-side | 9 | Frontend | Core |
| spawn | 13 | Core (spawn arguments) | Platform |
| n/a | 8 | none for seven terminal-mechanics rows (inventory C16, U1, U3, U6, L10, L11, Y3; [screens §Rows with no screen](06-ux/screens.md#rows-with-no-screen)); inventory U7 folds into SCR-09, so Frontend surfaces it | — |

Counts are the totals of the [coverage summary](05-capability-inventory.md#coverage-summary). Separately, 56 of the 158 rows have an "Upstream dependency" cell that does not start with "none". Counting rule for this page: split each row on unescaped `|`, take the sixth cell, test whether it starts with "none". Five rows whose cell starts with "none" also name a gap: inventory V1 ("none (queue); G2 (phase)") depends on gap G2 for part of the row, and inventory S7, K3, K4 ("none (G7)", "none (see G7)") and L3 ("none (G10)") point at a gap. Counting inventory V1 as well gives 57; counting every cell that names a gap gives 61. Recount when the inventory changes.

### Core and RPC contract

**Scope**
- **Main process and session host.** The hexagonal main process and typed preload bridge: ADR [0002](03-architecture/adr/0002-process-roles-and-typed-preload-bridge.md), [0003](03-architecture/adr/0003-hexagonal-main-process.md), [0005](03-architecture/adr/0005-gentle-shell-rpc-child-process.md), [0006](03-architecture/adr/0006-in-process-session-list.md), [0011](03-architecture/adr/0011-helpers-scoped-per-chat.md), [0012](03-architecture/adr/0012-interactive-host-env-flag.md).
- **Multi-chat.** Audit A3 (High), A11, A1, in the order the audit recommends ([audit §Recommendations](03-architecture/audit.md#1-unblock-multi-chat)); gap G9 is desktop work, not an upstream change ([04 §Gaps](04-rpc-contract.md#gaps-the-desktop-needs)).
- **Correctness of the protocol layer.** Audit A2, A5 (with Upstream integration), A6, A7, A8, A10, A12, A13 (with Frontend), A19 (with Upstream integration).
- **IPC hardening.** Audit A14 (see [security](#cross-cutting-concerns)).
- **Structure rules in `src/main`.** The main-process part of audit A17 (`home.ts` imports, stale placeholder).
- **Inventory.** Rows exposed over RPC as yes, partial or spawn ([allocation table](#how-inventory-rows-are-allocated)). They spread across 14 of the 17 inventory groups; the largest are Conversation and input (16), Shell experience (14), Sessions (13), Integrations, skills, memory and diagnostics (10) and Helpers (8) (yes + partial + spawn per group in the [coverage summary](05-capability-inventory.md#coverage-summary)).
- **Undecided architecture.** Prepares the evidence for four of the six candidates in [ADR "Undecided / not recorded"](03-architecture/adr/README.md#undecided--not-recorded): one child per chat vs a shared host, RPC-only vs mixed, prompt while working, version compatibility policy (vision Q3–Q6). The maintainer decides them ([governance](#how-decisions-are-made)).

**Out of scope**
- Rendering and visual design: Frontend and UX.
- Any change to pi's `RpcCommand` union or to gentle-shell: Upstream integration.
- Packaging and OS-specific spawning (audit A4): Platform.

**Owner:** `TBD`.

**Headcount: 2–3** **[community proposal]**. Rationale: 14 audit findings are in this scope (audit A1, A2, A3, A5, A6, A7, A8, A10, A11, A12, A13, A14, A17 in part, A19; counting rule: every finding named in the scope above, shared and partial ones included, as in the other areas), including the only High finding that blocks several surfaces (audit A3 is a main blocker of SCR-01 and SCR-06 in [screens §At a glance](06-ux/screens.md#at-a-glance); [audit §Risks](03-architecture/audit.md#risks-for-scaling-the-ui) ties it to several chats at once and the ODD panel), plus 94 inventory rows marked yes, partial or spawn. `Inference:` the multi-chat sequence is serial (audit A3, then A11, then A1), so more than three people would wait on each other.

**Interfaces**
- Frontend: the preload bridge types (`src/shared/bridge-types.ts`, ADR 0002) are the contract between the two.
- Upstream integration: version handshake (gap G10, audit A8), real helper statuses (audit A5).
- QA: fixtures and contract tests for the parser.

**Skills:** Electron main process and IPC; strict TypeScript; Node child processes and line-delimited JSON; hexagonal architecture; vitest in the Node environment (`gentle-shell-desktop@5ab4a00:package.json:15`, `:39`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:26-27`); reading pi's RPC types (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-types.ts`, pi 1.0.0).

### Upstream integration (pi / gentle-shell / gentle-ai)

gentle-pi and gentle-shell are one package (`gentle-shell@ac67159:package.json`, gentle-shell `main`, package version 4.0.0; [02-ecosystem](02-ecosystem.md)), so this area is titled by repository: pi, gentle-shell (package `gentle-pi`) and gentle-ai.

**Scope**
- **RPC gaps that need an upstream change.** Gaps G1–G8 and G10. `Inference` (from [02 §Where each change belongs](02-ecosystem.md#where-each-change-belongs), itself labelled `Inference`): gaps G3, G4, G5 and G10 belong in pi; gaps G2, G6, G7 and G8 in gentle-shell; gap G1 in gentle-shell plus an inbound channel that may also need pi.
- **gentle-shell commands that fail under RPC.** Inventory P1, P3, Y4, R3 ([02 §Where each change belongs](02-ecosystem.md#where-each-change-belongs)).
- **Launcher behavior.** Machine-readable setup progress for audit A9 (inventory L5), home semantics for audit A19.
- **gentle-ai outside the session.** Inventory GA1–GA5 ([05](05-capability-inventory.md#gentle-ai-outside-the-session)).
- **Inventory.** The 47 rows marked "no" over RPC ([allocation table](#how-inventory-rows-are-allocated)).
- **Pending prerequisites.** "Real data requires gentle-pi with `rpc-interactive-host` (gentle-shell #1328, #1329, P3 pending)" **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:59`). "P3" there is a gentle-pi work item the M2 document does not define further (`:69` names "the P3 branch"); it is not inventory P3.
- **Following each repository's process.** pi needs prior maintainer approval before a PR, through a Contribution Proposal issue **[upstream]** (`pi@a13d35a:CONTRIBUTING.md:31-34`, `:58`; [04 §How to propose contract changes upstream](04-rpc-contract.md#how-to-propose-contract-changes-upstream)). gentle-shell has no `CONTRIBUTING.md` at `ac67159` and uses a feature-request form ([04](04-rpc-contract.md#gentle-shell-gentleman-programminggentle-shell-package-gentle-pi-owns-the-extension-level-additions)).

**Out of scope**
- Consuming a new upstream capability in the desktop: Core and Frontend.
- Community projects outside the pinned ecosystem, such as gentle-mesh ([02 §Community projects outside scope](02-ecosystem.md#community-projects-outside-scope)).
- Deciding upstream design. The upstream maintainers do.

**Owner:** `TBD`.

**Headcount: 2–3** **[community proposal]**. Rationale: 9 upstream gaps across two repositories with different contribution rules, 47 inventory rows marked "no", and one Go codebase (gentle-ai) next to two TypeScript ones. `Inference:` throughput is gated by upstream review (pi auto-closes PRs from new contributors by default, `pi@a13d35a:CONTRIBUTING.md:23`), so extra people would not speed this area up.

**Interfaces**
- Core: agrees each new command, event or payload shape before it is proposed upstream.
- Docs and community: links upstream issues from the roadmap.
- QA: contract tests against published upstream schemas (for example `gentle-agents.activity/v1`, [04 §Versioning](04-rpc-contract.md#versioning-and-compatibility)).

**Skills:** TypeScript in pi (`packages/coding-agent`) and in gentle-shell extensions; Go for gentle-ai (the inventory cites Go sources under its `GAI:` key, `gentle-ai@ff77164:internal/...`, gentle-ai v4.0.0, [05 §Method (gentle-shell part)](05-capability-inventory.md#method-gentle-shell-part); [02 §Versions](02-ecosystem.md#versions-and-compatibility)); pi's RPC mode and extension UI; writing short, well-evidenced upstream issues.

### Frontend

**Scope**
- **Screens.** Implementing [SCR-01 to SCR-19](06-ux/screens.md#at-a-glance). Three exist partly (SCR-01, SCR-02, SCR-03) and SCR-09 exists partly; the other 15 do not exist.
- **Renderer architecture.** ADR [0004](03-architecture/adr/0004-renderer-scope-rule-and-screaming-architecture.md) (Scope Rule, Screaming Architecture, container/presentational, atomic `shared/ui`), [0007](03-architecture/adr/0007-text-only-chat-view.md), [0010](03-architecture/adr/0010-standalone-renderer-with-mock-bridge.md).
- **Audit findings.** Audit A15 (silent mock-bridge fallback; with Platform), the renderer part of audit A17 (`shared/markdown` with one consumer, dangling note reference), audit A13 (with Core).
- **Inventory.** Host-side rows (9), and the surface half of every row Core wires. Examples named in [02](02-ecosystem.md#where-each-change-belongs): `notify` toasts (inventory C20), tool cards (inventory C17), steering (inventory C4).
- **Theme implementation.** ADR [0009](03-architecture/adr/0009-hardcoded-gentleman-cute-theme.md) and the token fixes in design D1–D12, once UX decides them.

**Out of scope**
- What a screen should show and how it reads: UX and design.
- Protocol parsing and session state: Core.

**Owner:** `TBD`.

**Headcount: 2–4** **[community proposal]**. Rationale: 19 screens, 15 of them not started; the mockup screens (SCR-01 to SCR-09) and the inventory-derived ones (SCR-10 to SCR-19) can proceed in parallel once their blockers clear. `Inference:` most new screens are blocked by gaps (for example SCR-04 by gap G2, SCR-07 by gaps G3 and G4), so the upper end only pays off once Upstream integration delivers.

**Interfaces**
- Core: the bridge contract.
- UX: screen specs and tokens.
- QA: component tests and browser verification evidence.

**Skills:** React 19 (`gentle-shell-desktop@5ab4a00:package.json:45-46`) with the maintainer's `react-19` rules (named imports, no manual memoization, ref as prop) **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:29`); strict TypeScript; Vite and `electron-vite`; vitest with jsdom and Testing Library (`gentle-shell-desktop@5ab4a00:package.json:26-27`, `:35`); CSS custom properties.

### UX and design

**Scope**
- **Principles.** UX [U1–U12](06-ux/principles.md#at-a-glance); UX U9, U10, U11 and U12 are tagged community.
- **Screen specs and information architecture.** [Screens](06-ux/screens.md) and its [open questions](06-ux/screens.md#open-questions) (which derived screens are in scope, the work progress panel, one or several settings screens).
- **Design system.** Token and component differences design D1–D12 ([design system](06-ux/design-system.md#differences)) and theme switching ([§Themes](06-ux/design-system.md#themes)).
- **Product framing questions** to bring to the maintainer: vision Q1 (accessible vs full-featured) and vision Q8 (profiles).
- **UX framing of community proposals** [0001](07-proposals/0001-agent-flow-graph.md)–[0003](07-proposals/0003-post-hoc-audit-by-questions.md), until the maintainer accepts or declines them.

**Out of scope**
- Implementation: Frontend.
- Treating mockup example data as requirements. The mockup is intent, not spec ([vision §How to read](00-vision.md#how-to-read-this-page)).

**Owner:** `TBD`.

**Headcount: 1–2** **[community proposal]**. Rationale: 12 principles and 12 design differences already documented; the open work is 19 screen specs and three screen-level open questions. `Inference:` one or two people keep the product voice consistent (vision P2, UX U1).

**Interfaces**
- Frontend: specs and tokens.
- Accessibility steward: UX U10 and U11.
- Maintainer: validates principles and product framing.

**Skills:** interaction and visual design; reading the concept mockup (`gs-mockup.html`) as intent; design tokens; accessibility basics (UX U11); familiarity with gentle-shell's TUI, so parity is judged from the real product.

### QA and end-to-end testing

**Scope**
- **Audit A16.** No CI, fixtures not taken from real output, no tests for the composition root, the Windows launcher paths and `HelpersSummary`, and no automated run against a real gentle-shell ([audit A16](03-architecture/audit.md#a16-test-coverage-and-ci-gaps)).
- **Real fixtures and contract tests.** Record fixtures from a real gentle-shell run; add a contract test against the published activity example (audit A16 recommendation; ties to audit A5).
- **Reproductions.** Reproduce audit A4 on Windows before any fix (audit recommendation [§3 Platform](03-architecture/audit.md#3-platform)); desktop issue #23 reports the failure with reproduction steps, but the corpus authors have not reproduced it (audit A4).
- **Smoke and browser checks.** `pnpm smoke:electron` launches the packaged main entry through Playwright (`gentle-shell-desktop@5ab4a00:README.md:107`); browser verification of UI work with screenshots as evidence **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:29`).

**Out of scope**
- Writing each feature's unit tests. Under strict TDD every writer does that ([contribution flow](#contribution-flow)).
- CI runners and build matrix: Platform.

**Owner:** `TBD`.

**Headcount: 1–2** **[community proposal]**. Rationale: one Medium audit finding (audit A16) with several parts, plus real-runtime fixtures and the Windows reproduction. The existing suite is already large (286 tests at M2 close, `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:59`), so the gap is coverage of real behavior, not volume.

**Interfaces**
- Platform: CI jobs run QA's suites.
- Upstream integration: schemas and real outputs to record.
- Core and Frontend: test seams.

**Skills:** vitest (`gentle-shell-desktop@5ab4a00:package.json:39`); Playwright (`:36`); Electron testing; running gentle-shell locally with an isolated home (`gentle-shell-desktop@5ab4a00:README.md:29`); Windows and Linux test environments.

### Platform and distribution

**Scope**
- **Audit findings and platform risks.** Audit A4 (High: Windows `.cmd` spawn), audit A9 (first-run provisioning progress; with Upstream integration), audit A18 (launcher discovery and platform coverage), audit A15 (mock bridge in packaged builds; with Frontend); the support matrix, WSL topologies and risks PLAT-01 to PLAT-11 in [10-platforms.md](10-platforms.md#risks). Two open upstream PRs are external contributions in this scope, not merged as of 2026-10-03: #26 (Windows spawner, audit A4; it leaves paths unquoted, PLAT-02) and #27 (cross-platform `dev:local-pi`, audit A18). Reviewing them belongs here; contributing a PR does not make anyone the area's owner.
- **CI infrastructure.** The workflow audit A16 recommends, with a Windows job once audit A4 lands ([audit §3 Platform](03-architecture/audit.md#3-platform)).
- **Packaging.** `electron-builder` targets for macOS, Windows and Linux (`gentle-shell-desktop@5ab4a00:package.json:18-21`). Only macOS (Apple silicon) is tested, and there are no signed builds (`gentle-shell-desktop@5ab4a00:README.md:7`).
- **Runtime shipping.** Prepares evidence for the undecided "bundled vs external runtime" question (vision Q2, [ADR not recorded](03-architecture/adr/README.md#undecided--not-recorded)). The maintainer decides it.

**Out of scope**
- Launcher behavior inside gentle-shell: Upstream integration.
- Test content: QA.

**Owner:** `TBD`.

**Headcount: 1–2** **[community proposal]**. Rationale: four audit findings (one High), 11 platform risks (PLAT-01 to PLAT-11; three rated High, two of those only for one audience or topology), three OS targets with one tested, and no CI. `Inference:` access to Windows and Linux machines matters more than headcount.

**Interfaces**
- QA: CI jobs.
- Core: spawn arguments and launcher discovery (inventory rows marked "spawn").
- Upstream integration: launcher provisioning output (audit A9).

**Skills:** `electron-builder` and `electron-vite` (`gentle-shell-desktop@5ab4a00:package.json:33-34`); Node `child_process` on Windows; macOS `PATH` and app signing; CI configuration (no workflow exists yet, so no CI provider is chosen; audit A16).

### Docs and community

**Scope**
- **This corpus.** `docs/00` to `docs/10`, the ADR index and the proposals index. Keeping the inventory current ([05 §How to keep this current](05-capability-inventory.md#how-to-keep-this-current)).
- **Roadmap upkeep.** [09-roadmap](09-roadmap.md) is derived from the other pages (context brief §1). Presenting it is step 1 of the maintainer's process **[maintainer]** (Discord, Alan Buscaglia, 2026-09-27).
- **Contributor infrastructure.** There is no `CONTRIBUTING` file on `main` (context brief §5). The issue forms still name gentle-pi (`gentle-shell-desktop@5ab4a00:.github/ISSUE_TEMPLATE/bug_report.yml:2`, `feature_request.yml:2`).
- **Channels.** Keeping the [communication channels](#communication-channels) current, including the Discussions request.
- **The proposals log.** The [index and the "mentioned, not proposed" list](07-proposals/README.md#mentioned-in-the-community-not-proposed).

**Out of scope**
- Deciding what goes in the vision, the roadmap or a proposal's status: the maintainer ([governance](#how-decisions-are-made)).
- Code documentation that belongs with the change (`src/README.md`, README dev section): the writer of that change.

**Owner:** `TBD`.

**Headcount: 1–2** **[community proposal]**. Rationale: nine top-level Markdown files (eight numbered pages and the index `README.md`) and three folders (`03-architecture`, `06-ux`, `07-proposals`) holding five more pages, 12 ADRs, three proposals and two indexes already exist; the open work is upkeep, contributor docs and two stale issue forms.

**Interfaces:** every area (each page has a home area: 03 and 04 with Core, 05 with Core and Upstream integration, 06 with UX, 10 with Platform and distribution). Maintainer: validation of the vision and the roadmap.

**Skills:** technical writing in English, neutral register **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:28`); citation discipline (context brief §6); Markdown and Mermaid; GitHub issue forms.

### Cross-cutting concerns

**[community proposal]** Each concern has a steward (`TBD`) who checks every area's work against it. A steward is not a separate team.

| Concern | Evidence today | Steward checks | Main areas |
|---|---|---|---|
| **Accessibility** | Named as an area by Matrak (Discord, 2026-09-27). Proposed rule UX [U11](06-ux/principles.md#u11-accessible-by-default) and keyboard parity UX [U10](06-ux/principles.md#u10-keyboard-parity-with-the-cli), both **[community]**. Not covered by the audit (`03-architecture/audit.md:18`). | Keyboard reach, focus, live regions, reduced motion (UX U11 rule). | UX, Frontend, QA |
| **Performance** | Named as an area by Matrak (Discord, 2026-09-27). Rendering performance and packaged-app size are not covered by the audit (`03-architecture/audit.md:18`). No measurement exists in the corpus. | `Inference:` a baseline first (startup, long chats, many helpers), since nothing is measured yet. | Core, Frontend, Platform |
| **Security** | Audit A14 (IPC validation, sandbox, CSP without `'unsafe-eval'`, `will-navigate` guard) and audit A15 (mock bridge in packaged builds). | IPC surface and packaged-build behavior. | Core, Platform, Frontend |

## Interest expressed in the thread

**Not assignments.** What each person said, quoted from the Discord thread. Owners stay `TBD` until people self-nominate.

| Who | Date | What they said |
|---|---|---|
| memoTux | 2026-09-26, 2026-09-29, 2026-09-30 | "Presente."; proposed the process in [§How decisions are made](#how-decisions-are-made); shared a roadmap extracted from the repo; said he would develop a roadmap proposal. |
| SteLMV | 2026-09-26 | "Me sumo de igual forma en ambos casos" (I join either way). |
| basb7 | 2026-09-26 | Had sent the maintainer an alpha demo built with Tauri + Rust; "interesado en seguir con el desarrollo de gentle desktop"; "el lunes me pongo al día para empezar a aportar" (on Monday I will catch up to start contributing). |
| MAYLOVE | 2026-09-26 | Tested on Windows and reported `spawn EINVAL` (audit A4); "carga sesiones bien" (it loads sessions fine). |
| eSagraDEV | 2026-09-26, 2026-09-27 | "luego me pongo a testear y a ver que podemos mejorarle" (I will test it and see what we can improve); "como hacemos pa contribuir" (how do we contribute). |
| Mauroo | 2026-09-27 | "Yo me sumo !" (I'm in). |
| vudumstead | 2026-09-27 | "voy apoyar" (I will support). |
| Erick | 2026-09-27 | "me hare el tiempo ... para poder dar mi aporte" (I will make time to contribute). |
| Matrak | 2026-09-26, 2026-09-27, 2026-09-30 | Proposed to "armar un grupo de trabajo y postularnos como grupo a Alan" (form a working group and apply to Alan as a group) (09-26); proposed areas of competence with owners (09-27); offered to review memoTux's roadmap and give feedback (09-30). |
| gc | 2026-09-29 | Said he is developing a desktop version (Electron interface, pi/gentle-shell underneath). He did not state an offer to contribute; memoTux invited him to on 2026-09-30 ("Si lo que tu ya tienes puedes aportarlo para la comunidad, bienvenido es"). |

## How decisions are made

| # | Rule | Tag | Source |
|---|---|---|---|
| D1 | The process is: present a roadmap, which goes into the repo; divide tasks; present PRs. | **[maintainer]** | Discord, Alan Buscaglia, 2026-09-27: "1- juntensen presenten un roadmap y lo metemos en el repo 2- dividan tareas 3- presenten prs" |
| D2 | The roadmap is a list of milestones; implementation is discussed within the group. | **[community proposal]** (advice from Gentleman Staff) | Discord, dnlrsls, 2026-09-26 |
| D3 | The group analyzes what the maintainer shared, proposes a roadmap (following dnlrsls's suggestion), merges the proposals into a common one, and then members commit to a specific task. | **[community proposal]** | Discord, memoTux, 2026-09-26 |
| D4 | The group meets live, defines areas of competence with an owner, a roadmap and an MVP, and presents itself to the maintainers as a group. The project stays aligned with the maintainer's philosophy. | **[community proposal]** | Discord, Matrak, 2026-09-27 |
| D5 | The maintainer's own M1 chain was merged into its tracker and then into `main` on his instruction. How community PRs are reviewed and merged is not stated in any source ([open questions](#open-questions)). | **[maintainer]** (recorded practice, his own chain) | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:71` ("Maintainer instruction: #4 to #9 merged into the tracker"; tracker #3 merged into `main` "(maintainer instruction)"), `:75` |
| D6 | The maintainer validates the [vision](00-vision.md) line by line; until then it is a draft. | **[community proposal]** | `00-vision.md:3-5` |
| D7 | Ideas beyond parity are written as proposals; only the maintainer moves a proposal to `accepted` or `declined`. | **[community proposal]** | [07-proposals §Process](07-proposals/README.md#process); vision P10 |
| D8 | Architecture questions the repo leaves open get an ADR only after a maintainer decision. | **[community proposal]** | [ADR "Undecided / not recorded"](03-architecture/adr/README.md#undecided--not-recorded) |
| D9 | A change that belongs upstream goes to that repository through its own process: RPC protocol changes to pi, extension-level data and RPC fixes to gentle-shell, the managed companion stack to gentle-ai. | **[community proposal]**; the routing is `Inference:` as in its source | [02 §Where each change belongs](02-ecosystem.md#where-each-change-belongs) |
| D10 | pi PRs need prior maintainer approval (`lgtm`). Separately, under "Where can I learn about plans?", the file says Earendil uses RFCs to discuss larger changes; that describes upstream practice, not a contributor rule. | **[upstream]** | `pi@a13d35a:CONTRIBUTING.md:31-34`, `:58`; `:99-102` |
| D11 | Each area owner decides within the area's scope; anything that changes the vision, a screen's purpose, an ADR or another area's interface goes to the group, then to the maintainer. | **[community proposal]** | This page |
| D12 | Owners self-nominate; the group confirms; the maintainer can veto. | **[community proposal]** | This page; owners are `TBD` |

## Role of the maintainer

| Responsibility | Tag | Source |
|---|---|---|
| Sets the product intent through the repo and the concept mockup; pointed to the mockup when asked for his ideas, goals and limits. | **[maintainer]** | Discord, Alan Buscaglia, 2026-09-26; [vision](00-vision.md#how-to-read-this-page) |
| Puts the roadmap in the repo once the group presents it. | **[maintainer]** | Discord, Alan Buscaglia, 2026-09-27 |
| Had his own M1 chain merged into the tracker and then `main` on his instruction. Review and merge of community PRs is an [open question](#open-questions). | **[maintainer]** (recorded practice, his own chain) | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:71`, `:75` |
| Gave instructions on verification and code structure for M1 (browser checks, React and structure rules). | **[maintainer]** | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:29` |
| Validates the vision, answers vision Q1–Q13, decides open ADR candidates, accepts or declines proposals. | **[community proposal]** | `00-vision.md:3-5`; [07-proposals §Process](07-proposals/README.md#process) |
| gentle-shell "is built by Alan Buscaglia"; gentle-ai is "Built by Alan Buscaglia (Gentleman Programming)" and lists him under "Maintainer" in CONTRIBUTORS. | **[upstream]** for authorship | `gentle-shell@ac67159:README.md:351`; `gentle-ai@ff77164:README.md:306`, `CONTRIBUTORS.md:5-9`; [02 §Ownership](02-ecosystem.md#ownership) |

`Inference:` because the maintainer also builds gentle-shell, the Upstream integration area will often be talking to him in a second role.

## Contribution flow

The maintainer's M1 and M2 documents record how the existing code was built **[maintainer]**. Applying the same practice to community PRs is a **[community proposal]**.

| Practice | Recorded in |
|---|---|
| Feature document per milestone in `odd/tasks/`, with tasks, route, commits, checks and review evidence | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:54-61`; `odd/tasks/desktop-m2-helpers.md:47-53` |
| Strict TDD with vitest: RED before implementation, GREEN, REFACTOR | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:27`; `odd/tasks/desktop-m2-helpers.md:26` |
| Scope Rule, Screaming Architecture, container/presentational, atomic `shared/ui`, hexagonal main | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:29`; `odd/tasks/desktop-m2-helpers.md:26`; ADR [0003](03-architecture/adr/0003-hexagonal-main-process.md), [0004](03-architecture/adr/0004-renderer-scope-rule-and-screaming-architecture.md) |
| Browser verification of UI work as it lands | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:29`; `odd/tasks/desktop-m2-helpers.md:26` |
| English artifacts, neutral register; Conventional Commits; no AI attribution | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:28` |
| Feature-branch chain: slice PRs target the previous slice, only the tracker merges to `main`; never `--delete-branch` mid-chain | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:30`; `odd/tasks/desktop-m2-helpers.md:3`, `:26` |
| Receipt-driven development (RDD) on, with review consent pre-granted by the maintainer. `Inference:` the M1 and M2 documents cover only his own milestones, so the pre-granted consent is recorded for that work only | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:31`; `odd/tasks/desktop-m2-helpers.md:26` |
| Bugs reported through the bug report form | `gentle-shell-desktop@5ab4a00:README.md:66` |

**Gaps in this flow today.** No CI runs these checks (audit A16), there is no contributor guide (context brief §5), and the strict TDD setting is recorded as coming from the maintainer's user-level agent configuration (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:27`), not from a repository policy. See [open questions](#open-questions).

## Communication channels

| Channel | Status | Source |
|---|---|---|
| Discord thread "Gentle Desktop" (Gentleman Programming server, channel gentle-shell) | **In use.** The maintainer's process and this group's proposals were posted there. | Discord thread, 2026-09-26 to 2026-09-30 |
| Live voice room on Discord | **Proposed** for a group introduction meeting; no date is set in the thread. Two members already talked in a live channel. | Discord, Matrak, 2026-09-26 and 2026-09-27 ("lo que estuvimos hablando @memoTux y yo en un canal en vivo") |
| GitHub Discussions on `Gentleman-Programming/gentle-shell-desktop` | **Requested, not enabled.** memoTux asked the maintainer to enable Discussions so the roadmap conversation lives there (Discord, memoTux, 2026-09-29). `gh api repos/Gentleman-Programming/gentle-shell-desktop --jq .has_discussions` returned `false` on 2026-10-01. | Discord, memoTux, 2026-09-29; GitHub API, 2026-10-01 |
| GitHub issues and PRs on the same repository | **In use.** Issues are enabled (`has_issues: true`, GitHub API, 2026-10-01); the M2 planning issue is #2; M1 and M2 shipped as PR chains. | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:3`, `:59`; `odd/tasks/desktop-m1-chat-core.md:75` |
| Upstream trackers (pi, gentle-shell) | For changes that belong upstream (rule D9). pi sends questions to Discord, not issues. | [04 §How to propose contract changes upstream](04-rpc-contract.md#how-to-propose-contract-changes-upstream); `pi@a13d35a:.github/ISSUE_TEMPLATE/config.yml:1-5` |

## Open questions

- Who reviews and merges community PRs? The sources record only that the maintainer's own M1 chain was merged on his instruction (`odd/tasks/desktop-m1-chat-core.md:71`); the review evidence the M1 and M2 documents record is RDD lineages (for example `odd/tasks/desktop-m1-chat-core.md:67`), and no human reviewer is named.
- Who owns the RDD policy for community PRs? The M1 document records "consent for review is pre-granted by the maintainer" (`odd/tasks/desktop-m1-chat-core.md:31`). `Inference:` that covers his own milestones; nothing says whether community PRs run RDD, and with whose consent.
- Is strict TDD a repository rule for contributors, or the maintainer's personal setting? Today it is recorded as coming from his user-level configuration (`odd/tasks/desktop-m1-chat-core.md:27`).
- How do areas coordinate with upstream maintainers? One contact per repository through Upstream integration, or each area files its own upstream issues?
- Does the maintainer want a single group contact, or does each area owner talk to him directly?
- Will Discussions be enabled, and if so, which conversations move there from Discord?
- Who merges when the maintainer is unavailable? No co-maintainer or delegated reviewer is named in any source.
- Does the group adopt the feature-branch chain for every milestone, or only for large milestones? M2 chose a chain from a forecast of about 900 changed lines (`odd/tasks/desktop-m2-helpers.md:28`).
- Are accessibility and performance stewards enough, or does the group want them as full areas once there is evidence to size them?

## Sources read

`/home/acester/bitacoras/gs-desktop/context-brief.md`; `/home/acester/bitacoras/gs-desktop/discord-thread.md`; `docs/00-vision.md`; `docs/02-ecosystem.md`; `docs/03-architecture/audit.md`; `docs/03-architecture/adr/README.md`; `docs/04-rpc-contract.md`; `docs/05-capability-inventory.md` (coverage summary, columns, row IDs); `docs/06-ux/screens.md`; `docs/06-ux/principles.md` (headings and U10–U11); `docs/06-ux/design-system.md` (headings and D-rows); `docs/07-proposals/README.md`; `docs/10-platforms.md` (risks); refreshed 2026-10-03 against pi `a13d35a` (1.0.0), gentle-shell `main` at `ac67159` (package version 4.0.0), gentle-ai `ff77164` (v4.0.0) and desktop PRs #26 and #27 on GitHub; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md`, `odd/tasks/desktop-m2-helpers.md`, `README.md`, `package.json`, `.github/ISSUE_TEMPLATE/`; GitHub API for `Gentleman-Programming/gentle-shell-desktop` (read-only, 2026-10-01).
