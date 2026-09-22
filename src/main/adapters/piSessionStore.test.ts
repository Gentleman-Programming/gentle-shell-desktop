import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPiSessionStore } from "./piSessionStore";

/**
 * Writes one session in pi's on-disk jsonl format: a `session` header line
 * followed by `message` entries, under <home>/sessions/<projectDirName>/
 * (pi's real layout is one subdirectory per project cwd — see
 * getDefaultSessionDirPath in pi's session-manager.ts — but SessionManager
 * only cares that it is *a* subdirectory of the sessions dir, not its exact
 * encoded name).
 */
function writeSessionFixture(
  home: string,
  projectDirName: string,
  fileName: string,
  header: Record<string, unknown>,
  messages: Record<string, unknown>[],
): void {
  const projectDir = path.join(home, "sessions", projectDirName);
  mkdirSync(projectDir, { recursive: true });
  const lines = [header, ...messages].map((entry) => JSON.stringify(entry)).join("\n");
  writeFileSync(path.join(projectDir, fileName), `${lines}\n`);
}

describe("createPiSessionStore", () => {
  let home: string | undefined;

  afterEach(() => {
    if (home) rmSync(home, { recursive: true, force: true });
    home = undefined;
  });

  it("lists sessions across every project subdirectory under <home>/sessions", async () => {
    home = mkdtempSync(path.join(tmpdir(), "gentle-shell-home-"));

    writeSessionFixture(
      home,
      "--tmp-project-a--",
      "sess-a.jsonl",
      { type: "session", id: "sess-a", timestamp: "2026-09-20T10:00:00.000Z", cwd: "/tmp/project-a" },
      [
        {
          type: "message",
          id: "m1",
          parentId: null,
          timestamp: "2026-09-20T10:00:01.000Z",
          message: { role: "user", content: [{ type: "text", text: "Write the README intro" }] },
        },
      ],
    );
    writeSessionFixture(
      home,
      "--tmp-project-b--",
      "sess-b.jsonl",
      { type: "session", id: "sess-b", timestamp: "2026-09-21T09:00:00.000Z", cwd: "/tmp/project-b" },
      [],
    );

    const sessions = await createPiSessionStore(home).listAll();

    expect(sessions.map((session) => session.id).sort()).toEqual(["sess-a", "sess-b"]);
    expect(sessions.find((session) => session.id === "sess-a")).toMatchObject({
      cwd: "/tmp/project-a",
      messageCount: 1,
      firstMessage: "Write the README intro",
    });
  });

  it("restores a previously-unset PI_CODING_AGENT_DIR after the call", async () => {
    home = mkdtempSync(path.join(tmpdir(), "gentle-shell-home-"));
    const previous = process.env.PI_CODING_AGENT_DIR;
    delete process.env.PI_CODING_AGENT_DIR;

    try {
      await createPiSessionStore(home).listAll();
      expect(process.env.PI_CODING_AGENT_DIR).toBeUndefined();
    } finally {
      if (previous !== undefined) process.env.PI_CODING_AGENT_DIR = previous;
    }
  });

  it("restores a previously-set PI_CODING_AGENT_DIR after the call", async () => {
    home = mkdtempSync(path.join(tmpdir(), "gentle-shell-home-"));
    const previous = process.env.PI_CODING_AGENT_DIR;
    process.env.PI_CODING_AGENT_DIR = "/some/other/agent/dir";

    try {
      await createPiSessionStore(home).listAll();
      expect(process.env.PI_CODING_AGENT_DIR).toBe("/some/other/agent/dir");
    } finally {
      if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
      else process.env.PI_CODING_AGENT_DIR = previous;
    }
  });

  it("returns an empty list when the sessions directory does not exist yet", async () => {
    home = mkdtempSync(path.join(tmpdir(), "gentle-shell-home-"));
    await expect(createPiSessionStore(home).listAll()).resolves.toEqual([]);
  });
});
