import { accessSync, constants, existsSync } from "node:fs";
import path from "node:path";
import type { LauncherLocator, ResolvedLauncher } from "../ports";

const JS_ENTRY_EXTENSIONS = [".mjs", ".js", ".cjs"];

/**
 * Resolves how to invoke the gentle-shell launcher, in order:
 * 1. `GENTLE_SHELL_BIN` — a path to a JS entry point (run with
 *    `process.execPath`, e.g. the maintainer's local
 *    `bin/gentle-shell.mjs` checkout) or a directly executable binary.
 * 2. `gentle-shell` found on PATH. On Windows, npm's `gentle-shell.cmd`
 *    shim cannot be spawned without a shell, so its sibling
 *    `node_modules/gentle-pi/bin/gentle-shell.mjs` entry is run instead.
 * 3. Otherwise, throw with a message naming both options (gentle-shell is
 *    not on npm yet; see the README Development section).
 */
export function createLauncherLocator(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): LauncherLocator {
  return {
    locate(): ResolvedLauncher {
      const binPath = env.GENTLE_SHELL_BIN;
      if (binPath) return resolveBinPath(binPath);

      const onPath = findOnPath("gentle-shell", env, platform);
      if (onPath) return resolveOnPath(onPath, platform);

      throw new Error(
        "gentle-shell launcher not found. Install it with `npm install -g gentle-pi` " +
          "(gentle-pi 3.7.0 or newer) so `gentle-shell` is on PATH, or set GENTLE_SHELL_BIN " +
          "to its full path (`which gentle-shell`). See the README Try it section.",
      );
    },
  };
}

function resolveBinPath(binPath: string): ResolvedLauncher {
  const isJsEntry = JS_ENTRY_EXTENSIONS.includes(path.extname(binPath));
  if (!isJsEntry) return { command: binPath, args: [] };

  // process.execPath under Electron is the Electron binary; ELECTRON_RUN_AS_NODE
  // makes it run this JS entry as plain Node instead of launching another
  // Electron instance. No effect (and not consulted) under plain Node.
  return { command: process.execPath, args: [binPath], env: { ELECTRON_RUN_AS_NODE: "1" } };
}

// Node refuses to spawn a .cmd without `shell: true` (EINVAL/EFTYPE), and
// `shell: true` concatenates arguments unquoted, breaking paths with spaces.
function resolveOnPath(onPath: string, platform: NodeJS.Platform): ResolvedLauncher {
  if (platform === "win32" && path.extname(onPath).toLowerCase() === ".cmd") {
    const npmEntry = path.join(path.dirname(onPath), "node_modules", "gentle-pi", "bin", "gentle-shell.mjs");
    if (existsSync(npmEntry)) return resolveBinPath(npmEntry);
  }
  return { command: onPath, args: [] };
}

function findOnPath(binName: string, env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string | undefined {
  const pathVar = env.PATH ?? env.Path;
  if (!pathVar) return undefined;

  const candidateNames = platform === "win32" ? [`${binName}.cmd`, `${binName}.exe`, binName] : [binName];

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
