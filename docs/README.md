# Gentle Desktop documentation corpus

Shared ground for everyone working on Gentle Desktop: what we are building, why, how it works today, what gentle-shell already does that the desktop must expose, and how the community organizes around it. The roadmap is one document among these, derived from the others.

## How to read it

1. Start with the [vision](00-vision.md) and the [glossary](01-glossary.md).
2. Understand the pieces in the [ecosystem](02-ecosystem.md).
3. Go deep on [architecture](03-architecture/), the [RPC contract](04-rpc-contract.md) and the [capability inventory](05-capability-inventory.md).
4. Then [UX](06-ux/), [proposals](07-proposals/), [team](08-team.md) and the [roadmap](09-roadmap.md).
5. For Windows, macOS, Linux and WSL support, read [platforms](10-platforms.md) after the audit and the roadmap.

**IDs across documents.** IDs collide between pages (inventory A1–A12 and U1–U8, audit A1–A19, UX U1–U12). Inside its home page an ID is written bare; anywhere else it carries a qualifier: `inventory A5` ([capability inventory](05-capability-inventory.md)), `audit A5` ([audit](03-architecture/audit.md)), `UX U3` ([UX principles](06-ux/principles.md)), `design D3` ([design system](06-ux/design-system.md)), `gap G1` ([RPC contract](04-rpc-contract.md#gaps-the-desktop-needs)), `vision P2` and `vision Q1` ([vision](00-vision.md)), `ADR 0007` ([ADRs](03-architecture/adr/)), `SCR-03` ([screens](06-ux/screens.md)), `governance D7` ([team](08-team.md)), `QW-01` ([roadmap](09-roadmap.md)), `PLAT-01` ([platforms](10-platforms.md)) and `M2 scope D2` (the maintainer's `odd/tasks/desktop-m2-helpers.md`). Watch the pairs that share a letter: `inventory Q6` (a desktop search) vs `vision Q1`, and `milestone M3` (a desktop milestone) vs `inventory M3`. A qualifier covers the IDs listed after it (`audit A3, A11`). A page may declare a bare form in its own legend, as the roadmap does for milestones M1–M6.

## Documents and status

| Document | Purpose | Status |
|---|---|---|
| [00-vision.md](00-vision.md) | Product vision and philosophy (to be validated by the maintainer) | draft (awaiting maintainer validation) |
| [01-glossary.md](01-glossary.md) | Shared vocabulary | draft |
| [02-ecosystem.md](02-ecosystem.md) | Pieces, owners and how they relate to the desktop | draft |
| [03-architecture/current.md](03-architecture/current.md) | Architecture as it is today | draft |
| [03-architecture/audit.md](03-architecture/audit.md) | Findings, risks and recommendations | draft |
| [03-architecture/adr/](03-architecture/adr/) | Architecture decision records | draft |
| [04-rpc-contract.md](04-rpc-contract.md) | The desktop ↔ gentle-shell contract and its gaps | draft |
| [05-capability-inventory.md](05-capability-inventory.md) | Every gentle-shell capability and its desktop surface | draft |
| [06-ux/](06-ux/) | Principles, screens and design system | draft |
| [07-proposals/](07-proposals/) | Community proposals beyond parity | draft |
| [08-team.md](08-team.md) | Areas of responsibility and governance | draft (community proposal, awaiting group and maintainer review) |
| [09-roadmap.md](09-roadmap.md) | Milestones derived from the corpus | draft (community proposal, awaiting maintainer validation) |
| [10-platforms.md](10-platforms.md) | Windows (native and WSL), macOS and Linux support across the ecosystem; what the desktop must solve and the risks | draft |

Status values: `skeleton` → `draft` → `in review` → `validated`.

## How to propose changes

Open a pull request against the document. Maintainer vision lives in `00-vision.md`; new ideas from the community go to `07-proposals/` until the maintainer accepts them.
