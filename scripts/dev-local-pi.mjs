#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_RELATIVE_BIN = "../gentle-pi-worktrees/desktop-integration/bin/gentle-shell.mjs";

/**
 * Resolves the path to the gentle-shell binary for local development:
 * 1. Honors explicit GENTLE_SHELL_BIN env var if set and non-empty.
 * 2. Defaults to the local worktree path relative to project root.
 */
export function resolveLocalPiBin(env = process.env, root = projectRoot) {
  const bin = env.GENTLE_SHELL_BIN;
  if (bin && bin.trim().length > 0) {
    return bin;
  }
  return path.resolve(root, DEFAULT_RELATIVE_BIN);
}

/**
 * Resolves spawn configuration to execute electron-vite dev cross-platform.
 */
export function resolveSpawnConfig({
  env = process.env,
  root = projectRoot,
  platform = process.platform,
  extraArgs = [],
} = {}) {
  const localPiBin = resolveLocalPiBin(env, root);
  const pathVarName = platform === "win32" && !env.PATH && env.Path ? "Path" : "PATH";
  const existingPath = env[pathVarName] ?? "";
  const localNodeModulesBin = path.join(root, "node_modules", ".bin");
  const newPath = existingPath ? `${localNodeModulesBin}${path.delimiter}${existingPath}` : localNodeModulesBin;

  const mergedEnv = {
    ...env,
    [pathVarName]: newPath,
    GENTLE_SHELL_BIN: localPiBin,
  };

  return {
    command: "electron-vite",
    args: ["dev", ...extraArgs],
    options: {
      cwd: root,
      env: mergedEnv,
      stdio: "inherit",
      shell: platform === "win32",
    },
  };
}

/**
 * Main entry point when invoked directly from CLI.
 */
export function run() {
  const { command, args, options } = resolveSpawnConfig({
    extraArgs: process.argv.slice(2),
  });

  const child = spawn(command, args, options);

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on("error", (error) => {
    console.error("dev:local-pi failed to launch electron-vite:", error);
    process.exit(1);
  });
}

// Auto-run when executed directly
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run();
}
