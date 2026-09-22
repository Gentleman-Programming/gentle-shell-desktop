import { describe, expect, it } from "vitest";
import gentlemanCute from "./gentleman-cute.json";
import { theme } from "./theme";

describe("theme", () => {
  it("uses the accent color from the committed Gentleman-Cute fixture", () => {
    expect(theme.accent).toBe(gentlemanCute.vars.accent);
  });

  it("mirrors the rest of the token set against the committed Gentleman-Cute fixture", () => {
    // theme.ts renames the fixture's `vars` keys (bgPanel -> panel,
    // activePink -> accentActive, ...); pinned here instead of literal hex
    // strings so a future palette change in the fixture fails this test
    // instead of silently drifting from theme.ts/tokens.css.
    expect(theme.bg).toBe(gentlemanCute.vars.bg);
    expect(theme.panel).toBe(gentlemanCute.vars.bgPanel);
    expect(theme.text).toBe(gentlemanCute.vars.text);
    expect(theme.accentActive).toBe(gentlemanCute.vars.activePink);
  });
});
