# gentle-shell-desktop

Private planning and code for the Gentle Shell desktop app: a plain-chat window over pi with per-chat helpers, ODD progress, providers and extensions. Issues here track work that is not public yet.

## Development

```sh
pnpm install       # install dependencies
pnpm dev           # run the Electron + React app
pnpm dev:web       # run the renderer alone in a browser tab (for browser-driven QA), http://localhost:5173
pnpm test          # run the vitest suite once
pnpm test:watch    # run vitest in watch mode
pnpm typecheck     # type-check main, preload and renderer
pnpm build         # build the Electron app (main, preload, renderer)
pnpm package       # build and package an unsigned app for this OS (electron-builder), output under release/
pnpm package:mac   # same, macOS only (dmg + zip)
pnpm package:win   # same, Windows only (nsis)
pnpm package:linux # same, Linux only (AppImage)
pnpm smoke:electron # build, launch the packaged main entry through Playwright, and verify the window actually comes up
```

The gentle-shell launcher itself is not published on npm yet: `pnpm dev`/`pnpm package`'s packaged app resolve it via `GENTLE_SHELL_BIN` (a path to a local `gentle-shell` checkout's `bin/gentle-shell.mjs`, or another gentle-shell executable) or a `gentle-shell` binary on `PATH` — see `src/main/adapters/launcherLocator.ts`.

The app always sets `GENTLE_SHELL_INTERACTIVE_HOST=1` on the pi process it spawns; it requires a gentle-pi build with the `rpc-interactive-host` feature to enable RPC dialogs and the per-chat Helpers tab (M2) — see `src/main/domain/session/PiSession.ts`.

See `src/README.md` for why the source tree is shaped the way it is.
