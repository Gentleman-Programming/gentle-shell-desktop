import { fileURLToPath } from "node:url";
import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { createLauncherLocator, createNodeProcessSpawner, createPiSessionStore } from "./adapters";
import { resolveHome } from "./domain/home/home";
import { ChatHost } from "./domain/session/ChatHost";
import { registerHandlers } from "./ipc/registerHandlers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
});

// M1 T1 was just the window shell; T2 added the PiSession child process;
// T3 wires IPC handlers so the renderer can list/open/send for real.
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

  registerHandlers(chatHost, window.webContents, ipcMain);

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

// Stop the current PiSession's child process cleanly instead of leaving it
// orphaned when the app quits.
app.on("before-quit", () => {
  void chatHost.stop();
});
