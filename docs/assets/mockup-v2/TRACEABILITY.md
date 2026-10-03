# Traceability: concept mockup v2 (corpus edition)

This file links every surface and every new element of `gs-mockup-corpus.html` to the documentation corpus. The corpus is `docs/` of `gentle-shell-desktop` on branch `docs/corpus`, refreshed on 2026-10-03: the working tree after the refresh, on top of commit `d4a1b84`. Its pins are gentle-shell `main` at `ac67159` (package version 4.0.0), pi 1.0.0 at `a13d35a` and gentle-ai v4.0.0 at `ff77164` (`docs/01-glossary.md:20`). Citations are `docs/<file>:<line>` in that working tree; each cited line was re-read on 2026-10-03. The first edition was aligned with commit `d27baba`.

The mockup is **intent, not spec** (`docs/06-ux/screens.md:7`). It extends Alan Buscaglia's concept mockup (`gs-mockup.html`) with what the corpus documents. Example data (names, counts, percentages, copy) never becomes a requirement. Nothing here is implemented functionality: each surface's "Exists today" value ("Existe hoy" in the Spanish notes) comes from `docs/06-ux/screens.md:54-74`.

IDs from other documents are qualified, as the corpus does: `inventory C17`, `gap G1`, `audit A3`, `UX U3`, `vision Q2`.

## Conventions

