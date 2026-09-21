import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectPi, homeDirFor, piAgentDir, resolveHomeArgs, resolveHomeMode } from "./home";

describe("resolveHomeMode", () => {
  it("returns the persisted mode when a choice was made", () => {
    expect(resolveHomeMode({ home: "link" })).toBe("link");
    expect(resolveHomeMode({ home: "isolated" })).toBe("isolated");
  });

  it("defaults to isolated when no choice is persisted yet — the single source of truth resolveHomeArgs and main/index.ts's SessionStore both defer to", () => {
    expect(resolveHomeMode({})).toBe("isolated");
  });
});

describe("piAgentDir", () => {
  it("resolves to PI_CODING_AGENT_DIR when set", () => {
    expect(piAgentDir({ PI_CODING_AGENT_DIR: "/custom/pi-dir" }, () => "/Users/dev")).toBe("/custom/pi-dir");
  });

  it("resolves to <homedir>/.pi/agent by default — the single source of truth homeDirFor and detectPi both defer to", () => {
    expect(piAgentDir({}, () => "/Users/dev")).toBe(path.join("/Users/dev", ".pi", "agent"));
  });
});

describe("resolveHomeArgs", () => {
  it('resolves ["--link"] for link mode', () => {
    expect(resolveHomeArgs({ home: "link" }, {})).toEqual(["--link"]);
  });

  it('resolves ["--isolated"] for isolated mode', () => {
    expect(resolveHomeArgs({ home: "isolated" }, {})).toEqual(["--isolated"]);
  });

  it("defaults to isolated when no choice is persisted yet", () => {
    expect(resolveHomeArgs({}, {})).toEqual(["--isolated"]);
  });

  it('GENTLE_SHELL_HOME overrides the mode with ["--home", dir], for either mode', () => {
    expect(resolveHomeArgs({ home: "link" }, { GENTLE_SHELL_HOME: "/custom/home" })).toEqual(["--home", "/custom/home"]);
    expect(resolveHomeArgs({}, { GENTLE_SHELL_HOME: "/custom/home" })).toEqual(["--home", "/custom/home"]);
  });

  it("ignores an empty-string GENTLE_SHELL_HOME and falls back to the mode", () => {
    expect(resolveHomeArgs({ home: "link" }, { GENTLE_SHELL_HOME: "" })).toEqual(["--link"]);
  });
});

describe("homeDirFor", () => {
  it("resolves link mode to PI_CODING_AGENT_DIR when set", () => {
    expect(homeDirFor("link", { PI_CODING_AGENT_DIR: "/custom/pi-dir" }, () => "/Users/dev")).toBe("/custom/pi-dir");
  });

  it("resolves link mode to <homedir>/.pi/agent by default", () => {
    expect(homeDirFor("link", {}, () => "/Users/dev")).toBe(path.join("/Users/dev", ".pi", "agent"));
  });

  it("resolves isolated mode to <homedir>/.gentle-shell/agent", () => {
    expect(homeDirFor("isolated", {}, () => "/Users/dev")).toBe(path.join("/Users/dev", ".gentle-shell", "agent"));
  });

  it("GENTLE_SHELL_HOME overrides either mode, matching resolveHomeArgs' --home flag", () => {
    expect(homeDirFor("link", { GENTLE_SHELL_HOME: "/custom/home" }, () => "/Users/dev")).toBe("/custom/home");
    expect(homeDirFor("isolated", { GENTLE_SHELL_HOME: "/custom/home" }, () => "/Users/dev")).toBe("/custom/home");
  });
});

describe("detectPi", () => {
  function existsOnly(paths: readonly string[]): (candidate: string) => boolean {
    return (candidate) => paths.includes(candidate);
  }

  it("reports not found when ~/.pi/agent does not exist", () => {
    const detection = detectPi({}, () => "/Users/dev", existsOnly([]));
    expect(detection).toEqual({ found: false, dir: path.join("/Users/dev", ".pi", "agent"), hasAuth: false, hasModels: false });
  });

  it("reports found with hasAuth/hasModels when both files exist", () => {
    const dir = path.join("/Users/dev", ".pi", "agent");
    const detection = detectPi({}, () => "/Users/dev", existsOnly([dir, path.join(dir, "auth.json"), path.join(dir, "models.json")]));
    expect(detection).toEqual({ found: true, dir, hasAuth: true, hasModels: true });
  });

  it("reports found but hasAuth/hasModels false when the dir exists without those files", () => {
    const dir = path.join("/Users/dev", ".pi", "agent");
    const detection = detectPi({}, () => "/Users/dev", existsOnly([dir]));
    expect(detection).toEqual({ found: true, dir, hasAuth: false, hasModels: false });
  });

  it("honors PI_CODING_AGENT_DIR for where to look", () => {
    const detection = detectPi({ PI_CODING_AGENT_DIR: "/custom/pi-dir" }, () => "/Users/dev", existsOnly(["/custom/pi-dir"]));
    expect(detection).toEqual({ found: true, dir: "/custom/pi-dir", hasAuth: false, hasModels: false });
  });
});
