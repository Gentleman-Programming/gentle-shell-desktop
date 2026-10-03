# Vision

> Status: draft (awaiting maintainer validation).

> **Community draft.** The community wrote this page from the maintainer's public statements, his repository documents and his concept mockup. Nothing here is decided until the maintainer validates it. Each statement carries a provenance tag, so the maintainer can accept, correct or reject it line by line.

**In one paragraph.** Gentle Desktop is a desktop chat window over pi, run through the `gentle-shell` launcher, which "runs pi with Gentle Shell loaded" **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:19`). Its planned scope is "a plain-chat window over pi with per-chat helpers, ODD progress, providers and extensions"; today only M1 (chat core) and M2 (per-chat helpers) are done **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:3`, `:62-64`). It is for people who want to get work done in a chat window instead of a terminal **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:11`). The community reads its purpose as carrying the gentle-shell experience to the desktop, without becoming another generic agent chat **[community]** (Discord, memoTux, 2026-09-30; Matrak, [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28)).

## How to read this page

| Tag | Source | Weight |
|---|---|---|
| **[maintainer]** | Alan Buscaglia's Discord messages, the maintainer-authored desktop repo documents (`README.md`, `odd/tasks/desktop-m1-*.md`, `odd/tasks/desktop-m2-*.md`), and his concept mockup | Intent. The mockup is **intent, not spec**: its example data never becomes a requirement. |
| **[gentle-shell]** | gentle-shell's own README and docs at `gentle-shell@ac67159` (gentle-shell `main`, package version 4.0.0); quotes first read at `1162ce9` (3.7.0) were re-checked there on 2026-10-03 | What the product the desktop sits on says about itself. |
| **[community]** | Framing from community members (Matrak's framing in [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28) and his review of this page on 2026-10-03, [issue #28, "Author's framing: review of the vision (2026-10-03)"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28); Discord messages from members other than the maintainer) | Proposed for maintainer validation. Not decided. |
| **[open question]** | Raised, not answered | Needs a maintainer decision. |

**Citation keys.** `gentle-shell-desktop@5ab4a00:` is the desktop repo `main`. `gentle-shell@ac67159:` is gentle-shell `main` at `ac67159` (npm package `gentle-pi`, package version 4.0.0). `gs-mockup.html:<line>` is the saved DOM of the concept mockup at https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL. Refreshed pins of 2026-10-03: `pi@a13d35a:` is pi 1.0.0, and `gentle-ai@ff77164:` is gentle-ai v4.0.0. Discord dates are converted from the thread's `d/m/yy` format.

**The maintainer pointed to the mockup when asked for his vision.** When a member asked him for "un vaciado de tus ideas, objetivos y límites" (a dump of your ideas, goals and limits; Discord, memoTux, 2026-09-26), he replied "No necesitan jejeje" (you don't need it), linked the mockup, wrote "En un rato lo pongo público el repo" (I will make the repo public shortly), then "Pero sería esto" (but it would be this) **[maintainer]** (Discord, Alan Buscaglia, 2026-09-26). `Inference:` "esto" (this) most likely refers to the mockup he had just linked; given the message order, it may also include the repository. He also called the current app "muy en pañales pero anda al menos" (very early-stage, but at least it works) **[maintainer]** (Discord, Alan Buscaglia, 2026-09-26).

## Philosophy of gentle-shell

**In gentle-shell's own words** **[gentle-shell]**:

- "Your coding agent for controlled development in the workspace you lead." (`gentle-shell@ac67159:README.md:9`)
- "Your terminal can run an agent. Your workspace should help you lead it." (`gentle-shell@ac67159:README.md:33`)
- "One workspace. A coding agent you direct. A workflow you can inspect." (`gentle-shell@ac67159:README.md:35`)
- gentle-shell turns a pi session into a workspace "so you lead the work instead of chasing it." (`gentle-shell@ac67159:README.md:97`)
- "Say what you need once, then keep moving. el Gentleman helps turn intent into clear scope, a sensible next step, and evidence people can review — without making every task feel like a process meeting." (`gentle-shell@ac67159:README.md:107`)
- The el Gentleman persona "Makes Pi behave like a senior architect and teacher, not a generic chatbot." (`gentle-shell@ac67159:docs/readme-reference.md:103`)
- ODD is "the everyday path": the agent "explores before changing anything, clarifies only real decisions, and keeps small understood work small." (`gentle-shell@ac67159:README.md:127`)
- Native review: "You still decide what happens next in your repository." (`gentle-shell@ac67159:README.md:137`)
- Package description: "Turn Pi into el Gentleman: an ODD development harness with focused subagents, configured TDD evidence, native review, and skill discovery." (`gentle-shell@ac67159:package.json:4`)
- GitHub repository description: "Gentle Shell is a Pi-native coding-agent harness for controlled development with Organic Driven Development, optional SDD/OpenSpec, subagents, TDD evidence, review guardrails, skills, and memory integrations." (`gh repo view Gentleman-Programming/gentle-shell --json description`, fetched 2026-10-01; repository metadata, not a file at `ac67159`)

**The community's summary** **[community]** (Matrak, [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28)): gentle-shell aims at **total control in the friendliest possible way**. It is a harness and a workflow that **guides and teaches**, whatever the task or domain, while staying controllable and customizable.

`Inference:` the two readings agree on control ("you lead", "you direct", "you still decide") and on teaching (the persona as "teacher"). "Friendliest possible way" and "whatever the task or domain" are the community's words; gentle-shell's own docs describe a *coding* agent.

## What Gentle Desktop is

- **A plain-chat window over pi** with per-chat helpers, ODD progress, providers and extensions, as planned scope; see "Where it stands" below for what exists today **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:3`).
- **A client of your gentle-shell / pi setup.** Replying to a tester on Windows, the maintainer wrote: "nice! tenes que apuntar pi a los pr que dice en la docu / y te anda / es que eso lo que hace es hacer sync con pi / entonces de porsi tenes que tener pi todo con gentle-ai configurado / pero la version de los pr" (you have to point pi to the PRs the docs mention and it works; what it does is sync with pi, so you need pi fully configured with gentle-ai, but the PR version) **[maintainer]** (Discord, Alan Buscaglia, 2026-09-26 22:31). The pointer to "the PRs" was a setup instruction for testers at that date; the lasting point is that the app syncs with an existing pi set up with gentle-ai. Today it requires the `gentle-shell` launcher from gentle-pi 3.7.0 or newer **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:12`).
- **Built with Electron + React**, "chosen by the maintainer on 2026-09-21" **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:18`). See [ADR 0001](03-architecture/adr/0001-electron-react-typescript-stack.md).
- **The concept mockup shows four screens:** Chats, Providers, Extensions and First run **[maintainer]** (`gs-mockup.html:462`). Within them it shows:
  - several chats with a status each, such as "working" and "needs you" (`gs-mockup.html:481`, `:486`), and notifications: one about a helper of the open chat (`gs-mockup.html:828`) and one about another chat that needs a decision (`:833`);
  - helpers under the message that started them, and a Helpers tab with a narrated timeline and a Stop button (`gs-mockup.html:546-549`, `:573-603`);
  - question cards answered inline, including "Let me explain" (`gs-mockup.html:554-558`);
  - an ODD panel with the steps Explore, Plan, Build, Verify, Deliver, tasks with commit and test evidence, and checks (`gs-mockup.html:617-644`);
  - a status bar with folder, branch, model, effort, profile, context, cost and `ODD · RDD on` (`gs-mockup.html:814-822`);
  - providers (subscriptions, API keys, local models) and a default model for new chats (`gs-mockup.html:694-731`);
  - extensions managed in the app, with global and per-project scope (`gs-mockup.html:747-806`);
  - a first-run choice between "Use my pi setup" and "Keep it separate" (`gs-mockup.html:668`, `:677`).
