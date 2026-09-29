# Architecture

This document describes the **static structure** of `gentle-shell-desktop`: what
the parts are, which layers exist, and where the boundaries sit. Runtime flows,
protocols and lifecycle behaviour live in [`system-design.md`](./system-design.md).

## 1. What the application is

A thin Electron desktop client for a terminal-first agent runtime. The app does
not embed the agent: it spawns the `gentle-shell` launcher (shipped by
`gentle-pi`) as a child process in pi's `--mode rpc` JSON-line mode and renders a
plain chat UI over that stream.

```
gentle-shell-desktop ──spawn──> gentle-shell --mode rpc ──> pi (coding agent)
```

The launcher indirection is the key architectural choice. It buys two things:

- **Home selection** without the desktop app knowing pi internals: `--link`
  (reuse `~/.pi/agent`) vs `--isolated` (`~/.gentle-shell/agent`).
- **Decoupling and versioned coupling**: the desktop app depends on the launcher
  contract, not on pi's module graph. The requirement is documented as
  gentle-pi 3.7.0 or newer.

The app is a *client of the launcher*, never a pi host.

## 2. Runtime topology: three processes, one typed contract

Electron runs three isolated JS contexts that cannot share runtime state. The
architecture treats that constraint as the primary modularity axis.

```
┌───────────────────────── MAIN (Node) ─────────────────────────┐
│  ChatHost ──> PiSession ──> child: gentle-shell --mode rpc    │
│  SetupService · app config (userData/config.json)             │
│  SessionStore (pi SessionManager.listAll)                     │
└───────────────────────────┬───────────────────────────────────┘
              ipcMain.handle  /  webContents.send
┌───────────────────────────▼───────────────────────────────────┐
│  PRELOAD (sandboxed, contextIsolation)                        │
│  createBridge(ipcRenderer) ──> window.gentle                  │
└───────────────────────────┬───────────────────────────────────┘
              window.gentle (typed GentleBridge)
┌───────────────────────────▼───────────────────────────────────┐
│  RENDERER (browser-like, no Node)                             │
│  React feature containers · mockBridge fallback               │
└───────────────────────────────────────────────────────────────┘
```

Boundaries are enforced in `src/main/index.ts` via `contextIsolation: true` and
`nodeIntegration: false`. The preload script exposes exactly one object
(`src/preload/index.ts`), and the renderer reaches the main process only through
`window.gentle`.

## 3. The Scope Rule across processes

`src/shared/` exists because of one rule: **code used by 2+ consumers is shared,
not duplicated locally**. On the main side the "consumers" are processes, so the
rule is applied at process granularity rather than feature granularity.

| File | Why it is shared |
| --- | --- |
| `src/shared/bridge-types.ts` | `GentleBridge` contract plus every domain type that crosses the boundary (`ChatState`, `ChatSummary`, `Dialog`, `DialogAnswer`, `PromptResult`, `HelpersActivity`, `HomeMode`, `PiDetection`, `SetupStatus`, ...) |
| `src/shared/ipc-channels.ts` | Channel names, needed by both `registerHandlers` and the preload bridge |
| `src/shared/chatGrouping.ts` | Day bucketing used by both the main-side session mapping and the renderer sidebar |

The doc comments in `bridge-types.ts` are a running record of each type being
*promoted* out of `src/main` the moment a second process needed its shape. That
is the rule being applied, not incidental commentary.

## 4. Main process: ports and adapters (hexagonal)

Three concentric layers, defined in `src/README.md`:

| Layer | Path | Responsibility |
| --- | --- | --- |
| Domain (pure) | `src/main/domain/` | Chat reducer, RPC codec, history mapping, helpers parser, home rules, bounded stop |
| Ports | `src/main/ports/index.ts` | `ProcessSpawner`, `LauncherLocator`, `SessionStore`, `HomeSettings`, `SetupService` |
| Adapters | `src/main/adapters/` | Node/Electron implementations, composed in `src/main/index.ts` |

```
             domain (pure, no Node/Electron imports)
                ▲                         ▲
                │ depends on              │
             ports (interfaces) ──implemented by──> adapters (Node/Electron)
```

This layering is load-bearing, not decorative. `PiSession` imports only
`ProcessSpawner` and `LauncherLocator`, so the entire RPC client can be exercised
with a fake spawner and recorded fixtures. The domain's single impure input is
deliberate and localized: `PiSession` supplies the wall-clock `now` to the
otherwise pure `reduceChat`.

### Domain inventory

| Module | Purity | Role |
| --- | --- | --- |
| `domain/rpc/codec.ts` | pure | `encodeCommand`, `LineSplitter`, tolerant `decodeLine` |
| `domain/rpc/chatReducer.ts` | pure | `reduceChat(state, event, now?)` fold |
| `domain/rpc/history.ts` | pure | `get_messages` payload → `ChatMessage[]` |
| `domain/rpc/helpersActivity.ts` | pure | `gentle-agents.activity/v1` → `HelpersActivity` |
| `domain/home/home.ts` | pure-ish (injected `env`/`homedir`/`exists`) | Home mode rules, pi detection |
| `domain/lifecycle/boundedStop.ts` | pure | Race an async stop against a timeout |
| `domain/session/PiSession.ts` | **impure boundary** | Child process, stream decode, state emission |
| `domain/session/ChatHost.ts` | impure | Session lifecycle and broadcast, one session at a time |

## 5. Renderer: Screaming Architecture

Feature folders are named after what the app does, not after technical layers.

