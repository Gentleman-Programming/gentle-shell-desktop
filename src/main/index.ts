import { fileURLToPath } from "node:url";
import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { createLauncherLocator, createNodeProcessSpawner, createPiSessionStore } from "./adapters";
import { boundedStop } from "./domain/lifecycle/boundedStop";
import { resolveHome } from "./domain/home/home";
import { ChatHost } from "./domain/session/ChatHost";
import { registerHandlers } from "./ipc/registerHandlers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STOP_ON_QUIT_TIMEOUT_MS = 4000;

// Electron's own console, prefixed so pi's stderr output (diagnostics,
// warnings — not by itself evidence of a failure, see PiSession's
// handleStderrLine) is distinguishable from this app's own logging.
function logPiLine(line: string): void {
  process.stderr.write(`[pi] ${line}\n`);
}

// The resolved home is shared by the ChatHost's SessionStore (lists
// sessions from <home>/sessions) and every PiSession it spawns (--home
// <home>, T5 replaces this with --link/--isolated once first-run exists),
// so the session list always matches the chat the user can actually open.
const home = resolveHome();
const chatHost = new ChatHost({
  spawner: createNodeProcessSpawner(),
  locator: createLauncherLocator(),
  sessionStore: createPiSessionStore(home),
  env: process.env,
  homeArgs: ["--home", home],
  log: logPiLine,
});

// M1 T1 was just the window shell; T2 added the PiSession child process;
// T3 wires IPC handlers so the renderer can list/open/send for real; T5
// keeps registerHandlers' unsubscribe and calls it when this window
// closes, so a later window (macOS activate) can re-register cleanly.
function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "gentle shell",
    backgroundColor: "#060407",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const unregisterHandlers = registerHandlers(chatHost, window.webContents, ipcMain);
  window.on("closed", unregisterHandlers);

  window.once("ready-to-show", () => window.show());

  // No remote content: dev loads the Vite dev server on localhost, build
  // loads the bundled renderer files from disk.
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(path.join(__dirname, "../renderer/index.html"));
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