- **Where it stands:** M1 (chat core) and M2 (per-chat helpers) are done; the ODD panel (M3), providers and extensions screens (M4), signing (M5) and notifications and status bar (M6) are not **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:3`, `:62-64`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:22`). The [capability inventory](05-capability-inventory.md#coverage-summary) counts how much of pi and gentle-shell has a desktop surface today.

## What Gentle Desktop is not

- **Not a terminal.** "Gentle Shell exists only inside pi's TUI. People who only want to get work done need a chat window, not a terminal." **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:11`)
- **Not a tool-output viewer by default.** M1 scoped the chat as "No tool output, no thinking shown." **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:7`). The mockup keeps tool details behind an unchecked "Show tool details" toggle **[maintainer]** (`gs-mockup.html:600`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:18`).
- **Not a global helper dashboard.** "Never a global list: the parent-child relation stays direct (maintainer decision, 2026-09-21)." **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:7`; [ADR 0011](03-architecture/adr/0011-helpers-scoped-per-chat.md))
- **Not something that edits your pi install.** The launcher "never edits your vanilla pi setup" **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:19`). The mockup says "Your pi settings are never edited", and lists "Your vanilla pi" as "untouched" **[maintainer]** (`gs-mockup.html:672`, `:738`).
- **Not another generic agent chat** like Codex desktop or t3 **[community]** (Matrak, [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28); Discord, gc, 2026-09-29, asked how to avoid "una  app mas tipo  codex desktop o t3"). The maintainer has not said this in the thread.
- **Not, for now, a remote or mobile client.** Community members proposed multiplatform, mobile and remote-agent ideas (gentle-mesh) **[community]** (Discord, memoTux, 2026-09-26; Rafael The Hutt, 2026-09-27). The maintainer did not respond to them, and the corpus keeps them [outside scope](01-glossary.md#community-terms-outside-scope) **[open question]**.

## Product principles

Each principle cites its sources. A principle tagged only **[community]** is **proposed for maintainer validation**.

| # | Principle | Provenance | Sources |
|---|---|---|---|
| P1 | **Bring gentle-shell's harness, not a bare chat.** The app surfaces what gentle-shell adds: helpers, ODD progress, review state, providers, extensions. | **[maintainer]** for the feature list; **[community]** for the framing "carry the gentle-shell experience to the desktop" | `gentle-shell-desktop@5ab4a00:README.md:3`; `gs-mockup.html:617-644`, `:822`; Discord, memoTux, 2026-09-30 ("la idea de Alan es traer la experiencia de gentle-shell (terminal) a desktop", Alan's idea is to bring the gentle-shell terminal experience to the desktop); [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28) |
| P2 | **Plain language first; technical detail at the edges.** The app speaks of "Gentle", "Helpers" and "needs you". The main chat shows no tool output and no thinking; a helper's thread collapses tool calls behind a "Show tool details" toggle and shows the helper's plan as a "Plan" row. | **[maintainer]** (mockup intent) for the wording; **[maintainer]** for the M1 and M2 scope | `gs-mockup.html:486`, `:522`, `:589`, `:600`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:7`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:12`, `:18`; `gentle-shell-desktop@5ab4a00:README.md:82` |
| P3 | **Never break the user's environment.** The user's pi setup is reused or left alone, never edited. | **[maintainer]**, **[gentle-shell]** | `gentle-shell-desktop@5ab4a00:README.md:19`, `:25`; `gs-mockup.html:672`, `:680`, `:738`; `gentle-shell@ac67159:README.md:237` ("without installing it into your pi agent or editing its `settings.json`") |
| P4 | **Helpers belong to the chat that started them.** | **[maintainer]** | `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:7`; `gentle-shell-desktop@5ab4a00:README.md:86-87` |
| P5 | **Delegate instead of babysit; ask for attention only when needed.** The concept mockup shows one chat "working" while another "needs you", and a "Gentle needs a decision" notification. | **[maintainer]** (mockup intent), **[gentle-shell]** | `gs-mockup.html:481`, `:486`, `:543` ("I handed two pieces to helpers so this goes faster."), `:833`; `gentle-shell@ac67159:README.md:157` ("Delegating work should not mean losing it.") |
| P6 | **The user stays in control.** The agent can be stopped, questions are answered by the user, and the user decides what ships. | **[gentle-shell]**, **[maintainer]** (mockup intent) | `gentle-shell@ac67159:README.md:9`, `:137`; `gs-mockup.html:558` ("Let me explain"), `:568` ("Esc to stop the agent"), `:603` |
| P7 | **Make the workflow and its evidence visible.** Progress is shown as steps, tasks with commits and tests, and checks. | **[maintainer]** (mockup intent), **[gentle-shell]** | `gs-mockup.html:617-644`; `gentle-shell@ac67159:README.md:35` ("A workflow you can inspect."), `:127` |
| P8 | **Manage the setup in the app.** Sign-ins, models and packages are handled in the window, not only in the terminal. | **[maintainer]** (mockup intent and planned M4) | `gs-mockup.html:694-806`; `gentle-shell-desktop@5ab4a00:README.md:63` |
| P9 | **Guide and teach.** The app helps the user learn while working, as gentle-shell's persona does. | **[community]**, supported by **[gentle-shell]** for the persona | [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28); `gentle-shell@ac67159:docs/readme-reference.md:103` ("senior architect and teacher") |
| P10 | **Go further where a GUI beats a terminal.** Examples proposed: an agent/subagent graph view, interacting with a running node, and asking a finished **helper** why it did something. The reviewer clarified that P10 means a finished helper (a subagent the main agent delegated to), not the main session ([issue #28, "Author's framing: review of the vision (2026-10-03)"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28), item 1). See "Asking a finished helper" below. | **[community]** | Matrak, [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28) and [issue #28, "Author's framing: review of the vision (2026-10-03)"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28); [proposal 0003](07-proposals/0003-post-hoc-audit-by-questions.md); ideas belong in [07-proposals](07-proposals/README.md) until accepted |

**Asking a finished helper (vision P10).** What gentle-shell `main` (`ac67159`, package version 4.0.0) and pi 1.0.0 provide today, from their code and docs (only the quotes from gentle-shell's docs carry **[gentle-shell]**):

- **Each helper is its own pi session.** gentle-shell spawns a separate pi process per helper with `--mode rpc --session-dir <dir>` (`gentle-shell@ac67159:lib/agents-runner.ts:258-259`, `:501-502`). That directory is `<agent home>/gentle-agents/sessions` (`gentle-shell@ac67159:extensions/gentle-agents.ts:124-127`, `:1266`). The docs say: "Child sessions live under `~/.pi/agent/gentle-agents/sessions/`" **[gentle-shell]** (`gentle-shell@ac67159:docs/gentle-shell.md:233`).
- **The main agent can reopen a finished helper.** The `subagent_continue` tool is described as "Resume a finished subagent task in its own session with a follow-up prompt." (`gentle-shell@ac67159:extensions/gentle-agents.ts:1615`). It refuses a task that is not finished or has no session path (`:1622`). Otherwise it relaunches the helper with `--session <sessionPath>` (`:1631`; `gentle-shell@ac67159:lib/agents-runner.ts:261`). This is a model tool: the main agent calls it, not the user. It is registered with `pi.registerTool` under the `subagent_` prefix (`gentle-shell@ac67159:extensions/gentle-agents.ts:62`, `:1402-1404`), and helper processes, which gentle-shell spawns with `GENTLE_PI_AGENTS_CHILD=1` (`gentle-shell@ac67159:lib/agents-runner.ts:216`, `:473`), do not register it (`gentle-shell@ac67159:extensions/gentle-agents.ts:152`, `:338-345`).
- **The TUI does not resume a helper for the user.** In the agents overlay, "Open writes a markdown transcript for `$EDITOR`, not a resumed child session." **[gentle-shell]** (`gentle-shell@ac67159:docs/gentle-shell.md:227`).
- **pi can open a session file by path.** `--session <path|id>` "Opens by file path, exact ID, or partial ID" (`pi@a13d35a:packages/coding-agent/docs/cli.md:90-91`). By default pi stores sessions under `~/.pi/agent/sessions/`, grouped by working directory (`pi@a13d35a:packages/coding-agent/docs/sessions.md:50`).

`UNVERIFIED:` whether a user can reopen a helper session with `pi --session <helper session file>`. Checked: the docs above. Not run. `Inference:` (code read, not run) pi's `/resume` picker in the parent session does not list helpers. With the default session directory, the picker lists the current folder's sessions and `SessionManager.listAll()` (`pi@a13d35a:packages/coding-agent/src/modes/interactive/interactive-mode.ts:5636-5645`), and `listAll()` scans only the subdirectories of `<agent dir>/sessions` (`pi@a13d35a:packages/coding-agent/src/config.ts:607-608`; `pi@a13d35a:packages/coding-agent/src/core/session-manager.ts:1945-1956`). Helper sessions live in `<agent home>/gentle-agents/sessions` (above), outside that directory. The reviewer's reading, that a helper is a normal pi session the user could resume, is kept as **[community]** framing (Matrak, [issue #28, "Author's framing: review of the vision (2026-10-03)"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28), item 1). [Proposal 0003](07-proposals/0003-post-hoc-audit-by-questions.md) works out the requirements for an "Ask why" action, including a read-only run.

## Who it is for

- **People who want to get work done without a terminal** **[maintainer]** (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:11`).
- **Existing pi users**, who can reuse their sign-ins, models and chats; the mockup marks "Use my pi setup" as recommended **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:25`; `gs-mockup.html:668-674`).
- **People without pi, or who want a separate space** **[maintainer]** (`gentle-shell-desktop@5ab4a00:README.md:26`; `gs-mockup.html:677-687`).
- **People who use gentle-ai through other agents because the terminal holds them back** **[community]** (Matrak, review of 2026-10-03). The reviewer's argument: many people feel friction and lack confidence with the terminal. They use gentle-ai through other editors and agents instead; he names Cursor, Codex and Antigravity. The factual part is sourced: gentle-ai lists 17 integrations, including Pi, Codex, Cursor and Antigravity (`gentle-ai@ff77164:README.md:89-109`). The reviewer expects two benefits:
  1. A better experience for this profile, and a way to attract people who do not adopt gentle-shell because of terminal friction.
  2. A step toward eventually narrowing support to pi plus the two or three main agents, instead of keeping residual CLI agents. This is the reviewer's opinion, not maintainer intent. It implies a support-policy decision for gentle-ai, so it is listed as vision Q12.
- **Teams that share project settings through the repository?** The mockup's Extensions screen shows two settings scopes: global, and "Per project … .pi/settings.json (shared with your team)" (`gs-mockup.html:802-806`). In pi, `.pi/settings.json` is the project-level settings file (`pi@a13d35a:packages/coding-agent/docs/configuration.md:30`). `Inference:` because it sits inside the project folder, it can be committed and shared with everyone who works on the repo. The mockup states "Content is example data." (`gs-mockup.html:462`), so this line does not establish teams as an audience. Open question, listed as vision Q13: is team-shared project configuration a target use case for the app? **[open question]**
- **How accessible versus how complete** is unresolved. DanielOtero31 recalled the maintainer saying on a stream the day before that "la idea es que fuera más accesible pero que no tendrá tantas opciones como el gentle-pi" (the idea was for it to be more accessible but without as many options as gentle-pi), and asked whether that was right or whether it would be full-featured. This is second-hand evidence of the maintainer's leaning; he did not answer in the thread **[open question]** (Discord, DanielOtero31, 2026-09-26).

## What sets it apart

The sources say little about other apps. This section stays within what they say.

- **Codex desktop and t3.** A community member asked what would keep Gentle Desktop from being "una  app mas tipo  codex desktop o t3" (one more app like Codex desktop or t3) **[community]** (Discord, gc, 2026-09-29; [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28)). One member said he was waiting for "t3 code con pi" **[community]** (Discord, vudumstead, 2026-09-27). No source describes how those apps work, so this page does not compare features with them.
- **What the sources do name as distinctive** (`Inference:` drawn from the principles above, not from a comparison):
  - The concept mockup surfaces gentle-shell's harness in the window: ODD (`gs-mockup.html:617-644`, `:822`), helpers (`:522`, `:545-549`), review state (`:643`, `:822`) and the active profile (`:819`) **[maintainer]** (mockup intent). gentle-shell names ODD, subagents and native review in its package description (`gentle-shell@ac67159:package.json:4`) and profiles in its README (`gentle-shell@ac67159:README.md:167`) **[gentle-shell]**.
  - Helpers stay tied to their chat **[maintainer]** (P4).
  - It sits on the user's own pi setup without editing it **[maintainer]**, **[gentle-shell]** (P3).
- **A workflow that teaches, can be audited and can be customized** **[community]** (Matrak, review of 2026-10-03). The reviewer's argument: the user can see what runs under a request (ODD, RDD, strict TDD), audit it and customize it. The sources say these parts exist in gentle-shell 4.0.0 **[gentle-shell]**:
  - **Teaching:** the el Gentleman persona "Makes Pi behave like a senior architect and teacher, not a generic chatbot." (`gentle-shell@ac67159:docs/readme-reference.md:103`).
  - **A visible workflow:** "A workflow you can inspect." (`gentle-shell@ac67159:README.md:35`). ODD is "the everyday path"; substantial work gets one feature document so "progress, evidence, and the next step survive an interruption" (`gentle-shell@ac67159:README.md:127`).
  - **Review:** native review "returns risk-scoped evidence" and "You still decide what happens next in your repository." (`gentle-shell@ac67159:README.md:137`). RDD is opt-in, through `/gentle:review-mode enable` (`gentle-shell@ac67159:README.md:291`).
  - **Strict TDD:** "Enabled TDD requires observed evidence; a test command alone does not enable it." (`gentle-shell@ac67159:docs/readme-reference.md:107`).
  - **Customization:** named profiles route models and effort, and a repository can pin its profile (`gentle-shell@ac67159:README.md:163-167`). `/gentle:models` finds project and user agent definitions (`gentle-shell@ac67159:docs/readme-reference.md:712-718`).

  `Inference:` P7 (visible evidence), P9 (teaching) and P10 (asking a finished helper why) are where the desktop could show this. The reviewer contrasts this with Codex, where in his view the user does not know what runs under a request. That is his opinion: no source in the corpus describes how Codex works, so this page makes no feature comparison.

## Open questions for the maintainer

Decisions the corpus found unrecorded that change what the product is. The architecture-level detail is in [ADR "Undecided / not recorded"](03-architecture/adr/README.md#undecided--not-recorded) and the [audit](03-architecture/audit.md).

| # | Question | Why it matters | Evidence |
|---|---|---|---|
| Q1 | Accessible with fewer options, or full-featured like gentle-pi? | Sets the scope of every screen and the inventory's targets. | Discord, DanielOtero31, 2026-09-26: second-hand report of the maintainer's stream ("más accesible pero que no tendrá tantas opciones como el gentle-pi"); unanswered in the thread |
| Q2 | Does the app ship its own runtime, or require an installed `gentle-shell`? | The mockup says "the app runs its own copy of pi, so nothing else has to be installed" (`gs-mockup.html:687`); the README requires a global install (`gentle-shell-desktop@5ab4a00:README.md:12-17`); the maintainer told a tester the app syncs with pi, so pi must be set up with gentle-ai (Discord, Alan Buscaglia, 2026-09-26 22:31). | [ADR not recorded: bundled vs external runtime](03-architecture/adr/README.md#undecided--not-recorded) |
| Q3 | Several chats at once: one child process per chat, or a shared host? | The mockup shows concurrent chats; the code holds one session. | [Audit A3](03-architecture/audit.md#a3-single-session-host-with-positional-message-ids); [audit: risks for scaling the UI](03-architecture/audit.md#risks-for-scaling-the-ui) |
| Q4 | Should the app reach pi only through gentle-shell RPC, or also import pi in-process? | Decides version coupling and how providers and extensions screens are built. | [ADR not recorded: RPC-only vs mixed](03-architecture/adr/README.md#undecided--not-recorded); [audit A1](03-architecture/audit.md#a1-two-data-paths-to-pi-and-a-global-pi_coding_agent_dir-mutation) |
| Q5 | A prompt sent while the agent works: queue, steer or decline? | Shapes how the user directs a running agent (P6). | [Audit A7](03-architecture/audit.md#a7-prompts-declined-while-working-despite-steer-and-follow-up) |
| Q6 | What versions of gentle-shell and pi does the app support, and what happens below the minimum? | Users on older setups get silent failures today. | [Audit A8](03-architecture/audit.md#a8-no-version-handshake) |
| Q7 | Should the first-run home choice be shared with gentle-shell's own setting? | Two saved choices can disagree, against P3. | [Audit A19](03-architecture/audit.md#a19-two-persisted-home-choices) |
| Q8 | How do profiles appear in the app? | Profiles are first-class in gentle-shell (`gentle-shell@ac67159:README.md:167`); the mockup shows them only in the status bar and the default model (`gs-mockup.html:731`, `:819`). | [issue #28, "Author's framing: reading the concept mockup"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28) |
| Q9 | Are "beyond the terminal" ideas (P10) in scope, and is mobile or remote access in scope? | Decides whether P9 and P10 become principles. | [issue #28, "Author's framing: philosophy"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28); Discord, Rafael The Hutt, 2026-09-27 |
| Q10 | What is the product called? | The corpus says "Gentle Desktop", the Discord thread's title. The maintainer's documents say "Gentle Shell Desktop" and "the Gentle Shell desktop app" (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:1`; `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:1`; `gentle-shell-desktop@5ab4a00:README.md:3`). The mockup window is labelled "Gentle Shell desktop" (`gs-mockup.html:465`), and the mockup and the built app show "gentle shell" (`gs-mockup.html:468`, `:654`; `gentle-shell-desktop@5ab4a00:README.md:55`). The repo is `gentle-shell-desktop`. | — |
| Q11 | Do you accept P1 to P10 as written? | This page is a draft until validated. | — |
| Q12 | Is the desktop meant to serve people who use gentle-ai through other agents because of terminal friction, and is it a step toward narrowing gentle-ai's support to pi plus two or three main agents? | The second part is a support-policy decision for gentle-ai, which lists 17 integrations today. | Matrak, review of 2026-10-03 **[community]**; `gentle-ai@ff77164:README.md:89-109` |
| Q13 | Is team-shared project configuration (`.pi/settings.json` in the repository) a target use case? | Decides whether the settings and extensions screens must show which changes reach teammates. | `gs-mockup.html:802-806` (example data); `pi@a13d35a:packages/coding-agent/docs/configuration.md:30` |

