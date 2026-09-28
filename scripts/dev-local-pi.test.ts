import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveLocalPiBin, resolveSpawnConfig } from "./dev-local-pi.mjs";

describe("dev-local-pi", () => {
  const dummyRoot = "/test/project/gentle-desktop";

  describe("resolveLocalPiBin", () => {
    it("returns default path relative to project root when GENTLE_SHELL_BIN is not set", () => {
      const resolved = resolveLocalPiBin({}, dummyRoot);
      const expected = path.resolve(dummyRoot, "../gentle-pi-worktrees/desktop-integration/bin/gentle-shell.mjs");
      expect(resolved).toBe(expected);
    });

    it("returns default path when GENTLE_SHELL_BIN is empty string or only whitespace", () => {
      expect(resolveLocalPiBin({ GENTLE_SHELL_BIN: "" }, dummyRoot)).toBe(
        path.resolve(dummyRoot, "../gentle-pi-worktrees/desktop-integration/bin/gentle-shell.mjs"),
      );
      expect(resolveLocalPiBin({ GENTLE_SHELL_BIN: "   " }, dummyRoot)).toBe(
        path.resolve(dummyRoot, "../gentle-pi-worktrees/desktop-integration/bin/gentle-shell.mjs"),
      );
    });

    it("preserves explicit GENTLE_SHELL_BIN environment variable", () => {
      const customPath = "/custom/gentle-pi/bin/gentle-shell.mjs";
      expect(resolveLocalPiBin({ GENTLE_SHELL_BIN: customPath }, dummyRoot)).toBe(customPath);
    });

    it("preserves Windows-style GENTLE_SHELL_BIN paths", () => {
      const winPath = "C:\\Users\\dev\\gentle-pi\\bin\\gentle-shell.mjs";
      expect(resolveLocalPiBin({ GENTLE_SHELL_BIN: winPath }, dummyRoot)).toBe(winPath);
    });
  });

  describe("resolveSpawnConfig", () => {
    it("sets GENTLE_SHELL_BIN in environment and inherits stdio", () => {
      const config = resolveSpawnConfig({
        env: { PATH: "/usr/bin" },
        root: dummyRoot,
        platform: "linux",
        extraArgs: ["--debug"],
      });

      expect(config.command).toBe("electron-vite");
      expect(config.args).toEqual(["dev", "--debug"]);
      expect(config.options.env.GENTLE_SHELL_BIN).toBe(
        path.resolve(dummyRoot, "../gentle-pi-worktrees/desktop-integration/bin/gentle-shell.mjs"),
      );
      expect(config.options.stdio).toBe("inherit");
      expect(config.options.shell).toBe(false);
    });

    it("enables shell: true on win32 for electron-vite command invocation", () => {
      const config = resolveSpawnConfig({
        env: { Path: "C:\\Windows\\system32" },
        root: dummyRoot,
        platform: "win32",
        extraArgs: [],
      });

      expect(config.options.shell).toBe(true);
      expect(config.command).toBe("electron-vite");
      expect(config.args).toEqual(["dev"]);
    });

    it("prepends project node_modules/.bin to PATH for portable execution", () => {
      const config = resolveSpawnConfig({
        env: { PATH: "/existing/path" },
        root: dummyRoot,
        platform: "linux",
        extraArgs: [],
      });

      const binDir = path.join(dummyRoot, "node_modules", ".bin");
      expect(config.options.env.PATH).toMatch(new RegExp(`^${binDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    });
  });
});
