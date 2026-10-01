# Contributing

> Status: draft (community proposal for the contribution process; maintainer practice cited where recorded).

Gentle Desktop is an early preview: M1 (chat core) and M2 (per-chat helpers) are done (`README.md:3`). This guide gives you the short path to a useful contribution and links to the [documentation corpus](docs/README.md) for detail.

## How to read this guide

| Tag | Meaning |
|---|---|
| **[maintainer]** | Alan Buscaglia's Discord messages and the maintainer-authored desktop repo documents (`README.md`, `odd/tasks/desktop-m1-*.md`, `odd/tasks/desktop-m2-*.md`): stated intent or recorded practice. |
| **[community proposal]** | This guide, other corpus pages, and Discord messages from members other than the maintainer: proposed, not decided. |
| **[upstream]** | The upstream repositories' own files: rules the desktop group does not control. |

These are the same tags, with the same sources, as the tag table in [08 §How to read this page](docs/08-team.md#how-to-read-this-page).

Citations `path:line` point to files in this repository at `main` `5ab4a00` (the corpus writes them as `gentle-shell-desktop@5ab4a00:path:line`); the cited files are unchanged on the corpus branch. `Inference:` marks reasoning, not stated fact. IDs from other corpus pages carry their page (`audit A4`, `inventory C20`, `governance D7`, `QW-11`), following the [corpus ID convention](docs/README.md#how-to-read-it); unqualified M1 and M2 are the maintainer's milestones.

Applying the maintainer's practice to community pull requests is itself a **[community proposal]** ([08 §Contribution flow](docs/08-team.md#contribution-flow)). The open governance questions are listed at the [end of this guide](#open-questions).

## Before you start

1. **Read the corpus.** Start with the [vision](docs/00-vision.md) and the [glossary](docs/01-glossary.md), then follow the reading order in [docs/README.md](docs/README.md#how-to-read-it).
2. **Pick an area.** [08 §Areas of responsibility](docs/08-team.md#areas-of-responsibility) lists seven areas with their scope; owners self-nominate, the group confirms and the maintainer can veto (governance D12, **[community proposal]**).
3. **Pick a task.** The [quick wins](docs/09-roadmap.md#quick-wins) are desktop-only, need no open decision and each fix one cited finding (**[community proposal]**).
4. **Talk first.** The community coordinates in the Discord thread "Gentle Desktop"; GitHub issues are enabled, Discussions are not ([08 §Communication channels](docs/08-team.md#communication-channels)). Announcing what you take before you start is a **[community proposal]**.

The maintainer's process is "present a roadmap, which goes into the repo; divide tasks; present PRs" (governance D1, **[maintainer]**, Discord, Alan Buscaglia, 2026-09-27; [08 §How decisions are made](docs/08-team.md#how-decisions-are-made)).

## Where a change belongs

Not every change belongs in this repository. [02 §Where each change belongs](docs/02-ecosystem.md#where-each-change-belongs) routes each kind of change; that table is labelled `Inference:` in its source, and so is this summary:

| If the change… | It belongs in |
|---|---|
| Adds or changes an RPC command, event or response shape | pi (`earendil-works/pi`) |
| Publishes new data from a gentle-shell feature, or makes a gentle-shell command work under RPC, or changes the launcher | gentle-shell |
| Lets the host act on a gentle-shell feature | gentle-shell, plus an inbound channel; a new command type would also need pi (labelled `Inference:` in 02) |
| Changes which companion packages a home gets | gentle-ai, then a gentle-pi pin bump |
| Renders or acts on data already on the wire, or changes the desktop process, IPC or packaging | This repository |

Upstream repositories have their own rules **[upstream]**; follow them there, not here:

- **pi:** issues and PRs from new contributors are auto-closed by default, and no PR is accepted without prior maintainer approval (`lgtm`) (`pi@d86654a:CONTRIBUTING.md:23`, `:31-34`, `:58`). Summary in [04 §How to propose contract changes upstream](docs/04-rpc-contract.md#how-to-propose-contract-changes-upstream).
- **gentle-shell:** no `CONTRIBUTING.md` exists at `1162ce9`; it has bug and feature issue forms ([04 §How to propose contract changes upstream](docs/04-rpc-contract.md#how-to-propose-contract-changes-upstream)).
- **gentle-ai:** "No PR without an issue. No exceptions." (`gentle-ai@b388eb3:CONTRIBUTING.md:24-26`). Work may begin only when the issue has `status:approved` (`:31`), and PRs not linked to an approved issue are automatically rejected by CI (`:35`).

## Proposing ideas

Ideas that go beyond parity with gentle-shell are written as proposals in [docs/07-proposals/](docs/07-proposals/README.md#process): one file per idea at status `proposed`, opened as a pull request and added to the index. Only the maintainer moves a proposal to `accepted` or `declined` (governance D7, **[community proposal]**). The maintainer's vision stays in [00-vision.md](docs/00-vision.md) and is not edited to carry community ideas (`docs/README.md:35`).

## Workflow

The maintainer built M1 and M2 with this practice **[maintainer]**. Using it for community work is a **[community proposal]**.

| Practice | Recorded in |
|---|---|
| One ODD feature document per milestone in `odd/tasks/`, with objective, scope, constraints, tasks, route, commits, checks and review evidence | `odd/tasks/desktop-m1-chat-core.md:3-75`; `odd/tasks/desktop-m2-helpers.md:5-53` |
| Strict TDD with vitest: "RED observed before implementation, GREEN, REFACTOR"; Node environment for main and protocol, jsdom for the renderer | `odd/tasks/desktop-m1-chat-core.md:27`; `odd/tasks/desktop-m2-helpers.md:26` |
| Structure: Scope Rule, Screaming Architecture, container/presentational, atomic design under `shared/ui`, hexagonal main process; why the tree is shaped this way is in `src/README.md` | `odd/tasks/desktop-m1-chat-core.md:29`; `src/README.md:5-51` |
| React 19 rules: named imports, no manual memoization, ref as prop | `odd/tasks/desktop-m1-chat-core.md:29` |
| Browser verification of UI work as it lands, through `pnpm dev:web` with the mock bridge, screenshots kept as evidence | `odd/tasks/desktop-m1-chat-core.md:29`; `odd/tasks/desktop-m2-helpers.md:26` |
| Checks in the acceptance criteria: both milestones require `pnpm test`, `pnpm typecheck`, `pnpm build`; M1 adds that `pnpm package` produces an unsigned build; M2 adds `pnpm smoke:electron`, which M1 also ran in task T6 and at its close | `odd/tasks/desktop-m1-chat-core.md:50`, `:61`, `:65`; `odd/tasks/desktop-m2-helpers.md:43` |
| Technical artifacts in English, neutral register | `odd/tasks/desktop-m1-chat-core.md:28` |
| Receipt-driven development (RDD) on, review consent pre-granted by the maintainer | `odd/tasks/desktop-m1-chat-core.md:31`; `odd/tasks/desktop-m2-helpers.md:26` |

Notes:

- The strict TDD setting is recorded with the source "user-level CLAUDE.md" (`odd/tasks/desktop-m1-chat-core.md:27`), not a repository policy. `Inference:` that file is the maintainer's own configuration, because the same document records his instructions for the milestone (`:29`); it does not say whose file it is ([08 §Contribution flow](docs/08-team.md#contribution-flow) reads it the same way). Whether it binds contributors is [open](#open-questions).
- `Inference:` the pre-granted RDD consent covers the maintainer's own milestones; nothing says whether community PRs run RDD ([08 §Open questions](docs/08-team.md#open-questions)).
- There is no CI yet, so nothing runs these checks for you (audit A16, [audit](docs/03-architecture/audit.md#a16-test-coverage-and-ci-gaps)). **[community proposal]**: contributors would run these checks locally and paste the results in the PR.

## Branches, commits and pull requests

**Recorded practice [maintainer]:**

- Conventional Commits; no AI attribution (`odd/tasks/desktop-m1-chat-core.md:28`).
- Feature-branch chain: M1 records delivery strategy `ask-on-risk` with the chain strategy `feature-branch-chain` "cached from this session" (`odd/tasks/desktop-m1-chat-core.md:30`). A tracker branch (`feat/desktop-m1-chat-core`) has slice branches (`feat/desktop-m1-1-scaffold`, …); the first slice PR targets the tracker, later slices target the previous slice, and only the tracker merges to `main`. Never merge a child with `--delete-branch` until the chain is complete (same line).
- M2 calls its chain a "cached choice" (`odd/tasks/desktop-m2-helpers.md:3`). Its forecast line reads "~900 authored changed lines (…) → feature-branch-chain" (`odd/tasks/desktop-m2-helpers.md:28`); neither document states a size rule for when to use a chain.
- The M1 document records the labels `type:feature` and `size:exception` on PR #4, the first slice (`odd/tasks/desktop-m1-chat-core.md:32`). The GitHub API (`gh pr list`, 2026-10-01) also shows `type:*` labels, and `size:exception` on some, on PRs #3 to #18; that is GitHub state, not a practice recorded in the repository.
- The M1 chain was merged into the tracker and then into `main` on the maintainer's instruction (`odd/tasks/desktop-m1-chat-core.md:71`).

**For community contributions [community proposal]:**

- One quick win or one coherent change per PR, with its tests and docs in the same PR.
- When to use a feature-branch chain is not decided: 08 asks whether the group adopts it for every milestone or only for large ones ([open questions](#open-questions); [08 §Open questions](docs/08-team.md#open-questions)).
- Corpus changes go as a pull request against the document (`docs/README.md:33-35`).
- Code documentation that belongs with a change (`src/README.md`, the README dev section) is written by the author of that change ([08 §Docs and community](docs/08-team.md#docs-and-community)).

## Development setup

**Requirements** (`README.md:9-19`):

- Node.js 22.19 or newer and pnpm 11 (`README.md:11`). `package.json` declares no `engines` or `packageManager` field, so nothing enforces these versions.
- The `gentle-shell` launcher, shipped with gentle-pi 3.7.0 or newer (`README.md:12-17`):

  ```sh
  npm install -g gentle-pi
  gentle-shell --version
  ```

- A model provider signed in through pi or `gentle-shell --isolated` (`README.md:21-30`).

**Run from source** (`README.md:34-40`). The Electron download step comes from the README, not from a `package.json` script:

```sh
pnpm install
node node_modules/electron/install.js   # downloads the Electron binary; pnpm may skip it
pnpm dev
```

**Scripts** (`package.json:10-24`; descriptions from `README.md:95-108`, `:116`):

| Command | What it does |
|---|---|
| `pnpm dev` | Run the Electron + React app |
| `pnpm dev:web` | Run the renderer alone in a browser tab, http://localhost:5173, with a mock bridge (`odd/tasks/desktop-m1-chat-core.md:29`) |
| `pnpm dev:local-pi` | Run the app against a local gentle-pi checkout (default `../gentle-pi-worktrees/desktop-integration`) |
| `pnpm test` / `pnpm test:watch` | Run the vitest suite once / in watch mode |
| `pnpm typecheck` | Type-check main, preload and renderer |
| `pnpm build` | Build main, preload and renderer |
| `pnpm smoke:electron` | Build, launch the packaged main entry through Playwright, and verify the window comes up |
| `pnpm package`, `package:mac`, `package:win`, `package:linux` | Build an unsigned app under `release/` |

`package.json` also defines `pnpm preview` (`electron-vite preview`, `package.json:14`); the README does not describe it.

**Environment variables:**

| Variable | Effect | Source |
|---|---|---|
| `GENTLE_SHELL_BIN` | Path to the launcher (a gentle-pi checkout's `bin/gentle-shell.mjs` or another gentle-shell executable); otherwise `gentle-shell` on `PATH` is used | `README.md:110`; `src/main/adapters/launcherLocator.ts` |
| `GENTLE_SHELL_INTERACTIVE_HOST=1` | Set by the app on the pi process it spawns, so gentle-pi publishes helper activity and enables RPC dialogs; you do not set it yourself | `README.md:89-91`, `:112`; `odd/tasks/desktop-m2-helpers.md:11` |

Only macOS (Apple silicon) is tested; Windows and Linux builds are configured but untested (`README.md:7`).

## Reporting bugs

- Use the bug report form in GitHub issues (`README.md:66`). It asks for a duplicate search, a sensitive-data check, steps to reproduce, expected and actual behavior, versions and the operating system, and applies the labels `bug` and `status:needs-review` (`.github/ISSUE_TEMPLATE/bug_report.yml:1-91`).
- **Known issue:** both issue forms were copied from gentle-pi and still name it (`.github/ISSUE_TEMPLATE/bug_report.yml:2`, `:30`, `:57`; `feature_request.yml:2`). Fixing them is roadmap quick win [QW-11](docs/09-roadmap.md#qw-11-issue-forms-and-contributing). Until then, **[community proposal]**, fill the form this way (the forms stay as they are):
  - *Problem* (`bug_report.yml:26-32`): where it says gentle-pi, describe the effect on Gentle Desktop. Put the desktop commit (or app version) on its first line; the form has no field for it.
  - *gentle-pi version* (required, `bug_report.yml:54-60`): the version of the gentle-pi package that ships your `gentle-shell` launcher, or its commit if you run the launcher from a checkout (`GENTLE_SHELL_BIN`).
  - *Pi version* (required, `bug_report.yml:62-68`): the pi version. `gentle-shell --version` prints the gentle-shell, pi and home versions (`README.md:16`); paste that output in *Problem* as well.
- Check the [known limitations](README.md#known-limitations) first: for example, helper Stop is disabled on purpose (`README.md:62`).
- A bug in pi or gentle-shell itself belongs in that repository ([Where a change belongs](#where-a-change-belongs)).

## Open questions

These are not answered by any source; this guide does not answer them ([08 §Open questions](docs/08-team.md#open-questions)):

- Who reviews and merges community PRs.
- Whether community PRs run RDD, and with whose consent.
- Whether strict TDD is a repository rule for contributors.
- Whether the group adopts the feature-branch chain for every milestone, or only for large milestones.
