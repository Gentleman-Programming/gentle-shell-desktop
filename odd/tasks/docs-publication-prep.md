# Gentle Shell Desktop: corpus publication readiness (2026-10-03)

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop (community fork `matraket/gentle-shell-desktop`). Branch: `docs/corpus`. Locator: `odd/tasks/docs-publication-prep.md`. Engram mirror: `odd/docs-publication-prep/tasks` (project `gentle-shell-desktop`).

## Objective

Make every source the corpus cites reachable by an upstream reviewer before the issue and the draft PR are published, and remove local paths.

## Problem and why

The corpus was written against local copies: the maintainer's concept mockup DOM (94 `gs-mockup.html:<line>` citations), memoTux's `roadmap.txt` (line citations in `docs/09-roadmap.md`), the author's working brief (about 25 "context brief §N" citations) and absolute local paths in source lists. A reviewer cannot check any of them.

## Scope (authorized)

- Add the concept mockup snapshot under `docs/assets/` with unchanged line numbers (human decision 2026-10-03, option a).
- Add the concept mockup v2 and its traceability under `docs/assets/mockup-v2/` in a separate commit, after the mockup session finishes (human decision 2026-10-03).
- Resolve the other unpublished sources (roadmap, brief, Discord copy, local paths): pending a human decision.
- Mirror in `docs-es/`.

Out of scope: pushing, the issue, the PR, Drive, the artifact, the Discord post (separate human decisions).

## Tasks

- [x] P1 Concept mockup snapshot `docs/assets/gs-mockup.html` + `docs/assets/README.md`; `docs/04-rpc-contract.md:297` points to it; ES mirror. Route: inline (mechanical copy by script, two one-line edits). Evidence: lines 2–911 byte-identical to the saved copy (`cmp`); line 1 frame-runtime script replaced by a provenance comment; spot check `gs-mockup.html:819` = "profile balanced" as cited at `docs/04-rpc-contract.md:291`; parity 33/33; links 580, 0 broken (EN and ES).
- [ ] P2 Other unpublished sources and local paths. Pending human decision.
- [ ] P3 Concept mockup v2 under `docs/assets/mockup-v2/`, audit A20/A21 and refresh-document mentions repointed. Waits for the mockup session.
- [ ] P4 Decide whether the `odd/tasks/` process documents go in the PR. Pending human decision.

## Progress and evidence

- 2026-10-03: document created; P1 done.
