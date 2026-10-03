# Corpus assets

Files the corpus cites by line number, kept here so every citation can be checked.

| File | What it is | Provenance |
|---|---|---|
| [`gs-mockup.html`](gs-mockup.html) | Snapshot of the rendered DOM of the maintainer's concept mockup. Cited across the corpus as `gs-mockup.html:<line>`. The product markup is at lines 459–909. | Concept mockup published by Alan Buscaglia at https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL and linked in the Discord thread "Gentle Desktop" (2026-09-26). Saved on 2026-10-01. The only change is on line 1: the claude.ai frame-runtime script was replaced by a provenance comment. Lines 2–911 are byte-identical to the saved copy, so line numbers match the citations. |
| [`mockup-v2/gs-mockup-corpus.html`](mockup-v2/gs-mockup-corpus.html) and [`mockup-v2/TRACEABILITY.md`](mockup-v2/TRACEABILITY.md) | Concept mockup v2: a **community concept**, **non-normative**. It extends the maintainer's mockup with the surfaces the corpus documents, keeps its look and palette, and adds two annotation layers ("§ Corpus notes", "✎ Community proposals") styled apart from the app so they are not read as product UI. The annotation notes are in Spanish. `TRACEABILITY.md` links every surface and new element to corpus lines (`docs/<file>:<line>`). It does not replace the maintainer's mockup and is cited by [audit A20 and A21](../03-architecture/audit.md#findings-added-after-the-refresh). | Built in a community session from this corpus (2026-10-02 to 2026-10-03). Added unchanged. When added, a local traceability check found 680 corpus citations, none pointing at a missing line. The rendered page is also published as a claude.ai artifact (link in [issue #28](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28)). |

The mockup is intent, not spec ([04 §Gaps](../04-rpc-contract.md#gaps-the-desktop-needs)). Its example data (provider names, counts, exact strings) are not requirements.
