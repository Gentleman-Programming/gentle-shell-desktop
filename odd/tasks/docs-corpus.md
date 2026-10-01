# Gentle Shell Desktop: documentation corpus

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop (community fork `matraket/gentle-shell-desktop`). Base: `main` (`5ab4a00`). Branch: `docs/corpus`, delivered as one draft PR to upstream. Locator: `odd/tasks/docs-corpus.md`. Engram mirror: `odd/docs-corpus/tasks` (project `gentle-shell-desktop`). Visual reference (concept mockup): https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL

## Objective

Build a shared documentation corpus under `docs/` that grounds community work on Gentle Desktop before tasks are split: vision, glossary, ecosystem, architecture (as-is + audit), RPC contract, an exhaustive inventory of gentle-shell capabilities that need a desktop surface, UX, proposals, team areas, and the roadmap as one document among them.

## Problem and why

The maintainer asked the community for a roadmap, then tasks, then PRs. A roadmap without an inventory of gentle-shell capabilities and a documented architecture is guesswork, and a community of volunteers needs shared vocabulary, clear areas of responsibility and a contribution guide. Gentle-shell's differentiator is total control with the friendliest possible harness that guides and teaches; the desktop app must preserve that experience, not become another generic agent chat.

## Scope (authorized)

- Corpus skeleton: index, one file per document with its sections.
- Fill documents incrementally, each reviewable on its own.
- `CONTRIBUTING.md` at the repository root.

Out of scope: source code changes (quick-win fixes such as the Windows `spawn EINVAL` go in separate PRs).

## Constraints

English artifacts; the concept mockup is intent, not spec; maintainer vision (`00-vision.md`) and community proposals (`07-proposals/`) stay separate; every architecture or audit claim cites `path:line` evidence; Conventional Commits; no push, PR or merge without the human's decision.

## Tasks

- [x] C1 Corpus skeleton (index + section headings). Route: inline (mechanical, headings only). Checks: structural readback.
- [x] C2 Glossary (`01-glossary.md`, 40 terms) and ecosystem map (`02-ecosystem.md`). Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 0 wrong, 16 defects) → one bounded correction (15 applied, 1 partially).
- [x] C3 Architecture as-is (`03-architecture/current.md`), audit (`03-architecture/audit.md`) and 12 ADRs. Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 2 wrong, 2 missing, 1 overstated, 6 imprecise) → one bounded correction (10 applied, 1 partially; esbuild claim rejected with lockfile evidence, parent-confirmed).
- [x] C4 RPC contract (`04-rpc-contract.md`). Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 1 wrong, 4 missing, 8 imprecise) → one bounded correction (13/13 applied after re-verification).
- [x] C5 Capability inventory (`05-capability-inventory.md`). Route: delegated in two sequential writers (C5a pi core, C5b gentle-shell + gentle-ai) → independent fact-check (PASS-WITH-FIXES: 1 wrong, 2 missing, 11 imprecise) → one bounded correction (14/14 applied, #12 partially after re-verification).
- [x] C6 Vision draft (`00-vision.md`) for maintainer validation, provenance-tagged. Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 1 wrong, 16 defects) → one bounded correction (17/17 applied). Awaiting human and maintainer review.
- [x] C7 UX (`06-ux/`: 12 principles, 19 screens, design system) and proposals (`07-proposals/` 0001–0003, status proposed). Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 1 wrong (ID collisions), 13 defects) → one bounded correction (13/13 applied; corpus ID convention adopted; inventory-to-screen coverage diff 0 missing).
- [x] C8 Team areas and governance (`08-team.md`), community draft. Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 1 wrong, 2 overstated, 14 minor) → one bounded correction (17/17 applied). Awaiting group and maintainer review; human decides whether to keep the "Interest expressed in the thread" table.
- [x] C9 Roadmap (`09-roadmap.md`) derived from the corpus: maintainer M1–M6 kept, community F1/F2, 11 quick wins. Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 1 wrong, 16 defects) → one bounded correction (17 applied, 2 partially; critical path recomputed: vision Q3 → F1 → M3).
- [x] C10 `CONTRIBUTING.md` (maintainer practice cited vs community proposals tagged). Route: delegated writer → independent fact-check (PASS-WITH-FIXES: 0 wrong, 13 defects) → one bounded correction (14/14 applied).

## Acceptance criteria

- Every document states its status (draft / in review / validated) in the index.
- Architecture, audit, contract and inventory claims carry `path:line` or doc-URL evidence.
- The roadmap references inventory rows and architecture findings, not mockup screens.

## Progress and evidence

- C1: skeleton created on `docs/corpus`, commit `7f4d0f7` (17 files). Check: structural readback of `docs/` tree. RDD assess: `passive`, review not due.
- C4: `docs/04-rpc-contract.md` (322 lines, ~211 citations). Writer spot-check 5/5; independent verifier checked ~131 rows / ~115 citations → PASS-WITH-FIXES; correction applied 13/13 after re-verification; parent spot-check `pi@d86654a:agent-session.ts:2401-2404` and `helpersActivity.ts:21,139-141` confirmed. Side findings (desktop bugs, out of corpus scope): helper status `completed`/`timed_out` vs `done`, and missing `callId` on tool items.
- C5: `docs/05-capability-inventory.md` (156 capability rows: pi core 81, gentle-shell + gentle-ai 75; coverage summary recounted mechanically). Verifier independently enumerated every category (slash commands 24, app keybindings 43, settings 55, CLI flags 40, gentle-shell commands 27, shortcuts 8, tools 23+7, entry points 17) with no omissions or phantoms; ~210 citations re-opened. Parent spot-checks: launcher `-e` only (`lib/gentle-shell-launcher.ts:910-940`), `PiSession.ts:168-180`, retention merge `chatReducer.ts:225-240`.
- C3: `docs/03-architecture/{current,audit}.md` + `adr/0001-0012` (19 audit findings; 6 decisions listed as not recorded). Verifier: ~115 items, ~130 citations re-opened. Parent spot-checks: retention merge `chatReducer.ts:225-240`, esbuild via `@earendil-works/chord@0.85.1` (`pnpm-lock.yaml:3196-3198,3237-3239`), A14 citation fixed to `renderMarkdown.ts:58-72`.
- C2 + C6: `docs/00-vision.md`, `01-glossary.md`, `02-ecosystem.md`. Verifiers re-opened 60+ and all quotes/citations of 00. Parent spot-check: `gh repo view Gentleman-Programming/gentle-shell --json description` matches the quote in `00-vision.md:35` verbatim.
- C7: `docs/06-ux/*`, `docs/07-proposals/*`. Verifier re-opened 70+ citations. Parent spot-check: `src/renderer/shared/theme/theme.test.ts:2-3` imports only the JSON and `theme.ts` (tokens.css untested), status lines present in all 7 files. Corpus ID convention recorded (qualified IDs across documents).
- C8: `docs/08-team.md` (7 areas, owners TBD, headcount ranges as community proposal, governance D1–D12 tagged). `has_discussions=false` on 2026-10-01 (gh api). Counts recounted mechanically by the corrector.
- C10: `CONTRIBUTING.md`. Every `pnpm` command checked against `package.json` scripts; verifier re-opened every citation; PR labels confirmed read-only via `gh pr list` (labelled as GitHub API state, 2026-10-01).
- C9: `docs/09-roadmap.md`. Verifier re-opened ~70 citations; Mermaid parses (mermaid.parse under jsdom); 353 qualified IDs checked by script. Parent spot-check: audit risk table `docs/03-architecture/audit.md:382-386` (M4 tied to audit A2, A8; M3 to A3, A8).
