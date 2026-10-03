# Gentle Shell Desktop: documentation corpus refresh (2026-10-03)

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop (community fork `matraket/gentle-shell-desktop`). Branch: `docs/corpus` (continues the corpus feature, `odd/tasks/docs-corpus.md`). Locator: `odd/tasks/docs-corpus-refresh.md`. Engram mirror: `odd/docs-corpus-refresh/tasks` (project `gentle-shell-desktop`).

## Objective

Bring the verified corpus up to the ecosystem state of 2026-10-03 and integrate the human review of the Spanish version: gentle-shell 4.0.0, pi 1.0.0 and gentle-ai v4.0.0 replace the versions the corpus was written against; the desktop `main` is unchanged (`5ab4a00`) but has open PRs relevant to the audit; the vision gets the reviewer's corrections; a new multi-platform document is added. Then update the Spanish translation and check the concept mockup v2 against the changes.

## Problem and why

Since the corpus was verified (`1dadd17`), gentle-shell moved from 3.7.0 to 4.0.0 (38 commits), pi released 1.0.0 and gentle-shell now installs gentle-ai v4.0.0. Facts and citations pinned to the old versions may be stale. The human reviewer found three vision passages that misrepresent or omit the intent and asked for a multi-platform document.

## Scope (authorized)

- Re-pin current facts to: desktop `5ab4a00`, gentle-shell `ac67159` (4.0.0), pi `a13d35a` (1.0.0), gentle-ai `ff77164` (v4.0.0), engram `3951380`. Old pins remain only for explicit version comparisons.
- Vision corrections (P10 subagent wording; audience; "teams sharing settings"; differentiator), tagged by provenance.
- New document `docs/10-platforms.md`.
- Sweep every corpus document for facts invalidated by the new versions.
- Consistency pass, index, links; Spanish translation update; mockup v2 check.

Out of scope: source code changes, pushing, opening PRs.

## Constraints

Same as the corpus feature: English artifacts, evidence for every claim (`repo@sha:path:line`), `Inference:`/`UNVERIFIED:` labels, qualified IDs, provenance tags, writer → independent verifier → one bounded correction → parent spot-check → commit. RDD: the human's standing decision is to decline consent envelopes for this docs work; RDD stays enabled.

## Tasks

- [x] R1 Impact map: pi 0.99.1 → 1.0.0, gentle-shell 3.7.0 → 4.0.0, gentle-ai v3.7.0 → v4.0.0, desktop open PRs. Route: three parallel read-only mappers.
- [x] R2 Vision corrections from the human review (P10 = finished helper; audience: terminal friction + support narrowing as vision Q12; teams-sharing as vision Q13; differentiator: teaching, auditable, customizable). Route: delegated writer → independent verifier (PASS-WITH-FIXES: 0 wrong, 5 minor) → one correction (5/5 applied).
- [x] R3 Multi-platform document `docs/10-platforms.md` (support matrix, per-platform requirements, WSL topologies A/B/C, risks PLAT-01…PLAT-11, open questions). Route: delegated research writer → independent verifier (PASS-WITH-FIXES: 2 wrong, 12 minor) → one correction (15/15 applied incl. pin precision).
- [x] R4 Version sweep of 01, 02, 03, 04, 05, 06, 08, 09, CONTRIBUTING per the impact map. Route: delegated writers (sequential) + verifiers.
- [x] R5 Consistency pass, index and link check. Route: delegated writer + scripted checks.
- [x] R6 Spanish translation update of every changed file. Route: translators + fidelity verifiers + scripted structure/link checks.
- [x] R7 Concept mockup v2 check against the refreshed corpus (`~/bitacoras/gs-desktop/mockup-v2/`). Route: delegated checker, then corrections if needed.

## Acceptance criteria

- No current-fact citation points to a superseded pin unless it is an explicit version comparison.
- Every vision correction carries a provenance tag.
- `docs-es/` mirrors `docs/` with structure parity and 0 broken links.
- The mockup traceability table points only to existing corpus lines.

