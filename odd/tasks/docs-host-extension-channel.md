# Gentle Shell Desktop: host to gentle-shell channel question (2026-10-03)

Feature document (ODD). Repository: Gentleman-Programming/gentle-shell-desktop (community fork `matraket/gentle-shell-desktop`). Branch: `docs/corpus`. Locator: `odd/tasks/docs-host-extension-channel.md`.

## Objective

Record in the corpus, as an undecided question with verified alternatives and tradeoffs, how a desktop host should reach gentle-shell features that pi's RPC does not carry today: extend pi's RPC, use the existing extension channels, or give gentle-shell a protocol of its own.

## Problem and why

The corpus states the facts (gentle-shell adds no RPC command or event, `docs/04-rpc-contract.md:217`; gap ownership, `docs/04-rpc-contract.md:299`; `docs/02-ecosystem.md:142-144`) but never weighs a separate gentle-shell protocol against the other routes. A recommendation given in conversation was not backed by the corpus. The human reviewer requires every point to be tied down and verified against pi and gentle-shell.

## Scope (authorized)

- Verify every host-to-extension and extension-to-host path in pi `a13d35a` (1.0.0) and gentle-shell `ac67159` (main), including any the corpus does not list yet.
- Add one row to `docs/03-architecture/adr/README.md` "Undecided / not recorded" with the alternatives and evidence-backed tradeoffs, without taking a side.
- Cross-link it from the gap-ownership passages; correct any existing corpus statement the evidence contradicts.
- Mirror in `docs-es/` (unversioned).

Out of scope: source code changes, a decision on the question, pushing, opening PRs.

## Constraints

English artifacts; every claim cites `repo@sha:path:line`; `Inference:`/`UNVERIFIED:` labels; qualified IDs; no line shifts in files other documents cite by line unless every such citation is updated; references only from pinned reference checkouts (pi `a13d35a`, gentle-shell `ac67159`), never the author's local working copies (not used as sources). Writer, independent verifier, one bounded correction, parent spot check, commit. The optional native review (RDD) was assessed per commit; the author chose not to run the optional reviews for this documentation work.

## Tasks

- [x] H1 Evidence map of host-extension channels in pi and gentle-shell. Route: delegated read-only explorer (mapping trigger: more than 5 sequential lookups across two repositories). Result: 5 corpus statements contradicted or incomplete (see Progress). Parent spot check passed: `pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:713-716`, `src/core/agent-session.ts:3359-3364`, `:1870-1888`.
- [x] H2 English write: ADR README undecided row, cross-links, corrections from H1. Route: delegated writer (preparation trigger: reading that prepares the write). Result: 04 gains `### Host and extension channels` and `#### Alternatives for a host channel to gentle-shell features` after line 299 (322 → 376 lines; no citation points past `:299`); ADR README +1 row; in-place edits in 01, 02, 0002, 08, 09, CONTRIBUTING; inventory A4/A6 left as still accurate. Writer corrected 4 explorer citations while re-reading.
- [x] H3 Independent verification of H2 against pi and gentle-shell. Route: delegated verifier, then one bounded correction. Verdict PASS-WITH-FIXES, 10 defects (2 wrong inbound-table claims: `compact` and `set_session_name` carry host text; missing outbound `sendUserMessage`/`setSessionName`; 2 missing custom message types; presence quote misattributed to the transport; 2 neutrality breaches; stale "six candidates" count in 08; 4 minor citation ranges). One correction round applied 10/10; 04 now 384 lines, other files keep their counts; citations into 04 stay at `:299` or earlier. Parent spot check passed (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:533-535` vs 04:321; ADR row wording neutral). EN links: 576 checked, 0 broken.
- [x] H4 Spanish mirror in `docs-es/`, parity and link checks. Route: delegated writer plus parent checks (a Spanish/English line-parity check and a relative-link remap and anchor check; local scripts, not versioned). Parity 32/32; ES links kept=576, unresolved=0; per-line code-span and label sets identical (writer's structural check). Parent fix: the ES self-reference to the "only formal interface" sentence now quotes the Spanish text at line 7.
- [x] H5 Parent spot check, work-unit commit, RDD assess. EN links 576 checked, 0 broken. Commit: see Progress.

## Acceptance criteria

- The row lists each alternative with what it needs (which repository changes), what it can carry (inbound, outbound) and its costs, each backed by a citation or labelled `Inference:`.
- No statement in the corpus about the available channels contradicts the H1 evidence.
- Links resolve (EN and ES); ES parity holds.

## Progress and evidence

- 2026-10-03: document created.
- 2026-10-03 H1: the corpus understates the channels. Contradicted: "the only inbound channels to an extension are `prompt` and dialog responses" (`docs/04-rpc-contract.md:299`, `docs/02-ecosystem.md:144`, `CONTRIBUTING.md:38`); "everything it adds rides on `extension_ui_request` or `prompt`-invoked commands" (`docs/04-rpc-contract.md:217`). Missing: the `input` hook on RPC `prompt`/`steer`/`follow_up` (source `rpc`, can handle or transform), `user_bash`, lifecycle events fired by RPC commands, `appendEntry` → `entry_appended` + `get_entries`, custom messages (`message_*` with `customType`), and gentle-shell's own socket/named-pipe transport and file presence outside stdio. Mis-cited: "Contribution Proposal" comes from `pi@a13d35a:.github/ISSUE_TEMPLATE/contribution.yml:1`, not `CONTRIBUTING.md:31-34`. The earlier conversational answer repeated the corpus error; it is corrected by this feature.
- 2026-10-03 H5: work-unit commit `4b3f5e6` (`docs: map host and extension channels and record the host channel question`).
