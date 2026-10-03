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
- [ ] R4 Version sweep of 01, 02, 03, 04, 05, 06, 08, 09, CONTRIBUTING per the impact map. Route: delegated writers (sequential) + verifiers.
- [ ] R5 Consistency pass, index and link check. Route: delegated writer + scripted checks.
- [ ] R6 Spanish translation update of every changed file. Route: translators + fidelity verifiers + scripted structure/link checks.
- [ ] R7 Concept mockup v2 check against the refreshed corpus (`~/bitacoras/gs-desktop/mockup-v2/`). Route: delegated checker, then corrections if needed.

## Acceptance criteria

- No current-fact citation points to a superseded pin unless it is an explicit version comparison.
- Every vision correction carries a provenance tag.
- `docs-es/` mirrors `docs/` with structure parity and 0 broken links.
- The mockup traceability table points only to existing corpus lines.

## Progress and evidence
- R1: three impact maps (pi 1.0.0: RPC byte-identical, 4 behaviour changes, counts unchanged; gentle-shell 4.0.0: no RPC-facing file changed, +1 command/entry point/shortcut, bash no longer re-registered, helper wake via user-role message; gentle-ai v4.0.0: pi-mcp-adapter retired; desktop PRs #26/#27 open). Stored in the session scratchpad as working notes.
- R2: `docs/00-vision.md` corrected; reviewer opinions tagged [community], helper facts cited at gentle-shell@ac67159 and pi@a13d35a.
- R3: `docs/10-platforms.md` + index entry. No pinned source states "WSL recommended" (only gentle-ai draft PRD 2026-02-27 ranks WSL 2 P1); recorded as [community] + UNVERIFIED. Pin precision verified: gentle-shell `ac67159` = main, 19 commits after release commit `1f35ab1`.