- **Attributes.** A surface root carries `data-scr="SCR-NN"` and `data-surface="SCR-NN"`, plus `data-inv="inventory …"`. Every new component (note, chip, row, button, state element) carries `data-scr`, and `data-inv` when an inventory row applies. Text spans inside a component inherit from it. Meta elements outside the product window (the meta bar, the surface index, the pending notice and the window-edge notes strip) carry a bare `data-meta` attribute instead of `data-scr`, so every `data-scr` value matches `SCR-01`…`SCR-19`. The note triggers (inside the window), the note inspector drawer and its scrim and spotlight layers (fixed to the viewport, after the frame) are meta too: they carry `data-meta`, never `data-scr`. So is the desktop background (wallpaper, desktop icons, menu bar, Dock and the banner panel; Decisions, "Desktop background (2026-10-03)").
- **Corpus notes.** `details.gs-corpus` holds the surface ID, name and "Exists today" in its `summary`. Its `dl` holds "Blocked by", "States", "Inventory" and, where needed, "Inference", "Intent only", "Input", "Not drawn" and "Today". The selectors in the table give each note's home in the markup. Since 2026-10-03 no note shows inline: the script hides each note at its home and puts a trigger button in its place, and the note opens in the note inspector: a shared drawer that slides in from the browser's edge over a spotlight on the annotated surface. Opening moves the note node into the panel, and closing moves it back, so its chips, `data-scr` and `data-inv` stay the same. Without the script, the notes show inline in the corpus style. See Decisions, "Annotation styles and note inspector".
- **Note language.** Since 2026-10-03 everything that is not the app is in Spanish (Decisions, "Spanish annotation layer" and "Spanish meta layer"): the notes, the proposal badges and tags, the triggers' accessible names, the inspector chrome and the two switch labels are in Spanish, with `lang="es"`; the product window stays English (Decisions, "Spanish annotation layer (2026-10-03)"). This file stays English and names note sections by their English corpus-convention labels. The notes show them as: "Blocked by" = "Bloqueado por", "States" = "Estados", "Inventory" = "Inventario", "Inference" = "Inferencia", "Intent only" = "Solo intención", "Input" = "Entrada", "Not drawn" = "No dibujado", "Already drawn" = "Ya dibujado", "Drawn" = "Dibujado", "Depends on" = "Depende de", "Open" = "Abierto", "Status" = "Estado", "Today" = "Hoy", "Mockup" = "Mockup" (the user's term, since the scoped correction of 2026-10-03; T1 had used a Spanish synonym), "Interactions" = "Interacciones", "Over RPC" = "Por RPC", "Added" = "Añadido"; "Exists today" = "Existe hoy"; "not built" = "no construido". The `Inference:` and `UNVERIFIED:` markers inside the prose stay in English.
- **State previews.** A chip `button.gs-chip[data-group][data-state]` calls `setState(group, state)`. Elements with `data-when="group:state …"` show only in those states; elements with `data-hide-when` hide in them. `[data-state-scope]` receives `data-current`. The default state of every group is `drawn`.
- **Navigation.** A delegated `go(target)` shows `[data-view="<target>"]`. When no such view exists it shows `#gs-pending` and changes nothing. Index links carry `data-focus="SCR-NN"`, which outlines `[data-surface="SCR-NN"]`.
- **Community proposals.** `[data-proposal]` hides when the switch is off. The badge is `span.gs-badge.gs-proposal`. Proposal UI carries a dotted frame in `--note-community`, so it reads as a layer added on top of the product. See [Community proposals](#community-proposals).
- **Overlays.** A view with `[data-overlay]` (SCR-13, SCR-19) opens over the current view instead of replacing it. It closes with its × button, any `[data-close-overlay]` action, a click on the backdrop, Escape, or navigation to another view.
- **Derived surfaces.** Every SCR-10…19 note states "No mockup; derived from inventory." (the wording of `docs/06-ux/screens.md:199` and the matching line of each derived screen; shown since 2026-10-03 in Spanish as "Sin mockup; derivado del inventario.", keeping "mockup", the user's term) and has an "Inference" line (shown as "Inferencia"), because their content is `Inference:` (`docs/06-ux/screens.md:188`). A `button[data-set-state]` inside a view previews the next state of an interaction (for example consent, then in progress); it is a preview, not behavior.
- **Segmented choice.** `.gs-seg [role="radio"]` keeps one choice checked per group. It is used for the worktree switch (SCR-15) and for settings with named values (SCR-17).

## Table

| Element | Selector | SCR | Inventory rows | Corpus citation | Notes |
|---|---|---|---|---|---|
| Corpus edition line | `.gs-meta > span:first-child[data-meta]` | meta (`data-meta`) | — | `docs/06-ux/screens.md:7`, `docs/01-glossary.md:20` | Names the corpus refreshed on 2026-10-03 and its pins (gentle-shell `main` at `ac67159`, package 4.0.0; pi 1.0.0; gentle-ai v4.0.0), and states that every screen is design intent, not implemented functionality. In Spanish since 2026-10-03 (`lang="es"`): "Edición del corpus · alineada con el corpus `docs/` …"; branch names, SHAs, versions and code stay as they are (Decisions, "Spanish meta layer"). |
| Concept mockup disclaimer | `.gs-banner > .gs-note:first-child` (`.gs-frame > .gs-note:first-child` before the banner panel, 2026-10-03) | meta (outside the window) | — | Original `gs-mockup.html:461-462` | Alan's line, translated at the user's request on 2026-10-03: "Mockup conceptual · El contenido es de ejemplo." (`lang="es"`), with the same styling; the original reads "Concept mockup · Content is example data.". Since 2026-10-03 its "Screens: …" links are gone; the four screens are subgroups of the surface index (Decisions, "Banner: screens as index subgroups"). |
| Surface index | `nav.gs-index[lang="es"][data-meta]`, `.gs-index-group[data-meta]`, `.gs-index-items[data-meta]` | meta (`data-meta`) | — | `docs/06-ux/screens.md:5`, `docs/06-ux/screens.md:54-74` | Spanish, accessible name "Índice de superficies". Two sections, aligned on one grid: a section label, then its items. "Del mockup" (SCR-01…09) holds Alan's four screens as subgroups (`.gs-index-screen[data-meta]`, left rule). Each subgroup starts with its screen label, a link (`a.gs-index-screen-link[data-meta]`, `data-go` `chat`, `providers`, `extensions` or `welcome`) that opens the whole screen as the old "Screens:" link did, followed by that screen's SCR chips: Chats (SCR-01…06), Providers (SCR-07), Extensions (SCR-08), Primer arranque (SCR-09). The labels Chats, Providers and Extensions stay English, because they are the app's own screen names in its sidebar; "First run" is not an app navigation label, so it becomes "Primer arranque", the name the SCR-09 note uses. Each screen link has a Spanish `title` ("Pantalla Chats del mockup"; "Pantalla de primer arranque del mockup (First run en el original)"). "Derivadas del inventario" (SCR-10…19) has no subgroups. Chips show the SCR ID and a Spanish short name ("SCR-01 Barra lateral", "SCR-04 Progreso del trabajo", "SCR-19 Confianza en el proyecto"). SCR chips keep `data-go`, `data-focus` (opens and flashes the surface) and `data-scr`. Derived links use a dashed border, as the screen map does (`docs/06-ux/screens.md:50`). Below 640px the label stacks above its items. |
| Index links SCR-10…19 | `.gs-index a.gs-derived` | SCR-10…19 | — | `docs/06-ux/screens.md:65-74` | Targets `profiles`, `tree`, `details`, `palette`, `review`, `changes`, `memory`, `settings`, `diagnostics`, `trust`. Each opens its view; `palette` and `trust` open overlays (SCR-13, SCR-19). |
| Pending notice | `#gs-pending[lang="es"][data-meta]` | meta (`data-meta`) | — | — | Shown when a target view does not exist: "<SCR-NN nombre> aún no tiene pantalla en esta edición. No ha cambiado nada." (Spanish since 2026-10-03; names from the script's `PENDING_SURFACES`). Since T2 every SCR-01…19 target has a view, so no index link or in-app entry point reaches it. |
| Corpus notes switch | `#sw-notes`, in `.gs-toggle.gs-toggle-corpus[data-meta]` | meta (`data-meta`) | — | `docs/06-ux/screens.md:54-64`; token `docs/06-ux/design-system.md:32` | Default on. Label "§ Notas del corpus" (`lang="es"`; accessible name "Mostrar las notas del corpus") in `--heading`; when on, the track is `--heading`. Off adds `body.gs-notes-off`, which hides every corpus trigger and every corpus note (`.gs-corpus:not([data-proposal])`), and closes the note inspector if it shows a corpus note. Proposal notes follow the proposals switch. |
| Community proposals switch | `#sw-proposals`, in `.gs-toggle.gs-toggle-community[data-meta]` | meta (`data-meta`) | — | vision P10, `docs/00-vision.md:81`; `docs/06-ux/principles.md:123` | Default on. Label "✎ Propuestas de la comunidad" (`lang="es"`; accessible name "Mostrar las propuestas de la comunidad") in `--note-community`; when on, the track is `--note-community`. Off adds `body.gs-proposals-off`, which hides every `[data-proposal]`, including the community triggers. It also closes the note inspector if it shows a proposal note. Content: proposals 0001–0003 (rows below the derived surfaces). |
| Scrollbars (theme-wide) | `*::-webkit-scrollbar*` under `@supports selector(::-webkit-scrollbar)`; `*` with `scrollbar-width`/`scrollbar-color` under `@supports not selector(…)`; `scrollbar-gutter` on `.gs-side`, `.gs-thread`, `.gs-odd`, `.gs-view`, `.gs-hlist`, `.gs-hbody`, `.gs-pal-list` | all surfaces (theme) | — | Precedent `gentle-shell-desktop@5ab4a00:src/renderer/shared/theme/tokens.css:48-72` (commit `3456eef`, PR #20); tokens `docs/06-ux/design-system.md:21`, `docs/06-ux/design-system.md:31` | Not a corpus capability; it is a theme detail taken from the desktop. The six departures from the precedent (rest colour for 3:1, `@supports` split, no arrows or corner, focus matching hover, gutter, no motion) are justified under Decisions, "Scrollbars". |
| Community proposal badge | `.gs-badge.gs-proposal` | meta (`data-meta` on the legend instance) | — | `docs/06-ux/principles.md:123` | Reusable badge; one legend instance sits next to the switch. Since 2026-10-03 it uses the community style: "✎" prefix (CSS `::before`), monospace, dotted `--note-community` border, `--note-community` text on its tint. |
| Note inspector | `aside#gs-insp.gs-insp[data-meta]` (drawer), `#gs-scrim[data-meta]` (hit layer), `#gs-spot[data-meta]` (dim layer and cut-out); after `.gs-frame` | meta (`data-meta`) | — | — | One shared, non-modal drawer (`role="dialog"`, `aria-modal="false"`, labelled by its heading `#gs-insp-title`; triggers carry `aria-haspopup="dialog"`). It is fixed and flush with the browser's left or right edge, full viewport height, 370px wide, with only its inner border in the note style, and it slides in over the page: the app never moves. `data-kind` is `corpus` (dashed `--heading` border, "§ Corpus" tab) or `community` (dotted `--note-community` border, "✎ Propuesta de la comunidad" tab). Header: ‹ › ("Nota anterior", "Nota siguiente") through the enabled notes, ⇆ ("Mover el panel al otro lado") to swap sides, × ("Cerrar la nota", title "Cerrar (Esc)") to close; a line with the note's "Existe hoy" badge (proposals: "se muestra en" and the host SCR) and its position, for example "1 de 22". The drawer carries `lang="es"`. A spotlight dims everything but the annotated surface, outlined in the note style; a click on the dimmed area closes the drawer. Motion, side rule, ARIA and the phone sheet: Decisions, "Annotation styles and note inspector". |
| Onboarding layer | `#gs-tour[lang="es"][data-meta]`: `#gs-tour-block` (pointer blocker), `#gs-tour-spot` (dim and cut-out); after the note inspector | meta (`data-meta`) | — | — | A modal, skippable tour in Spanish, 8 steps. The dim-and-hole technique of the note drawer, on its own layer above the drawer (z 60–62). While it is open, the page, the drawer and its scrim are `inert`, and a click on the dimmed area does nothing. The hole outline is solid `--text-2`, distinct from the gold and orange note styles; steps with no element (welcome) dim the whole page. Behaviour, motion, storage and responsive rules: Decisions, "Onboarding (2026-10-03)". |
| Onboarding card | `section#gs-tour-card[role="dialog"][aria-modal="true"][lang="es"][data-meta]` | meta (`data-meta`) | — | `docs/06-ux/screens.md:5` (step 2: 4 screens, 9 surfaces, 10 derived) | Step count "Paso N de 8", title (`#gs-tour-title`, focused on each step), text, progress dots, "Saltar", "Anterior", "Siguiente" ("Empezar" on the last step). Neutral meta style: `--text` and `--text-2` on `color-mix(in srgb, var(--text) 6%, var(--raised))`, a solid `--line-strong` border, radius 14px, Inter. Placed beside the spotlit element without covering it; docked at the bottom at 1100px and below. |
| "Ver tutorial" button | `button#gs-tour-replay.gs-tour-replay[lang="es"][data-meta]`, at the end of `.gs-meta` | meta (`data-meta`) | — | — | Replays the tour from step 1. Same neutral meta style as the card. Step 8 spotlights it. |
| Desktop wallpaper | `.gs-desk[aria-hidden="true"][data-meta] > svg.gs-wall` | meta (`data-meta`) | — | — | Not a corpus capability: the page background, at the user's request (2026-10-03). An original abstract composition in inline SVG, fixed behind everything (`z-index: -1`): a diagonal `--blue` → `--purple` → `--gold` blend over `--bg`, a soft `--heading` glow and four smooth wave bands, with thin `--text` highlight lines on three wave crests. Every colour is a token or a `color-mix()` of tokens; no Apple wallpaper or artwork. Decorative (`aria-hidden`). Decisions, "Desktop background (2026-10-03)". |
| Banner panel | `.gs-frame > .gs-banner[data-meta]`, wrapping the disclaimer, `.gs-meta`, `nav.gs-index` and `#gs-pending` | meta (`data-meta`) | — | — | Not a corpus capability. A translucent dark widget that keeps the meta banner legible on the wallpaper: `color-mix(in srgb, var(--bg) 75%, transparent)` with `backdrop-filter: blur(24px) saturate(1.2)`, radius 16px (14px at 640px and below), a faint `--text` border. Body text (`--muted`) measures 5.96:1 at 1440 and 5.69:1 at 390, against the lightest panel pixel under it. |
| Menu bar | `.gs-mbar[lang="es"][data-meta]`, fixed at the top, 26px | meta (`data-meta`) | — | — | Not a corpus capability. Translucent dark bar with blur (`--bg` 55%). Left: a neutral ring glyph (not the Apple logo), the app name "gentle shell" in bold, and the decorative menus "Archivo", "Edición", "Visualización", "Ventana" (`aria-hidden`). "Ayuda" (`button#gs-mbar-help`, `aria-haspopup="menu"`, `aria-expanded`) opens `#gs-mbar-helpmenu[role="menu"]` with one item, "Ver tutorial" (`#gs-mbar-tour`, `role="menuitem"`), which replays the onboarding; the menu closes on Esc, an outside click or a choice, and ↓ or Enter opens it from the keyboard with focus on the item. Right (`aria-hidden`): original wifi, battery, search and control-centre glyphs in `--text`, then the date and time in Spanish (`#gs-mbar-clock`, for example "sáb 3 oct 16:42"), updated every minute. `.gs-frame` gains `padding-top: 26px`, so nothing sits under the bar. |
| Desktop icons | `.gs-dicons[lang="es"][data-meta] > .gs-dicon` (inside `.gs-desk`) | meta (`data-meta`) | — | — | Not a corpus capability. Three original icons in a column at the top right, under the menu bar and behind the window: "Proyectos" and "Capturas" (two-tone `--blue` folders with a code and a screenshot mark) and "notas.md" (a page with a folded corner and an "MD" tag). White 10px one-line labels with a soft shadow, macOS style, ellipsized if a font runs wider. Decorative (`aria-hidden`). Shown at 1440px and above only, where they fit the gutter beside the window. |
| Dock | `#gs-dockwrap[lang="es"][data-meta] > #gs-dock` | meta (`data-meta`) | — | — | Not a corpus capability. A translucent, rounded Dock centred at the bottom, auto-hidden. Original tiles: "Archivos" (file manager), "Navegador", "Terminal", "Ajustes", then gentle shell (✿ in `--gold` on a dark rounded square, with the running dot), a separator and "Papelera". Hover lifts a tile 5px and scales it 1.12, with its name above. Only gentle shell is a control: `button#gs-dock-gs`, labelled "gentle shell: ir a la ventana de la aplicación", which scrolls the window to just under the menu bar; the other tiles are `aria-hidden`. Hidden at 640px and below. Auto-hide and motion: Decisions, "Desktop background (2026-10-03)". |
| Corpus trigger | `button.gs-ntrig.gs-ntrig-corpus[data-meta]`, inserted by the script just before each corpus note's home | host SCR (`data-meta`) | — | — | 19 triggers, one per surface SCR-01…SCR-19, labelled "§ SCR-NN". Each sits where its note was (SCR-05 and SCR-06: in the window-edge strip). `aria-controls="gs-insp"` and `aria-expanded`; the accessible name and title read "Nota del corpus SCR-NN: " plus the surface name, with `lang="es"`. A click opens the note in the inspector, and a second click closes it. |
| Community trigger | `button.gs-ntrig.gs-ntrig-community[data-meta][data-proposal]` | host SCR-03 (`data-meta`) | — | `docs/07-proposals/README.md:5` | 3 triggers, labelled "✎ 0001", "✎ 0002", "✎ 0003". 0002 sits in the helpers list, where its note was, and 0003 sits in the Ask why dialog. 0001 sits by the List \| Graph toggle (`.gs-pview`), because its note lives in the graph, which List mode hides. They carry `data-proposal`, so the proposals switch hides them. Accessible name and title: "Propuesta de la comunidad 000N: " plus the proposal name, with `lang="es"`. |
| Community frame on proposal elements | `[data-proposal]:not(.gs-corpus):not(.gs-ntrig):not(.gs-overlay):not([data-proposal] *)`, `.gs-overlay[data-proposal] > .gs-dialog` | host SCR (SCR-02, SCR-03) | — | `docs/07-proposals/README.md:5` | A 1px dotted `--note-community` outline on the outermost element of every piece of proposal UI. That covers List \| Graph and the graph, the steer box, Steer \| Queue, the helper's question card, Ask why, the Ask why dialog, and the items the script adds. Proposals live apart from maintainer intent, so they read as a layer added on top of the product. Behaviour is unchanged. |
| **SCR-01** Sidebar and chat list (surface) | `nav.gs-side[data-surface="SCR-01"]` | SCR-01 | S1, S2, S3, S4, S5, S6, S16, S17 | `docs/06-ux/screens.md:78`, `:83` | Exists today: partial (`docs/06-ux/screens.md:56`). Original markup kept. |
| SCR-01 corpus note | `nav.gs-side > details.gs-corpus` | SCR-01 | S1, S2, S3, S4, S5, S6, S16, S17 | `docs/06-ux/screens.md:56`, `:84`, `:88`; `docs/05-capability-inventory.md:149`, `:163` | Blockers from "At a glance" plus gap G9, inventory S17 and the inventory S3 caveat (a stored cwd that no longer exists makes pi exit with code 1) from the Blockers row. S17's hidden custom-directory sessions are `Inference:`, as the corpus writes it. |
| "Chat in another folder…" | `#new-chat-folder` | SCR-01 | S1, T1 | `docs/06-ux/screens.md:42`, `docs/05-capability-inventory.md:147` | `Inference:` screen-map edge to SCR-19; inventory S1 surface is "New chat with a folder picker". |
| Search chats | `#chat-search` | SCR-01 | S4 | `docs/06-ux/screens.md:85`, `docs/05-capability-inventory.md:150` | `Inference:` (host-side search). Not wired. |
| Settings nav entry | `.gs-nav [data-go="settings"]` | SCR-01 | — | `docs/06-ux/screens.md:40` | `Inference:` edge SB → SCR-17. |
| List states: empty, loading, list error | `.gs-side-state[data-when^="list:"]` | SCR-01 | S3 | `docs/06-ux/screens.md:84` | Preview chips `data-group="list"`. Copy is example text. |
| **SCR-02** Chat pane (surface) | `section.gs-main[data-surface="SCR-02"]` | SCR-02 | C1–C6, C8–C11, C14, C17–C21, S19, K1, A5, A7, A9, R2, V1, V13, V14, V15, V16–V18, I5, I10, Y1, Y2 | `docs/06-ux/screens.md:90`, `:95` | Exists today: partial (`docs/06-ux/screens.md:57`). The root `data-inv` carries exactly these assigned rows. Helpers under their message stay as mockup intent; the desktop cannot place them (`docs/06-ux/screens.md:100`). |
| SCR-02 corpus note | `#thread > details.gs-corpus` | SCR-02 | as surface | `docs/06-ux/screens.md:57`, `:96`, `:100`; `docs/05-capability-inventory.md:528`; `docs/03-architecture/audit.md:159` | "Blocked by" also carries audit A12 and A13 (`docs/06-ux/screens.md:100`). "Inference" also carries the idle-parent wake: since gentle-shell 4.0.0 a user-role message wakes an idle parent when a helper finishes (inventory A7); `Inference:` (not run) the desktop drops it live and, after a reload, shows it as a user bubble without the result. "Not drawn" also lists inventory C8, V13, V14, Y1, Y2 and A9 (see Gaps). |
| Helpers under the message (original, annotated) | `.gs-agents` | SCR-02 | A1, A2 | `docs/06-ux/screens.md:99`, `:100`; `docs/05-capability-inventory.md:522-523` | Original element. Inventory A1 and A2 are SCR-03 rows; they are carried here because the strip shows helpers (A1) and their live state (A2) under the message that started them, which is mockup intent (`docs/06-ux/screens.md:99`). The desktop cannot place them there (`docs/06-ux/screens.md:100`). |
| "⋯" chat menu | `#chat-more`, `#chat-more-menu` | SCR-02 | K1 | `docs/06-ux/screens.md:35-37`, `:97` | `Inference:` entries Compact now, Branches (SCR-11), Details and export (SCR-12), Commands (SCR-13). Placed left of the tabs because the toasts overlay the right end of the header. |
| Compact now | `#chat-more-menu [data-set-state="chat:compacting"]` | SCR-02 | K1 | `docs/05-capability-inventory.md:197`, `docs/06-ux/screens.md:97` | Previews the compacting state. "Optional instructions" not drawn. |
| State: idle | chip `data-group="chat" data-state="idle"` | SCR-02 | V1 | `docs/06-ux/screens.md:96` | Hides the Working pill and the question card. |
| State: empty | `.gs-empty-state` | SCR-02 | — | `docs/06-ux/screens.md:96`, `docs/06-ux/principles.md:32` | Copy "Start a conversation with Gentle." is the desktop's own (cited in UX U1). |
| State: queued message | `.gs-cstate[data-when="chat:queued"]` | SCR-02 | C4, C5, C6 | `docs/05-capability-inventory.md:174-176`, `docs/06-ux/screens.md:96` | Not built. Edit and Remove follow inventory C6. Whether a prompt sent while working queues or steers is open (vision Q5, `docs/00-vision.md:131`). |
| State: retrying | `.gs-cstate.gs-is-retry` | SCR-02 | K5 | `docs/05-capability-inventory.md:201` | Not built. Text "Retrying in 4 s… Cancel" follows the inventory's surface idea. |
| State: compacting | `.gs-cstate[data-when="chat:compacting"]` | SCR-02 | K1, K2 | `docs/05-capability-inventory.md:197-198` | Not built. |
| State: error | `.gs-cstate.gs-is-error` | SCR-02 | — | `docs/06-ux/screens.md:96`, `:98` | Copy is example text. |
| Working pill and question card (original) | `.gs-main-head .gs-pill`, `.gs-ask` | SCR-02 | V1; C19, I10 | `docs/06-ux/screens.md:99` | Original elements; given `data-hide-when` for the state previews. |
| **SCR-03** Helpers pane (surface) | `.gs-chat-helpers[data-surface="SCR-03"]` | SCR-03 | A1, A2, A3, A4, A5, A6, A12 | `docs/06-ux/screens.md:102`, `:107` | Exists today: partial (`docs/06-ux/screens.md:58`). |
| SCR-03 corpus note | `.gs-hlist > details.gs-corpus` | SCR-03 | as surface | `docs/06-ux/screens.md:58`, `:108`, `:112` | |
| "Earlier · 2 finished" group | `details.gs-earlier` | SCR-03 | A12 | `docs/06-ux/screens.md:108`, `:110` | The desktop already has this group; drawn with a failed and a cancelled helper. |
| Helper states failed, cancelled | `.gs-hitem.gs-failed`, `.gs-hitem.gs-cancelled` | SCR-03 | A1 | `docs/06-ux/screens.md:108` | Desktop status set. `gs-cancelled` is a new muted dot. "waiting" is listed in the note only. |
| State: empty | `.gs-side-state[data-when="helpers:empty"]` | SCR-03 | — | `docs/06-ux/screens.md:108` | Copy is example text. |
| Stop (original, annotated) | `.gs-hfoot .gs-btn.gs-quiet` | SCR-03 | A4 | `docs/05-capability-inventory.md:525`, `docs/04-rpc-contract.md:286` | Kept as mockup intent. Disabled in the desktop today (gap G1). |
| **SCR-04** Work progress panel (surface) | `aside.gs-odd[data-surface="SCR-04"]` | SCR-04 | O2, O3, O4, R5 | `docs/06-ux/screens.md:114`, `:119` | Exists today: no (`docs/06-ux/screens.md:59`). |
| SCR-04 corpus note | `aside.gs-odd > details.gs-corpus` | SCR-04 | as surface | `docs/06-ux/screens.md:59`, `:120`, `:124` | Carries the phase mapping. "Blocked by" also carries audit A3 (`:124`). |
| gentle-shell phase label | `#odd-phase` | SCR-04 | O2 | `docs/05-capability-inventory.md:540`, `docs/04-rpc-contract.md:287` | Small monospace label on the active step. See Decisions. |
| Phase preview chips | `.gs-chip[data-phase]` | SCR-04 | O2 | `docs/05-capability-inventory.md:540` | Eight phases; `setPhase()` moves the active step by the mapping. `Inference:` mapping. |
| State: no feature | `.gs-odd [data-when="odd:none"]` | SCR-04 | O1 | `docs/06-ux/screens.md:120`, `docs/05-capability-inventory.md:539` | `Inference:` (per screens.md): small work creates no feature document. |
| Review check link | `.gs-odd [data-go="review"]` | SCR-04 | R5 | `docs/06-ux/screens.md:121` | `Inference:` jump to SCR-14. |
| Changed lines link | `.gs-odd [data-go="changes"]` | SCR-04 | — | `docs/06-ux/screens.md:38`, `:121` | `Inference:` edge OP → SCR-15. |
| Tasks and evidence (original, annotated) | `.gs-odd .gs-tasks` | SCR-04 | O3, O4 | `docs/05-capability-inventory.md:541-542` | Feature document format unspecified; todo state rides only in `todo` tool results. |
| **SCR-05** Status bar (surface) | `.gs-shellbar[data-surface="SCR-05"]` | SCR-05 | V2, V3, V4, K3, K4, M1, M3, M5, P1, R1, O2 | `docs/06-ux/screens.md:126`, `:131` | Exists today: no (`docs/06-ux/screens.md:60`). |
| SCR-05 corpus note | `.gs-edge-notes > details[data-scr="SCR-05"]` | SCR-05 | as surface | `docs/06-ux/screens.md:60`, `:132`, `:136`; `docs/05-capability-inventory.md:500` | Placed below the window (the bar is too thin for a note). Lists what RPC offers per value (gap G6, G7). "Blocked by" also carries audit A3 (`docs/06-ux/screens.md:136`). "Not drawn" also lists the inventory V3 status card (see Gaps). |
| Profile entry point | `.gs-shellbar [data-go="profiles"]` | SCR-05 | P1 | `docs/06-ux/screens.md:33`, `:133` | `Inference:` edge BAR → SCR-10. Keyboard: Enter or Space. |
| RDD entry point | `.gs-shellbar [data-go="review"]` | SCR-05 | R1, O2 | `docs/06-ux/screens.md:34`, `:133` | `Inference:` edge BAR → SCR-14. |
| State: value unknown | `.gs-shellbar [data-unknown]` | SCR-05 | — | `docs/06-ux/screens.md:132` | Chip swaps every value for "—". |
| **SCR-06** Notifications (surface) | `.gs-toasts[data-surface="SCR-06"]`, `.gs-bell[data-surface="SCR-06"]` | SCR-06 | C20, V16, V18, A7 | `docs/06-ux/screens.md:138`, `:143` | Exists today: no (`docs/06-ux/screens.md:61`). |
| SCR-06 corpus note | `.gs-edge-notes > details[data-scr="SCR-06"]` | SCR-06 | as surface | `docs/06-ux/screens.md:61`, `:144`, `:148` | |
| Unread count on the bell | `.gs-bell .gs-count` | SCR-06 | C20 | `docs/06-ux/screens.md:144` | Example count. |
| Toast opens its chat | `.gs-toast [data-open-chat]` | SCR-06 | C20 | `docs/06-ux/screens.md:29`, `:145` | `Inference:` edge NT → CP. Selects the matching sidebar chat. |
| State: none | chip `data-group="notif" data-state="none"` | SCR-06 | — | `docs/06-ux/screens.md:144` | Hides toasts, dot and count. |
| **SCR-07** Providers (surface) | `section[data-surface="SCR-07"]` | SCR-07 | M1, M2, M4, M7–M12, I6, V4, V19 | `docs/06-ux/screens.md:150`, `:155` | Exists today: no (`docs/06-ux/screens.md:62`). Inventory V19 joined the screen's rows in the 2026-10-03 refresh. |
| SCR-07 corpus note | `[data-view="providers"] > details.gs-corpus` | SCR-07 | as surface | `docs/06-ux/screens.md:62`, `:156`, `:160`; `docs/05-capability-inventory.md:214`, `:516`; `docs/04-rpc-contract.md:288` | "Blocked by" adds inventory V19 (`/gentle:stats` is TUI-only and under RPC only sends a `notify`; `Inference:` the desktop could read the same session files). States adds a non-interactive chip for the `Inference:` usage history per model (inventory V19), not drawn. "Input" records that since pi 1.0.0 the terminal `/login` ends with "Sign in with Radius" and then offers the Radius MCP server (inventory M7, gap G3): input for this screen, not a requirement. |
| Check connection | `[data-view="providers"] [data-inv="inventory M12"].gs-btn` | SCR-07 | M12 | `docs/05-capability-inventory.md:219` | `Inference:` inventory surface "Check connection per provider". |
| Usage section | `[data-view="providers"] .gs-meter` | SCR-07 | V4 | `docs/06-ux/screens.md:156`, `docs/05-capability-inventory.md:501` | Not in the mockup. `UNVERIFIED:` which usage fields gentle-shell reports; one percentage is drawn as example data. |
| NaN provider row | `[data-view="providers"] [data-inv="inventory I6"].gs-row` | SCR-07 | I6 | `docs/05-capability-inventory.md:583` | Provider entry with an API key; sign-in is gap G3. |
| Models for quick switching | `[data-view="providers"] .gs-res[data-inv="inventory M4"]` | SCR-07 | M4 | `docs/06-ux/screens.md:157`, `docs/05-capability-inventory.md:211` | `Inference:` favorites for cycling; no RPC command sets them. |
| States: signing in, error | `[data-when^="prov:"]` | SCR-07 | M7 | `docs/06-ux/screens.md:156` | Drawn on the OpenAI Codex row. Copy is example text. |
| **SCR-08** Extensions (surface) | `section[data-surface="SCR-08"]` | SCR-08 | E1, E2, E4–E9, I1–I3, A11, L4, L7, V10, H3 | `docs/06-ux/screens.md:162`, `:167` | Exists today: no (`docs/06-ux/screens.md:63`). |
| SCR-08 corpus note | `[data-view="extensions"] > details.gs-corpus` | SCR-08 | as surface | `docs/06-ux/screens.md:63`, `:168`, `:172`; `docs/00-vision.md:100`, `:139` | "Open" points the mockup's "Per project … (shared with your team)" line, kept unchanged as example copy, to vision Q13: whether team-shared project settings are a target use case is open. |
| State: installing | `[data-when="ext:installing"]` | SCR-08 | E1 | `docs/06-ux/screens.md:168` | Example package `npm:pi-btw`. |
| State: needs reload | `[data-when="ext:reload"]` | SCR-08 | E7 | `docs/06-ux/screens.md:168`, `docs/05-capability-inventory.md:232` | `Inference:` from "Changes apply to new chats". No reload command over RPC. |
| Memory link | `.gs-row [data-go="memory"]` | SCR-08 | — | `docs/06-ux/screens.md:39` | `Inference:` edge EX → SCR-16, on the gentle-engram row. |
| Refresh skills | `[data-view="extensions"] .gs-btn[data-inv="inventory I3"]` | SCR-08 | I3 | `docs/05-capability-inventory.md:580` | `Inference:` "Refresh skills" action. |
| Helper definitions | `.gs-res[data-inv="inventory A11"]` | SCR-08 | A11 | `docs/05-capability-inventory.md:532` | Paths follow inventory A11 for an isolated home. |
| MCP servers | `.gs-res[data-inv="inventory E8"]` | SCR-08 | E8 | `docs/05-capability-inventory.md:233` | `Inference:` MCP section; state only via `notify`. |
| Companion packages, Repair | `.gs-res[data-inv="inventory L4"]` | SCR-08 | L4 | `docs/05-capability-inventory.md:484` | `Inference:` "Repair companions". |
| **SCR-09** First run (surface) | `section.gs-welcome[data-surface="SCR-09"]` | SCR-09 | L1, L2, L5, U7, M7, M9 | `docs/06-ux/screens.md:174`, `:179` | Exists today: yes, partly (`docs/06-ux/screens.md:64`). |
| SCR-09 corpus note | `.gs-welcome-card > details.gs-corpus` | SCR-09 | as surface | `docs/06-ux/screens.md:64`, `:180`, `:184`; `docs/05-capability-inventory.md:481`; `docs/03-architecture/audit.md:8`; `docs/10-platforms.md:132`, `:134`, `:135` | "Blocked by" also carries the inventory L1 `GENTLE_SHELL_HOME` caveat and audit A4 as screens.md now states it: a tester reports the Windows spawn failure in desktop issue #23, and open PR #26 (not merged as of 2026-10-03) leaves paths unquoted, PLAT-02 (`docs/06-ux/screens.md:184`). "Not drawn" adds the Windows checks for Go 1.25.10 or newer and for Bash, whose mitigations are first-run checks (PLAT-04, PLAT-05). |
| States: pi not found, saving, error with Retry | `[data-when^="first:"]` | SCR-09 | — | `docs/06-ux/screens.md:180-181` | Copy is example text. |
| State: provisioning | `.gs-found.gs-busy` | SCR-09 | L5 | `docs/05-capability-inventory.md:485` | Not built. `Inference:` "Setting up Gentle…" progress. |
| Lead "Everything you need is already inside this app." and "the app runs its own copy of pi" (original, annotated) | `.gs-welcome p.gs-lead`, `.gs-welcome-card > p.gs-fine` | SCR-09 | — | `docs/06-ux/screens.md:183`, `docs/00-vision.md:128` | Both are original copy (`gs-mockup.html:655`, `:687`), kept unchanged. Intent only (vision Q2): the corpus does not settle whether the app ships its own runtime. The note's "Intent only" line covers the lead and the fine print. |
| **SCR-10** Profiles (surface) | `section[data-surface="SCR-10"]` | SCR-10 | P1, P2, P3 | `docs/06-ux/screens.md:190`, `:194-195` | Exists today: no (`docs/06-ux/screens.md:65`). No mockup (`:199`); content is `Inference:` (`:188`). Reached from the status bar profile (`:33`). |
| SCR-10 corpus note | `[data-view="profiles"] > details.gs-corpus` | SCR-10 | as surface | `docs/06-ux/screens.md:196-200`, `docs/04-rpc-contract.md:291`, `docs/00-vision.md:134`, `docs/05-capability-inventory.md:558` | Blockers gap G6, inventory P1, P3 (`Inference:`, not run), vision Q8. "Today" carries the seeded `current` profile from inventory P1 (`docs/05-capability-inventory.md:558`), marked `Inference:`. "Not drawn" carries the post-release Apply confirmation: on gentle-shell `main` (`ac67159`), after the 4.0.0 release (#1349), applying a profile first asks a `confirm` with the routing diff, which is unreachable under RPC because it is asked from inside the panel (inventory P1). |
| Profile list: Apply, Rename, Duplicate, Export, Delete | `[data-view="profiles"] .gs-list .gs-row` | SCR-10 | P1 | `docs/06-ux/screens.md:197`, `docs/05-capability-inventory.md:558` | Names and models are example data; "balanced" matches the status bar (`profile balanced`). Each Apply button's `title` notes the post-release routing-diff confirmation (inventory P1), which is not drawn. |
| Create, Snapshot current, Import | `[data-view="profiles"] .gs-row-actions[data-inv="inventory P1"]` | SCR-10 | P1 | `docs/06-ux/screens.md:197`, `docs/05-capability-inventory.md:558` | Panel keys `c`, `s`, `i`. The corpus names the snapshot action, not what it captures, so neither the button nor the empty state explains it. |
| Pin badge `balanced (local)` / `balanced (repo)` | `[data-view="profiles"] .gs-badge[data-inv="inventory P2"]` | SCR-10 | P2 | `docs/06-ux/screens.md:196`, `docs/05-capability-inventory.md:559` | The documented `name (local)` / `name (repo)` form. |
| This project: Pin for me, Pin for the repository | `[data-view="profiles"] .gs-res[data-inv="inventory P2"]` | SCR-10 | P2 | `docs/05-capability-inventory.md:559` | Panel keys `p` (local pin) and `P` (repository declaration). |
| Model and effort per helper, with Save, Save into balanced, Export, Restore | `[data-view="profiles"] .gs-table-wrap`, `.gs-row-actions[data-inv="inventory P3"]` | SCR-10 | P3 | `docs/06-ux/screens.md:194`, `docs/05-capability-inventory.md:560` | Panel keys `ctrl+s`, `u`, `x`, `r`. Helper names are example data. The "Gentle" row is `Inference:` from the `orchestrator` key of inventory P1 (`docs/05-capability-inventory.md:558`). |
| Where this lives | `[data-view="profiles"] .gs-kv` | SCR-10 | P1, P2, P3 | `docs/05-capability-inventory.md:558-560` | Paths as documented; `<git-common-dir>` is kept as the inventory writes it. |
| State: pinned by the repository | `[data-when="profiles:repo"]` | SCR-10 | P2 | `docs/06-ux/screens.md:196` | |
| State: no profiles file yet | `[data-when="profiles:none"]` | SCR-10 | P1 | `docs/06-ux/screens.md:196` | Copy is example text. |
| **SCR-11** Session tree and branches (surface) | `section[data-surface="SCR-11"]` | SCR-11 | S8, S9, S10, S11, S12 | `docs/06-ux/screens.md:202`, `:206-207` | Exists today: no (`docs/06-ux/screens.md:66`). No mockup (`:211`). Reached from the "⋯" chat menu (`:35`). |
| SCR-11 corpus note | `[data-view="tree"] > details.gs-corpus` | SCR-11 | as surface | `docs/06-ux/screens.md:208-212`, `docs/04-rpc-contract.md:286` | Carries the gap G1 side effect of `fork` and `clone`. |
| Earlier branch, "Go to this branch" | `.gs-branch.gs-left`, `[data-set-state="tree:moving"]` | SCR-11 | S8 | `docs/06-ux/screens.md:209`, `docs/05-capability-inventory.md:154` | Messages are example data. No RPC command moves the active leaf. |
| Summarize prompt | `[data-view="tree"] [data-when="tree:moving"]` | SCR-11 | S10, S8 | `docs/06-ux/screens.md:209`, `docs/05-capability-inventory.md:156` | Interaction preview, not a listed state. Follows the inventory surface idea "Summarize the branch you leave?". |
| Branch from here | `.gs-node [data-inv="inventory S11"]` | SCR-11 | S11 | `docs/06-ux/screens.md:209`, `docs/05-capability-inventory.md:157` | On a user message, as the inventory surface idea says. |
| Label, and the "plan agreed" label | `.gs-node[data-inv="inventory S9"]` | SCR-11 | S9 | `docs/06-ux/screens.md:209`, `docs/05-capability-inventory.md:155` | Label text is example data. |
| Duplicate chat | `[data-view="tree"] .gs-btn[data-inv="inventory S12"]` | SCR-11 | S12 | `docs/06-ux/screens.md:209`, `docs/05-capability-inventory.md:158` | |
| Active leaf ("you are here") | `.gs-node.gs-leaf` | SCR-11 | S8 | `docs/06-ux/screens.md:208` | |
| State: linear chat | chip `data-group="tree" data-state="linear"`; `.gs-tree[data-current="linear"]` | SCR-11 | — | `docs/06-ux/screens.md:208` | Hides the earlier branch and the labels. |
| **SCR-12** Chat details and export (surface) | `section[data-surface="SCR-12"]` | SCR-12 | S5, S6, S7, S13, S14, S15, S16, S19, K6 | `docs/06-ux/screens.md:214`, `:218-219` | Exists today: no (`docs/06-ux/screens.md:67`). No mockup (`:223`). Reached from the "⋯" chat menu (`:36`). |
| SCR-12 corpus note | `[data-view="details"] > details.gs-corpus` | SCR-12 | as surface | `docs/06-ux/screens.md:220-224` | |
| Name and Rename | `[data-view="details"] .gs-field` | SCR-12 | S5 | `docs/06-ux/screens.md:221`, `docs/05-capability-inventory.md:151` | Renames the loaded session only over RPC. |
| About this chat | `[data-view="details"] .gs-kv` | SCR-12 | S7 | `docs/05-capability-inventory.md:153` | `/session` shows file, ID, message count, tokens and cost; the ID is not drawn. Values and the file name are example data. |
| Export: Web page, Session file | `.gs-res[data-inv="inventory S13"]` | SCR-12 | S13 | `docs/06-ux/screens.md:221`, `docs/05-capability-inventory.md:159` | Only HTML export exists over RPC. |
| Share link with a privacy warning | `.gs-res[data-inv="inventory S15"]` | SCR-12 | S15 | `docs/05-capability-inventory.md:161` | Warning copy is example text. |
| Open a session file | `.gs-res[data-inv="inventory S14"]` | SCR-12 | S14 | `docs/06-ux/screens.md:221`, `docs/05-capability-inventory.md:160` | No import command. |
| Copy the last answer | `.gs-res[data-inv="inventory S19"]` | SCR-12 | S19 | `docs/06-ux/screens.md:221`, `docs/05-capability-inventory.md:165` | |
| Loaded instructions | `.gs-res[data-inv="inventory K6"]` | SCR-12 | K6 | `docs/05-capability-inventory.md:202`, `:595`; `docs/06-ux/screens.md:221` | File names from inventory K6; `APPEND_SYSTEM.md` is the file the gentle-ai adapter targets (inventory GA1). Paths are example data. A list only: the corpus documents seeing the loaded files, not opening them, so no Open action is drawn. |
| Delete chat | `.gs-btn[data-inv="inventory S6"]` | SCR-12 | S6 | `docs/06-ux/screens.md:221`, `docs/05-capability-inventory.md:152` | No delete command over RPC. Hidden in the private state. |
| State: private chat | `[data-when="details:private"]` | SCR-12 | S16 | `docs/06-ux/screens.md:220`, `docs/05-capability-inventory.md:162` | Hides "Saved as" and Delete. |
| **SCR-13** Command palette (surface, overlay) | `.gs-overlay[data-surface="SCR-13"]` | SCR-13 | C11, C12, V7, E4, E5, I2, I3 | `docs/06-ux/screens.md:226`, `:230-231` | Exists today: no (`docs/06-ux/screens.md:68`). No mockup (`:235`). Reached from the "⋯" chat menu (`:37`). Overlay; see Decisions. |
| SCR-13 corpus note | `[data-view="palette"] details.gs-corpus` | SCR-13 | as surface | `docs/06-ux/screens.md:232-236` | Also names the inventory P1, P3 panels that likely fail under RPC (`docs/05-capability-inventory.md:558`, `:560`). |
| Search box | `[data-view="palette"] input.gs-search` | SCR-13 | C12 | `docs/06-ux/screens.md:232-233` | Not wired to filter; the chips preview the states. |
| Grouped results | `.gs-pal-list` | SCR-13 | V7 | `docs/06-ux/screens.md:233`, `docs/05-capability-inventory.md:504` | The four group names Configuration, Session, Diagnostics, Skills come from inventory V7. Items are inventory rows with a command: P3, P1, P4, R1, A8, V4, R4, I7 (two entries), I3 (`docs/05-capability-inventory.md:560`, `:558`, `:561`, `:548`, `:529`, `:501`, `:551`, `:584`, `:580`). Each label is a plain form of that row's title, with "helpers" for "subagents" (UX U1). `Inference:` the placement of each item into a group; the corpus names the groups, not their members. |
| Skill entry `/skill:branch-pr` | `.gs-pal-item[data-inv="inventory E4"]` | SCR-13 | E4 | `docs/05-capability-inventory.md:229` | The skill name is example data. |
| "Prompt templates" group, `/skill-creation` | `.gs-pal-item[data-inv="inventory E5, I2"]` | SCR-13 | E5, I2 | `docs/05-capability-inventory.md:230`, `:579`, `:182` | `Inference:` group; `get_commands` lists templates (inventory C12). |
| State: no match | `[data-when="palette:nomatch"]` | SCR-13 | — | `docs/06-ux/screens.md:232` | Copy is example text. |
| **SCR-14** Review and RDD (surface) | `section[data-surface="SCR-14"]` | SCR-14 | R1, R2, R3, R4, R5, GA2 | `docs/06-ux/screens.md:238`, `:242-243` | Exists today: no (`docs/06-ux/screens.md:69`). No mockup (`:247`). Reached from the status bar (`:34`) and from the panel's Review check. |
| SCR-14 corpus note | `[data-view="review"] > details.gs-corpus` | SCR-14 | as surface | `docs/06-ux/screens.md:244-248`, `docs/03-architecture/audit.md:39`, `docs/10-platforms.md:136` | Carries the default-mode contradiction of inventory R1 (`docs/05-capability-inventory.md:548`): gentle-ai v4.0.0, as v3.7.0, resolves an unset mode to on, while gentle-shell says RDD is opt-in; and read-only `review status` (inventory GA2, `:596`, `Inference:`). "Not drawn" adds the v4.0.0 refusal of review mode on a filesystem that cannot keep private POSIX modes, such as WSL DrvFS without `metadata` (inventory R1; PLAT-06). |
| Review mode switch with the deciding scope | `.gs-res[data-inv="inventory R1"]` | SCR-14 | R1 | `docs/06-ux/screens.md:244-245`, `docs/05-capability-inventory.md:548` | Scopes `clone` and `global` are shown as "this repository" and "all projects" (UX U1). |
| State: RDD off | `[data-when="rdd:off"]` | SCR-14 | R1 | `docs/06-ux/screens.md:244` | Hides the session permission and the chat section. |
| Allowed for this session, Revoke | `.gs-res[data-inv="inventory R4"]` | SCR-14 | R4 | `docs/05-capability-inventory.md:551` | `status` and `revoke`; requires the TUI today. The description is neutral ("Review permission for this session"); what the permission changes is not drawn. |
| Review due | `.gs-res[data-inv="inventory R2"]` | SCR-14 | R2 | `docs/06-ux/screens.md:244`, `:245`, `docs/05-capability-inventory.md:549` | The reminder is sent automatically at `agent_end`, and the corpus documents no user action that starts a review, so no button is drawn. The consent state is reached through its "consent asked" chip. |
| Consent card: benefits, consequences, Review, Not this time, Allow for this session | `.gs-consent` | SCR-14 | R3 | `docs/05-capability-inventory.md:550`, `docs/06-ux/screens.md:245` | Inventory surface idea "consent card with benefits and consequences". "Allow for this session" is disabled because it is unavailable over RPC. Copy is example text. Not `.gs-ask`, which carries the original answer behavior. |
| States: in progress, approved, correction required | `[data-when="review:progress"]`, `review:approved`, `review:correction` | SCR-14 | R5 | `docs/06-ux/screens.md:244`, `docs/05-capability-inventory.md:552` | Copy is example text. |
| **SCR-15** Changes (surface) | `section[data-surface="SCR-15"]` | SCR-15 | V5, V6 | `docs/06-ux/screens.md:250`, `:254-255` | Exists today: no (`docs/06-ux/screens.md:70`). No mockup (`:259`). Reached from the panel's "212 / 400" (`:38`). |
| SCR-15 corpus note | `[data-view="changes"] > details.gs-corpus` | SCR-15 | as surface | `docs/06-ux/screens.md:256-260` | |
| Working folder switch | `[data-view="changes"] .gs-seg` | SCR-15 | V6 | `docs/06-ux/screens.md:257`, `docs/05-capability-inventory.md:503` | Inventory surface idea "worktree list in Changes". Folder names are example data. |
| Files with diffs | `.gs-file` | SCR-15 | V5 | `docs/06-ux/screens.md:257`, `docs/05-capability-inventory.md:502` | A native `details` opens each diff. Files and diffs are example data; the total matches the mockup's "212 / 400". |
| State: no changes | `[data-when="changes:none"]` | SCR-15 | — | `docs/06-ux/screens.md:256` | |
| **SCR-16** Memory (surface) | `section[data-surface="SCR-16"]` | SCR-16 | I4, GA1 | `docs/06-ux/screens.md:262`, `:266-267` | Exists today: no (`docs/06-ux/screens.md:71`). No mockup (`:271`). Reached from the gentle-engram row in Extensions (`:39`). |
| SCR-16 corpus note | `[data-view="memory"] > details.gs-corpus` | SCR-16 | as surface | `docs/06-ux/screens.md:268-272` | |
| Status: active, installed, package missing | `[data-view="memory"] .gs-found` | SCR-16 | I4, GA1 | `docs/06-ux/screens.md:268`, `docs/05-capability-inventory.md:581`, `:595` | Copy is example text; "memory that survives between chats" is the mockup's phrase (`docs/06-ux/screens.md:271`). The installed state reads "Memory tools are not active in this chat", the doctor's "Engram tools are active" check in plain words; when memory starts is not drawn. |
| Check status | `.gs-btn[data-inv="inventory I4, I7"]` | SCR-16 | I4, I7 | `docs/06-ux/screens.md:269`, `docs/05-capability-inventory.md:581` | `Inference:` "open memory status"; Engram status comes from `/gentle:doctor`. |
| Links to Extensions | `[data-view="memory"] [data-go="extensions"]` | SCR-16 | — | `docs/06-ux/screens.md:269` | `Inference:` link to the package in Extensions. |
| Where this comes from | `[data-view="memory"] .gs-kv` | SCR-16 | I4, GA1 | `docs/05-capability-inventory.md:581` | `npm:gentle-engram`, installed by setup. |
| **SCR-17** Settings (surface) | `section[data-surface="SCR-17"]` | SCR-17 | C7, K2, K5, M6, M13, U4, U8, I8, I9, GA3, V8, V9, V12, V13, V14, A8, P4, Y4, E6, V10 | `docs/06-ux/screens.md:274`, `:278-279` | Exists today: no (`docs/06-ux/screens.md:72`). No mockup (`:283`). Reached from the sidebar nav (`:40`). |
| SCR-17 corpus note | `[data-view="settings"] > details.gs-corpus` | SCR-17 | as surface | `docs/06-ux/screens.md:280-284`, `:323` | "Over RPC" summarizes each row's RPC column. Carries the screens.md open question on one screen vs a split. |
| Source tag on each setting | `[data-view="settings"] .gs-set .gs-badge` | SCR-17 | A8 | `docs/06-ux/screens.md:280` | Sources default, global, project, environment; values are example data. |
| Messages sent while Gentle works | `.gs-res[data-inv="inventory C7"]` | SCR-17 | C7 | `docs/05-capability-inventory.md:177` | Values `all` and `one-at-a-time`. |
| Summarize long conversations | `.gs-res[data-inv="inventory K2"]` | SCR-17 | K2 | `docs/05-capability-inventory.md:198` | On/off only over RPC. |
| Try again when the provider fails | `.gs-res[data-inv="inventory K5"]` | SCR-17 | K5 | `docs/05-capability-inventory.md:201` | |
| Effort for new chats | `.gs-res[data-inv="inventory M6"]` | SCR-17 | M6 | `docs/05-capability-inventory.md:213` | RPC `set_thinking_level` does not persist. |
| Press Esc twice to stop Gentle | `.gs-res[data-inv="inventory V13"]` | SCR-17 | V13 | `docs/05-capability-inventory.md:510` | Opt-in double Esc to cancel; the description says only "Opt-in". |
| Remember what you type | `.gs-res[data-inv="inventory V14"]` | SCR-17 | V14 | `docs/05-capability-inventory.md:511` | Capture is opt-in; Up-arrow recall is the inventory's `Inference:` surface. |
| Vim keys | `.gs-res[data-inv="inventory V12"]` | SCR-17 | V12 | `docs/05-capability-inventory.md:509` | |
| Background helpers (source: project) | `.gs-res[data-inv="inventory A8"]` | SCR-17 | A8 | `docs/05-capability-inventory.md:529` | Shows the precedence project, then global, then environment; default off. |
| Persona | `.gs-res[data-inv="inventory P4"]` | SCR-17 | P4 | `docs/05-capability-inventory.md:561` | `gentleman` or `neutral`. |
| Theme | `.gs-res[data-inv="inventory E6, V10, V8"]` | SCR-17 | E6, V10, V8 | `docs/05-capability-inventory.md:231`, `:507`, `:505` | One theme or a light/dark pair; Gentleman-Cute is the isolated-home default. |
| Reduce motion | `.gs-res[data-inv="inventory V9"]` | SCR-17 | V9 | `docs/05-capability-inventory.md:506` | `Inference:` maps from the animation mode. |
| What's new after an update | `.gs-res[data-inv="inventory U4"]` | SCR-17 | U4 | `docs/05-capability-inventory.md:251` | |
| Share usage data (source: environment) | `.gs-res[data-inv="inventory I9, GA3, U8"]` | SCR-17 | I9, GA3, U8 | `docs/05-capability-inventory.md:586`, `:597`, `:255` | `DO_NOT_TRACK=1` is a documented opt-out. |
| Offline mode | `.gs-res[data-inv="inventory U8"]` | SCR-17 | U8 | `docs/05-capability-inventory.md:255` | Spawn only, hence "Applies to new chats". |
| Proxy and timeouts | `.gs-res[data-inv="inventory M13"]` | SCR-17 | M13 | `docs/05-capability-inventory.md:220` | One row for the network settings. |
| YOLO for this session | `.gs-res[data-inv="inventory Y4"]` | SCR-17 | Y4 | `docs/05-capability-inventory.md:570`, `docs/01-glossary.md:69` | Warning copy follows the glossary: Gentle can commit, push and open PRs without asking each time; destructive actions still ask. Cannot be enabled over RPC. |
| Development build of gentle-ai | `.gs-res[data-inv="inventory I8"]` | SCR-17 | I8 | `docs/05-capability-inventory.md:585` | |
| Where this lives | `[data-view="settings"] .gs-kv` | SCR-17 | — | `docs/05-capability-inventory.md:690`, `:346`, `:481` | gentle-shell settings live under `~/.pi/gentle-ai`, shared by every home (`Inference:`). The chat settings path is `<agent-dir>/settings.json` (`docs/05-capability-inventory.md:346`) in the default isolated home `~/.gentle-shell/agent` (inventory L1, `docs/05-capability-inventory.md:481`), and matches SCR-08. |
| About and diagnostics link | `[data-view="settings"] [data-go="diagnostics"]` | SCR-17 | — | `docs/06-ux/screens.md:41` | `Inference:` edge SET → SCR-18. |
| **SCR-18** Diagnostics and About (surface) | `section[data-surface="SCR-18"]` | SCR-18 | H1, H2, H3, H4, L3, L9, L12, I7, GA5 | `docs/06-ux/screens.md:286`, `:290-291` | Exists today: no (`docs/06-ux/screens.md:73`). No mockup (`:295`). |
| SCR-18 corpus note | `[data-view="diagnostics"] > details.gs-corpus` | SCR-18 | as surface | `docs/06-ux/screens.md:292-296`, `docs/04-rpc-contract.md:295`, `docs/03-architecture/audit.md:41` | |
| Health: healthy, below minimum version, update available, doctor findings | `[data-view="diagnostics"] .gs-found` | SCR-18 | I7, L9, H3, L12, GA5 | `docs/06-ux/screens.md:292`, `docs/05-capability-inventory.md:489`, `:263`, `:492` | The 0.99.1 floor is documented (inventory L9); 0.98.0, 4.1.0 and the finding are example data. "Update available" is a notice only, as inventory H3 and L12 describe it ("update notice"); no Update action is drawn. |
| Run doctor, Copy diagnostics | `.gs-btn[data-inv="inventory I7"]`, `[data-inv="inventory H2"]` | SCR-18 | I7, H2 | `docs/06-ux/screens.md:293`, `docs/05-capability-inventory.md:584`, `:262` | |
| Versions | `[data-view="diagnostics"] .gs-kv` | SCR-18 | H4, L3, L9, GA5 | `docs/05-capability-inventory.md:264`, `:483`, `:489`, `:599`; `docs/01-glossary.md:20` | `gentle-shell --version` prints gentle-shell, pi and `home <mode> <dir>`. The values follow the refreshed pins: gentle-shell 4.0.0 (the package version of `main` at `ac67159`, not the release itself), pi 1.0.0 and gentle-ai v4.0.0; the 0.99.1 floor stays in the "below minimum version" state (inventory L9). "This app 0.2.0" is example data. |
| Report a problem, with a scope choice | `.gs-row-actions[data-inv="inventory H1"]` | SCR-18 | H1 | `docs/06-ux/screens.md:293`, `docs/05-capability-inventory.md:261` | The scope is undecided (pi, gentle-shell or desktop); only the choice is drawn. |
| **SCR-19** Project trust prompt (surface, overlay) | `.gs-overlay[data-surface="SCR-19"]` | SCR-19 | T1, Y5 | `docs/06-ux/screens.md:298`, `:302-303` | Exists today: no (`docs/06-ux/screens.md:74`). No mockup (`:307`). Opened by "Chat in another folder…" (`:42`). Overlay; see Decisions. |
| SCR-19 corpus note | `[data-view="trust"] details.gs-corpus` | SCR-19 | as surface | `docs/06-ux/screens.md:304-308` | |
| Folder and explanation | `[data-view="trust"] .gs-res`, `p.gs-fine` | SCR-19 | T1 | `docs/06-ux/screens.md:302`, `docs/05-capability-inventory.md:240` | Project packages load only after trust is resolved. The folder is example data. |
| Remember my choice | `[data-view="trust"] label` | SCR-19 | T1 | `docs/06-ux/screens.md:305` | `Inference:` (per screens.md). |
| Trust, Don't trust | `[data-set-state="trust:trusted"]`, `[data-set-state="trust:untrusted"]` | SCR-19 | T1 | `docs/06-ux/screens.md:305` | Each previews its resulting state. |
| States: trusted, untrusted | `[data-when="trust:trusted"]`, `[data-when="trust:untrusted"]` | SCR-19 | T1 | `docs/06-ux/screens.md:304` | "Start the chat" closes the prompt. |
| Back to chat, Back to Settings | `[data-view] .gs-view-head [data-go]` | SCR-11, SCR-12, SCR-14, SCR-15, SCR-18 | — | `docs/06-ux/screens.md:34-41` | Returns along the screen-map edge that leads in. |
| List \| Graph toggle | `.gs-hlist > .gs-pview[data-proposal="0001"]` | SCR-03 | A1, A2 | `docs/07-proposals/0001-agent-flow-graph.md:24`, `:31` | Community proposal 0001. "A per-chat graph view": the toggle sits in the chat's own Helpers pane, so the graph covers this chat only. Sets `data-hview` on `.gs-chat-helpers`. Hidden in `helpers:empty`. |
| Agent flow graph | `section.gs-hgraph[data-proposal="0001"]` | SCR-03 | A1, A2, A5, A6, A7, A12 | `docs/07-proposals/0001-agent-flow-graph.md:26-29` | Community proposal 0001. In Graph mode it takes the thread column; the list stays. CSS boxes and existing tokens only. Helper names, states and times are the list's example data. |
| User message node and "led to" edge | `.gs-gnode.gs-gintent`, `.gs-glink` | SCR-03 | — | `docs/07-proposals/0001-agent-flow-graph.md:26`, `:39` | Community proposal 0001. Design intent, drawn dashed: the payload has no message linkage, and the desktop also needs stable message ids (audit A3). |
| Main agent node | `.gs-gnode.gs-gmain` | SCR-03 | A1 | `docs/07-proposals/0001-agent-flow-graph.md:26` | Community proposal 0001. Not selectable: `Inference:` a selected node opens its thread in the Helpers pane (`:28`), and the main agent has no helper thread. |
| Helper nodes and delegation edges | `.gs-gkids .gs-gnode[data-gnode]` | SCR-03 | A1, A2, A12 | `docs/07-proposals/0001-agent-flow-graph.md:27-29`, `:38`, `:40` | Community proposal 0001. Ordered by start time; state and elapsed time per node. Selecting a node returns to the list with that helper selected (opening the Earlier group when needed). The parent link is a new field (`parentSessionId` is omitted from the payload); every edge starts at the main agent because, `Inference:` per the proposal, helpers cannot start helpers. |
| "Result returned" edge | `.gs-gedge.gs-gback` | SCR-03 | A7 | `docs/07-proposals/0001-agent-flow-graph.md:27`, `:41` | Community proposal 0001. On the done helper. Results arrive as custom messages, which the desktop drops (audit A6); since gentle-shell 4.0.0 an idle parent is then woken by a user-role message that carries no task id (`:41`), so that message cannot draw the edge either. |
| Edge legend | `.gs-glegend` | SCR-03 | A5, A6, A7 | `docs/07-proposals/0001-agent-flow-graph.md:27`, `:41` | Community proposal 0001. Names the four edge types; question and steering edges are not drawn because the example has no such event. |
| 0001 corpus note | `.gs-hgraph details.gs-corpus[data-proposal="0001"]` | SCR-03 | A1, A2, A3, A5, A6, A7, A9, A12 | `docs/07-proposals/README.md:11`, `docs/07-proposals/0001-agent-flow-graph.md:10`, `:31`, `:37-44`, `:54-56` | Community proposal 0001. Status, single-chat scope, drawn parts, design intent, runtime dependencies (gap G8, parent and message linkage, the idle-parent wake with no task id, gap G9), open questions. |
| Steer or Queue while Gentle works | `#p0002-main` | SCR-02 | C4, C5 | `docs/07-proposals/0002-interact-with-running-node.md:29`, `:40`; `docs/05-capability-inventory.md:174-175` | Community proposal 0002. Composer row, shown in `chat:drawn` and `chat:queued`. Which behavior is the default is open (vision Q5, `docs/00-vision.md:131`); "Steer" is preselected as example only. |
| Steering or queued mark on a sent message | `.gs-ptag[data-proposal="0002"]` | SCR-02 | C4, C5 | `docs/07-proposals/0002-interact-with-running-node.md:29`, `:33` | Community proposal 0002. Added by the script to a message sent while the row is visible: "steering" or "queued". |
| Steer box in the helper thread | `.gs-hthread > .gs-psteer` | SCR-03 | A6 | `docs/07-proposals/0002-interact-with-running-node.md:29`, `:33`, `:42`; `docs/05-capability-inventory.md:527` | Community proposal 0002. "Send to helper" appends a "Steer" item to that helper's thread only. Needs an inbound host channel (gap G1 shape); today only a model tool. |
| Helper question in its own thread | `#p0002-ask` | SCR-03 | A5, C19 | `docs/07-proposals/0002-interact-with-running-node.md:30`, `:43`; `docs/05-capability-inventory.md:526` | Community proposal 0002. Names the helper. Preview chip `p0002:question`; an answer appends an "Answer" item and returns to `drawn`. New class `.gs-pask`, not `.gs-ask`. Needs a helper id on dialog requests; `UNVERIFIED:` (per the proposal) whether the forwarded dialog carries one. Question text is example data. |
| 0002 corpus note and state chips | `.gs-hlist > details.gs-corpus[data-proposal="0002"]`, `.gs-chip[data-group="p0002"]` | SCR-03 | C3, C4, C5, C19, A4, A5, A6 | `docs/03-architecture/adr/README.md:40`; `docs/04-rpc-contract.md:299`, `:301`, `:353`; `docs/07-proposals/README.md:12`, `docs/07-proposals/0002-interact-with-running-node.md:24`, `:26-31`, `:33`, `:39-46`, `:59-61` | Community proposal 0002. Lists what is already drawn as maintainer intent (Stop in the footer, `:28`; Escape; chat question cards), the dependencies (gap G1, inventory C4, A6), and the open questions. Since 2026-10-03 its "Depends on" line adds that host actions on helpers need an inbound channel and that the channel choice is still open, with three alternatives: extend pi RPC, use the existing extension channels, or a gentle-shell channel of its own. Sources: the ADR index row "Host channel to gentle-shell features" under "Undecided / not recorded" (`docs/03-architecture/adr/README.md:40`); the section "Host and extension channels" (`docs/04-rpc-contract.md:301`) and its alternatives table (`docs/04-rpc-contract.md:353`); the gap-ownership line that names the inbound channel for gap G1 and points to both (`docs/04-rpc-contract.md:299`). The note cites both documents by path and heading. |
| Ask why on a finished helper | `.gs-hlist .gs-pwhy[data-proposal="0003"]` | SCR-03 | A12 | `docs/07-proposals/0003-post-hoc-audit-by-questions.md:24`, `:36`; `docs/00-vision.md:81` | Community proposal 0003, primary scope: vision P10 means a finished helper, not the main session. Under the done helper. Opens the side conversation (`askwhy:helper`). |
| Ask why on a finished turn of the main agent (extension) | `.gs-msg .gs-pwhy[data-proposal="0003"]` | SCR-02 | C17, C18 | `docs/00-vision.md:81`; `docs/07-proposals/0003-post-hoc-audit-by-questions.md:24`, `:39`, `:56` | Community proposal 0003, optional "Extension beyond vision P10 [community]": vision P10 leaves the main session out, so the tag reads "0003 · `proposed` · extensión opcional más allá de vision P10" (in English before 2026-10-03: "0003 · proposed · optional extension beyond vision P10"), and whether the extension is wanted at all is an open question (`:56`). Shown in `chat:idle` only: `Inference:` idle is the state in which the main agent's turn has finished. Opens `askwhy:main`. |
| Ask why side conversation | `[data-view="askwhy"][data-overlay]` | SCR-03, SCR-02 | A12, C18 | `docs/07-proposals/0003-post-hoc-audit-by-questions.md:24`, `:26-29` | Community proposal 0003. Overlay over the current view, like SCR-13 and SCR-19; closes like them. Names the node: the helper (primary scope), or the main agent's turn, labelled as the optional extension. |
| Example exchange with cited steps | `#p0003-conv` | SCR-03, SCR-02 | A12, C17 | `docs/07-proposals/0003-post-hoc-audit-by-questions.md:26-27` | Community proposal 0003. Questions, answers and step numbers are example data. |
| Read-only line | `[data-view="askwhy"] .gs-dialog > p.gs-fine` | SCR-03 | — | `docs/07-proposals/0003-post-hoc-audit-by-questions.md:24`, `:26`, `:28` | Community proposal 0003. "Answers come from this helper's own record: its task, steps, tool calls and result." In `askwhy:main` that sentence is replaced by "Optional extension beyond vision P10: the same action on a finished turn of the main agent." (wording of `0003:24`) Both end with "Asking here does not change the chat, the code or the original record." A read-only run is the proposal's own `Inference:`. |
| Ask another question | `#p0003-input`, `#p0003-ask` | SCR-03 | A12 | `docs/07-proposals/0003-post-hoc-audit-by-questions.md:27` | Community proposal 0003. The input's accessible name is "Question about this helper's work" (primary scope). Appends the question only; no answer is generated in the mockup. Reopening or Discard clears added questions. |
| Save, Discard | `[data-view="askwhy"] .gs-actions` | SCR-03, SCR-02 | — | `docs/07-proposals/0003-post-hoc-audit-by-questions.md:24`, `:29` | Community proposal 0003. "Save next to the helper", or "Save next to this turn (extension)" for the main-turn extension; both close the dialog. Where saved answers live is open (`:55`). |
| 0003 corpus note | `[data-view="askwhy"] details.gs-corpus[data-proposal="0003"]` | SCR-03 | A12, C17, C18, S3, E9, S11, S12 | `docs/07-proposals/README.md:13`, `docs/07-proposals/0003-post-hoc-audit-by-questions.md:10`, `:24`, `:33-42`, `:53-56` | Community proposal 0003. Summary title "Post-hoc audit by questions (finished helpers)", as the proposals index names it. Status, placement (finished helper as the primary scope; the main-agent turn marked as the optional extension), dependencies (gap G8, inventory A12, read-only run, separate process for the main-turn extension; the helper's thinking only partly in its 40-item thread), open questions, including whether the main-turn extension is wanted at all (`:56`). |

## Community proposals

The three proposals in `docs/07-proposals/` are community ideas, not maintainer intent. They stay apart from the vision until the maintainer accepts them (`docs/07-proposals/README.md:5`; vision P10, `docs/00-vision.md:81`; UX U12, `docs/06-ux/principles.md:125`). All three are at status `proposed`, and only the maintainer changes that status (`docs/07-proposals/README.md:11-13`, `:22`).

- **Badge.** Every proposal element shows `span.gs-badge.gs-proposal` ("Propuesta de la comunidad"; "Community proposal" before 2026-10-03) with its number and status in monospace, for example "0002 · `proposed`" (the corpus status value, as the notes show it; "0002 · propuesta" until the scoped correction of 2026-10-03). Both carry `lang="es"`. Each proposal has one note that opens with "Propuesta de la comunidad · estado `proposed` · no es intención del mantenedor" (the status value stays the corpus token) and lists its runtime dependencies with qualified IDs. The note opens from its community trigger ("✎ 000N") in the note inspector, in the community style.
- **Switch.** "Propuestas de la comunidad" in the meta bar adds `body.gs-proposals-off`, which hides every `[data-proposal]`, including the items the script adds (steering marks, steer, answer and question items). Turning it off also closes the Ask why dialog. The Graph mode rule is scoped to `body:not(.gs-proposals-off)`, so the thread returns even if Graph was selected. With the switch off, every non-proposal element had the same bounding box as before T3 (checked in headless Chromium at T3). Since 2026-10-03 the notes no longer take space in the layout, so that baseline is historical. The switch also hides the community triggers and closes the note inspector when it shows a proposal note.
- **0001 is single-chat.** The proposal names vision P4 as a constraint it must respect (`docs/07-proposals/0001-agent-flow-graph.md:10`) and limits itself to one chat, quoting the maintainer's "Never a global list" (`:31`; `docs/03-architecture/adr/0011-helpers-scoped-per-chat.md:11`; vision P4, `docs/00-vision.md:75`). The graph therefore lives inside the chat's Helpers pane and shows only that chat's helpers. A cross-chat graph is not drawn: UX U4 records that it would conflict with the decision (`docs/06-ux/principles.md:60`).
- **Placement.** Controls sit on the left or low in the window, because the original toasts cover its top right. New cards use their own classes (`.gs-pask`, `.gs-pwhy`), not `.gs-ask`, which carries the original answer behavior.

## Decisions

- **ODD stepper.** The panel keeps the mockup's five plain steps (UX U1, U2) and shows gentle-shell's active phase as a small monospace secondary label (`#odd-phase`). Evidence: inventory O2 lists the eight phases and states that the five steps "need a mapping from these eight phases" (`docs/05-capability-inventory.md:540`; also `docs/06-ux/screens.md:124`). The mapping is `Inference:`:
  - Explore ← authorizing, exploring, researching
  - Plan ← deciding, planning
  - Build ← implementing
  - Verify ← checking
  - Deliver ← closing

  Only explicit `gentle_odd_phase` calls reach the host, as `tool_execution_*` events; inferred phases stay in the TUI (gap G2, `docs/04-rpc-contract.md:287`).
- **Banner: screens as index subgroups (2026-10-03).** The user's choice. Alan's v1 line read "Concept mockup · Content is example data. · Screens: Chats · Providers · Extensions · First run" (`gs-mockup.html:461-462`).
  - That "Screens" row and the "From the mockup" index group (now "Del mockup") covered the same surfaces, one at screen granularity and the other at surface granularity, so the row duplicated the index. The screen map itself counts the 9 mockup surfaces as the four screens, with Chats split into six regions (`docs/06-ux/screens.md:5`).
  - The disclaimer keeps its text and styling (translated later the same day; see "Spanish meta layer"). The screens become subgroups of "From the mockup" (now "Del mockup"), which keeps Alan's structure visible: each screen label still opens the whole screen with the same `data-go` target, and its SCR chips follow it.
  - "Derived from the inventory" (now "Derivadas del inventario") is unchanged.
  - Both sections share one grid: section label, then screen label, then chips.
- **Navigation edges.** Every in-app entry point follows a screen-map edge, and every edge is `Inference:` (`docs/06-ux/screens.md:50`).
- **Window-edge notes.** The SCR-05 and SCR-06 notes have their home in a strip under the window, because the status bar is one line high and the toasts float over the thread. Since 2026-10-03 the strip shows only their two triggers.
- **One flow per state group.** State chips are previews of documented states, not behavior. Groups are independent; returning to `drawn` restores the original content.
- **Overlays for SCR-13 and SCR-19.** `Inference:` a command palette and a trust prompt interrupt the current task instead of replacing it, so both open as dialogs over the current view. They keep `data-view`, so the index links and the existing `go()` reach them.
- **Head actions on the left.** The original toasts cover the top right of the window, so the derived views put "Back to…" and similar actions under the heading.
- **Palette content.** The palette lists only commands that are rows of the inventory, under the four curated group names of inventory V7; placing each item into a group is `Inference:`. It does not list built-in pi commands, which do not exist over RPC (inventory C12).
- **Wording of derived notes.** Each note uses the exact screens.md phrase, "No mockup; derived from inventory.", rather than a paraphrase. Since 2026-10-03 it is shown in Spanish as "Sin mockup; derivado del inventario.", keeping "mockup", the user's term (Decisions, "Spanish annotation layer (2026-10-03)").
- **Scrollbars (2026-10-03).** The precedent is the desktop's own fix: `gentle-shell-desktop@5ab4a00:src/renderer/shared/theme/tokens.css:48-72` (commit `3456eef`, PR #20, "match scrollbars to dark theme"). Kept from the precedent:
  - 8px size, transparent track;
  - thumb with a 2px transparent border, `border-radius: 999px` and `background-clip: padding-box`;
  - `var(--purple)` on hover;
  - `scrollbar-width: thin` with a transparent track for the standard properties.

  Departures, each with its reason:
  1. **Rest colour.** The thumb uses `color-mix(in srgb, var(--line-strong), var(--purple) 50%)` instead of `var(--line-strong)`. `--line-strong` reaches only 1.84:1 on `--bg`, 1.76:1 on `--panel` and 1.70:1 on `--raised`. The mix (sRGB `#904d71`) reaches 3.39, 3.25 and 3.13:1, which meets the 3:1 non-text contrast of WCAG 2.2 SC 1.4.11. `--purple` on hover reaches 5.45–5.90:1. The mix uses existing tokens only; there is no new literal.
  2. **Split by `@supports`.** Chromium ignores every `::-webkit-scrollbar` rule on an element whose `scrollbar-color` or `scrollbar-width` is set. Observed in headless Chromium 149: a probe with both styles rendered the standard colour at 10px and ignored the webkit thumb. So in the precedent, the 8px pill and the thumb hover never apply in Chromium.
     - The mockup wraps the webkit rules in `@supports selector(::-webkit-scrollbar)` (Chromium, WebKit).
     - It wraps the standard properties in `@supports not selector(::-webkit-scrollbar)` (Firefox).
     - Result: the precedent's intended pill and hover apply in Chromium and WebKit, and Firefox keeps `scrollbar-width: thin` and `scrollbar-color`.
  3. **No arrows, no light corner.** `::-webkit-scrollbar-button { display: none }` and a transparent `::-webkit-scrollbar-corner`. Neither is in the precedent; both make the absence of arrows and of a light corner square explicit.
  4. **Focus matches hover.** `*:focus-visible::-webkit-scrollbar-thumb` and `:active` use the hover colour, so keyboard focus on a scroll pane gives the same signal as pointer hover.
  5. **No shift.** `scrollbar-gutter: stable` on the vertical panes whose content changes with state chips or new messages: `.gs-side`, `.gs-thread`, `.gs-odd`, `.gs-view`, `.gs-hlist`, `.gs-hbody`, `.gs-pal-list`. `.gs-main` is excluded because its children scroll, not itself.
  6. **No motion.** There is no transition or animation, so `prefers-reduced-motion` needs no rule.

  Known limits:
  - Firefox has no thumb-hover colour, because the standard properties have no hover state.
  - The original toasts cover the top of the chat thread's and the helper thread's scrollbars, as they cover other top-right controls (see "Head actions on the left").
  - Firefox was not run. Its path was checked by rendering the same standard declarations in Chromium: thumb pixels `144,77,113`.
- **Annotation styles and note inspector (2026-10-03).** The user's decision, after reviewing the mockup on 2026-10-03, addressed two problems:
  1. Corpus notes and proposal elements used the product theme, so they looked like part of the app.
  2. Notes inline in narrow areas were hard to read, for example long text wrapped at about 180px in the sidebar (SCR-01) and the ODD panel (SCR-04).

  The user chose option B: a side inspector instead of a modal, because a modal would hide the surface that the state chips change. After a second review the same day, the user asked for two revisions:
  - a community colour clearly foreign to the theme, because `--purple` read as part of the product's pink family;
  - a real `aside` beside the app instead of a panel inside the window.

  The user rejected that real-aside version in a third review the same day. In their words, it had no smooth animation, did not look like an aside, and appeared "rough and abrupt" on one side of the app or the other. They asked instead for "the typical aside that slides out from the side of the browser and takes the whole height of the browser window": the app must not move, and everything darkens except the referenced area, which gets a spotlight. The aside layout (`.gs-stage`, the narrowed window, the wider frame and the two-column switch) is removed.
  - **Corpus style.** Corpus notes use `--heading` (`#e0c27a`, champagne gold), a dashed border, the "§" glyph and the "§ Corpus" label. The original CSS (L8–461) has 0 uses of the token; the corpus records the same name as unused in any desktop CSS file (`docs/06-ux/design-system.md:32`, `:56`). Tint: `color-mix(in srgb, var(--heading) 8%, var(--panel))`; hover and the open trigger use 16%.
  - **Community style.** Community proposals use `--note-community` (`#ff5500`, a saturated orange), a dotted border, the "✎" glyph and the "✎ Community proposal" label. Proposals live apart from maintainer intent (`docs/07-proposals/README.md:5`), so their UI also carries a dotted frame in that colour. Tint: `color-mix(in srgb, var(--note-community) 10%, var(--panel))`; hover and the open trigger use 16%.
  - **Exception to "tokens only".** `--note-community` is the mockup's one new colour literal. It is a deliberate, user-directed exception (2026-10-03): notes must read as not part of the app, and no `:root` token is foreign to the theme. It is defined once, as a meta-only custom property on `body`, never in `:root`, which stays byte-identical. Every tint is a `color-mix` of it with existing tokens. `verify.py` reports it as the single entry of NEW_COLOUR_LITERALS. The superseded choice was `--purple` (`#c96aa2`), whose CIEDE2000 distance to `--gold` is only 12.4.
  - **Choice of the community colour, by numbers.**
    - **Method.** CIEDE2000 (ΔE00) from each candidate to every colour token in `:root`: `--bg`, `--panel`, `--raised`, `--line`, `--line-strong`, `--text`, `--text-2`, `--muted`, `--gold`, `--blue`, `--green`, `--amber`, `--red`, `--purple` and `--heading`. The implementation reproduces the Sharma et al. reference pair 1 (2.0425).
    - **Constraints.** At least 4.5:1 as text on the 10% and 16% tints and on `--panel`; at least 3:1 as a border on `--bg`; ΔE00 to `--heading` at least 20, so it stays clearly distinct from the corpus gold.
    - **Candidates.** 15 named, saturated candidates across the hue circle, plus a sweep every 5° of HSV hue at S 0.7–1.0 and V 0.85–1.0 (the table adds the best of each sector).
    - **Rule.** Pick the largest minimum ΔE00 that meets the constraints.

    | Candidate | Hue | Min ΔE00 | Nearest token | ΔE00 to `--heading` | On tint 10% | On tint 16% | On `--panel` | Border on `--bg` | Passes |
    |---|---|---|---|---|---|---|---|---|---|
    | `#ff5500` | 20° | 26.0 | `--amber` | 33.2 | 5.54 | 5.13 | 6.11 | 6.37 | yes |
    | `#ff5a1f` | 16° | 24.1 | `--red` | 33.2 | 5.68 | 5.23 | 6.28 | 6.55 | yes |
    | `#ff8a00` | 32° | 14.0 | `--amber` | 21.5 | 7.29 | 6.59 | 8.29 | 8.64 | yes |
    | `#f5d90a` | 53° | 13.5 | `--heading` | 13.5 | 11.49 | 9.85 | 13.81 | 14.41 | no |
    | `#bfff00` | 75° | 24.6 | `--heading` | 24.6 | 13.44 | 11.29 | 16.34 | 17.04 | yes |
    | `#a3e635` | 83° | 21.6 | `--green` | 23.0 | 10.93 | 9.43 | 12.99 | 13.55 | yes |
    | `#00ff00` | 120° | 23.5 | `--green` | 32.2 | 12.21 | 10.47 | 14.27 | 14.88 | yes |
    | `#22c55e` | 142° | 19.7 | `--green` | 30.5 | 7.59 | 6.84 | 8.59 | 8.96 | yes |
    | `#00e08a` | 157° | 15.7 | `--green` | 31.8 | 9.78 | 8.58 | 11.22 | 11.70 | yes |
    | `#14d0b4` | 171° | 14.7 | `--green` | 33.5 | 8.72 | 7.72 | 9.99 | 10.42 | yes |
    | `#00c7be` | 177° | 17.7 | `--green` | 35.1 | 8.16 | 7.31 | 9.24 | 9.64 | yes |
    | `#00d0e0` | 184° | 19.9 | `--blue` | 38.5 | 9.02 | 7.98 | 10.35 | 10.79 | yes |
    | `#22d3ee` | 188° | 18.0 | `--blue` | 40.3 | 9.39 | 8.26 | 10.84 | 11.30 | yes |
    | `#0089eb` | 205° | 20.9 | `--blue` | 53.1 | 4.95 | 4.63 | 5.39 | 5.62 | yes |
    | `#1fa2ff` | 205° | 15.7 | `--blue` | 49.7 | 6.42 | 5.87 | 7.15 | 7.46 | yes |
    | `#4c6fff` | 228° | 24.4 | `--blue` | 60.8 | 4.32 | 4.04 | 4.69 | 4.89 | no |
    | `#7c6cff` | 247° | 23.6 | `--blue` | 60.9 | 4.63 | 4.31 | 5.08 | 5.30 | no |
    | `#a855f7` | 271° | 19.4 | `--purple` | 63.1 | 4.53 | 4.23 | 4.95 | 5.16 | no |
    | `#c44dff` | 280° | 18.0 | `--purple` | 63.3 | 4.97 | 4.61 | 5.46 | 5.69 | yes |
    | `#e83ad6` | 306° | 12.2 | `--purple` | 61.3 | 5.11 | 4.74 | 5.60 | 5.84 | yes |

    - **Winner.** `#ff5500` (minimum ΔE00 26.0, nearest `--amber`; 33.2 from `--heading`). It is about twice as far from its nearest token as `--purple` was (12.4). Its saturation (LCh chroma 93 against at most 58 in the theme) is itself a signal of "not the app".
    - **Runners-up.** Lime `#bfff00` (24.6) sits too close in hue to the corpus gold. The best cool hue is azure `#0089eb` (20.9).
    - **Teal and cyan.** The expected teal and cyan (`#00c7be` 17.7, `#00d0e0` 19.9) score lower, because the theme's mint `--green` and light `--blue` sit near them.
    - **Known risk.** Orange sits between the product's `--red` (errors) and `--amber` (warnings) in hue, although it is far from both in ΔE00 (26.4 and 26.0). If it reads as a status colour, swapping the one `--note-community` value for `#0089eb` changes every community element.
  - **Contrast** (WCAG 2.x relative luminance, sRGB; tints as rounded sRGB mixes; Chromium 149 renders them as `33,25,24` and `40,18,14`, matching the computed values):

    | Pair | Corpus tint `rgb(33,25,24)` | Community tint `rgb(40,18,14)` |
    |---|---|---|
    | Body text `--text-2` | 10.84:1 | 11.15:1 |
    | Heading `--text` | 15.25:1 | 15.69:1 |
    | Secondary `--muted` | 5.74:1 | 5.90:1 |
    | Labels and triggers in the note colour | `--heading` 10.00:1 | `--note-community` 5.54:1 |
    | Hover or open trigger, 16% tint | `--heading` 8.44:1 | `--note-community` 5.13:1 |

    - Tab labels are `--bg` on `--heading` (11.83:1) and `--bg` on `--note-community` (6.37:1).
    - Pressed chips sit on `--raised`: `--heading` 10.94:1, `--note-community` 5.89:1.
    - The switch labels sit on `--bg`: `--heading` 11.83:1, `--note-community` 6.37:1.
    - Every text pair reaches 4.5:1.
  - **Triggers.** A note keeps only a compact trigger where it was ("§ SCR-NN" or "✎ 000N", with `aria-controls` and `aria-expanded`), so it never squeezes content. 0001's trigger sits by the List | Graph toggle.
  - **Drawer.** One `aside#gs-insp`, `position: fixed`, flush with the browser's left or right edge: `top: 0; bottom: 0; height: 100vh` (`100dvh` where supported), with no inset, gap or rounded outer corners. It is 370px wide (`min(370px, 100vw)`), and its only border is on the inner side, in the note style. Its content scrolls inside it, and it overlays the page.
    - **App does not move.** Product boxes are identical with the drawer open and closed: 0 differing boxes for every note at 1440×900, and for SCR-01, SCR-04, 0002, SCR-17 (and SCR-13 at 1280) at 1280×800 and 390×844. Boxes are measured in document coordinates, without the notes themselves, which move into the drawer.
    - **Classic scrollbars.** At 1440×900 the drawer measured x = 1062 or x = 0, y = 0, height = 900 = `innerHeight`. The right-edge x is `clientWidth − width` (1432 − 370), because the run used a classic 8px page scrollbar, which a fixed element cannot cover. With overlay scrollbars, `clientWidth` equals `innerWidth`.
    - **Moved, not copied.** The note node moves into the drawer and back to its home on close, so chips change the surface live.
    - **Order of ‹ ›.** SCR-01…SCR-19, then 0001…0003, limited to the switched-on layers, with wrap-around. Each step first shows the next note's surface: its view, pane or dialog.
  - **Motion: a choreography (fourth review, 2026-10-03).** The user found the 260ms slide and dimming too fast to perceive. They felt like an impact and pulled attention away instead of guiding it. The motion should help the mind focus and see the relation between the note and the area it annotates: softer, with no sense of impact. So the light comes first, then the drawer, then the words.
    - **How it works.** CSS transitions do all the motion. Each state carries the transition that leads into it, so an interrupted move reverses from where it is instead of jumping. JavaScript timers only sequence the content swap, the side change, the focus and the final hide, and each timer reads the current note when it fires.

    | Step | What moves | Start | Duration | Easing |
    |---|---|---|---|---|
    | Open | dim and spotlight outline (one layer): opacity 0 → 1 | 0 | 600ms | `cubic-bezier(.4,0,.2,1)` |
    | Open | drawer `translateX(±100%)` → 0, opacity 0.6 → 1 | 250ms | 650ms | `cubic-bezier(.22,.61,.36,1)` (no overshoot) |
    | Open | heading (title and its line): opacity 0 → 1, `translateY(6px)` → 0 | 600ms | 350ms | `cubic-bezier(.4,0,.2,1)` |
    | Open | body: the same | 650ms | 350ms | same |
    | Open | focus moves to the heading | 600ms | — | — |
    | Close | heading and body fade out (back to 6px) | 0 | 150ms | `cubic-bezier(.4,0,1,1)` |
    | Close | drawer slides out, opacity 1 → 0.6 | 0 | 450ms | `cubic-bezier(.4,0,1,1)` |
    | Close | dim and outline fade out | 100ms | 450ms | `cubic-bezier(.4,0,.2,1)` |
    | Close | drawer hidden | 600ms | — | — |
    | ‹ › same side | words fade out | 0 | 200ms | `cubic-bezier(.4,0,1,1)` |
    | ‹ › same side | hole glides to the new surface | 0 | 550ms | `cubic-bezier(.4,0,.2,1)` |
    | ‹ › same side | new heading rises in; body 50ms later | 220ms | 300ms | `cubic-bezier(.4,0,.2,1)` |
    | ‹ › other side | the drawer closes as above while the dim stays and the hole glides 550ms; at 460ms it jumps off screen on the new side and slides in at once (no 250ms delay; fifth review), 650ms; heading from +350ms after the slide starts, body +400ms | 0 | about 1200ms in all | as above |
    | Tracking | hole follows size or position changes (chips, scroll, resize) | 0 | 450ms | `cubic-bezier(.4,0,.2,1)` |

    Small adjustments to the brief, each with its reason:
    - The drawer starts closing at 0 rather than after the words. With an ease-in it barely moves during the 150ms word fade, and starting at 0 keeps the close total at about 550ms.
    - The new words in a same-side switch rise from 220ms, after the 200ms fade-out. The eye follows the light first, and the hole is nearly settled when the words arrive.
    - The tab and the tools stay with the drawer and do not fade, so ‹ › and × never disappear under the pointer.

    **Measured at 1440×900, opening SCR-01** (real time, sampled every animation frame, nearest frame to each step; dim and outline are one layer):

    | t (ms) | Dim and outline | Drawer x (px) | Drawer opacity | Heading opacity / y | Body opacity / y |
    |---|---|---|---|---|---|
    | 0 | 0 | 370 | 0.60 | 0 / 6 | 0 / 6 |
    | 150 | 0.24 | 370 | 0.60 | 0 / 6 | 0 / 6 |
    | 250 | 0.65 | 370 | 0.60 | 0 / 6 | 0 / 6 |
    | 300 | 0.78 | 292 | 0.68 | 0 / 6 | 0 / 6 |
    | 400 | 0.92 | 163 | 0.82 | 0 / 6 | 0 / 6 |
    | 500 | 0.98 | 83 | 0.91 | 0 / 6 | 0 / 6 |
    | 600 | 1 | 38 | 0.96 | 0 / 6 | 0 / 6 |
    | 700 | 1 | 14 | 0.98 | 0.33 / 4.0 | 0.06 / 5.7 |
    | 800 | 1 | 3 | 1.00 | 0.85 / 0.9 | 0.67 / 2.0 |
    | 900 | 1 | 0 | 1 | 0.99 / 0.1 | 0.95 / 0.3 |
    | 1000 | 1 | 0 | 1 | 1 / 0 | 1 / 0 |

    - **Monotonic.** Every channel moves in one direction (0 direction changes over 68 frames). Focus reached the heading at about 650ms.
    - **Close.** The words were at 0 by 150ms and the drawer was off screen at 450ms. The dim was 0.97 at 150ms and 0 at 550ms, and the drawer was hidden at 600ms. Each channel is monotonic.
    - **Same-side switch (SCR-01 → SCR-02).** The hole's left edge went 51 → 75 → 174 → 241 → 270 → 281px at 0, 100, 200, 300, 400 and 550ms. The words faded to 0 by 200ms, the new title appeared at 250ms, and it was fully in by 550ms.
    - **Side change (SCR-03 → SCR-04), after the fifth review (2026-10-03).** At the user's request, the re-entry skips the 250ms open delay, because the dim is already up (`data-phase="reenter"`); a fresh open keeps it. The words keep their open offset from the slide start. Measured: the drawer was at +370px by 450ms, jumped to the left and was already at −318px by 503ms, reached 0 at about 1150ms; the heading rose from about 850ms and the body was in by about 1250ms. The total is about 1.2s, down from about 1.45s. The dim stayed at 1, and each channel changed direction only at the out/in turn (the drawer x twice, counting the jump). The hole landed by about 550ms.
    - **Interruptions.**
      - Esc at 300ms into opening: the drawer reversed from +323px back to +370px with no jump, and the dim held at 0.74 and then faded out. After 900ms the state was clean: drawer, spot and scrim hidden, no state classes left, the note back home, and `aria-expanded` false everywhere.
      - Two › clicks 60ms apart from SCR-01 ended on SCR-03, with only SCR-03 in the drawer.
      - Three › clicks 80ms apart, across a side change, ended on SCR-06 on the left, settled.
  - **Spotlight.** Two fixed layers sit under the drawer.
    - **`#gs-spot`** is a hole over the surface's box, padded 6px, with the surface's corner radius plus 6px (4px if the surface is square). It is outlined in the note style (2px dashed `--heading`, or 2px dotted `--note-community`). It dims everything else with `box-shadow: 0 0 0 200vmax color-mix(in srgb, var(--bg) 72%, transparent)`: tokens only, no new literal.
    - **Following the surface.** The hole's `left`, `top`, `width`, `height` and radius transition over 450ms (550ms when the note changes), `cubic-bezier(.4,0,.2,1)`. A `ResizeObserver` on the surface, scroll (capture) and resize listeners, and a refresh after every click keep it in sync.
    - **Measured tracking.** The hole matched the surface within 1px after the transition in five cases:
      - SCR-06 with the "none" chip (the hole shrinks to the bell), and back;
      - 0002 with the "question" chip (the card appears);
      - SCR-02 with "queued";
      - a 120px page scroll;
      - a resize to 1300×860.
    - **`#gs-scrim`** is a transparent full-viewport hit layer with an evenodd `clip-path` polygon that leaves the hole open. A click on the dimmed area closes the drawer; clicks inside the hole reach the product, so chips act live and the surface stays usable.
    - **Stacking.** Toasts (z 5) and product dialogs (z 8) sit below the scrim and spotlight (z 50), and the drawer (z 51) sits above them. A spotlight on a dialog (SCR-13, SCR-19, 0003) targets its `.gs-dialog`.
  - **Side rule.** The drawer opens on the side whose drawer overlaps the cut-out least, but never on the side that covers the start of the surface: the text of its first heading (measured with a `Range`), or its top-left corner. Ties go right. ⇆ overrides the rule until the note changes. Measured at 1440×900 (the full-width views and the status bar are covered at most 23.7%, always on their right, so their start stays clear):

    | Note | Spotlit surface | Side | Overlap (px²) | Share of the surface covered | Start of the surface covered |
    |---|---|---|---|---|---|
    | SCR-01 | sidebar | right | 0 | 0% | no (no heading; top-left corner kept clear) |
    | SCR-02 | chat pane | right | 7,937 | 1.4% | no |
    | SCR-03 | helpers pane | right | 8,957 | 1.6% | no |
    | SCR-04 | work progress panel | left | 0 | 0% | no |
    | SCR-05 | status bar | right | 9,390 | 23.7% | no (no heading; top-left corner kept clear) |
    | SCR-06 | bell and toasts | left | 0 | 0% | no |
    | SCR-07 | view (full width) | right | 191,087 | 23.5% | no |
    | SCR-08 | view (full width) | right | 191,087 | 23.5% | no |
    | SCR-09 | first-run section (full width) | right | 191,400 | 19.5% | no |
    | SCR-10 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-11 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-12 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-13 | palette dialog | right | 0 | 0% | no |
    | SCR-14 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-15 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-16 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-17 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-18 | view (full width) | right | 191,400 | 23.6% | no |
    | SCR-19 | trust dialog | right | 0 | 0% | no |
    | 0001 | List \| Graph toggle | right | 0 | 0% | no (no heading; top-left corner kept clear) |
    | 0002 | steer box | left | 0 | 0% | no (no heading; top-left corner kept clear) |
    | 0003 | Ask why dialog | right | 0 | 0% | no |

  - **ARIA.** The drawer is `role="dialog"` with `aria-modal="false"`. It behaves like a non-modal dialog: it opens on demand, takes focus, and closes with Esc or ×. It is not modal, because the spotlit surface stays interactive and focus is not trapped; the dimmed area only blocks the pointer. `complementary` was dropped because the drawer is no longer a landmark beside the content but a popup over it. Triggers carry `aria-haspopup="dialog"`, `aria-controls` and `aria-expanded`; the layers are `aria-hidden`.
  - **Reduced motion.** Under `prefers-reduced-motion: reduce`, nothing slides, rises or glides. The drawer, the spotlight, the heading and the body transition only `opacity` over 120ms, with no delay (measured). `translateX` is 0 from the first sample, and the timers fire at once.
  - **1100px and below.** The same concept becomes a bottom sheet that slides up from the bottom edge.
    - **Size.** The sheet is `translateY(100%)` → 0 with the same choreography, at most 760px wide (full width on a phone) and 60vh high, with only its top border in the note style, and without ⇆. This covers the original 640px phone breakpoint.
    - **Room above.** The frame gains 60vh of bottom padding (below every product element, so no box moves), and opening scrolls the surface to the top of the viewport, where the spotlight shows above the sheet.
    - **Measured at 390×844.** `translateY` was 496px at about 5 and 120ms, 426px at 300ms, 59px at 600ms and 0 at 1000ms; 340px of the spotlight visible above the sheet; no horizontal scroll.
    - **Why not a side drawer from 641 to 1100px.** The window already stacks there, and a side drawer would cover most of it.
  - **Focus and Esc.** Opening moves focus to the drawer's heading; closing with × or Esc returns it to the trigger, without scrolling. Esc closes the drawer when focus is inside it, and the event then stops there. With focus elsewhere, Esc closes the aside only when no dialog or menu is open; otherwise the existing Esc handling closes the dialog or menu as before.
  - **Switches.** Each switch hides its own triggers and closes the drawer if it shows a note of its type. While the drawer is open, the meta bar sits under the dim layer: a pointer click there closes the drawer first, and the keyboard still reaches the switches. A note also closes when its trigger leaves the screen, for example after navigation or when its dialog closes.
  - **Defaults and motion.** On load, triggers are visible and the drawer is closed.
- **Spanish annotation layer (2026-10-03).** The user asked for the corpus notes and the community proposal annotations in Spanish (feature `odd/tasks/mockup-es-onboarding-desktop.md`, T1). Neutral, professional Spanish, with no regional forms.
  - **Scope: annotations in Spanish, product in English.** Translated:
    - the content of the 22 notes: surface and proposal names, "Existe hoy" badges, section labels (mapping under Conventions, "Note language"), state-chip labels and prose;
    - the inspector chrome: the community tab "✎ Propuesta de la comunidad", the position "N de 22", "se muestra en SCR-NN", and the names and titles of ‹ › ⇆ ×. The "§ Corpus" tab is unchanged, because the word is the same in Spanish;
    - the triggers' accessible names and titles ("Nota del corpus …", "Propuesta de la comunidad …");
    - the badge "Propuesta de la comunidad" and the tags, in the markup and in the script's `proposalBadges()`. The tags read "000N · `proposed`" since the scoped correction of 2026-10-03: the status is the corpus value, code-styled as in the notes (they read "000N · propuesta" before);
    - the two switch labels, "§ Notas del corpus" and "✎ Propuestas de la comunidad", and their accessible names.
  - **Kept in English, and why.**
    - The product window, because it reproduces Alan's app UI. This includes the mock product UI that the proposals simulate ("Steer this helper…", "Ask why", "Send to helper", List | Graph, the "steering" and "queued" marks) and product copy quoted inside notes ("Chat in another folder…", "needs you", "Compact now", "Retry" and similar), which stays in quotes.
    - IDs in their qualified form (`inventory C17`, `gap G1`, `vision P10`, `audit A3`, `ADR 0011`, SCR-NN, PLAT-NN), code spans, commands, flags, file paths, citations and quoted corpus headings ("Host channel to gentle-shell features", "Undecided / not recorded"). This file and the peer verifier key on them, so translating them would break traceability.
    - The `Inference:` and `UNVERIFIED:` markers, which are corpus conventions; the sentence after each marker is translated. A section label "Inference" is translated ("Inferencia"), because it is a label, not a marker.
    - Product names: gentle-shell, pi, Gentle, Helpers, Engram.
    - SCR-04's Phase chips and its mapping line: `gentle_odd_phase` values (authorizing … closing) and the product's step names (Explore … Deliver), which the product shows verbatim.
    - The maintainer's quote "Never a global list" in the 0001 note, which is a quotation.
  - **Out of T1's scope, left in English at the time:** the meta bar's edition line, the surface index, the pending notice and the annotation `title` tooltips on product elements. They were translated later the same day (Decisions, "Spanish meta layer (2026-10-03)"). CSS and script comments stay English.
  - **`lang` attributes.** `lang="es"` is set on each `details.gs-corpus`, on `aside#gs-insp`, on both `.gs-toggle` switch groups, on each `.gs-badge.gs-proposal` and `.gs-pid`, and on each trigger (set by the script). The document and the product window stay `lang="en"`, so a screen reader changes language only for the annotations.
  - **Terminology.** No Spanish edition of the corpus exists (no `docs-es/` on `docs/corpus`), so there was no glossary to reuse. These choices hold throughout:
    - "helper" stays "helper";
    - "Exists today" = "Existe hoy", "not built" = "no construido", "not drawn" = "no dibujado";
    - "steer" = "redirigir", "thinking" = "razonamiento", "payload" = "carga útil";
    - "the desktop" (the app) = "la aplicación de escritorio"; "mockup" stays "mockup", the user's term (T1 used a Spanish synonym; aligned in the scoped correction of 2026-10-03);
    - the corpus marker `Inference:` is never used as a Spanish noun: the prose says "una inferencia" and keeps the marker in code (for example "ambos son inferencias (`Inference:`)").
    - "toast" = "aviso", "spawn flags" = "opciones de lanzamiento", "launcher" = "lanzador".
  - **Peer corrections done in the same task.**
    - The 0002 note now states that the channel choice for host actions on helpers is open, with the three alternatives, and cites the ADR index row and the RPC contract section (row "0002 corpus note and state chips").
    - The rows citing `docs/00-vision.md:81` and `docs/05-capability-inventory.md:481` now name vision P10 and inventory L1.
  - Nothing else changed: no layout, style, timing, behaviour or `data-*` attribute.
  - **Known layout effect of the Spanish badge.** "Propuesta de la comunidad" is longer than "Community proposal", so the proposal mock UI that follows a badge shifts: by 53px horizontally at 1440, and by 17px in height in the ask-why dialog (proposal 0003) at 390. The annotation causes the shift; the proposal mock UI is not product, and Alan's product boxes (everything outside `[data-proposal]`) are unchanged. The badge text is kept, by the user's Spanish scope.
  - **Checks (headless Chromium, 1440×900).**
    - 0 page errors.
    - All 22 notes open in the drawer with Spanish chrome and content, every note with `lang="es"`.
    - The product window's text content and its `title`, `aria-label` and `placeholder` values are identical to the pre-change file, once notes, triggers, proposal badges and tags are excluded.
    - The open/close suite passes for all 22 notes, with 0 product boxes moving at 1440×900, 1280×800 and 390×844.
    - Peer verifier: OK, with 0 inventory mismatches and no vision line (before: 2 and 1).

- **Spanish meta layer (2026-10-03).** The user widened the Spanish scope: everything that is not the app is in Spanish, in a neutral, professional register (feature `odd/tasks/mockup-es-onboarding-desktop.md`, T2 part B).
  - **Translated, with `lang="es"` on each container:**
    - Alan's disclaimer: "Mockup conceptual · El contenido es de ejemplo.", a translation of `gs-mockup.html:461-462` at the user's request;
    - the edition line, keeping branch names, SHAs, versions and code;
    - the surface index: its accessible name ("Índice de superficies"), the section labels "Del mockup" and "Derivadas del inventario", and the chips' short names, keeping the SCR IDs;
    - the pending notice and the script's `PENDING_SURFACES` names;
    - the onboarding and its "Ver tutorial" button.
  - **Screen-name rule.** Alan's subgroup labels Chats, Providers and Extensions are the app's own screen names, as its sidebar navigation shows them, so they stay English as proper names; each gets a Spanish `title` ("Pantalla Chats del mockup"). "First run" is not an app navigation label (the sidebar has Chats, Providers, Extensions and Settings), so it becomes "Primer arranque", the name the SCR-09 note already uses.
  - **"Mockup" in the banner.** The banner and the onboarding say "mockup" ("Mockup conceptual", "Del mockup"), as the user's wording did. The T1 notes used a Spanish synonym, also as the section label of derived notes. Resolved in the scoped correction of 2026-10-03: every note, label and the page title now say "mockup" ("Mockup" as the section label, "Sin mockup; derivado del inventario."), so the whole meta layer uses the user's term. The page title is "Gentle Shell Desktop · Mockup conceptual del corpus".
  - **Annotation tooltips.** 18 `title` attributes on product elements annotate rather than label UI, so they are translated. The `Inference:` marker stays English, as in the notes; qualified IDs stay as they are. They are:
    - 12 `Inference:` titles (sidebar "Chat in another folder…" and Settings, ODD Review and Changed lines, SCR-08 to Memory, both SCR-16 links to Extensions, SCR-17 to Diagnostics, the status bar's profile and "ODD · RDD", and both toasts);
    - 2 "Bloqueado por …" (the helper Stop, and the SCR-14 "Allow for this session");
    - 1 "Intención de diseño: …" (the 0001 message node);
    - 2 identical "Tras la versión 4.0.0 … (inventory P1); no dibujado" titles on SCR-10's Apply buttons. T1 had not counted them; they annotate, so they are translated;
    - 1 "Fase de gentle-shell, comunicada por gentle_odd_phase (gap G2)" on SCR-04's phase label. It is ambiguous, because it labels the phase chip, but it cites a gap, so it is treated as an annotation.
  - **Kept in English, as real UI tooltips:**
    - "2 notifications" on the bell;
    - "Change course before the next step" and "Send after this finishes" on proposal 0002's Steer | Queue. That is mock product UI.
  - **`lang` limitation.** A `title` takes its language from its element, and these elements are English product UI. So the translated tooltips carry no `lang="es"`: tagging the element would mislabel its English text.
  - **Not changed:** the product window's text, the mock product UI of the proposals, IDs, code, citations, branch names and SHAs. Checked: the product's text content (17,527 characters) is identical to the pre-change file, and its 87 `title`, `aria-label` and `placeholder` values differ only in the 18 tooltips above.
  - **Layout.** At 1440 and 1280px the product window keeps its exact position. At 390px the longer Spanish banner and the new "Ver tutorial" button push the window 58px down; nothing inside it moves.
- **Onboarding (2026-10-03).** The user asked for a skippable onboarding in neutral, professional Spanish that explains how to use the mockup on first use, like a typical first-run app tour. Its steps move into each other with the drawer's calm motion language: guide attention, no impact (feature `odd/tasks/mockup-es-onboarding-desktop.md`, T2).
  - **Content (8 steps, about two minutes).** Each step spotlights the element it explains.

    | Step | Title | Spotlight |
    |---|---|---|
    | 1 | Mockup conceptual de Gentle Shell Desktop: Alan's design extended to the corpus; design intent, not working functionality; example data; app UI in English; 8 steps, skippable | none (whole page dimmed) |
    | 2 | El índice de superficies: "Del mockup" = Alan's 4 screens and 9 surfaces; "Derivadas del inventario" = SCR-10…19, deduced from the inventory, with no mockup (`docs/06-ux/screens.md:5`); a click goes to the surface | the index |
    | 3 | Notas del corpus (§): the gold § button opens the note in a side panel (what exists today, what blocks it, its states); the app stays lit, so chips act live | SCR-01's § trigger (or the corpus switch if notes are off) |
    | 4 | Propuestas de la comunidad (✎): community proposals, not Alan's intent, with ✎ and an orange frame; each has its own note; they can be hidden | proposal 0002's Steer \| Queue row (or the proposals switch) |
    | 5 | Los interruptores: one switch per layer | both switches |
    | 6 | Navegar dentro de la app: status bar, the "⋯" menu, the sidebar, the ODD panel's links | the status bar |
    | 7 | Controles del panel: ‹ › in order, ⇆ swaps sides, Esc, × or a click on the dimmed area closes | the drawer's tools; the step opens SCR-01's note (or the first enabled note) and closes it on leaving |
    | 8 | Listo para empezar: traceability in `TRACEABILITY.md`; replay with "Ver tutorial"; the button reads "Empezar" | the "Ver tutorial" button |

  - **Presentation.** The tour reuses the drawer's dim-and-hole technique: a fixed hole, padded 6px, whose `box-shadow` dims the rest with `color-mix(in srgb, var(--bg) 72%, transparent)`. It uses its own elements above the drawer (z 60–62), so step 7 can show the open drawer under it. Without a target, the hole shrinks to the centre and its outline fades, which dims the whole page.
  - **Card placement.** The card is placed beside the target, never over it, and inside the viewport. Targets wider than half the viewport prefer below, then above; others prefer right, then left, then below, then above. With no target, the card is centred. At 1100px and below, it docks at the bottom, at most 760px wide, and the target scrolls into view above it. If the target would still sit with its centre in the lower half of the viewport (the page end, or a fixed target such as the drawer's tools), the card docks at the top instead, with the same style and mirrored 16px margins, and the target is brought up to the bottom edge. The side is chosen once per step; a side change fades the card out with the step text (200ms) and back in. The docked card caps its height to the room between the target and the far edge (160px to half the viewport); the step text then scrolls inside the card, and the buttons stay visible.
  - **Meta style and contrast.** The card is neutral, so it is apart from the product and from the gold corpus and orange community layers: `--text` and `--text-2` on `color-mix(in srgb, var(--text) 6%, var(--raised))` = `rgb(37,28,34)`, a solid `--line-strong` border, radius 14px, and Inter rather than the notes' monospace. The hole outline is 2px solid `--text-2`. No new colour literal. WCAG ratios on the card:

    | Text | Ratio |
    |---|---|
    | title `--text` | 14.64:1 |
    | body `--text-2` | 10.41:1 |
    | step count and "Saltar" `--muted` | 5.51:1 |
    | "Siguiente" (`--bg` on `--text-2`) | 12.83:1 |
    | "Siguiente" on hover (`--bg` on `--text`) | 18.05:1 |

  - **Motion.** CSS transitions, each state carrying the transition into it, so an interruption reverses or settles from where it is.

    | Moment | What moves | Start | Duration | Easing |
    |---|---|---|---|---|
    | Open | dim fades in | 0 | 600ms | `cubic-bezier(.4,0,.2,1)` |
    | Open | card rises in (opacity 0 → 1, 8px → 0) | 300ms | 350ms | `cubic-bezier(.4,0,.2,1)` |
    | Step change | hole glides to the new target | 0 | 550ms | `cubic-bezier(.4,0,.2,1)` |
    | Step change | words fade out, moving 0 → 6px | 0 | 200ms | `cubic-bezier(.4,0,1,1)` |
    | Step change | new words fade in, rising 6px → 0 | 200ms | 300ms | `cubic-bezier(.4,0,.2,1)` |
    | Step change | card moves to its new position | 0 | 450ms | `cubic-bezier(.4,0,.2,1)` |
    | Close or skip | card fades out and sinks 8px | 0 | 250ms | `cubic-bezier(.4,0,1,1)` |
    | Close or skip | dim fades out; the layer is hidden at 470ms | 0 | 450ms | `cubic-bezier(.4,0,.2,1)` |
    | Reduced motion | opacity only; nothing glides, rises or moves | 0 | 120ms | linear |

    - **Following.** A frame loop follows the target for about 1.3s after each change, and on scroll and resize, so the hole and the card track smooth scrolling and the drawer's slide in step 7.
    - **Measured (1440×900).** Open: the dim was at 0.53 by 250ms and 1 by 650ms; the card started at about 350ms and was settled at 700ms. Step 1 → 2: the hole grew from the centre to the index by about 550ms; the words were out by about 200ms and back by 450ms; the card glided 526 → 50px. Skip: the card was out by 250ms, the dim was at 0 by 460ms, and the layer was hidden at 470ms. Every channel moved in one direction, except the words' opacity and offset, which turn once (out, then in).
  - **First run and storage.**
    - **Auto-start.** The tour starts about 400ms after `load` when `localStorage["gs-mockup-onboarding-v1"]` is empty. Finishing writes `done`; "Saltar" or Esc writes `skipped`. Any value suppresses the auto-start.
    - **Failures.** Every read and write is wrapped in try/catch. If storage throws, the tour shows once per load and nothing breaks.
    - **Opening.** Opening the tour closes the "⋯" menu, any product dialog and the note drawer first.
    - **Replay.** "Ver tutorial" replays the tour from step 1.
  - **Keyboard and ARIA.**
    - **Roles.** The card is `role="dialog"` with `aria-modal="true"`, labelled by its title and described by its text, inside a `lang="es"` layer.
    - **Truly modal.** While the tour is open, the page, the drawer and its scrim, the menu bar and the Dock are `inert`, and a pointer blocker covers the viewport. All are restored on close. (The menu bar and the Dock were added in the scoped correction of 2026-10-03.)
    - **Keys.** → or Enter go next (Enter on a focused button activates that button), ← goes back, and Esc skips. Tab cycles among "Saltar", "Anterior" and "Siguiente".
    - **Priority.** These keys are handled in the window's capture phase, so the tour comes before the drawer's and the dialogs' Esc handling.
    - **Focus.** It moves to the step title on each step. The title draws no focus ring, because it is not a control. On close, focus returns to the element that opened the tour ("Ver tutorial"), or leaves the card on a first-visit start.
  - **Responsive.** At 1100px and below, the card docks at the bottom (or at the top for a target in the lower half), and its footer puts the dots on their own line at 640px and below. At 390px there is no horizontal scroll. Checked after the scoped correction of 2026-10-03: at 390×844 and 1000×800, with and without reduced motion, no step's card intersects its spotlight, and every spotlight is inside the viewport. Before it, at 390, step 6 (status bar) sat fully under the card and step 2 (index) overlapped it by 34px.
  - **Product untouched.** No product text changes. With the tour open, on each of the 8 steps, 0 product boxes move at 1440, 1280 and 390, measured in document coordinates.

- **Desktop background (2026-10-03).** The user asked for the page background to look like a macOS desktop, with a menu bar, a wallpaper, icons and a Dock ("puede ser una imagen", it may be an image). It is meta, not product: every part carries `data-meta`, and its visible text is neutral, professional Spanish (feature `odd/tasks/mockup-es-onboarding-desktop.md`, T3).
  - **Original assets only.** The wallpaper, glyphs and icons are drawn here in inline SVG and CSS from the `:root` tokens and `color-mix()` of them, so `verify.py` reports no new colour literal and the file stays self-contained. There is no Apple logo, no Apple wallpaper, no SF font and no copied Apple artwork, because those are copyrighted; the menu bar's system glyph is a neutral ring. The look follows the macOS conventions (translucent bars with blur, a rounded Dock, labelled desktop icons), not its assets.
  - **Layering** (root stacking context, back to front):

    | Layer | z-index |
    |---|---|
    | Wallpaper, then desktop icons (`.gs-desk`, fixed) | -1 |
    | Banner panel and product window (normal flow; product layers 5–8 inside) | auto |
    | Dock (`.gs-dockwrap`) | 30 |
    | Menu bar (`.gs-mbar`) | 40 |
    | Note scrim and spotlight | 50 |
    | Note drawer | 51 |
    | Onboarding blocker, hole and card | 60–62 |

    While the note drawer or the onboarding is open, the menu bar fades out under their dim (450ms; 120ms with reduced motion), so it never cuts into a spotlight hole near the top. The Dock cannot be revealed while either is open.
  - **Window separation.** The wallpaper is mid-luminance (blue, orchid and pink blends at 30–70% over `--bg`), so the near-black product window, with its original shadow, stands out without any change to product CSS.
  - **Banner panel.** The disclaimer, the meta bar, the surface index and the pending notice sit in one wrapper, `.gs-banner`, on `color-mix(in srgb, var(--bg) 75%, transparent)` with `backdrop-filter: blur(24px) saturate(1.2)`. Contrast was sampled from pixels with the text hidden, against the lightest pixel under each text box:

    | Text | Colour | 1440×900 | 390×844 |
    |---|---|---|---|
    | Body and index labels | `--muted` | 5.96:1 | 5.69:1 |
    | Strong and chips | `--text-2` | 11.25:1 | 10.85:1 |
    | Corpus switch | `--heading` | 10.38:1 | 10.21:1 |
    | Community switch | `--note-community` | 5.53:1 | 5.33:1 |
    | Screen links | `--text` | 16.01:1 | 15.19:1 |

  - **Dock auto-hide.** The Dock rests below the viewport edge (translated out by its height plus 24px), so it never covers the product, including the status bar when the page is scrolled to the bottom. It slides up when the pointer comes within 6px of the bottom edge, in the Dock's horizontal band plus 40px, or when it takes keyboard focus. It slides back 250ms after the pointer leaves it, or when focus leaves it. Only keyboard focus (`:focus-visible` inside the Dock) holds it up: a mouse click on a tile also focuses the tile, and before the scoped correction of 2026-10-03 that pinned the Dock until the next click elsewhere; now it hides once the pointer leaves. In: 350ms `cubic-bezier(.22,.61,.36,1)`. Out: 300ms `cubic-bezier(.4,0,1,1)`. Measured at 1440×900 (samples vary by a few pixels between runs), the offset went 89 → 55.5 → 25.2 → 12.8 → 4.2 → 0.6 → 0px at about 0, 60, 120, 180, 240, 300 and 360ms. On leave, it held for 250ms, then went 2 → 18.9 → 46.4 → 73.6 → 89px between about 300 and 620ms.
  - **Responsive.**
    - At 1440px and above, the desktop icons show in the right gutter. The gutter there is 56px (client width 1432 minus the 1320px window, halved), and the column is 50px wide, 3px from the edge, with 36px tiles and 10px labels. Measured at 1440×900 with fallback fonts, the widest label ("Proyectos") spans x 1379.7–1428.3 and the window and banner end at x 1376, so no label reaches them; the labels fit without ellipsis. The breakpoint moved from 1400 to 1440px in the scoped correction of 2026-10-03, because at 1400 the gutter is 36px, too narrow for any label; below 1440 they hide, which covers the requested 1100px rule. Before the correction the labels (10.5px, up to 64px wide) ran about 4px into the banner and the window at 1440, and "notas-corpus.md" was clipped.
    - At 1100px and below: the full menu bar and the auto-hiding Dock stay.
    - At 640px and below: the menu bar shows only the glyph, the app name and the time, and there is no Dock.
    - At 390px there is no horizontal scroll.
  - **Reduced motion.** The Dock does not slide: it stays in place and fades in or out over 120ms (opacity 0 at rest, with no pointer events). The tile hover lift is off, and the menu bar fade takes 120ms.
  - **Product untouched.** No product CSS rule, markup, text or behaviour changes. At 1440, 1280 and 390, every product box relative to `.gs-window` is identical to the version before this task. The window sits lower on the page (58px at 1440, 86px at 1280, 147px at 390) because of the menu bar offset and the panel padding.

## Gaps

Left out on purpose, with the reason:

| What | Rows | Why |
|---|---|---|
| Tool and thinking blocks in the main chat | inventory C17, C18, V15, I5 | Vision P2 keeps them out of the main chat (`docs/00-vision.md:73`); listed in the SCR-02 note. |
| Steer from the composer while working | inventory C4 | Queue vs steer vs decline is open (vision Q5); only the queued-message state is previewed. |
| Attach images, `@` file references, copy message, find in chat, shortcut sheet | inventory C9, C10, S19, U2, U5 | `Inference:` interactions only; left out for proportionality and listed in the note where they belong to SCR-02. |
| Helper result, review reminder and preflight cards | inventory A7, R2, V17 | Dropped by the desktop today (audit A6); the review reminder belongs to SCR-14. The inventory V17 dev-binary notice is also not drawn: on gentle-shell `main` (`ac67159`), after the 4.0.0 release (#1652), its `notify` fallback is sent only when the shell is disabled or the override check fails, so by default an RPC host receives none (`Inference:`, `docs/05-capability-inventory.md:514`). |
| Option descriptions on question cards | inventory I10 | Lost over RPC; the card is drawn as in the mockup. |
| Steer box and in-thread answer in the Helpers pane | inventory A6, A5 | `Inference:` only; listed in the SCR-03 note. |
| "All sessions" helper scope | inventory A3 | Conflicts with UX U4 (`docs/06-ux/screens.md:112`). |
| A "waiting" helper item | inventory A1 | Listed as a state; no example item drawn. |
| Rename, delete, "Continue last chat", private chat | inventory S5, S6, S2, S16 | Listed in the SCR-01 note; rename, delete and private chat belong to SCR-12. |
| Open the feature document from the panel | inventory O3 | `Inference:` interaction with no target surface and no specified format. |
| Model and effort pickers, usage meter in the status bar | inventory M1, M5, V4 | Listed in the SCR-05 note; the usage meter is drawn in Providers instead. |
| Usage fields per subscription | inventory V4 | `UNVERIFIED:` the inventory documents the `/gentle:usage` panel, not its fields. |
| OAuth details while signing in | inventory M7 | The corpus documents the "signing in" state, not the flow; drawn as "Signing in…" only. Since pi 1.0.0 the terminal `/login` ends with "Sign in with Radius" and then offers to add the Radius MCP server (`docs/05-capability-inventory.md:214`); screens.md treats this as input for SCR-07, not a requirement (`docs/06-ux/screens.md:160`), so it stays undrawn and is named in the SCR-07 note. |
| Usage history across chats, per model | inventory V19 | `Inference:` state in screens.md (`docs/06-ux/screens.md:156`); `/gentle:stats` is TUI-only and sends only a `notify` under RPC (`docs/05-capability-inventory.md:516`), and the history could also sit beside the chat statistics of SCR-12. Its placement is undecided, so it is a non-interactive chip in the SCR-07 note, not a drawn section. |
| Routing-diff confirmation when applying a profile | inventory P1 | Post-release: on gentle-shell `main` (`ac67159`), after the 4.0.0 release (#1349); unreachable under RPC because it is asked from inside the panel (`docs/05-capability-inventory.md:558`). Named in the SCR-10 note and in the Apply buttons' `title`. |
| Windows checks for Go and Bash on first run | — | PLAT-04 and PLAT-05 propose first-run checks (`docs/10-platforms.md:134`, `:135`); the corpus names no screen copy for them. Listed in the SCR-09 note. |
| Review mode refused on DrvFS, exFAT or SMB | inventory R1 | New in gentle-ai v4.0.0 (`docs/05-capability-inventory.md:548`; PLAT-06, `docs/10-platforms.md:136`). The mockup draws no error state for it; listed in the SCR-14 note. |
| Per-chat tool toggles | inventory E9 | Spawn flags only; listed in the SCR-08 note. |
| "Same home as my terminal" option; theme and analytics steps on first run | inventory L2, U7 | `Inference:` candidates (vision Q7); listed in the SCR-09 note. |
| Run a shell command from the composer | inventory C8 | `Inference:` surface "Run command" mode in the composer (`docs/05-capability-inventory.md:178`); not drawn; listed in the SCR-02 note. |
| Esc behavior in the composer | inventory V13 | `Inference:` surface "same semantics in the composer" (`docs/05-capability-inventory.md:510`); not drawn in SCR-02; the opt-in setting is drawn in SCR-17. Listed in the SCR-02 note. |
| Prompt history in the composer | inventory V14 | `Inference:` surface "Up-arrow history and search in the composer" (`docs/05-capability-inventory.md:511`); not drawn in SCR-02; the capture setting is drawn in SCR-17. Listed in the SCR-02 note. |
| Risky shell command confirmation card | inventory Y1 | Exists in the desktop as a confirmation card (`docs/05-capability-inventory.md:567`); the mockup draws no example. Listed in the SCR-02 note. |
| Blocked-tool card | inventory Y2 | `Inference:` surface "blocked-tool card" (`docs/05-capability-inventory.md:568`); tool results are not rendered (inventory C17). Listed in the SCR-02 note. |
| Consent card naming the peer session | inventory A9 | `Inference:` surface "consent card naming the peer" (`docs/05-capability-inventory.md:530`); folded into SCR-02 as a dialog card (`docs/06-ux/screens.md:317`). Not drawn; listed in the SCR-02 note. |
| Status card (project, changes, integrations) | inventory V3 | `Inference:` surface "side panel" (`docs/05-capability-inventory.md:500`); `setStatus` is ignored today. Not drawn; listed in the SCR-05 note. |
| A command-output toast | inventory V18 | The inventory surface is "one toast or result card per command" (`docs/05-capability-inventory.md:515`), but the two drawn toasts are the mockup's helper and decision toasts, not command output, so V18 is not added to them. The `.gs-toasts` root and the SCR-06 note carry V18. |
| List models from the shell | inventory M11 | Covered by inventory M1, as the inventory says (`docs/05-capability-inventory.md:218`). |
| Copy for error, empty and loading states | — | The corpus documents the states, not the wording; all such copy is example text. |
| Steering mode and follow-up mode as two settings | inventory C7 | Drawn as one row; the corpus lists both under queue mode. |
| Default effort per model, compaction thresholds, retry limits and delays | inventory M6, K2, K5 | Only the main values are drawn; thresholds are not settable over RPC. |
| Individual network settings (transport, idle timeout, cache warming) | inventory M13 | Folded into one "Proxy and timeouts" row. |
| Analytics and install telemetry as separate switches | inventory U8, I9 | One telemetry row. |
| Visual customization items with terminal meaning (banner, cards, layout, sections, visual profiles) | inventory V8, V11 | `/gentle:customize` refuses outside the TUI; only theme and reduced motion are drawn. |
| Default project trust setting (`ask`, `always`, `never`) | inventory T1 | A global setting; screens.md places inventory T1 on SCR-19 only, so it is not drawn in Settings. |
| What was remembered | inventory I4 | `UNVERIFIED:` Engram's data model (`docs/06-ux/screens.md:272`). |
| Review timeline per reviewer and fix | inventory R5 | `Inference:` in the inventory, and tool cards are missing (inventory C17); only the review states are drawn. |
| Status-bar use of `review status` | inventory GA2 | `Inference:`; listed in the SCR-14 note. |
| Tree filters, label timestamps, branch-summary settings | inventory S8, S9, S10 | Terminal options with no documented GUI meaning. |
| Share targets and the viewer URL | inventory S15 | Only "Share link" with a warning is drawn. |
| System prompt and context-file flags | inventory K6 | Spawn only; the loaded files are listed instead. |
| Built-in pi commands in the palette | inventory C12 | Not available over RPC. |
| Palette live filtering and arrow-key selection | — | The search and no-match states are previewed with chips only. |
| What follows the "Report a problem" scope choice | inventory H1 | The scope is undecided; only the choice is drawn. |
| Update actions: updating pi, extensions, model catalogs or gentle-shell; gentle-ai update, upgrade, uninstall and restore | inventory H3, L12, GA5 | The inventory's surface for H3 and L12 is an update notice (`docs/05-capability-inventory.md:263`, `:492`); the update card is that notice, with no action. GA5 lists gentle-ai commands (`:599`), not an update of gentle-shell; only the gentle-ai version is shown. |
| Session ID in chat details | inventory S7 | Left out as technical detail (UX U2). |
| Which helpers exist for the per-helper table | inventory P3 | The corpus documents the table, not the helper list; the rows are example data. |
| Cancelled helper as a graph node | inventory A1 | Community proposal 0001 lists the node states queued, running, waiting, done and failed (`docs/07-proposals/0001-agent-flow-graph.md:28`); the cancelled helper stays in the list only. |
| Waiting node, question and steering edges in the graph | inventory A5, A6 | Community proposal 0001: the example has no helper question or steering event; the edge types are named in the legend only. |
| Cross-chat graph (messages between open sessions) | inventory A9 | Community proposal 0001 leaves it as an open question because it would conflict with vision P4 (`docs/07-proposals/0001-agent-flow-graph.md:31`, `:55`). |
| Model, tokens and cost on graph nodes | inventory A2 | Community proposal 0001: omitted from the payload (gap G8, `docs/07-proposals/0001-agent-flow-graph.md:42`). |
| Inspect the main agent's tool calls and thinking behind a toggle | inventory C17, C18 | Community proposal 0002 (`docs/07-proposals/0002-interact-with-running-node.md:31`, `:46`); vision P2 keeps them out of the main chat and the proposal names no surface for the toggle. Listed in the 0002 note. |
| Reply to a helper's `subagent_parent_message` query | inventory A5 | Community proposal 0002: model only, one reply within 30 seconds (`docs/07-proposals/0002-interact-with-running-node.md:44`); no host surface described. |
| A new Stop control for helpers | inventory A4 | Community proposal 0002 reuses the mockup's Stop in the helper thread (`docs/07-proposals/0002-interact-with-running-node.md:28`), already drawn as maintainer intent; whether it asks for confirmation is open (`:61`). |
| Steering a helper through the parent agent | inventory A6 | Community proposal 0002 leaves the route open (`docs/07-proposals/0002-interact-with-running-node.md:59`); the box only states that the helper gets the message. |
| Ask why on the failed and cancelled helpers | inventory A12 | Community proposal 0003 covers finished helpers as its primary scope (`docs/07-proposals/0003-post-hoc-audit-by-questions.md:24`); drawn once, on the done helper, for proportionality. |
| Ask why on a finished ODD task (SCR-04) | inventory O3, R5 | Community proposal 0003 mentions "a task with a commit" as a result the user sees (`docs/07-proposals/0003-post-hoc-audit-by-questions.md:14`), but places Ask why on finished helpers, with main-agent turns only as an optional extension (`:24`); linking answers to ODD evidence needs gap G2 (`:41`). |
| Answers to newly asked questions | — | Community proposal 0003 does not define answer content; the preview appends the question only. |
| A saved-answer marker next to the node | — | Community proposal 0003: where saved answers live is open (`docs/07-proposals/0003-post-hoc-audit-by-questions.md:55`). |
| Several side conversations at once | — | Community proposal 0003: single session host, gap G9 (`docs/07-proposals/0003-post-hoc-audit-by-questions.md:42`). |
| The 0002 main-agent row fits the window at 390px | — (proposal 0002, mock UI) | Known pre-existing gap, out of scope of the scoped correction of 2026-10-03. At 390×844 the row `#p0002-main` (`.gs-cstate`) is 436px wide and ends at x 475, past the window edge at x 366; the window clips it, so there is no page horizontal scroll. Identical in the file before T1. |
