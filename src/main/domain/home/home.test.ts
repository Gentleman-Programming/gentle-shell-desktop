import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveHome } from "./home";

describe("resolveHome", () => {
  it("uses GENTLE_SHELL_HOME when set, taking precedence over the default", () => {
    expect(resolveHome({ env: { GENTLE_SHELL_HOME: "/custom/home" }, homedir: () => "/Users/dev" })).toBe(
      "/custom/home",
    );
  });

  it("defaults to <homedir>/.gentle-shell/agent (isolated default; T5 adds link mode)", () => {
    expect(resolveHome({ env: {}, homedir: () => "/Users/dev" })).toBe(
      path.join("/Users/dev", ".gentle-shell", "agent"),
    );
  });

  it("ignores an empty-string GENTLE_SHELL_HOME and falls back to the default", () => {
    expect(resolveHome({ env: { GENTLE_SHELL_HOME: "" }, homedir: () => "/Users/dev" })).toBe(
      path.join("/Users/dev", ".gentle-shell", "agent"),
    );
  });
});
