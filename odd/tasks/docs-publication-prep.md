# Gentle Shell Desktop: corpus publication readiness (2026-10-03)

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop (community fork `matraket/gentle-shell-desktop`). Branch: `docs/corpus`. Locator: `odd/tasks/docs-publication-prep.md`.

## Objective

Make every source the corpus cites reachable by an upstream reviewer before the issue and the draft PR are published, and remove local paths.

## Problem and why

The corpus was written against local copies: the maintainer's concept mockup DOM (94 `gs-mockup.html:<line>` citations), memoTux's `roadmap.txt` (line citations in `docs/09-roadmap.md`), the author's unpublished working brief, now published in [issue #28](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28) (about 25 "context brief §N" citations) and absolute local paths in source lists. A reviewer cannot check any of them.

## Scope (authorized)

- Add the concept mockup snapshot under `docs/assets/` with unchanged line numbers (human decision 2026-10-03, option a).
- Add the concept mockup v2 and its traceability under `docs/assets/mockup-v2/` in a separate commit, after the mockup session finishes (human decision 2026-10-03).
- Resolve the other unpublished sources (roadmap, the author's unpublished working brief, Discord copy, local paths): pending a human decision.
- Mirror in `docs-es/`.

Out of scope: pushing, the issue, the PR, Drive, the artifact, the Discord post (separate human decisions).

## Tasks

- [x] P1 Concept mockup snapshot `docs/assets/gs-mockup.html` + `docs/assets/README.md`; `docs/04-rpc-contract.md:297` points to it; ES mirror. Route: inline (mechanical copy by script, two one-line edits). Evidence: lines 2–911 byte-identical to the saved copy (`cmp`); line 1 frame-runtime script replaced by a provenance comment; spot check `gs-mockup.html:819` = "profile balanced" as cited at `docs/04-rpc-contract.md:291`; parity 33/33; links 580, 0 broken (EN and ES).
- [x] P2 Other unpublished sources and local paths. Done 2026-10-03: 36 brief citations repointed to issue #28 sections (delegated writer for 34; parent fixed `docs/05-capability-inventory.md:533`, outside the writer's surface); 3 local paths removed; `roadmap.txt` provenance note added at `docs/09-roadmap.md:317`. Checks: brief citations 0, local paths 0 (excluding the desktop code path `src/main/domain/home`), every cited issue heading exists in the published body, parity 33/33, links 580 / 0 broken, line counts unchanged. Original plan: human decision 2026-10-03: publish the author's whole framing (brief §1, §2, §3, §5, §6, §8 as cited) in the upstream issue, then repoint every "context brief §N" citation to "issue #N, section '<heading>'". Absolute paths (`docs/08-team.md:328`, `docs/09-roadmap.md:341`, `docs/00-vision.md:144`) are fixed in the same pass. memoTux's `roadmap.txt` citations: human decision 2026-10-03, option (a) — cite it as memoTux's attachment to the Discord thread "Gentle Desktop" (2026-09-29); line numbers refer to that file. Applied after the repoint writer finishes (same files).
- [x] P2a-publish Issue published 2026-10-03: https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28 (human affirmed both form checkboxes; placeholders replaced by "links added when published"; no labels, actor permission READ; read-back title and body match; result `confirmed`).
- [x] P2a Issue draft (feature_request form; English body, Spanish reading copy, cite map). Progress 2026-10-03: draft written (~5,400 words, 38 KB); independent verifier PASS-WITH-FIXES, 11 defects (unsupported "adversarial review" claim, Windows cause stated as fact, false tag-legend claim, roadmap "last document", 38-commit range imprecise, and minor); one correction round applied 11/11; parent removed an unsourced CVE identifier. Review copy for the human: a local review copy (outside the repository). Awaiting human review and the two checkbox affirmations. Route: delegated writer (preparation trigger: broad reading for a public artifact). Duplicate search done 2026-10-03: upstream issues #1, #2 (maintainer umbrella), #23–#25 and PRs #3–#27 contain no corpus or roadmap issue; upstream `main` is still `5ab4a00`.
- [ ] P2b Spanish corpus as a standalone `.zip` for Drive (human decision 2026-10-03; readers use local Markdown viewers and agents). Before zipping, repoint the 10 `docs-es/` links that leave the folder: 7 to English folders (`docs-es/README.md:11`, `:12` ×2, `:26`, `:29`, `:30`; `docs-es/08-team.md:44`) → Spanish folders; 2 to `../docs/assets/gs-mockup.html` (`docs-es/04-rpc-contract.md:299`, `docs-es/assets/README.md:9`) and 1 to `../README.md` (`docs-es/CONTRIBUTING.md:145`) → GitHub URLs once the PR exists. Order: issue → citation repoint (EN+ES) → PR → zip. Progress 2026-10-03: the 7 folder links now point to the Spanish folders (parity 33/33; ES links kept=580, unresolved=0); the 3 that need GitHub URLs remain.
- [x] P3 Concept mockup v2 under `docs/assets/mockup-v2/` (HTML and traceability, byte-identical to the final mockup-session output), row in `docs/assets/README.md` (EN+ES), audit A20 links to it (EN+ES), refresh-document mentions updated. Route: inline (copy plus three one-line edits). Checks: mockup traceability check OK (680 citations, 0 bad); parity 33/33 (traceability table excluded as an English-only data asset); links 585 / 0 broken.
- [x] P4 Decide whether the `odd/tasks/` process documents go in the PR. Human decision 2026-10-03: include the four ODD documents in the PR after this scrub.

## Progress and evidence

- 2026-10-03: document created; P1 done.
