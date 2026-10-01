# Gentle Desktop documentation corpus

Shared ground for everyone working on Gentle Desktop: what we are building, why, how it works today, what gentle-shell already does that the desktop must expose, and how the community organizes around it. The roadmap is one document among these, derived from the others.

## How to read it

1. Start with the [vision](00-vision.md) and the [glossary](01-glossary.md).
2. Understand the pieces in the [ecosystem](02-ecosystem.md).
3. Go deep on [architecture](03-architecture/), the [RPC contract](04-rpc-contract.md) and the [capability inventory](05-capability-inventory.md).
4. Then [UX](06-ux/), [proposals](07-proposals/), [team](08-team.md) and the [roadmap](09-roadmap.md).

## Documents and status

| Document | Purpose | Status |
|---|---|---|
| [00-vision.md](00-vision.md) | Product vision and philosophy (validated by the maintainer) | skeleton |
| [01-glossary.md](01-glossary.md) | Shared vocabulary | skeleton |
| [02-ecosystem.md](02-ecosystem.md) | Pieces, owners and how they relate to the desktop | skeleton |
| [03-architecture/current.md](03-architecture/current.md) | Architecture as it is today | draft |
| [03-architecture/audit.md](03-architecture/audit.md) | Findings, risks and recommendations | draft |
| [03-architecture/adr/](03-architecture/adr/) | Architecture decision records | draft |
| [04-rpc-contract.md](04-rpc-contract.md) | The desktop ↔ gentle-shell contract and its gaps | draft |
| [05-capability-inventory.md](05-capability-inventory.md) | Every gentle-shell capability and its desktop surface | draft |
| [06-ux/](06-ux/) | Principles, screens and design system | skeleton |
| [07-proposals/](07-proposals/) | Community proposals beyond parity | skeleton |
| [08-team.md](08-team.md) | Areas of responsibility and governance | skeleton |
| [09-roadmap.md](09-roadmap.md) | Milestones derived from the corpus | skeleton |

Status values: `skeleton` → `draft` → `in review` → `validated`.

## How to propose changes

Open a pull request against the document. Maintainer vision lives in `00-vision.md`; new ideas from the community go to `07-proposals/` until the maintainer accepts them.
