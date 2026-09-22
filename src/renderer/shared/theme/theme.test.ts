import { describe, expect, it } from "vitest";
import gentlemanCute from "./gentleman-cute.json";
import { theme } from "./theme";

describe("theme", () => {
  it("uses the accent color from the committed Gentleman-Cute fixture", () => {
    expect(theme.accent).toBe(gentlemanCute.vars.accent);
  });

  it("exposes the full Gentleman-Cute token set as CSS custom property names", () => {
    expect(theme.bg).toBe("#060407");
    expect(theme.panel).toBe("#100A0F");
    expect(theme.text).toBe("#F6EFF3");
    expect(theme.accentActive).toBe("#FFB1DD");
  });
});
