#!/usr/bin/env node
// Electron smoke check (M1 T6): launches the actual `electron-vite build`
// output through Playwright's Electron support and asserts the window
// comes up for real, instead of only trusting vitest's jsdom-mocked
// renderer tests (which never exercise the real main process, preload
// bridge, or a genuine BrowserWindow). Plain `playwright` (not
// `@playwright/test`) is enough — this is one linear check, not a suite
// that needs the test runner's fixtures/reporters.
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { _electron as electron } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const mainEntry = path.join(projectRoot, "out", "main", "index.js");

async function main() {
  // A throwaway userData dir (src/main/index.ts honors
  // GENTLE_SHELL_SMOKE_USERDATA before app ready) so this run never reads
  // or writes a real developer's config.json.
  const userDataDir = mkdtempSync(path.join(tmpdir(), "gentle-shell-smoke-"));

  const app = await electron.launch({
    args: [mainEntry],
    cwd: projectRoot,
    env: { ...process.env, GENTLE_SHELL_SMOKE_USERDATA: userDataDir },
  });

  try {
    const window = await app.firstWindow();
    await window.waitForLoadState("domcontentloaded");

    // App.tsx resolves setupStatus() asynchronously before choosing
    // between the first-run screen and the normal chat layout, so either
    // heading is a valid "the app actually came up" signal — wait for
    // whichever one wins instead of racing a fixed render.
    await window.waitForFunction(
      () => {
        const text = document.body.innerText || "";
        return text.includes("Welcome to gentle shell") || text.includes("Chats");
      },
      undefined,
      { timeout: 15_000 },
    );

    const title = await window.title();
    if (title !== "gentle shell") {
      throw new Error(`expected window title "gentle shell", got "${title}"`);
    }

    const bodyText = await window.locator("body").innerText();
    if (!bodyText.includes("Welcome to gentle shell") && !bodyText.includes("Chats")) {
      throw new Error(`expected the DOM to contain "Welcome to gentle shell" or "Chats", got:\n${bodyText.slice(0, 500)}`);
    }

    const screenshotDir = path.join(projectRoot, "release");
    mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, "smoke.png");
    await window.screenshot({ path: screenshotPath });

    console.log(`smoke:electron OK — title "${title}" and expected body content verified; screenshot at ${screenshotPath}`);
  } finally {
    await app.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("smoke:electron FAILED:", error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