## Progress and evidence
- R1: three impact maps (pi 1.0.0: RPC byte-identical, 4 behaviour changes, counts unchanged; gentle-shell 4.0.0: no RPC-facing file changed, +1 command/entry point/shortcut, bash no longer re-registered, helper wake via user-role message; gentle-ai v4.0.0: pi-mcp-adapter retired; desktop PRs #26/#27 open). Stored in the session scratchpad as working notes.
- R2: `docs/00-vision.md` corrected; reviewer opinions tagged [community], helper facts cited at gentle-shell@ac67159 and pi@a13d35a.
- R3: `docs/10-platforms.md` + index entry. No pinned source states "WSL recommended" (only gentle-ai draft PRD 2026-02-27 ranks WSL 2 P1); recorded as [community] + UNVERIFIED. Pin precision verified: gentle-shell `ac67159` = main, 19 commits after release commit `1f35ab1`.
- R4a: `docs/04-rpc-contract.md` and `docs/05-capability-inventory.md` re-pinned to pi@a13d35a, gentle-shell@ac67159, gentle-ai@ff77164 (885 citations mapped, 47 re-opened by hand); new inventory rows V19 and Y6; coverage recounted (gentle-shell + gentle-ai 77 rows). Independent verifier PASS-WITH-FIXES (pin precision: four post-release items worded as 4.0.0); one correction 8/8 applied with line counts unchanged (04: 322, 05: 713). Committed as `75fe5da` (after human approval of the commit prompt).
- Commit policy change (2026-10-03): the human's global settings ask before every `git commit`; to avoid stalling the unattended run, no further commits are made overnight. Pending commits (to make with the human): (1) R4b `docs/01-glossary.md`, `docs/02-ecosystem.md`, `docs/03-architecture/*`, `CONTRIBUTING.md` — "docs: refresh glossary, ecosystem, architecture and contribution guide to the new pins"; further entries are appended below as tasks finish.
- R4b: 01, 02, 03 (current, audit, ADR index) and CONTRIBUTING re-pinned; companion packages and ProvisionEngramMCP updated for gentle-ai v4.0.0; audit A1, A2, A4, A5, A6, A18 updated (issues #23–#25, open PRs #26/#27); all line counts unchanged. Independent verifier PASS-WITH-FIXES (0 wrong, 6 minor); correction running (also touches `docs/10-platforms.md` citation `launcherLocator.ts:53-54`).
- R4c: 06-ux, 07-proposals, 08-team, 09-roadmap re-pinned; principles shortcut count 9 (1 conditional); SCR-07 gains inventory V19 (Inference), SCR-09 cites issue #23/PR #26/PLAT-02; proposal 0003 aligned with vision P10 (finished helpers; main-turn variant labelled extension beyond P10 [community]); 08 counts 158 rows, Platform area covers PLAT-01…PLAT-11, PRs #26/#27 as external open contributions; 09 QW-01 notes PR #26 (Inference: does not meet the quoted-token criterion), F2 and M5 link 10-platforms. Only 0003 grew one line (end). Verifier running.
- R4 closed: R4b correction 6/6 + optional (issue #23 versions re-checked on GitHub by the parent); R4c verifier PASS-WITH-FIXES (0 wrong, counts verified), fixes applied together with R5.
- R5: consistency pass over 32 files — 75 intra-corpus line citations checked (2 stale fixed), 548 links 0 broken (parent re-ran the link script), old pins only in comparisons/legends (vision current-fact citations moved to ac67159 after a quote-identity script), index statuses match, qualified IDs; no line count changed.
- R6: docs-es updated incrementally (Spanish line N+2 ↔ English line N at 1dadd17; diff hunks applied bottom-up) in three sequential parts plus full translation of `10-platforms.md`; part 1 verifier PASS-WITH-FIXES (1 term fixed), part 2 PASS (316 lines, 0 defects), part 3 verifier running; link remap 146 targets → 548 links resolved, 0 unresolved; parity script 32/32 pairs = English + 2 lines. docs-es is not versioned.
- R7: mockup v2 (`~/bitacoras/gs-desktop/mockup-v2/`, not versioned) — impact check: 322 citations, none broken, 39 moved, 32 changed meaningfully; 16/17 content items applied (V19 history drawing left as a gap); independent verifier PASS-WITH-FIXES (0 wrong/invented/stale; 4 minor fixed by the parent); `:root` byte-identical, 19 SCR reachable, 659 citations 0 bad, headless Chromium without page errors.
- Pending commit (2): R4c files — "docs: refresh UX, proposals, team and roadmap to the new pins". Pending commit (3): this feature document.