## Sources

**Maintainer**
- Discord thread "Gentle Desktop" (Gentleman Programming Discord), Alan Buscaglia, 2026-09-26 (mockup link, repo link, setup reply, "muy en pañales") and 2026-09-27 (contribution process).
- Concept mockup: https://claude.ai/artifact/CCpKaRTkrnDrWoErY27KEL; saved DOM `gs-mockup.html`, product markup lines 459-909.
- `gentle-shell-desktop@5ab4a00:README.md`
- `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md`
- `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md`

**gentle-shell**
- `gentle-shell@ac67159:README.md`
- `gentle-shell@ac67159:docs/readme-reference.md`
- `gentle-shell@ac67159:package.json`
- GitHub repository description of `Gentleman-Programming/gentle-shell`, via `gh repo view --json description` on 2026-10-01.
- gentle-shell `main` at `ac67159` (package version 4.0.0), added 2026-10-03; the three files above were first read at `1162ce9` (3.7.0) and their quotes re-checked at `ac67159`: `gentle-shell@ac67159:docs/gentle-shell.md`, `gentle-shell@ac67159:extensions/gentle-agents.ts`, `gentle-shell@ac67159:lib/agents-runner.ts`

**pi and gentle-ai** (added 2026-10-03)
- `pi@a13d35a:packages/coding-agent/docs/cli.md`, `pi@a13d35a:packages/coding-agent/docs/sessions.md`, `pi@a13d35a:packages/coding-agent/docs/configuration.md`
- `gentle-ai@ff77164:README.md`

**Community**
- Matrak's framing, published in [issue #28](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28), sections "Author's framing: philosophy" and "Author's framing: reading the concept mockup".
- Matrak's review of this page, 2026-10-03 ([issue #28, "Author's framing: review of the vision (2026-10-03)"](https://github.com/Gentleman-Programming/gentle-shell-desktop/issues/28)): P10 means a finished helper; the audience of people who use gentle-ai through other agents; the "teaches, auditable, customizable" differentiator.
- Discord thread, members other than the maintainer: memoTux (2026-09-26, 2026-09-30), DanielOtero31 (2026-09-26), vudumstead (2026-09-27), Rafael The Hutt (2026-09-27), gc (2026-09-29).

**Corpus**
- [Capability inventory](05-capability-inventory.md), [architecture audit](03-architecture/audit.md), [ADR index](03-architecture/adr/README.md).
