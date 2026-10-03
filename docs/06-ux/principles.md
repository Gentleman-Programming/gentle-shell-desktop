# UX principles

> Status: draft.

These principles turn the [product principles](../00-vision.md#product-principles) (vision P1–P10) into rules for screens. Each one names the product principle it serves and keeps that principle's provenance tag. This page adds no maintainer claim: a rule tagged **[community]** is proposed for maintainer validation, like vision P9 and P10.

## At a glance

| # | UX principle | Serves | Provenance | Holds in the desktop today? |
|---|---|---|---|---|
| U1 | Speak plainly | vision P2 | **[maintainer]** (mockup intent) | Yes, in the copy that exists |
| U2 | Hide technical detail until asked | vision P2, P7 | **[maintainer]** (mockup intent; milestone M1 and M2 scope), **[gentle-shell]** | Partly: tool output and thinking are not shown at all |
| U3 | Ask for attention only when needed | vision P5 | **[maintainer]** (mockup intent), **[gentle-shell]** | No: one chat at a time |
| U4 | Keep helpers with their chat | vision P4 | **[maintainer]** | Yes |
| U5 | Let the user stop, steer and decide | vision P6 | **[gentle-shell]**, **[maintainer]** (mockup intent) | Partly: stop the main run and answer questions only |
| U6 | Show the workflow and its evidence | vision P7, P1 | **[maintainer]** (mockup intent), **[gentle-shell]** | No |
| U7 | Say where things live; never edit the user's setup silently | vision P3 | **[maintainer]**, **[gentle-shell]** | Partly: first run only |
| U8 | Manage the setup in the app | vision P8 | **[maintainer]** (mockup intent, planned milestone M4) | No |
| U9 | Teach while working | vision P9 | **[community]** | Not assessed |
| U10 | Keyboard parity with the CLI | vision P1, P6 | **[community]** | Partly: three shortcuts |
| U11 | Accessible by default | vision P2 | **[community]**, supported by the mockup's markup | Partly |
| U12 | Go beyond the terminal only through proposals | vision P10 | **[community]** | n/a |

**Citation keys.** `D:` is `gentle-shell-desktop@5ab4a00:src/`. `gs-mockup.html:<line>` is the saved DOM of the concept mockup (intent, not spec). IDs collide across documents (inventory A1–A12 and U1–U8, audit A1–A21, this page's U1–U12), so every ID from another document is qualified: `inventory C4` is a [capability inventory](../05-capability-inventory.md) row, `inventory Q29` one of its [desktop searches](../05-capability-inventory.md#desktop-searches), `gap G1` an [RPC gap](../04-rpc-contract.md#gaps-the-desktop-needs), `audit A3` an [audit finding](../03-architecture/audit.md#findings), `vision P2` and `vision Q5` a [product principle](../00-vision.md#product-principles) and an [open question](../00-vision.md#open-questions-for-the-maintainer). A qualifier covers the IDs listed after it (`vision P2, P7`). `milestone M1` is a desktop milestone, not an inventory row. Bare U1–U12 are this page's principles. Screens that apply each rule are in [screens.md](screens.md).

## U1. Speak plainly

**Rule.** Name things by what they do for the user: "Gentle", "Helpers", "needs you", "Where we are". Keep internal names (RPC methods, file paths, tool names) out of primary copy.

- **Serves:** vision P2 **[maintainer]** (mockup intent).
- **Evidence:** mockup copy `gs-mockup.html:486` ("needs you"), `:522` ("Helpers"), `:617` ("Where we are"), `:565` ("Tell Gentle what you need…").
- **Today:** the desktop reuses this copy: composer placeholder (`D:renderer/features/conversation/components/Composer.tsx:51`), empty thread "Start a conversation with Gentle." (`D:renderer/features/conversation/components/MessageThread.tsx:39`), "needs you" label (`D:renderer/features/chats/components/ChatListItem.tsx:14`).
- **Check for a new screen:** could a person who never opened a terminal read every primary label?

## U2. Hide technical detail until asked

**Rule.** Show outcomes first. Put tool calls, thinking, file paths and versions behind a toggle, in a secondary line, or at the window edges (status bar, small monospace text).

- **Serves:** vision P2 **[maintainer]** (mockup intent for the wording; milestone M1 and M2 scope), vision P7 **[maintainer]** (mockup intent), **[gentle-shell]**.
- **Evidence:** milestone M1 scope "No tool output, no thinking shown" (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:7`); mockup "Show tool details" unchecked (`gs-mockup.html:600`); paths in small monospace under a title (`gs-mockup.html:613`, `:674`, `:683`).
- **Today:** the Helpers footer has the same unchecked toggle (`D:renderer/features/helpers/components/HelpersFooter.tsx:28-31`). In the main chat, tool calls (inventory C17) and thinking (inventory C18) are not rendered at all, so there is nothing to disclose yet.
- **Tension.** U2 says "hide", U6 says "show evidence". `Inference:` the mockup resolves it by showing evidence as a short summary line ("commit 3f1c2a9 · tests green", `gs-mockup.html:630`) and leaving detail one click away.

## U3. Ask for attention only when needed

**Rule.** Several chats can run at once. A chat shows its state in the sidebar; the app interrupts only when a chat needs a decision or finishes something the user is waiting for.

- **Serves:** vision P5 **[maintainer]** (mockup intent), **[gentle-shell]**.
- **Evidence:** sidebar states `gs-mockup.html:481` (working), `:486` (needs you), `:491` (time); notifications "Helper finished" and "Gentle needs a decision" (`gs-mockup.html:828`, `:833`); bell `gs-mockup.html:470`.
- **Today:** the chat list item can show `idle`, `working` or `needs you` (`D:renderer/features/chats/components/ChatListItem.tsx:11-15`), but the main process always reports `idle` (`D:main/domain/session/sessionList.ts:35`); only the mock bridge produces the other two (`D:renderer/shared/bridge/mockBridge.ts:57`, `:65`). There are no notifications.
- **Blocked by:** single-session host (audit A3, gap G9); chat list lifecycle (audit A11); `notify` ignored (inventory C20).

## U4. Keep helpers with their chat

**Rule.** A helper is shown inside the chat that started it, ideally under the message that started it. No global list of helpers.

- **Serves:** vision P4 **[maintainer]**: "Never a global list: the parent-child relation stays direct (maintainer decision, 2026-09-21)" (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:7`; [ADR 0011](../03-architecture/adr/0011-helpers-scoped-per-chat.md)).
- **Evidence:** helpers under the message (`gs-mockup.html:545-550`); per-chat Helpers tab (`gs-mockup.html:520-523`, `:571-606`).
- **Today:** per-chat Helpers tab (`D:renderer/features/conversation/components/ConversationHeader.tsx:28-37`). Rows under the message are replaced by a whole-chat strip because the activity payload has no message linkage (`D:renderer/features/conversation/components/HelpersStrip.tsx:9-16`).
- **Constraint on proposals:** a cross-chat view, such as an all-sessions graph ([proposal 0001](../07-proposals/0001-agent-flow-graph.md)), conflicts with this decision unless the maintainer revisits it.

## U5. Let the user stop, steer and decide

**Rule.** Every running agent has a visible way to stop it. The user answers questions in place, can always answer in their own words, and decides what ships.

- **Serves:** vision P6 **[gentle-shell]**, **[maintainer]** (mockup intent).
- **Evidence:** "Esc to stop the agent" (`gs-mockup.html:568`); helper Stop (`gs-mockup.html:603`); question card with "Let me explain" (`gs-mockup.html:553-558`); "You still decide what happens next in your repository." (`gentle-shell@ac67159:README.md:137`).
- **Today:** Escape aborts the main run (inventory C3); dialog cards answer all four dialog kinds (inventory C19, `D:renderer/features/conversation/components/DialogCard.tsx:39-45`). Helper Stop is disabled (`D:renderer/features/helpers/components/HelpersFooter.tsx:36`). The composer is read-only while the agent works (`D:renderer/features/conversation/components/Composer.tsx:53`), so steering (inventory C4) is not possible.
- **Blocked by:** gap G1 (helper stop); audit A7 (steer and follow-up exist over RPC but the desktop declines them). Whether a prompt sent while working should queue, steer or be declined is open ([vision Q5](../00-vision.md#open-questions-for-the-maintainer)).

## U6. Show the workflow and its evidence

**Rule.** Show where the work is (phase), what is planned (tasks), what proves it (commits, tests, checks) and the review state. Evidence is a fact with a source, not a claim.

- **Serves:** vision P7, P1 **[maintainer]** (mockup intent), **[gentle-shell]** ("A workflow you can inspect.", `gentle-shell@ac67159:README.md:35`).
- **Evidence:** ODD panel (`gs-mockup.html:610-647`); `ODD · RDD on` (`gs-mockup.html:822`).
- **Today:** no ODD panel, no RDD state (inventory O2–O4, R1; inventory Q29–Q32).
- **Blocked by:** gap G2 (structured ODD state), gap G7 (status data).

## U7. Say where things live; never edit the user's setup silently

**Rule.** When a screen reads or writes the user's setup, it says which folder or file, and whether that is the user's pi or the app's own space.

- **Serves:** vision P3 **[maintainer]**, **[gentle-shell]**.
- **Evidence:** "Your pi settings are never edited" (`gs-mockup.html:672`); "Where this lives" (`gs-mockup.html:734-739`); extension scope (`gs-mockup.html:802-807`); "never edits your vanilla pi setup" (`gentle-shell-desktop@5ab4a00:README.md:19`).
- **Today:** the first run shows the detected directory (`D:renderer/features/first-run/components/FirstRun.tsx:45`). Two persisted home choices can disagree (audit A19). `Inference:` a terminal user's `gentle-shell home` choice is ignored by the app, because the app always passes a home flag and a flag beats the launcher config (inventory L2).

## U8. Manage the setup in the app

**Rule.** Sign-ins, default model, extensions and their scope are handled in the window, not only in a terminal.

- **Serves:** vision P8 **[maintainer]** (mockup intent, planned milestone M4: `gentle-shell-desktop@5ab4a00:README.md:63`).
- **Evidence:** Providers and Extensions screens (`gs-mockup.html:692-742`, `:745-810`).
- **Today:** not implemented (inventory M7, M8, E1, E2 missing).
- **Blocked by:** gap G3, G4, G5; the choice between RPC-only and in-process pi ([vision Q4](../00-vision.md#open-questions-for-the-maintainer), audit A1, A2).

## U9. Teach while working

**Rule (proposed).** The app explains what the agent is doing and why, in short plain sentences, so the user learns the workflow by watching it.

- **Serves:** vision P9 **[community]**, supported by **[gentle-shell]** for the persona ("senior architect and teacher", `gentle-shell@ac67159:docs/readme-reference.md:103`).
- **Evidence in the mockup** (`Inference:` read as teaching, not stated as such): the agent narrates its plan (`gs-mockup.html:535-536`, `:543`); step metadata such as "5 tasks", "tests · review" (`gs-mockup.html:620`, `:622`).
- **Status:** proposed. Not maintainer intent until validated ([vision Q9](../00-vision.md#open-questions-for-the-maintainer)).

## U10. Keyboard parity with the CLI

**Rule (proposed).** Frequent CLI actions have a desktop shortcut: send, new line, stop, and over time model and effort, command palette, helpers view, stop helpers.

- **Serves:** vision P1, P6 **[community]**.
- **Why:** gentle-shell's 9 shortcuts (one of them, for `/gentle:stats`, only when `GENTLE_PI_STATS_VIEW_KEY` is set) and pi's keybindings are terminal key bindings; none reach an RPC host, so "the desktop needs its own" ([inventory, command and shortcut coverage](../05-capability-inventory.md#command-and-shortcut-coverage)).
- **Evidence:** the mockup shows three hints (`gs-mockup.html:568`); the desktop implements the same three (`D:renderer/features/conversation/components/Composer.tsx:30-37`, `:61`).
- **Not parity of bindings.** `Inference:` matching the terminal's exact keys is not required; several (`ctrl+c`, `ctrl+d`, `ctrl+z`) mean other things in a desktop app. Which actions get shortcuts is a design decision for the team.

## U11. Accessible by default

**Rule (proposed).** Every control is a real button or input, reachable by keyboard, with a visible focus ring; live regions announce new activity; motion can be reduced; layout works at narrow widths.

- **Serves:** vision P2 **[community]**. Accessibility was named as a competency area for the working group (Discord, Matrak, 2026-09-27).
- **Evidence in the mockup** (markup, not a stated rule): `role="tablist"` (`gs-mockup.html:520`); `aria-live="polite"` on the helper thread and toasts (`:587`, `:825`); `role="switch"` with `aria-checked` (`:766`); focus outline (`:124`); breakpoints at 1100 px and 640 px (`:437-456`).
- **Today:** chat items are buttons for keyboard and screen-reader use (`D:renderer/features/chats/components/ChatListItem.tsx:23-26`); errors use `role="status"` (`D:renderer/features/conversation/components/StatusLine.tsx:14`); text fields remove the outline on focus and use a border color instead (`D:renderer/shared/ui/atoms/TextField.css:17-20`). The audit did not cover accessibility ([audit, method and scope](../03-architecture/audit.md#method-and-scope)).
- **Related:** gentle-shell's animation modes (inventory V9). `Inference:` they map to a reduced-motion setting.

## U12. Go beyond the terminal only through proposals

**Rule (proposed).** A feature with no gentle-shell or pi counterpart (for example a graph view) starts as a file in [07-proposals](../07-proposals/README.md). It reaches a screen only after the maintainer accepts it.

- **Serves:** vision P10 **[community]**.
- **Why:** keeps parity work (the inventory) separate from new ideas, and keeps maintainer intent separate from community framing ([issue #28, "Author's framing: corpus rules"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28), rule 5).

## Open questions

- Are U9–U12 accepted as principles? They depend on [vision Q9 and Q11](../00-vision.md#open-questions-for-the-maintainer).
- U3 depends on the multi-chat decision ([vision Q3](../00-vision.md#open-questions-for-the-maintainer)).

## Sources read

`docs/00-vision.md`; `gs-mockup.html` L4–909; `gentle-shell-desktop@5ab4a00`: `odd/tasks/desktop-m1-chat-core.md`, `odd/tasks/desktop-m2-helpers.md`, `README.md`, `src/renderer/**`, `src/main/domain/session/sessionList.ts`; `gentle-shell@ac67159:README.md`, `docs/readme-reference.md` (gentle-shell `main` at `ac67159`, package version 4.0.0; refreshed 2026-10-03); `docs/05-capability-inventory.md` (command and shortcut coverage); Discord thread (saved copy).
