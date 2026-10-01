# Frontend Renderer Design

This document turns the four reviewed screen references—Chat, Providers, Extensions, and First run—into a renderer design proposal for Gentle Shell. It describes the visual system, screen responsibilities, and integration boundaries with [Pi Session Process Design for Electron](./pi-electron-session-process-design.md). It is a planning artifact, not a record of implemented behavior.

## Design summary

Build one shared desktop shell around four screen experiences. Keep the renderer focused on presentation and user intent; let Electron main own process/session authority, credentials, filesystem resolution, and validation. Treat screenshot-derived styling and product policies below as proposals until confirmed and implemented.

## Shared visual system

The references use a dark plum palette. The following values are visual estimates from the screenshots, not pixel-sampled design tokens. Refine them against source assets before treating them as canonical.

| Token | Provisional value | Intended use |
|---|---|---|
| `background` | `#080609` | Main canvas |
| `surface` | `#110B11` | Sidebar, cards, composer, and status surfaces |
| `border` | `#492334` | Card and control outlines, separators |
| `text-primary` | `#F4EDF2` | Headings and primary content |
| `text-secondary` | `#B39BAE` | Supporting descriptions, timestamps, metadata |
| `accent-pink` | `#E77CC2` | Active navigation, toggles, notification markers |
| `state-success` | `#A7DDBF` | Connected, completed, and healthy indicators |
| `action-blue` | `#A8C9F7` | Primary actions such as Send and Sign in |
| `state-warning` | `#E9B75B` | Update availability and attention states |

Use semantic tokens rather than embedding colors in individual screen components. Define readable hover, focus, disabled, error, and high-contrast states when converting this proposal into a production theme. Do not convey status by color alone; pair status colors with labels or icons.

## Shared application shell

The three primary app screens share a shell composed of:

- **Title bar:** app identity, window controls, and notifications.
- **Conversation navigation:** New chat action and recent conversations grouped by recency, with concise run/status indicators.
- **Primary navigation:** Chats, Providers, and Extensions, including counts or update indicators where useful.
- **Profile/account area:** current user and selected provider/model summary.
- **Status bar:** workspace, branch, model, effort/profile, context/cost, and applicable workflow indicators.
- **Notification stack:** dismissible, concise notices for completion or user decisions.

First run uses a reduced shell: retain app identity and notifications, but omit normal navigation and chat-specific status until setup is resolved. The exact window chrome and cross-platform title-bar behavior remain implementation details.

## Screen designs

### Chat

**Purpose:** let the user navigate conversations, interact with one session, and understand its live progress and state.

**Reference components:**

- Conversation list and New chat action.
- Conversation header with title, task state, and Chat/Helpers view switch.
- Timestamped user and assistant message timeline.
- Message composer, Send action, and keyboard hints.
- Helper activity list with running/completed states.
- Workflow stages, task checklist, and checks/results panel.
- Session/run states such as ready, running, settled, failed, and disconnected.

**Renderer contract:** render a conversation-scoped projection of messages, progress, dialogs, and lifecycle state. Streamed content and terminal run completion are different events. A successful prompt request means accepted/queued, not that generation has completed. Use the settled event/state when the UI needs to indicate that pi will not continue automatically.

**Integration:** identify actions with an opaque app conversation ID. Send prompts, abort runs, answer dialogs, and close conversations only through named preload methods. Never expose raw RPC records, child handles, process output, or a generic IPC channel to the renderer.

### Providers

**Purpose:** show configured model-provider options and let the user connect or manage them.

**Reference components:**

- Page heading and explanatory copy.
- Connected-provider rows with provider, connection type/status, account/model summary, and actions such as Manage or Sign out.
- Add-provider rows with access method and Sign in/Add key actions.
- Notification feedback for connection or authentication actions.

**Renderer contract:** expose safe provider display data and operation outcomes only. Do not return API keys, tokens, credential files, or child-process environment values to the renderer.

**Integration:** provider sign-in, key entry, and configuration need explicitly named and validated application operations. Main owns credential handling and configuration authority. If a provider/model selection affects new RPC children, main applies that configuration during launch using controlled configuration—not renderer-supplied arbitrary environment variables or CLI arguments.

**Not specified by the session-process design:** provider catalog/discovery, authentication flows, credential persistence, account switching, and model availability. Define these in the provider/application contract before implementation.

### Extensions

**Purpose:** manage extension packages and app-level extension settings.

**Reference components:**

- Page heading and explanation that extension changes apply to new chats.
- Package source input (package name, Git URL, or local folder).
- Installed-package rows with source/version, update availability, enabled state, and Update/Remove actions.
- Built-in settings for commands/helpers and themes.
- Scope summary distinguishing global and project-level settings.

**Renderer contract:** extension management operations must be explicit, scoped, validated app operations. Package strings and local paths are untrusted input. Do not expose generic filesystem access or arbitrary package execution through preload.

**Integration:** the session-process design covers a narrower runtime interaction: main validates pi `extension_ui_request` records, routes supported dialogs to the owning renderer, validates the answer against the original allowed values, and sends the response to that same child. Unsupported methods/widgets require a documented allowlist and safe handling. Dialog ownership, cancellation, and timeout behavior must not leave a child blocked indefinitely.

