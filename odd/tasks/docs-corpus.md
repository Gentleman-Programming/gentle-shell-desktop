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
- [ ] C2 Glossary (`01-glossary.md`) and ecosystem map (`02-ecosystem.md`). Route: delegated (needs reading across the pi / gentle-pi / gentle-shell repos).
- [ ] C3 Architecture as-is (`03-architecture/current.md`) and audit (`03-architecture/audit.md`). Route: delegated explorer + writer.
- [ ] C4 RPC contract (`04-rpc-contract.md`). Route: delegated.
- [ ] C5 Capability inventory (`05-capability-inventory.md`). Route: delegated; largest document.
- [ ] C6 Vision draft (`00-vision.md`) for maintainer validation. Route: inline draft + human review.
- [ ] C7 UX (`06-ux/`) and proposals (`07-proposals/`). Route: delegated writer.
- [ ] C8 Team areas and governance (`08-team.md`). Route: inline draft + human review.
- [ ] C9 Roadmap (`09-roadmap.md`) derived from C3–C5. Route: delegated writer.
- [ ] C10 `CONTRIBUTING.md`. Route: inline.

## Acceptance criteria

- Every document states its status (draft / in review / validated) in the index.
- Architecture, audit, contract and inventory claims carry `path:line` or doc-URL evidence.
- The roadmap references inventory rows and architecture findings, not mockup screens.

## Progress and evidence

- C1: skeleton created on `docs/corpus`.
