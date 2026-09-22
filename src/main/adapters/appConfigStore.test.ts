import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAppConfigStore } from "./appConfigStore";

describe("createAppConfigStore", () => {
  let dir: string | undefined;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("read() returns {} when the config file does not exist yet", () => {
    dir = mkdtempSync(path.join(tmpdir(), "gentle-shell-config-"));
    const store = createAppConfigStore(path.join(dir, "config.json"));

    expect(store.read()).toEqual({});
  });

  it("read() tolerates invalid JSON, returning {}", () => {
    dir = mkdtempSync(path.join(tmpdir(), "gentle-shell-config-"));
    const configPath = path.join(dir, "config.json");
    writeFileSync(configPath, "{ not valid json");
    const store = createAppConfigStore(configPath);

    expect(store.read()).toEqual({});
  });

  it("read() tolerates an unrecognized home value, returning {}", () => {
    dir = mkdtempSync(path.join(tmpdir(), "gentle-shell-config-"));
    const configPath = path.join(dir, "config.json");
    writeFileSync(configPath, JSON.stringify({ home: "not-a-mode" }));
    const store = createAppConfigStore(configPath);

    expect(store.read()).toEqual({});
  });

  it("write() persists the patch and creates the parent directory if needed, and read() round-trips it", () => {
    dir = mkdtempSync(path.join(tmpdir(), "gentle-shell-config-"));
    const configPath = path.join(dir, "nested", "config.json");
    const store = createAppConfigStore(configPath);

    const written = store.write({ home: "link" });

    expect(written).toEqual({ home: "link" });
    expect(store.read()).toEqual({ home: "link" });
  });

  it("write() merges with the previously persisted config instead of replacing it", () => {
    dir = mkdtempSync(path.join(tmpdir(), "gentle-shell-config-"));
    const configPath = path.join(dir, "config.json");
    const store = createAppConfigStore(configPath);

    store.write({ home: "isolated" });
    const second = store.write({});

    expect(second).toEqual({ home: "isolated" });
  });
});
