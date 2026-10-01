# Design system

> Status: draft.

The desktop has one hardcoded theme, Gentleman-Cute, as 16 color tokens and 3 font tokens in CSS (`D:renderer/shared/theme/tokens.css:8-29`). The mockup uses the same 15 colors under partly different names, plus a radius token. gentle-shell ships three themes; the desktop cannot switch between them today. Shared UI components are three atoms: Button, Pill and TextField.

**Citation keys.** `D:` is `gentle-shell-desktop@5ab4a00:src/`. `GS:` is `gentle-shell@1162ce9:`. `gs-mockup.html:<line>` is the saved DOM of the concept mockup (intent, not spec). Every value below was copied from the cited line.

## Tokens

### Color tokens side by side

"Theme var" is the matching `vars` key in `GS:themes/Gentleman-Cute.json`. Values are case-insensitive hex; the CSS files use lowercase, the JSON and `theme.ts` uppercase.

| Role | Desktop `tokens.css` | Desktop `theme.ts` key | Mockup CSS | Theme var (Gentleman-Cute) |
|---|---|---|---|---|
| Window background | `--bg: #060407` (`:9`) | `bg` | `--bg: #060407` (`:6`) | `bg` `#060407` |
| Panel | `--panel: #100a0f` (`:10`) | `panel` | `--panel: #100a0f` (`:7`) | `bgPanel` `#100A0F` |
| Raised surface | `--raised: #180e15` (`:11`) | `raised` | `--raised: #180e15` (`:8`) | none (see [differences](#differences)) |
| Subtle line | `--line: #2a1720` (`:12`) | `line` | `--line: #2a1720` (`:9`) | `borderSubtle` `#2A1720` |
| Strong line | `--line-strong: #563040` (`:13`) | `lineStrong` | `--line-strong: #563040` (`:10`) | `border` `#563040` |
| Text | `--text: #f6eff3` (`:14`) | `text` | `--text: #f6eff3` (`:11`) | `text` `#F6EFF3` |
| Secondary text | `--text-2: #d2cbd0` (`:15`) | `text2` | `--text-2: #d2cbd0` (`:12`) | `pearl` `#D2CBD0` |
| Muted text | `--muted: #a78e9b` (`:16`) | `muted` | `--muted: #a78e9b` (`:13`) | `muted` `#A78E9B` |
| Accent (pink) | `--accent: #f095c8` (`:17`) | `accent` | `--gold: #f095c8` (`:14`) | `accent` `#F095C8` |
| Accent, active | `--accent-active: #ffb1dd` (`:18`) | `accentActive` | none | `activePink` `#FFB1DD` |
| Blue | `--blue: #a9c7ee` (`:19`) | `blue` | `--blue: #a9c7ee` (`:15`) | `powderBlue` `#A9C7EE` |
| Green | `--green: #b4e7c7` (`:20`) | `green` | `--green: #b4e7c7` (`:16`) | `mint` `#B4E7C7` |
| Amber | `--amber: #f2b86d` (`:21`) | `amber` | `--amber: #f2b86d` (`:17`) | `peach`, `warning` `#F2B86D` |
| Red | `--red: #ff718f` (`:22`) | `red` | `--red: #ff718f` (`:18`) | `error` `#FF718F` |
| Purple | `--purple: #c96aa2` (`:23`) | `purple` | `--purple: #c96aa2` (`:19`) | `deepPink` `#C96AA2` |
| Heading gold | `--champagne: #e0c27a` (`:24`) | `champagne` | `--heading: #e0c27a` (`:20`) | `champagne` `#E0C27A` |

Desktop line numbers are in `D:renderer/shared/theme/tokens.css`; `theme.ts` keys are at `D:renderer/shared/theme/theme.ts:7-25`. Mockup line numbers are in `gs-mockup.html`.

**Theme vars the desktop does not use** (`D:renderer/shared/theme/gentleman-cute.json:4-31`): `bgElement`, `bgSubtle`, `infoBg`, `toolPendingBg` (all `#100A0F`), `dim` `#76616B`, `softRose` `#D7A0B8`, `sky` `#C4DAF6`, `selection` `#28121E`, `toolSuccessBg` `#151316`, `toolErrorBg` `#261019`. The theme also maps 55 semantic `colors` (markdown, syntax, thinking levels, tool states, diffs) to these vars (`:32-88`); the desktop has no equivalent semantic layer.

### Font and shape tokens

| Token | Desktop (`tokens.css`) | Mockup (`gs-mockup.html`) |
|---|---|---|
| Display font | `"Space Grotesk", "Segoe UI", system-ui, sans-serif` (`:26`) | `"Space Grotesk", "Inter", system-ui, sans-serif` (`:21`) |
| Body font | `"Inter", "Segoe UI", system-ui, sans-serif` (`:27`) | `"Inter", system-ui, -apple-system, sans-serif` (`:22`) |
| Mono font | `"JetBrains Mono", "SFMono-Regular", Consolas, monospace` (`:28`) | `"JetBrains Mono", "SFMono-Regular", Menlo, monospace` (`:23`) |
| Radius | none; literal values per component: 4px (`D:renderer/shared/markdown/Markdown.css:21`), 6px (`D:renderer/features/helpers/components/HelperThreadItem.css:86`), 8px, 10px, 12px, 16px, 999px (all `border-radius` declarations in `D:renderer/**/*.css`) | `--r: 10px` (`:24`), plus literals |
| Color scheme | not declared (no `color-scheme` in `D:renderer/`) | `color-scheme: dark` (`:25`) |
| Spacing | no tokens | no tokens |

Fonts load from Google Fonts in both. Desktop: Space Grotesk 500, 600, 700; Inter 400, 500, 600; JetBrains Mono 400, 500 (`D:renderer/index.html:13-16`). Mockup: Space Grotesk 500, 600; Inter 400, 500, 600; JetBrains Mono 400, 500 (`gs-mockup.html:3`). An offline launch loses them ([ADR 0009](../03-architecture/adr/0009-hardcoded-gentleman-cute-theme.md), [audit A14](../03-architecture/audit.md#a14-preload-and-ipc-hardening)).

## Differences

| # | Difference | Desktop | Mockup / theme | Effect |
|---|---|---|---|---|
| D1 | Accent name | `--accent` | `--gold` (`gs-mockup.html:14`) | Same value; rename only. |
| D2 | Heading color name | `--champagne`, unused in any desktop CSS file (0 `var(--champagne)` hits in `D:renderer/`) | `--heading` (`gs-mockup.html:20`) | Same value. |
| D3 | Active accent | `--accent-active` for primary button hover (`D:renderer/shared/ui/atoms/Button.css:17-19`) | not in the mockup; `activePink` in the theme | Desktop adds a token from the theme. |
| D4 | `--raised` source | `#180e15` | equals the mockup (`gs-mockup.html:8`); not in any `GS:themes/*.json` (searched `180e15`, 0 hits) | `Inference:` the desktop took this value from the mockup, not from the theme, although `tokens.css:4` says values are copied from the theme. |
| D5 | Fixture drift | `gentleman-cute.json` maps `colors.userMessageBg` to `bgElement` and has no `userMessageBg` var | `GS:themes/Gentleman-Cute.json` adds var `userMessageBg: "#2A1523"` and maps the color to it | The desktop copy is not identical to the theme at `1162ce9` (compared with `jq -S` and `diff`; only these two lines differ). |
| D6 | Font fallbacks | `Segoe UI` second; `Consolas` for mono | `Inter` second for display, `-apple-system` for body, `Menlo` for mono | Different fallback on systems without the web fonts. |
| D7 | Base font size | none set (`tokens.css` and `App.css` set only `font-family`); sizes are `rem` | `body { font-size: 14px; line-height: 1.5 }` (`gs-mockup.html:35-36`) | `Inference:` desktop text renders against Chromium's 16px default, so it is larger than the mockup. |
| D8 | Working state color | Pill `working` is amber (`D:renderer/shared/ui/atoms/Pill.css:18-21`), used both in the sidebar chat list (`D:renderer/features/chats/components/ChatListItem.tsx:7`, `:39`) and in the chat header (`D:renderer/features/conversation/components/ConversationHeader.tsx:27`) | Chat header pill is gold/pink (`.gs-pill.gs-working`, `gs-mockup.html:162-163`, used at `:519`); sidebar "working" is green text with a dot (`.gs-s.gs-live`, `:144-145`, used at `:481`) | Same state, different colors: one amber pill in the desktop, two treatments in the mockup. |
| D9 | Needs-you color | Pill `needs-you` is red (`Pill.css:23-26`) | gold/pink (`gs-mockup.html:146`, toast `:320`) | Mockup uses red only for failure (`:409`) and for hover on quiet buttons (`:355`). |
| D10 | Primary button | accent background (`Button.css:12-15`) | blue background (`gs-mockup.html:239`, `:353`) | Different primary color. |
| D11 | Message bubbles | user and assistant both on `--raised`; user border accent, assistant border line (`D:renderer/features/conversation/components/MessageBubble.css:9-20`) | user on `--raised` with `--line-strong` border; assistant on `--panel` with `--line` border (`gs-mockup.html:184-185`) | Different contrast between speakers. |
| D12 | Color scheme | not declared | `color-scheme: dark` | `Inference:` native form controls may render light in the desktop. |

Statuses that match: running = accent/gold, waiting = blue, done = green, failed = red (`Pill.css:28-46`; `gs-mockup.html:204-206`, `:407-409`).

## Typography

| Use | Desktop | Mockup |
|---|---|---|
| Body | browser default size, Inter (`D:renderer/app/App.css:4`) | 14px / 1.5, Inter (`gs-mockup.html:34-36`) |
| Chat title | Space Grotesk 600, `1rem` (`D:renderer/features/conversation/components/ConversationHeader.css:11-13`) | Space Grotesk 600, 16px (`gs-mockup.html:156`) |
| Screen title | Space Grotesk 600, `1.5rem` on first run (`D:renderer/features/first-run/components/FirstRun.css:24-26`) | 600 18px for Providers and Extensions (`gs-mockup.html:335`); 600 24px on first run (`:373`) |
| Section label | — | Space Grotesk 600 12px, uppercase, `.08em` tracking (`gs-mockup.html:250`, `:337`) |
| Message text | `0.9rem` / 1.5 (`MessageBubble.css:5-6`) | inherits 14px / 1.55 (`gs-mockup.html:182`) |
| Pill | Inter 600, `0.75rem` (`Pill.css:6-8`) | 11px (`gs-mockup.html:158`) |
| Button | Inter 600, `0.875rem` (`Button.css:2-4`) | 500 12px (`gs-mockup.html:351`); send 600 13px (`:240`) |
| Text field | Inter `0.9rem` (`D:renderer/shared/ui/atoms/TextField.css:3-4`) | 14px / 1.5 (`gs-mockup.html:235`) |
| Paths, evidence, status bar | JetBrains Mono `0.75rem`–`0.8rem` on first run (`FirstRun.css:79-80`, `:142-143`) | JetBrains Mono 11–12px (`gs-mockup.html:285`, `:298`) |

## Components

### Shared components in the desktop

`D:renderer/shared/ui` holds three atoms and nothing else (no molecules or organisms folder).

| Component | File | API | Variants |
|---|---|---|---|
| `Button` | `D:renderer/shared/ui/atoms/Button.tsx:4-24` | native button props, `variant` | `primary` (default), `ghost` |
| `Pill` | `D:renderer/shared/ui/atoms/Pill.tsx:3-27` | `children`, `tone` | `neutral`, `working`, `needs-you`, `running`, `waiting`, `done`, `failed` |
| `TextField` | `D:renderer/shared/ui/atoms/TextField.tsx:4-34` | native input or textarea props, `multiline` | single line, multiline |

Other shared renderer code is not UI kit: `Markdown` (`D:renderer/shared/markdown/Markdown.tsx`) renders sanitized Markdown, and `shared/bridge` and `shared/theme` hold the bridge hook and tokens. Feature components (chat list, dialog card, helper list and thread, first-run option) live inside their feature folders ([ADR 0004](../03-architecture/adr/0004-renderer-scope-rule-and-screaming-architecture.md)).

### Mockup components and their desktop counterpart

| Mockup component | Mockup class and line | Desktop counterpart |
|---|---|---|
| Pill | `.gs-pill` (`gs-mockup.html:157-163`) | `Pill` atom |
| Badge (on, update, local, recommended) | `.gs-badge` (`:346-349`, `:384`) | none; first-run "Recommended" badge is feature CSS (`FirstRun.css:119-126`) |
| Button (default, primary, quiet) | `.gs-btn` (`:351-355`) | `Button` (`primary`, `ghost`) |
| Switch | `.gs-switch` with `role="switch"` (`:356-359`, `:766`) | none |
| Tabs | `.gs-tabs` (`:392-395`) | feature-local tabs in `ConversationHeader` |
| List row (logo, name, description, actions) | `.gs-row` (`:339-345`) | none |
| Key-value list | `.gs-kv` (`:365-366`) | none |
| Toast | `.gs-toast` (`:308-323`) | none |
| Question card | `.gs-ask` (`:213-226`) | `DialogCard` (feature) |
| Helper row, helper list item, thread item | `.gs-helper`, `.gs-hitem`, `.gs-item` (`:198-209`, `:401-411`, `:421-429`) | `HelperListItem`, `HelperThreadItem` (feature) |
| Step, task, checks | `.gs-step`, `.gs-task`, `.gs-checks` (`:263-291`) | none |
| Status bar | `.gs-shellbar` (`:294-306`) | none |
| Option card, found card | `.gs-option`, `.gs-found` (`:375-386`) | first-run option and detection card (feature) |

`Inference:` Switch, Badge, List row, Key-value list and Toast are reused across the mockup's Providers, Extensions and Chats screens, so they are candidates for `shared/ui` when those screens are built.

## Themes

### Themes in gentle-shell

gentle-shell registers its `themes/` folder with pi (`GS:package.json:64-66`). All three use pi's theme schema (`vars`, `colors`, `export`).

| Theme | File | `bg` | `accent` | Notes |
|---|---|---|---|---|
| `Gentle` | `GS:themes/Gentle.json` | `#06080f` | `#E0C15A` | Blue-black with gold; `text` `#F3F6F9`, `muted` `#5C6170`. |
| `Gentleman-Cute` | `GS:themes/Gentleman-Cute.json` | `#060407` | `#F095C8` | Default for new isolated homes ([inventory L6](../05-capability-inventory.md#launcher-and-homes)). The desktop's hardcoded theme. |
| `Gentleman-Sexy` | `GS:themes/Gentleman-Sexy.json` | `#060407` | `#F43888` | Same `bg`, `bgPanel`, `border`, `borderSubtle`, `text` and `muted` as Gentleman-Cute (`:5-13`); a stronger pink accent (`:15`). |

pi also has built-in `system`, `dark` and `light` themes ([inventory E6](../05-capability-inventory.md#extensions-packages-skills-prompts-themes-and-mcp)). None of gentle-shell's three themes is light.

### Theme switching status

**Hardcoded today.**

- `tokens.css` says so: "hardcoded for M1 (reading the live pi theme is out of scope until M4)" (`D:renderer/shared/theme/tokens.css:1-6`). Decision: [ADR 0009](../03-architecture/adr/0009-hardcoded-gentleman-cute-theme.md), from `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:22`.
- There are three copies of the palette: `tokens.css`, `theme.ts` and `gentleman-cute.json`. The test imports only the JSON and `theme.ts` (`D:renderer/shared/theme/theme.test.ts:2-3`) and pins five `theme.ts` values (`accent`, `bg`, `panel`, `text`, `accentActive`) against the JSON (`:7`, `:15-18`). Nothing checks `tokens.css`, so it can drift from the other two unnoticed.
- Only `tokens.css` is imported by the app (`D:renderer/main.tsx:5`). `theme.ts` is used by the test.
- Over RPC, pi does not expose themes: `getAllThemes()` returns `[]` and `setTheme()` returns `{success:false}` ([04, what RPC mode drops](../04-rpc-contract.md#what-rpc-mode-drops)).
- The user's chosen pi theme and gentle-shell's `/gentle:customize` appearance settings are not reflected (inventory E6, V8, V10).

`Inference:` two routes exist, neither decided: read the theme JSON files from the installed package host-side ([inventory V10](../05-capability-inventory.md#shell-experience)), or ask pi for theme data over RPC (inventory E6, upstream). Either needs a mapping from pi's `vars`/`colors` to the desktop's tokens, which the table above starts.

## Open questions

- Should the desktop follow the user's pi theme, offer its own picker, or stay on Gentleman-Cute?
- Which values win where the mockup and the desktop disagree (D7–D12)? The mockup is intent, not spec, so this is a design decision, not a bug list.
- Is a light theme in scope? None exists in gentle-shell.

## Sources read

`gentle-shell-desktop@5ab4a00`: `src/renderer/shared/theme/{tokens.css,theme.ts,theme.test.ts,gentleman-cute.json}`, `src/renderer/shared/ui/atoms/*`, `src/renderer/index.html`, `src/renderer/main.tsx`, `src/renderer/app/App.css`, component CSS cited above; `gs-mockup.html` L2–457; `gentle-shell@1162ce9:themes/*.json`, `package.json`.
