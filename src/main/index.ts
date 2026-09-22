import { fileURLToPath } from "node:url";
import path from "node:path";
import { app, BrowserWindow } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// M1 T1: just the window shell. T2 spawns the PiSession child process,
// T3 wires IPC handlers through src/main/ipc before the renderer can list
// or open chats for real.
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
