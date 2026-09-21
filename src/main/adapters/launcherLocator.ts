import { accessSync, constants, existsSync } from "node:fs";
import path from "node:path";
import type { LauncherLocator, ResolvedLauncher } from "../ports";

const JS_ENTRY_EXTENSIONS = [".mjs", ".js", ".cjs"];

/**
 * Resolves how to invoke the gentle-shell launcher, in order:
 * 1. `GENTLE_SHELL_BIN` — a path to a JS entry point (run with
 *    `process.execPath`, e.g. the maintainer's local
 *    `bin/gentle-shell.mjs` checkout) or a directly executable binary.
 * 2. `gentle-shell` found on PATH.
 * 3. Otherwise, throw with a message naming both options (gentle-shell is
 *    not on npm yet; see the README Development section).
 */
export function createLauncherLocator(env: NodeJS.ProcessEnv = process.env): LauncherLocator {
  return {
    locate(): ResolvedLauncher {
      const binPath = env.GENTLE_SHELL_BIN;
      if (binPath) return resolveBinPath(binPath);

      const onPath = findOnPath("gentle-shell", env);
      if (onPath) return { command: onPath, args: [] };

      throw new Error(
        "gentle-shell launcher not found. gentle-shell is not published on npm yet: " +
          "set GENTLE_SHELL_BIN to your local checkout's bin/gentle-shell.mjs (or another " +
          "gentle-shell executable), or install a gentle-shell binary named `gentle-shell` " +
          "on PATH. See the README Development section.",
      );
    },
  };
}

function resolveBinPath(binPath: string): ResolvedLauncher {
  const isJsEntry = JS_ENTRY_EXTENSIONS.includes(path.extname(binPath));
  return isJsEntry ? { command: process.execPath, args: [binPath] } : { command: binPath, args: [] };
}

function findOnPath(binName: string, env: NodeJS.ProcessEnv): string | undefined {
  const pathVar = env.PATH ?? env.Path;
  if (!pathVar) return undefined;

  const candidateNames = process.platform === "win32" ? [`${binName}.cmd`, `${binName}.exe`, binName] : [binName];

  for (const dir of pathVar.split(path.delimiter)) {
    if (!dir) continue;
    for (const name of candidateNames) {
      const candidate = path.join(dir, name);
      if (existsSync(candidate) && isExecutable(candidate)) return candidate;
    }
  }
  return undefined;
}

function isExecutable(candidate: string): boolean {
  try {
    accessSync(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
