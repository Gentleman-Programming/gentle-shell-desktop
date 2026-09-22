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
```

See `src/README.md` for why the source tree is shaped the way it is.