```
src/renderer/
  app/           App.tsx        shell, screen routing, activeChat selection
  features/
    chats/       sidebar: day-grouped chat list, state pills
    conversation/ thread, composer, status line, header, dialog cards
    helpers/      per-chat subagent tab (list + narrated thread)
    first-run/    link vs isolated home choice
  shared/
    ui/atoms/     Button, Pill, TextField
    theme/        Gentleman-Cute tokens and theme resolution
    bridge/       useBridge(), mockBridge
    markdown/     marked + DOMPurify rendering
```

Two structural rules from `src/README.md`:

- **Container / presentational split.** Each feature has a
  `<Feature>Container.tsx` that owns state and calls `useBridge()`; components
  under `components/` receive props only. This confines the IPC surface to one
  file per feature and keeps presentational pieces testable without Electron.
- **No speculative sharing.** `src/renderer/shared/` holds only code genuinely
  used by two or more features today.

`features/helpers` is its own folder even though only `conversation` imports it:
it is a distinct concern (a chat's subagents, not its messages) and is named for
what it does rather than buried under another feature's `components/`.

## 6. State ownership

There is no global store. State lives at the narrowest owner that needs it:

| State | Owner |
| --- | --- |
| Active chat selection | `App.tsx` (local `useState`) |
| Current conversation (`ChatState`) | `ConversationContainer`, fed by `bridge.onState` |
| View pane (Chat \| Helpers) | `ConversationContainer` |
| Selected helper, Follow live, tool details | `HelpersContainer` (pure view state, no bridge calls) |
| Home choice | Persisted in main, exposed through `SetupService` |

The system-level consequence: the renderer holds **no authoritative state of its
own**. The thread renders only pushed `ChatState`, and errors render in a
`StatusLine` rather than as synthetic messages. Because everything arrives
through `GentleBridge`, the same renderer runs unchanged against
`mockBridge` in a plain browser (`pnpm dev:web`).

## 7. Configuration and storage

Two distinct persistence concerns, deliberately separated:

| Concern | Location | Implementation |
| --- | --- | --- |
| App choice (link vs isolated) | Electron `app.getPath("userData")/config.json` | `adapters/appConfigStore.ts`; tolerant read, corrupt or missing file means "no choice yet" |
| Chat sessions (source of truth) | pi's own home directory | `adapters/piSessionStore.ts` over `SessionManager.listAll()` |

Home resolution is centralized in `src/main/domain/home/home.ts` so the launcher
flags and the local session reader can never drift apart:

- `resolveHomeMode` — absent choice defaults to **isolated**.
- `resolveHomeArgs` — `--link` / `--isolated`, with `GENTLE_SHELL_HOME`
  overriding to `--home <dir>`.
- `homeDirFor` — the directory this process's own `SessionStore` reads.
- `detectPi` — first run is only offered when a pi home actually exists.

## 8. Build topology

`electron-vite` produces three independent bundles because they run in three
different runtimes (`electron.vite.config.ts`):

| Bundle | Runtime | Notes |
| --- | --- | --- |
| main | Node (Electron main) | `externalizeDepsPlugin` keeps Node/Electron deps external |
| preload | sandboxed bridge | same externalization |
| renderer | browser-like | React plugin, HTML entry, `@renderer` alias |

Path aliases: `@shared` in all three bundles, `@renderer` in the renderer and in
`vitest.config.ts`.

Tests run in a single `vitest` invocation: Node environment by default, with
renderer files opting into jsdom per file via `// @vitest-environment jsdom`,
because Vitest 5 removed `environmentMatchGlobs`.

## 9. Security boundaries

The inferred threat model treats **model output and the child process stream as
untrusted input** to the UI.

- Renderer is sandboxed: `contextIsolation: true`, `nodeIntegration: false`.
- Assistant Markdown is sanitized in two stages (`marked` then `DOMPurify`) with
  a tight allowlist. There is deliberately **no `<img>`** (prevents exfiltration
  through image requests), no `<script>`/`<style>`/event-handler surface, and
  http(s)/mailto are the only surviving URI schemes. Every link is forced to
  `target="_blank"` with `rel="noopener noreferrer"`.
- The main process denies all new-window creation and hands only `http(s)` URLs
  to the OS browser.
- `GENTLE_SHELL_INTERACTIVE_HOST=1` is merged **last** into the child env so
  neither the ambient environment nor a launcher-supplied env can suppress it.
- `registerHandlers` receives `ipcMain` and `webContents` as parameters so the
  module never `require`s Electron at load time.

## 10. Known structural limitations

Self-documented in source, listed here so they are not mistaken for oversights:

1. **Two access paths to pi data.** Chat runs through the spawned CLI while the
   session list is read in-process via `SessionManager.listAll()`. This is the
   most fragile seam in the design.
2. **Global env mutation for session listing.** `createPiSessionStore` sets and
   restores `process.env.PI_CODING_AGENT_DIR` around `listAll()`, because the
   zero-argument overload is the only one that recurses per-project
   subdirectories. Documented as an accepted M1 limitation: two different homes
   read concurrently would race. Only one home is ever in play today.
3. **Single-session host.** `ChatHost` owns exactly one `PiSession`; there is no
   session registry, which is why there are no multi-chat tabs.
4. **Position-derived message ids.** `msg-${state.messages.length}` is valid
   because each open/backfill appends in a controlled order; a future concurrent
   surface would break it.
5. **Version coupling to the launcher.** M2 helper features degrade to an empty
   tab on an older gentle-pi; detection is documented but not surfaced in the UI.
