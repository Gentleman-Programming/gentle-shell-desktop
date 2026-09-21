import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createLauncherLocator } from "./launcherLocator";

describe("createLauncherLocator", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  it("runs a GENTLE_SHELL_BIN .mjs entry with process.execPath", () => {
    const locator = createLauncherLocator({ GENTLE_SHELL_BIN: "/home/dev/gentle-pi/bin/gentle-shell.mjs" });
    expect(locator.locate()).toEqual({
      command: process.execPath,
      args: ["/home/dev/gentle-pi/bin/gentle-shell.mjs"],
    });
  });

  it("runs a GENTLE_SHELL_BIN that is a plain executable directly", () => {
    const locator = createLauncherLocator({ GENTLE_SHELL_BIN: "/usr/local/bin/gentle-shell" });
    expect(locator.locate()).toEqual({ command: "/usr/local/bin/gentle-shell", args: [] });
  });

  it("finds an executable named gentle-shell on PATH when GENTLE_SHELL_BIN is unset", () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "gentle-shell-locator-"));
    const binPath = path.join(tmpDir, "gentle-shell");
    writeFileSync(binPath, "#!/usr/bin/env node\n");
    chmodSync(binPath, 0o755);

    const locator = createLauncherLocator({ PATH: tmpDir });
    expect(locator.locate()).toEqual({ command: binPath, args: [] });
  });

  it("throws naming both GENTLE_SHELL_BIN and PATH when neither resolves", () => {
    const locator = createLauncherLocator({ PATH: "" });
    expect(() => locator.locate()).toThrow(/GENTLE_SHELL_BIN/);
    expect(() => locator.locate()).toThrow(/PATH/);
  });

  it("skips a PATH entry that has the name but is not executable", () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "gentle-shell-locator-"));
    const binPath = path.join(tmpDir, "gentle-shell");
    writeFileSync(binPath, "not executable");
    chmodSync(binPath, 0o644);

    const locator = createLauncherLocator({ PATH: tmpDir });
    expect(() => locator.locate()).toThrow(/GENTLE_SHELL_BIN/);
  });
});
