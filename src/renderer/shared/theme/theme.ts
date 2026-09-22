/**
 * Gentleman-Cute design tokens as plain TS values, mirroring tokens.css.
 * theme.test.ts pins theme.accent against the committed
 * gentleman-cute.json fixture so the two never silently drift apart.
 */
export const theme = {
  bg: "#060407",
  panel: "#100A0F",
  raised: "#180E15",
  line: "#2A1720",
  lineStrong: "#563040",
  text: "#F6EFF3",
  text2: "#D2CBD0",
  muted: "#A78E9B",
  accent: "#F095C8",
  accentActive: "#FFB1DD",
  blue: "#A9C7EE",
  green: "#B4E7C7",
  amber: "#F2B86D",
  red: "#FF718F",
  purple: "#C96AA2",
  champagne: "#E0C27A",
  fontDisplay: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
  fontBody: '"Inter", "Segoe UI", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
} as const;

export type ThemeToken = keyof typeof theme;
