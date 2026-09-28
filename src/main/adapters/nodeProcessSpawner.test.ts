import { EventEmitter } from "node:events";
import type { ChildProcess } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { createNodeProcessSpawner } from "./nodeProcessSpawner";

function createMockChildProcess(): ChildProcess {
  const proc = new EventEmitter() as ChildProcess;
  const stdout = new EventEmitter() as any;
  stdout.setEncoding = vi.fn();
  const stderr = new EventEmitter() as any;
  stderr.setEncoding = vi.fn();
  proc.stdout = stdout;
  proc.stderr = stderr;
  proc.stdin = new EventEmitter() as any;
  proc.kill = vi.fn();
  return proc;
}

describe("createNodeProcessSpawner", () => {
  it("spawns with windowsHide: true to prevent visible console windows (Issue #24)", () => {
    let capturedOptions: any;
    const mockSpawn = vi.fn((_cmd, _args, opts) => {
      capturedOptions = opts;
      return createMockChildProcess();
    }) as any;

    const spawner = createNodeProcessSpawner({ spawn: mockSpawn });
    spawner.spawn("some-command", ["--arg"], { FOO: "bar" }, "/some/cwd");

    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(capturedOptions).toMatchObject({
      windowsHide: true,
      env: { FOO: "bar" },
      cwd: "/some/cwd",
      stdio: ["pipe", "pipe", "pipe"],
    });
  });

  describe("Windows (.cmd / .bat) execution (Issue #23)", () => {
    it("spawns with shell: true on win32 when command ends in .cmd", () => {
      let capturedOptions: any;
      const mockSpawn = vi.fn((_cmd, _args, opts) => {
        capturedOptions = opts;
        return createMockChildProcess();
      }) as any;

      const spawner = createNodeProcessSpawner({ spawn: mockSpawn, platform: "win32" });
      spawner.spawn("C:\\Users\\dev\\AppData\\Roaming\\npm\\gentle-shell.cmd", ["--mode", "rpc"], {});

      expect(capturedOptions.shell).toBe(true);
    });

    it("spawns with shell: true on win32 when command ends in .bat", () => {
      let capturedOptions: any;
      const mockSpawn = vi.fn((_cmd, _args, opts) => {
        capturedOptions = opts;
        return createMockChildProcess();
      }) as any;

      const spawner = createNodeProcessSpawner({ spawn: mockSpawn, platform: "win32" });
      spawner.spawn("gentle-shell.bat", ["--mode", "rpc"], {});

      expect(capturedOptions.shell).toBe(true);
    });

    it("handles quoted command paths ending in .cmd on win32", () => {
      let capturedOptions: any;
      const mockSpawn = vi.fn((_cmd, _args, opts) => {
        capturedOptions = opts;
        return createMockChildProcess();
      }) as any;

      const spawner = createNodeProcessSpawner({ spawn: mockSpawn, platform: "win32" });
      spawner.spawn('"C:\\Program Files\\gentle-shell.cmd"', ["--mode", "rpc"], {});

      expect(capturedOptions.shell).toBe(true);
    });

    it("does not pass shell: true on win32 for .exe executables", () => {
      let capturedOptions: any;
      const mockSpawn = vi.fn((_cmd, _args, opts) => {
        capturedOptions = opts;
        return createMockChildProcess();
      }) as any;

      const spawner = createNodeProcessSpawner({ spawn: mockSpawn, platform: "win32" });
      spawner.spawn("C:\\Program Files\\nodejs\\node.exe", ["entry.mjs"], {});

      expect(capturedOptions.shell).toBeUndefined();
    });

    it("does not pass shell: true on non-win32 platforms even if command ends in .cmd", () => {
      let capturedOptions: any;
      const mockSpawn = vi.fn((_cmd, _args, opts) => {
        capturedOptions = opts;
        return createMockChildProcess();
      }) as any;

      const spawner = createNodeProcessSpawner({ spawn: mockSpawn, platform: "linux" });
      spawner.spawn("/usr/local/bin/gentle-shell.cmd", ["--mode", "rpc"], {});

      expect(capturedOptions.shell).toBeUndefined();
    });
  });

  describe("Process lifecycle and streaming", () => {
    it("splits stdout lines through onStdoutLine", async () => {
      const spawner = createNodeProcessSpawner();
      const proc = spawner.spawn(process.execPath, ["-e", 'process.stdout.write("line1\\nline2\\n")'], {});
      const lines: string[] = [];
      proc.onStdoutLine((line) => lines.push(line));

      const exit = await proc.exited;
      expect(exit.code).toBe(0);
      expect(lines).toEqual(["line1", "line2"]);
    });

    it("resolves exited promise with code on process exit", async () => {
      const spawner = createNodeProcessSpawner();
      const proc = spawner.spawn(process.execPath, ["-e", "process.exit(42)"], {});
      const exit = await proc.exited;
      expect(exit.code).toBe(42);
    });

    it("resolves exited with error on spawn failure (e.g. non-existent command)", async () => {
      const spawner = createNodeProcessSpawner();
      const proc = spawner.spawn("non-existent-binary-12345", [], {});
      const exit = await proc.exited;
      expect(exit.error).toBeDefined();
    });
  });
});
