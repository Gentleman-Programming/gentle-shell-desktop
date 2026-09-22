import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import {
  createAppConfigStore,
  createDynamicPiSessionStore,
  createHomeSettings,
  createLauncherLocator,
  createNodeProcessSpawner,
  createSetupService,
} from "./adapters";
import { boundedStop } from "./domain/lifecycle/boundedStop";
import { homeDirFor, resolveHomeMode } from "./domain/home/home";
import { ChatHost } from "./domain/session/ChatHost";
import { registerHandlers } from "./ipc/registerHandlers";

// `import.meta.dirname` directly (not a manually computed
// `path.dirname(fileURLToPath(import.meta.url))` `__dirname`), and under
// its own name instead of shadowing `__dirname`: electron-vite's built
// ESM output auto-injects its own top-level `const __dirname =
// import.meta.dirname;` "CommonJS shim" (for whatever dependency still
// expects `require`/`__dirname`), so a second same-named top-level
// declaration in this file collided with it — "Identifier '__dirname'
// has already been declared" — and crashed the packaged app on load
// (T6's Electron smoke check caught this; electron-vite dev never hits
// the built bundle, only `pnpm build`/`pnpm package` do).
const moduleDir = import.meta.dirname;

const STOP_ON_QUIT_TIMEOUT_MS = 4000;

// scripts/smoke-electron.mjs (T6) sets this to a throwaway temp dir before
// launching the real built app through Playwright, so the smoke run never
// reads or writes this developer's actual config.json under the real
// userData path. Must run before the first app.getPath("userData") call
// below (configStore's own path) — Electron only honors setPath for a
// given name before anything has already read it.
const smokeUserData = process.env.GENTLE_SHELL_SMOKE_USERDATA;
if (smokeUserData) app.setPath("userData", smokeUserData);

// Electron's own console, prefixed so pi's stderr output (diagnostics,
// warnings — not by itself evidence of a failure, see PiSession's
// handleStderrLine) is distinguishable from this app's own logging.
function logPiLine(line: string): void {
  process.stderr.write(`[pi] ${line}\n`);
}

// Persisted first-run/home choice (T5), under Electron's own per-user data
// directory. configStore.read() has no choice yet before first-run
// resolves it (see setupService's needsChoice) — homeSettings/the dynamic
// SessionStore below both default an absent choice to isolated through
// resolveHomeMode (T6 follow-up), the single source of truth
// resolveHomeArgs/homeDirFor also defer to.
const configStore = createAppConfigStore(path.join(app.getPath("userData"), "config.json"));
const homeSettings = createHomeSettings(configStore);
const setupService = createSetupService(configStore);

// The SessionStore re-resolves the current home on every call (instead of
// once at startup) so it reflects a home choice made mid-session, exactly
// like homeSettings.homeArgs() above — see createDynamicPiSessionStore's
// doc comment.
const chatHost = new ChatHost({
  spawner: createNodeProcessSpawner(),
  locator: createLauncherLocator(),
  sessionStore: createDynamicPiSessionStore(() => homeDirFor(resolveHomeMode(configStore.read()), process.env)),
  env: process.env,
  homeSettings,
  log: logPiLine,
});

// M1 T1 was just the window shell; T2 added the PiSession child process;
// T3 wires IPC handlers so the renderer can list/open/send for real; T5
// keeps registerHandlers' unsubscribe and calls it when this window
// closes, so a later window (macOS activate) can re-register cleanly, and
// adds the setup.status/chooseHome handlers for first-run.
function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "gentle shell",
    backgroundColor: "#060407",
    show: false,
    webPreferences: {
      preload: path.join(moduleDir, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const unregisterHandlers = registerHandlers(chatHost, setupService, window.webContents, ipcMain);
  window.on("closed", unregisterHandlers);

  // Assistant replies now render Markdown links (Markdown.tsx forces
  // target="_blank" on every <a>), so a click reaches here instead of
  // navigating the app's own BrowserWindow. Only hand http(s) links to the
  // OS default browser; deny everything else (no new Electron windows, no
  // other schemes) since this window never needs to open one itself.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  window.once("ready-to-show", () => window.show());

  // No remote content: dev loads the Vite dev server on localhost, build
  // loads the bundled renderer files from disk.
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(path.join(moduleDir, "../renderer/index.html"));
  }
}

void app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Stops the current PiSession's child process cleanly instead of leaving
// it orphaned when the app quits, bounded to STOP_ON_QUIT_TIMEOUT_MS so a
// child that refuses to exit never hangs shutdown. `quitting` guards
// against the re-entrant app.quit() below re-triggering this handler in a
// loop (before-quit fires again for that quit() call too).
let quitting = false;
app.on("before-quit", (event) => {
  if (quitting) return;
  quitting = true;
  event.preventDefault();
  void boundedStop(() => chatHost.stop(), STOP_ON_QUIT_TIMEOUT_MS).finally(() => app.quit());
});