**Not specified by the session-process design:** package installation/update/removal, extension permission model, settings schema, settings scope enforcement, and exact activation/reload semantics. These need a separate app-level contract. The screenshot proposes that changes apply to new chats; preserve this as a product rule only after confirmation.

### First run

**Purpose:** choose how Gentle Shell will source pi configuration and session data before normal use.

**Reference components:**

- Welcome heading and short setup explanation.
- Detection summary when pi is found, including a safe summary of available configuration.
- Two choices: use the existing pi setup, or keep Gentle Shell separate.
- Explanatory tradeoffs for each choice.
- Fallback explanation when pi is not detected.

**Renderer contract:** present the detected state and collect the user's setup choice. Do not make the renderer resolve arbitrary filesystem paths, inspect secrets, or modify pi configuration.

**Integration:** main resolves the launcher, selected pi home/session configuration, working directory, and allowlisted child environment. The session-process design requires deliberate environment construction and main-owned resolution. The setup choice should be persisted as app configuration and applied when sessions are launched. The screenshot says existing pi settings are not edited and separate mode creates an app-owned space; treat those as intended behaviors to validate, not already-guaranteed implementation facts.

## Renderer and process boundary

The screen designs follow this ownership model:

| Concern | Owner | Renderer receives |
|---|---|---|
| Conversation-to-child registry and lifecycle | Electron main | Conversation identity and projected lifecycle state |
| RPC transport and command correlation | Main-process session supervisor | Stable operation outcomes and application events |
| Provider credentials and child environment | Main/configuration services | Safe provider labels and connection status |
| Extension UI request validation and response routing | Main, bound to the owning conversation/child | Supported, validated dialog models and allowed choices |
| View state and user interaction | Renderer | Typed application data; no process or filesystem authority |
| Setup choice | Renderer expresses intent; main validates/resolves it | Detected setup summary and operation result |

Preload should expose named operations that match application needs—for example, create/open conversation, send message, abort run, answer dialog, close conversation, list provider summaries, and perform supported provider/extension setup actions. These are design examples, not an approved API inventory. Avoid raw RPC passthrough, generic `send(channel, payload)`, arbitrary paths/commands, and direct filesystem access.

Events should be conversation-scoped and filtered by main. Where a session can be reopened or reattached, include a generation/attachment identity so late events from an old child cannot update the new view. Subscription APIs should return cleanup functions. Validate all main-to-renderer projections as well as renderer-to-main requests.

## Product decisions still open

The screenshots and session-process design do not resolve these policies. Keep them explicit; do not let component behavior decide them accidentally.

| Decision | Why it matters |
|---|---|
| Keep inactive conversation children alive, or stop/reopen them? | Memory use and session switching behavior |
| Maximum active children and any warning/eviction policy? | Resource limits and user expectations |
| Can multiple windows attach to one conversation? Who owns dialogs and close behavior? | Prevents duplicate writers and ambiguous interaction ownership |
| What are session persistence, deletion, duplicate-open, and recovery semantics? | Defines lifecycle beyond the visible chat screen |
| Which extension UI methods/widgets are supported, and what are timeout/cancel rules? | Prevents unsupported or indefinitely blocking extension interactions |
| What are extension installation permissions and activation semantics? | Package management is outside the current session-process contract |
| Which pi versions and launcher/update policy are supported? | Compatibility and packaged launch behavior |
| Does the session supervisor stay in main, or move to a Utility Process based on evidence? | Reliability/performance tradeoff identified in the process design |
| What is the exact provider/authentication and credential-storage contract? | Provider screen needs secure behavior beyond presentation |
| How is detected pi setup summarized, selected, and persisted? | First-run choice must map to main-owned configuration |

## Suggested implementation sequence

1. Confirm the provisional tokens and define a semantic theme, including focus, error, and disabled states.
2. Define shared shell/navigation components and responsive layout behavior.
3. Define typed renderer-facing contracts for session state, provider summaries, extension actions, and first-run configuration.
4. Implement the First run and Providers/Extensions screens against those contracts, keeping privileged operations in main.
5. Implement Chat against the session supervisor/event contract, including streaming, settled state, dialogs, disconnect, and retry.
6. Verify IPC allowlists, sender validation, listener cleanup, and session isolation; use fake-child tests for transport/supervisor behavior and an Electron integration path for the real boundary.

This is a proposed sequence, not an authorization to implement unresolved product policies. The detailed transport, lifecycle, security, and verification requirements remain in [Pi Session Process Design for Electron](./pi-electron-session-process-design.md) and [Pi RPC Mode](./pi-rpc-mode.md).

## Acceptance checklist for the design

- [ ] Theme values are treated as provisional until checked against source design assets.
- [ ] Shared shell components are distinguished from screen-specific components.
- [ ] Renderer state and actions do not grant process, filesystem, credential, or raw-RPC authority.
- [ ] Chat distinguishes request acceptance, streaming, settled state, and failure/disconnect.
- [ ] Extension dialogs remain bound to their originating conversation/child and validate answers.
- [ ] Provider and extension management APIs are specified separately from session transport.
- [ ] First-run selection is resolved and persisted by app-owned code.
- [ ] Open lifecycle and extension/provider policies are resolved before they become implicit UI behavior.
