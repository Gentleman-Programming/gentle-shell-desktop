# Source layout

Why the folders are shaped this way, not what each file does.

## Three processes, one Scope Rule

Electron runs three separate JS contexts: `main` (Node, owns child
processes and the session list), `preload` (a sandboxed bridge), and
`renderer` (the UI, browser-like, no Node access). Each gets its own
top-level folder because they cannot share runtime state — only types.

`src/shared/bridge-types.ts` sits outside all three because it is the one
thing all three processes import: the typed `GentleBridge` contract and the
domain types that cross the process boundary. The Scope Rule says code used
by 2+ consumers is shared, not duplicated locally — here the "consumers"
are processes, not features, but the rule is the same.

Everything else (`src/main/domain`, `src/main/ports`, `src/main/adapters`)
stays local to `src/main` until a second process needs it too.

## Screaming Architecture in the renderer

`src/renderer/features/` is named after what the app does — `chats`,
`conversation`, `first-run` — not after technical layers. A new
contributor should be able to read the folder names and know the product,
before opening a single file.

`src/renderer/shared/` holds only code genuinely used by 2+ features today
(`ui/atoms`, `theme`, `bridge`). Nothing moves there speculatively.

## Container / presentational

Each feature splits into a `<Feature>Container.tsx` (owns state, calls
`useBridge()`) and presentational components under `components/` that only
receive props. This keeps the bridge/IPC surface in one place per feature
and makes the presentational pieces trivially testable without mocking
Electron.

## Hexagonal main process

`src/main/domain` (pure types), `src/main/ports` (interfaces the domain
depends on) and `src/main/adapters` (Electron/Node implementations of
those ports) keep the domain logic free of Electron imports, so the RPC
codec and reducer T2 adds can be unit-tested without spawning a real
`gentle-shell` process.
