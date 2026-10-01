# Proposals

> Status: draft.

Community ideas that go beyond parity with gentle-shell. They live here, apart from the maintainer's [vision](../00-vision.md), until the maintainer accepts them ([vision P10](../00-vision.md#product-principles), [UX U12](../06-ux/principles.md#u12-go-beyond-the-terminal-only-through-proposals)).

## Index

| # | Proposal | Author | Status | Main runtime dependencies |
|---|---|---|---|---|
| [0001](0001-agent-flow-graph.md) | Agent flow as a graph | Matrak (community) | `proposed` | gap G8, parent and message linkage |
| [0002](0002-interact-with-running-node.md) | Interact with a running node | Matrak (community) | `proposed` | gap G1, steering (inventory C4, A6) |
| [0003](0003-post-hoc-audit-by-questions.md) | Post-hoc audit by questions | Matrak (community) | `proposed` | gap G8, helper history (inventory A12) |

IDs from other documents are qualified, because they collide (inventory A1–A12 and U1–U8, audit A1–A19, UX U1–U12): `gap G1` is from the [RPC contract](../04-rpc-contract.md#gaps-the-desktop-needs), `inventory C4` from the [capability inventory](../05-capability-inventory.md), `audit A5` from the [architecture audit](../03-architecture/audit.md#findings), `vision P10` and `vision Q5` from the [vision](../00-vision.md), `UX U2` from the [UX principles](../06-ux/principles.md). A qualifier covers the IDs listed after it (`inventory C4, A6`).

## Process

1. **Write.** One file per proposal, `NNNN-short-name.md`, with: Problem, Proposal, Runtime requirements, Prior art in the ecosystem, Status, Author and source.
2. **Ground it.** Runtime requirements cite the RPC contract gaps and inventory rows they depend on. Prior art lists only what can be verified in the pinned repositories.
3. **Propose.** Open a pull request with the file at status `proposed`, and add it to the index.
4. **Decide.** Only the maintainer moves a proposal to `accepted` or `declined`. A community member never changes that status.
5. **After acceptance.** The idea may move into the vision, the screens and the roadmap. Upstream work it needs (pi or gentle-shell) follows [how to propose contract changes upstream](../04-rpc-contract.md#how-to-propose-contract-changes-upstream).

| Status | Meaning | Who sets it |
|---|---|---|
| `proposed` | Written and open for discussion. | Author |
| `accepted` | The maintainer wants it in the product. | Maintainer only |
| `declined` | The maintainer does not want it, for now or for good. The file stays as a record. | Maintainer only |

## Mentioned in the community, not proposed

Ideas raised in the Discord thread "Gentle Desktop" with no proposal file. They are listed so they are not lost. Listing them is not an endorsement, and none of them is in scope. See also [community terms outside scope](../01-glossary.md#community-terms-outside-scope).

| Idea | Raised by | Date | What was said |
|---|---|---|---|
| Infinite canvas with agents | eSagraDEV | 2026-09-26 | Starting a project of his own, "un canvan infinito, con agentes, navegador integrado, etc.." |
| Integrated browser | eSagraDEV | 2026-09-26, 2026-09-27 | Same message; later, adding "el navegador integrado de hermes agent" so it can be used from gentle shell. |
| gentle-mesh for mobile and remote agents | memoTux; Rafael The Hutt | 2026-09-26; 2026-09-27 | memoTux: "Gentle Mesh pensamientos para moviles", with desktop and mobile front ends. Rafael: a multiplatform, lightweight app with access to remote agents over VPN, and the gentle-mesh protocol (`github.com/Rafaeldelinares/gentle-mesh`). |
| Verifiable delegation between agents | Rafael The Hutt | 2026-09-27 | gentle-mesh RFC-002: delegation with an explicit contract and verifiable execution, against the "Green Checkbox" fallacy (an agent claims success and nobody checks). |
| herdr-web-ui as a comparison | Rafael The Hutt | 2026-09-30 | Linked `github.com/devswha/herdr-web-ui` and asked how it compares with gentle-desktop. |

Dates are converted from the thread's `d/m/yy` format. Source: Discord thread "Gentle Desktop" (saved copy, not in the repository).
