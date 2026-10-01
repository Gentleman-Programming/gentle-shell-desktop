# Capability inventory

> Status: draft.

Every capability of gentle-shell that needs a surface in the desktop app, and how to get there. gentle-shell's experience is pi's interactive (TUI) mode plus gentle-shell extensions, so this inventory has two parts: [pi core](#pi-core-v0991), the runtime the desktop talks to through gentle-shell, and [gentle-shell and gentle-ai](#gentle-shell-and-gentle-ai), what gentle-shell adds on top.

## Coverage summary

Rows per group, counted mechanically from the capability tables below (first word of the "Desktop status" and "Exposed over RPC" cells). Recount when a row changes.

| Part | Group | Rows | Desktop done | partial | missing | n/a | RPC yes | partial | no | host-side | spawn | n/a |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pi core | Sessions | 19 | 1 | 2 | 16 | 0 | 5 | 4 | 5 | 1 | 4 | 0 |
| pi core | Conversation and input | 21 | 5 | 4 | 11 | 1 | 15 | 1 | 0 | 4 | 0 | 1 |
| pi core | Context, compaction and retry | 6 | 0 | 0 | 6 | 0 | 4 | 1 | 1 | 0 | 0 | 0 |
| pi core | Models, thinking and providers | 13 | 0 | 1 | 12 | 0 | 3 | 2 | 7 | 0 | 1 | 0 |
| pi core | Extensions, packages, skills, prompts, themes and MCP | 9 | 0 | 0 | 9 | 0 | 0 | 3 | 4 | 0 | 2 | 0 |
| pi core | Project trust | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| pi core | Display and terminal | 8 | 0 | 2 | 3 | 3 | 0 | 0 | 1 | 2 | 1 | 4 |
| pi core | Help and diagnostics | 4 | 0 | 0 | 4 | 0 | 0 | 0 | 4 | 0 | 0 | 0 |
| **pi core** | **Total** | **81** | **6** | **9** | **62** | **4** | **27** | **11** | **23** | **7** | **8** | **5** |
| gentle-shell | Launcher and homes | 12 | 1 | 3 | 5 | 3 | 0 | 0 | 5 | 0 | 5 | 2 |
| gentle-shell | Shell experience | 18 | 0 | 3 | 14 | 1 | 4 | 10 | 3 | 1 | 0 | 0 |
| gentle-shell | Helpers (subagents) | 12 | 0 | 5 | 7 | 0 | 3 | 5 | 4 | 0 | 0 | 0 |
| gentle-shell | ODD workflow and task tracking | 4 | 0 | 0 | 3 | 1 | 1 | 2 | 0 | 1 | 0 | 0 |
| gentle-shell | Review and RDD | 5 | 0 | 2 | 3 | 0 | 2 | 2 | 1 | 0 | 0 | 0 |
| gentle-shell | Profiles, models and persona | 4 | 0 | 1 | 3 | 0 | 1 | 0 | 3 | 0 | 0 | 0 |
| gentle-shell | Safety and permissions | 5 | 1 | 0 | 3 | 1 | 2 | 0 | 2 | 0 | 0 | 1 |
| gentle-shell | Integrations, skills, memory and diagnostics | 10 | 0 | 1 | 9 | 0 | 2 | 8 | 0 | 0 | 0 | 0 |
| gentle-ai | gentle-ai outside the session | 5 | 0 | 0 | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0 |
| **gentle-shell + gentle-ai** | **Total** | **75** | **2** | **15** | **52** | **6** | **15** | **27** | **23** | **2** | **5** | **3** |

## At a glance (pi core)

| Question | Answer |
|---|---|
| How many pi core capabilities? | 81 rows in 8 groups, covering 24 built-in slash commands, 1 hidden working command (`/debug`), 2 built-in extension commands, 43 app keybindings, 47 TUI keybindings, 40 CLI flags, 8 CLI subcommands and 55 top-level settings. |
| How many does the desktop cover? | **done** 6, **partial** 9, **missing** 62, **n/a** 4 (terminal mechanics with no GUI meaning). |
| How many can the desktop reach over RPC today? | **yes** 27, **partial** 11, **no** 23, **host-side** 7, **spawn** only 8, **n/a** 5. |
| Biggest pi-core findings for the desktop | 1) Steering and follow-up are fully available over RPC, but the desktop rejects input while a run is active (C4). 2) Built-in slash commands do not exist over RPC (C12). 3) Under `--mode rpc` an undecided project is silently untrusted (T1). 4) The desktop's session list ignores custom session directories (S17). 5) Reopening a session whose stored cwd no longer exists makes pi exit with code 1 under RPC (S3). |

Counts are tallies of the tables below; recount them when a row changes.

## Method

### Sources

| Source | What was enumerated | Pinned at |
|---|---|---|
| pi 0.99.1 (`@earendil-works/pi-coding-agent`) | Built-in slash commands, interactive dispatch, keybindings, CLI flags and subcommands, settings schema, settings menu, built-in extensions, RPC command handlers | `pi@d86654a` |
| pi 0.85.1 | Only the differences that matter to the desktop's in-process session list | `pi@d981de1` |
| Gentle Desktop | Every capability row's desktop status, by reading `src/` and by keyword searches (list below) | `gentle-shell-desktop@5ab4a00` (`src/` is identical on `docs/corpus`, checked with `git diff --quiet main HEAD -- src`) |
| `04-rpc-contract.md` | The "Exposed over RPC" column and gap IDs G1–G10 | this corpus |

`Inference:` gentle-shell runs pi's interactive mode, so every pi core capability below is available in gentle-shell unless a gentle-shell extension overrides or hides it. Checking overrides belongs to the gentle-shell part (C5b).

### Citation keys

Rows use short keys to stay readable. Each key expands to a full `repo@sha:path` prefix.

| Key | Expands to |
|---|---|
| `IM:` | `pi@d86654a:packages/coding-agent/src/modes/interactive/interactive-mode.ts:` |
| `SC:` | `pi@d86654a:packages/coding-agent/src/core/slash-commands.ts:` |
| `KB:` | `pi@d86654a:packages/coding-agent/src/core/keybindings.ts:` |
| `TKB:` | `pi@d86654a:packages/tui/src/keybindings.ts:` |
| `ARGS:` | `pi@d86654a:packages/coding-agent/src/cli/args.ts:` |
| `SM:` | `pi@d86654a:packages/coding-agent/src/core/settings-manager.ts:` |
| `RPCT:` | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-types.ts:` |
| `RPCM:` | `pi@d86654a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:` |
| `PISRC:` | `pi@d86654a:packages/coding-agent/src/` (any other source file) |
| `PIDOC:` | `pi@d86654a:packages/coding-agent/docs/` |
| `D:` | `gentle-shell-desktop@5ab4a00:src/` |
| `04` | [`04-rpc-contract.md`](04-rpc-contract.md) of this corpus |

### Completeness evidence

| Category | Enumerated from | Count | Coverage |
|---|---|---|---|
| Built-in slash commands | `BUILTIN_SLASH_COMMANDS` array, `SC:19-44` | 24 | All 24 have a row. Cross-checked against the dispatch in `IM:3102-3241`. |
| Hidden slash commands | Dispatch branches in `IM:3217-3231` not in the array | 3 | `/debug` has a row (H2). `/arminsayshi` and `/dementedelves` are excluded: they only render a component (`IM:3222`, `:3227`) and are not capabilities. |
| Built-in extension commands | `builtInExtensions` (`PISRC:extensions/index.ts:7-13`) and `registerCommand` calls in `PISRC:extensions/` | 2 | `/llama` (M9) and `/mcp` (E8). The other two built-in extensions, `codemode` and `tool-search`, register tools, not commands. |
| App keybindings | `AppKeybindings` interface, `KB:15-57` | 43 | All 43 mapped in [Keybinding coverage](#keybinding-coverage). |
| TUI keybindings | `"tui.*": {` entries in `TKB:72-209` | 47 | Grouped by family in [Keybinding coverage](#keybinding-coverage). |
| CLI flags | Distinct `arg === "--…"` branches in `ARGS:82-235` | 40 | All 40 mapped in [CLI flag coverage](#cli-flag-coverage). Help text at `ARGS:289-332`. |
| CLI subcommands | `Commands:` help block, `ARGS:277-286` | 8 | All 8 mapped in [CLI flag coverage](#cli-flag-coverage). |
| Settings keys | `interface Settings`, `SM:131-187` | 55 | All 55 listed in [Settings coverage](#settings-coverage). Nested shapes at `SM:18-129`. |
| Settings menu items | `id:` entries in `PISRC:modes/interactive/components/settings-selector.ts` and the setters `showSettingsSelector` calls (`IM:4778-5022`) | 34 top-level items | Every setter maps to a key in [Settings coverage](#settings-coverage). |
| RPC commands | `04` §Commands (33 commands) | 33 | Each RPC command used by at least one row is cited by name. |

### Desktop searches

A desktop status of **missing** cites one of these searches. Each runs `rg -i <pattern> src -g '!*.test.*' -g '!__fixtures__'` at `gentle-shell-desktop@5ab4a00`.

| ID | Pattern | Result |
|---|---|---|
| Q1 | `set_model\|get_available_models\|cycle_model` | 0 hits |
| Q2 | `thinking_level\|thinkingLevel` | 0 hits |
| Q3 | `login\|logout\|auth` | Only first-run detection of `auth.json` (`D:main/domain/home/home.ts:86`); the other hits are the word "authoritative" in comments |
| Q4 | `compact` | Comments only (`D:main/domain/rpc/types.ts:17`, `:20`; `D:renderer/features/conversation/components/HelpersStrip.tsx:10`) |
| Q5 | `fork\|clone\|get_tree` | 2 unrelated hits (`D:renderer/shared/bridge/mockBridge.ts:176`, `:195`) |
| Q6 | `set_session_name\|rename\|sessionName\|session_info_changed` | 0 hits |
| Q7 | `export_html\|exportTo` | 0 hits |
| Q8 | `bash` | Comments and a theme token only (`D:main/domain/rpc/types.ts:17`, `:20`, `:62`) |
| Q9 | `steer\|follow_up\|followUp\|clear_queue` | 0 hits |
| Q10 | `image` | `D:main/domain/rpc/history.ts:13` skips image parts; `D:renderer/shared/markdown/renderMarkdown.ts:19` is a sanitizer comment |
| Q11 | `get_session_stats\|cost\|contextUsage` | 1 unrelated comment (`D:main/adapters/piSessionStore.ts:6`) |
| Q12 | `get_commands\|slash` | 0 hits |
| Q13 | `skill` | 0 hits |
| Q14 | `trust` | 1 unrelated comment (`D:renderer/shared/markdown/renderMarkdown.ts:6`) |
| Q15 | `scoped` | 0 hits |
| Q16 | `mcp` | 0 hits |
| Q17 | `clipboard\|copy\|writeText\|get_last_assistant_text` | Unrelated (`D:main/domain/rpc/chatReducer.ts:285-287`, first-run copy text) |
| Q18 | `retry` | `willRetry` decode (`D:main/domain/rpc/codec.ts:94`) and the first-run Retry button only |
| Q19 | `theme` | Hardcoded tokens only (`D:renderer/shared/theme/tokens.css:2-5`, `D:renderer/shared/theme/theme.ts:6`) |
| Q20 | `install\|uninstall\|package` | Comments only (`D:main/ports/index.ts:57-59`, `D:main/domain/rpc/types.ts:8-12`) |
| Q21 | `settings` | The `HomeSettings` port only (`D:main/ports/index.ts:85`) |
| Q22 | `abort_bash\|abort_retry\|set_auto` | 0 hits |
| Q23 | `navigate\|branch` | 1 unrelated comment (`D:main/domain/rpc/chatReducer.ts:13`) |
| Q24 | `keybind\|shortcut\|hotkey` | 1 comment about the Escape abort shortcut (`D:renderer/features/conversation/components/Composer.tsx:20`) |
| Q25 | `search\|delete\|mermaid` | No search box, no delete action, no Mermaid renderer; hits are a URL query parser, listener cleanup and theme JSON keys |

### How to keep this current

1. Re-run the enumerations in [Completeness evidence](#completeness-evidence) at the new pi SHA and diff the counts.
2. Re-run Q1–Q25 at the new desktop SHA; a hit that is not a comment changes a row's status.
3. Update the [At a glance](#at-a-glance-pi-core) tallies.

## Columns

| Column | Meaning |
|---|---|
| Capability | What the user can do. Bold ID for cross-reference. |
| In the CLI | Command, key, flag or setting in pi's TUI, with citation. Keys are pi defaults; "Win/WSL" marks the alternative default pi uses on Windows and WSL (`KB:62-67`). |
| Exposed over RPC | **yes** / **partial** / **no**, with the RPC command or gap ID. **host-side**: the desktop can implement it from data it already has. **spawn**: only as a launch flag or environment variable. |
| Desktop status | **done** / **partial** / **missing**, citing `D:` or a search ID. **n/a**: terminal mechanics with no GUI meaning. |
| Desktop surface | Short, neutral idea of the GUI surface. Always `Inference:`; the mockup is intent, not spec. |
| Upstream dependency | Change needed upstream, or "none". |
| Priority | `TBD`: prioritization is a later team decision. |

## pi core (v0.99.1)

### Sessions

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **S1** Start a new session | `/new` (`IM:3201`); `app.session.new`, unbound by default (`KB:146`) | yes: `new_session` (`RPCT:27`) | partial: "New chat" spawns a new process without `--session` (`D:main/domain/session/ChatHost.ts:110-113`) instead of `new_session`; no `cwd` is passed to the session (`D:main/domain/session/ChatHost.ts:159-166`) | Inference: "New chat" with a folder picker | none | TBD |
| **S2** Continue the latest session in this folder | `--continue`, `-c` (`ARGS:110`, `:296`) | spawn only | missing: the desktop argv has no `--continue` (`D:main/domain/session/PiSession.ts:127-133`) | Inference: "Continue last chat" per project | none | TBD |
| **S3** Resume a saved session | `/resume` opens the picker (`IM:3232`, handler `IM:5588`); `--resume`, `-r` (`ARGS:112`, `:297`); `--session <path\|id>` (`ARGS:133`, `:298`); `app.session.resume`, unbound (`KB:149`) | partial: `switch_session` needs a path (`RPCT:61`); no command lists sessions | done: sidebar list from in-process `SessionManager.listAll()` (`D:main/adapters/piSessionStore.ts:29-35`); reopen via `--session <path>` at spawn (`D:main/domain/session/ChatHost.ts:100-108`). Caveat: under RPC, a stored session cwd that no longer exists makes pi exit with code 1 (`PISRC:main.ts:688-699`) | Inference: sidebar chat list (exists) | Inference: a list command would remove the in-process pi import | TBD |
| **S4** Search, filter and sort sessions | Picker search and keys: named filter `ctrl+n` (`KB:122`), sort `ctrl+s` (`KB:170`), path display `ctrl+p` (`KB:166`); `PIDOC:sessions.md:18` | host-side (over the desktop's own list) | missing: Q25 | Inference: search box and "named only" toggle in the sidebar | none | TBD |
| **S5** Name or rename a session | `/name [name]` (`IM:3150`, handler `IM:6452`); `--name`, `-n` (`ARGS:125`, `:303`); picker rename `ctrl+r` (`KB:174`) | partial: `set_session_name` renames the loaded session only (`RPCT:68`); `session_info_changed` event | missing: Q6. The sidebar shows the name when one exists (`D:main/domain/session/sessionList.ts:40-41`) | Inference: inline rename in the sidebar and header | Inference: renaming a session that is not loaded needs a new command or direct file access | TBD |
| **S6** Delete a session | Picker delete `ctrl+d` (`KB:178`); `ctrl+backspace` when the query is empty (`KB:182`) | no: no delete command in `RPCT:20-74` | missing: Q25 | Inference: "Delete chat" in the sidebar menu | pi: delete command, or desktop file removal (Inference) | TBD |
| **S7** Session info and stats | `/session` shows file, ID, message count, tokens and cost (`IM:3155`, handler `IM:6477`; `PIDOC:sessions.md:16`) | yes: `get_state` (`RPCT:30`), `get_session_stats` (`RPCT:59`) | missing: Q11; `get_state` is typed (`D:main/domain/rpc/types.ts:32`) but never sent | Inference: chat details panel | none (see G7) | TBD |
| **S8** Navigate the session tree | `/tree` (`IM:3180`, handler `IM:5439`); double Escape on an empty editor when `doubleEscapeAction` is `tree`, the default (`IM:2976-2990`, `SM:167`); `app.session.tree`, unbound (`KB:147`); tree keys and filters (`KB:150-157`, `:210-237`); `treeFilterMode` (`SM:168`) | partial: read with `get_tree` (`RPCT:66`) and `get_entries` (`RPCT:65`); no command moves the active leaf within the same file (checked `RPCT:20-74`) | missing: Q5, Q23 | Inference: branch view of the conversation | pi: tree navigation command | TBD |
| **S9** Label tree entries | `app.tree.editLabel` `shift+l` (`KB:158`); `app.tree.toggleLabelTimestamp` `shift+t` (`KB:162`) | no: no label command in `RPCT:20-74` | missing: Q23 | Inference: bookmark a message | pi: label command | TBD |
| **S10** Summarize a branch when leaving it | Offered during tree navigation (`PIDOC:sessions.md:32`); `branchSummary.reserveTokens`, `branchSummary.skipPrompt` (`SM:35-38`) | no: depends on S8; only `summarization_retry_*` events surface (`04` §Events) | missing: Q23 | Inference: "Summarize the branch you leave?" prompt | pi (with S8) | TBD |
| **S11** Fork from an earlier user message | `/fork` (`IM:3170`, handler `IM:5380`); double Escape when `doubleEscapeAction` is `fork`; `app.session.fork`, unbound (`KB:148`); `--fork <path\|id>` (`ARGS:137`, `:300`) | yes: `get_fork_messages` (`RPCT:64`), `fork` (`RPCT:62`). Side effect: cancels all helpers (`04` G1) | missing: Q5 | Inference: "Branch from here" on a user message | none | TBD |
| **S12** Clone the session | `/clone` (`IM:3175`, handler `IM:5418`) | yes: `clone` (`RPCT:63`). Same side effect as S11 | missing: Q5 | Inference: "Duplicate chat" | none | TBD |
| **S13** Export a session | `/export [path]`, HTML by default or `.jsonl` (`IM:3124`, `IM:6304-6315`); `--export <file>` (`ARGS:174`, `:323`) | partial: `export_html` only (`RPCT:60`, `RPCM:598-601`); no JSONL export command | missing: Q7 | Inference: "Export…" with format choice | pi for JSONL; Inference: the desktop knows the session path and could copy the file itself | TBD |
| **S14** Import a session from JSONL | `/import <path>` calls `runtimeHost.importFromJsonl` (`IM:3129`, `IM:6351-6371`) | no: no import command. Inference: `switch_session` to the file may cover part of it, unverified | missing: Q6, Q7 | Inference: "Open session file…" | pi | TBD |
| **S15** Share a session | `/share` uploads to Radius or a secret GitHub gist (`IM:3134`, handler `IM:6395`; `PIDOC:usage.md:82`); viewer base URL `PI_SHARE_VIEWER_URL` (`ARGS:447`) | no | missing: Q7 | Inference: "Share link…" with a privacy warning | pi | TBD |
| **S16** Ephemeral session | `--no-session` (`ARGS:131`, `:302`) | spawn only | missing: argv has no such flag (`D:main/domain/session/PiSession.ts:127-133`) | Inference: "Private chat (not saved)" | none | TBD |
| **S17** Session storage location | `--session-dir` (`ARGS:139`, `:301`); `sessionDir` (`SM:177`); `PI_CODING_AGENT_SESSION_DIR` (`ARGS:443`) | spawn only | partial: the list calls `SessionManager.listAll()` with no directory (`D:main/adapters/piSessionStore.ts:35`), and `listAll()` without a directory reads `<agent-dir>/sessions` (`PISRC:core/session-manager.ts:1949`, `PISRC:config.ts:600-601`). Inference: sessions kept in a custom directory do not appear in the sidebar | Inference: none needed beyond honoring the setting | none | TBD |
| **S18** Open or create a session by exact ID | `--session-id <id>` (`ARGS:135`, `:299`) | spawn only | missing: argv has no such flag (`D:main/domain/session/PiSession.ts:127-133`) | Inference: none needed; deep links at most | none | TBD |
| **S19** Copy the last assistant message | `/copy` (`IM:3145`, handler `IM:6421`); `app.message.copy` `ctrl+x` copies the selection or the last message (`KB:130`) | yes: `get_last_assistant_text` (`RPCT:67`); host-side clipboard | missing: Q17 | Inference: copy button on each message | none | TBD |

### Conversation and input

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **C1** Send a prompt | `enter` (`TKB:144`); submit handler `IM:3096-3295` | yes: `prompt` (`RPCT:22`) | done: `D:main/domain/session/PiSession.ts:184`, `D:renderer/features/conversation/components/Composer.tsx:34` | Composer (exists) | none | TBD |
| **C2** Write a multi-line prompt | `shift+enter`, `ctrl+j` (`TKB:143`) | host-side | done: Shift+Enter inserts a newline (`D:renderer/features/conversation/components/Composer.tsx:16-17`) | Composer (exists) | none | TBD |
| **C3** Stop the current run | `escape` (`KB:93`); while streaming it aborts and puts queued messages back in the editor (`IM:2967-2969`) | yes: `abort` (`RPCT:25`) | done: Escape sends `abort` (`D:renderer/features/conversation/components/Composer.tsx:30`, `D:main/domain/session/PiSession.ts:189`) | Stop button and Escape (exists) | none | TBD |
| **C4** Steer a running task | `enter` while streaming sends `prompt` with `streamingBehavior: "steer"` (`IM:3273-3280`); input during compaction is queued (`IM:3261-3271`) | yes: `steer` (`RPCT:23`) or `prompt` + `streamingBehavior` (`RPCT:22`) | missing: a prompt sent while working is rejected with "Gentle is still working" (`D:main/domain/session/PiSession.ts:169-180`); Q9 | Inference: composer stays usable while working; message shows as "queued" | none | TBD |
| **C5** Queue a follow-up | `app.message.followUp` `alt+enter`, Win/WSL `ctrl+q` (`KB:134`; handler `IM:4344`) | yes: `follow_up` (`RPCT:24`) | missing: Q9 | Inference: "Send after this finishes" | none | TBD |
| **C6** Edit queued messages | `app.message.dequeue` `alt+up`, Win/WSL `alt+q` (`KB:138`; handler `IM:4376`) | yes: `clear_queue` returns the removed messages (`RPCT:26`); `queue_update` event (`04` §Events) | missing: Q9 | Inference: queued-message chips with edit and remove | none | TBD |
| **C7** Choose queue delivery mode | `steeringMode`, `followUpMode`: `"all"` or `"one-at-a-time"` (`SM:138-139`); `/settings` items `steering-mode`, `follow-up-mode` | yes: `set_steering_mode`, `set_follow_up_mode` (`RPCT:43-44`), read via `get_state`; the setter writes the setting (`PISRC:core/agent-session.ts:2617`) | missing: Q9 | Inference: settings toggle | none | TBD |
| **C8** Run a shell command | `!cmd` adds output to context, `!!cmd` keeps it out (`IM:3243-3259`); Escape aborts it (`IM:2970-2971`); `shellPath`, `shellCommandPrefix` (`SM:147`, `:150`) | yes: `bash` with `excludeFromContext` (`RPCT:55`), `abort_bash` (`RPCT:56`), `bash_execution_update` | missing: Q8 | Inference: "Run command" mode in the composer | none | TBD |
| **C9** Attach images | Paste with `app.clipboard.pasteImage` `ctrl+v`, Win/WSL `alt+v` (`KB:142`; `PISRC:modes/interactive/components/custom-editor.ts:95`); drag into a compatible terminal (`PIDOC:usage.md:19`); `images.autoResize`, `images.blockImages` (`SM:67-70`) | yes: `images` on `prompt`, `steer`, `follow_up` (`RPCT:22-24`) | missing: text-only composer; history skips image parts (`D:main/domain/rpc/history.ts:13`); Q10 | Inference: paste or drop images into the composer | none | TBD |
| **C10** Reference files with `@` | `@` searches files, `tab` completes paths (`PIDOC:usage.md:17-18`; autocomplete provider `IM:782`); `autocompleteMaxVisible` (`SM:172`); `@file` CLI arguments (`ARGS:235-236`) | host-side: no file-search command; Inference: the desktop has filesystem access | missing: no autocomplete in `D:renderer/features/conversation/components/Composer.tsx` | Inference: `@` file picker in the composer | none | TBD |
| **C11** Run extension commands, templates and skills | `/<name>` typed in the editor | yes: `prompt` runs extension commands and expands templates and skills (`PIDOC:rpc-commands.md:31-33`) | partial: any text, including `/…`, is sent as `prompt` (`D:main/domain/session/PiSession.ts:184`); no discovery (C12) | Inference: works today when typed | none | TBD |
| **C12** Discover commands with `/` | Typing `/` opens a menu of built-ins plus resource commands (`PIDOC:usage.md:46`; built-ins added at `IM:675-691`) | partial: `get_commands` lists extension commands, prompt templates and skills only (`RPCM:680-710`). Built-ins exist only in interactive mode: `BUILTIN_SLASH_COMMANDS` is used only by `IM:112`, `:675`, `:691`. Inference: a built-in such as `/model` sent via `prompt` reaches the model as plain text | missing: Q12 | Inference: command palette | pi, if built-ins must be reachable over RPC | TBD |
| **C13** Open an external editor | `app.editor.external` `ctrl+g` (`KB:126`; handler `IM:4465`); `externalEditor` (`SM:146`) | host-side | missing: Q24 | Inference: low value in a GUI composer | none | TBD |
| **C14** Edit text in the prompt | 23 `tui.editor.*` actions: cursor moves, word jumps, kill and yank, undo, prompt history (`TKB:72-142`; undo default overridden at `KB:77-80`) | host-side | partial: native textarea editing only; no prompt history (`D:renderer/features/conversation/components/Composer.tsx`) | Inference: prompt history with Up/Down | none | TBD |
| **C15** Clear the editor or exit | `app.clear` `ctrl+c` (`KB:94`; `IM:4145`); twice exits; `app.exit` `ctrl+d` on an empty editor (`KB:95`; `IM:4155`); `/quit` (`IM:3237`) | yes: closing stdin shuts pi down (`04` §Startup and shutdown) | done: app quit stops the session (`D:main/domain/session/ChatHost.ts:137-140`) | Window close (exists) | none | TBD |
| **C16** Suspend to background | `app.suspend` `ctrl+z`, none on Windows (`KB:96-99`; `IM:4307`) | n/a | n/a: terminal job control | — | none | TBD |
| **C17** See tool calls and results | Shown inline; `app.tools.expand` `ctrl+o` toggles output (`KB:117`; `IM:4426`) | yes: `tool_execution_*`, `toolcall_*` deltas (`04` §Events) | missing: tool events only bump an activity counter (`D:main/domain/rpc/chatReducer.ts:65-67`); tool parts are not rendered (`D:main/domain/rpc/history.ts:15-17`) | Inference: collapsible tool cards | none | TBD |
| **C18** See thinking | `app.thinking.toggle` `ctrl+t` (`KB:118`; `IM:4458`); `hideThinkingBlock` (`SM:144`) | yes: `thinking_*` deltas (`04` §`message_update` delta types) | missing: thinking is not rendered (`D:main/domain/rpc/history.ts:15-17`) | Inference: collapsible "thinking" block | none | TBD |
| **C19** Answer extension dialogs | `select`, `confirm`, `input`, `editor` dialogs from extensions | yes: `extension_ui_request` / `extension_ui_response` (`04` §Extension UI requests) | done: dialog cards for all four kinds (`D:renderer/features/conversation/components/DialogCard.tsx:39-45`) | Question cards (exist) | none | TBD |
| **C20** See extension notices, status and widgets | `notify`, `setStatus`, `setWidget`, `setTitle` | yes, as fire-and-forget requests (`04` §Extension UI requests) | partial: only the `gentle-agents` widget is parsed; `notify` and the rest are ignored (`D:main/domain/rpc/chatReducer.ts:180-184`) | Inference: toasts for notices, status chips | none | TBD |
| **C21** Read rendered Markdown and diagrams | Markdown rendering; `markdown.codeBlockIndent`, `markdown.mermaid` (`SM:85-88`) | yes: message text | partial: Markdown is rendered (`D:renderer/shared/markdown/renderMarkdown.ts:65`); no Mermaid (Q25) | Inference: Mermaid rendering in messages | none | TBD |

### Context, compaction and retry

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **K1** Compact manually | `/compact [instructions]` (`IM:3206`, handler `IM:6875`) | yes: `compact` with `customInstructions` (`RPCT:47`) | missing: Q4 | Inference: "Compact now" action with optional instructions | none | TBD |
| **K2** Auto-compaction | `compaction.enabled`, `reserveTokens`, `keepRecentTokens`, `modelOverrides` (`SM:28-33`); `/settings` item `autocompact` | partial: `set_auto_compaction` toggles `enabled` only (`RPCT:48`); `compaction_start` / `compaction_end` events | missing: compaction events are not decoded (`D:main/domain/rpc/types.ts:17`); Q4 | Inference: "Compacting…" state in the chat | pi, for thresholds over RPC | TBD |
| **K3** See context usage | Footer context percent (`PISRC:modes/interactive/components/footer.ts:159-162`) | yes, pull only: `get_session_stats.contextUsage` (`04` G7) | missing: Q11 | Inference: ctx % in the status bar | none (G7) | TBD |
| **K4** See tokens and cost | Footer usage and cost (`PISRC:modes/interactive/components/footer.ts:159`); `/session` (S7) | yes, pull only: `get_session_stats` (`RPCT:59`) | missing: Q11 | Inference: cost in the status bar | none (G7) | TBD |
| **K5** Auto-retry transient errors | `retry.enabled`, `maxRetries`, `baseDelayMs`, `maxAgentDelayMs`, `provider.*` (`SM:40-52`); Escape aborts a pending retry (`IM:3633`) | yes: `set_auto_retry` (`RPCT:51`), `abort_retry` (`RPCT:52`), `auto_retry_*` events | missing: Q18, Q22. The desktop clears `working` on `agent_end` even when a retry follows (`04` compatibility observation 3) | Inference: "Retrying in 4 s… Cancel" banner | none | TBD |
| **K6** Context files and system prompt | `AGENTS.md`, `CLAUDE.md`, `AGENTS.override.md`, `SYSTEM.md`, `APPEND_SYSTEM.md` (`PIDOC:configuration.md:18-20`, `:32-33`, `:41-47`); `--system-prompt`, `--append-system-prompt`, `--no-context-files` (`ARGS:120-124`, `:204`) | no: no command lists loaded context files (checked `RPCT:20-74`); flags are spawn only | missing: argv has no such flags (`D:main/domain/session/PiSession.ts:127-133`) | Inference: "Loaded instructions" list per chat | pi, to list loaded context | TBD |

### Models, thinking and providers

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **M1** Select a model | `/model [provider/model]` (`IM:3112`, handler `IM:5072`); `app.model.select` `ctrl+l` (`KB:116`); `--model`, `--provider` (`ARGS:114-117`, `:289-290`) | yes: `get_available_models` (`RPCT:35`), `set_model` (`RPCT:33`) | missing: Q1 | Inference: model picker in the status bar | none | TBD |
| **M2** Set the default model | Model selector "set as default" path calls `setModel(model, { persist })` (`IM:5223-5230`); `defaultProvider`, `defaultModel` (`SM:133-134`) | no: G4 | missing: Q1 | Inference: "Default model for new chats" in Providers | pi (G4) | TBD |
| **M3** Cycle models | `app.model.cycleForward` `ctrl+p`, `app.model.cycleBackward` `shift+ctrl+p`, Win/WSL `alt+p` (`KB:108-115`; `IM:4407`) | partial: `cycle_model` has no direction field (`RPCT:34`) | missing: Q1 | Inference: keyboard shortcut in the app | none | TBD |
| **M4** Choose models for cycling | `/scoped-models` (`IM:3107`); `--models <patterns>` (`ARGS:141`, `:304`); `enabledModels` (`SM:165`); selector keys `app.models.*` (`KB:186-209`) | no: no command sets the scope; `cycle_model` only reports `isScoped` (`04` §Commands) | missing: Q15 | Inference: favorites in the model picker | pi | TBD |
| **M5** Set thinking level | `/thinking [level]` (`IM:3118`, handler `IM:5023`); `app.thinking.cycle` `shift+tab` (`KB:100-103`; `IM:4396`); `--thinking` with `off, minimal, low, medium, high, xhigh, max` (`ARGS:157`, `:312`); `:<thinking>` suffix on `--model` (`ARGS:290`) | yes: `set_thinking_level`, `cycle_thinking_level`, `get_available_thinking_levels` (`RPCT:38-40`); `thinking_level_changed` event | missing: Q2 | Inference: "effort" control in the status bar | none | TBD |
| **M6** Set default thinking level | Thinking selector `app.thinking.save` `ctrl+s` (`KB:104-107`; `PISRC:modes/interactive/components/thinking-selector.ts:131`) persists `defaultThinkingLevel` (`PISRC:core/agent-session.ts:2537-2538`); per-model `modelThinkingLevels` (`SM:136`), `/settings` item `model-thinking` | no: RPC `set_thinking_level` does not pass `persist` (`RPCM:498`) | missing: Q2 | Inference: default effort in settings | pi (same shape as G4) | TBD |
| **M7** Sign in to a provider | `/login [provider]`, OAuth or API key (`IM:3190`, handler `IM:5724-5771`; `PIDOC:providers.md:12`) | no: G3 | missing: first-run only checks that `auth.json` exists (`D:main/domain/home/home.ts:86`); Q3 | Inference: Providers screen with sign-in buttons | pi (G3) | TBD |
| **M8** Sign out of a provider | `/logout` (`IM:3196`, handler `IM:5858`) | no: G3 | missing: Q3 | Inference: "Sign out" per provider | pi (G3) | TBD |
| **M9** Custom providers and local models | `<agent-dir>/models.json` (`PIDOC:configuration.md:16`); `/llama` manages llama.cpp router models (`PISRC:extensions/llama/index.ts:183`) | partial: `/llama` only warns outside the TUI (`PISRC:extensions/llama/index.ts:185-188`); `models.json` is file only | missing: first-run only checks that `models.json` exists (`D:main/domain/home/home.ts:87`) | Inference: "Local models" section in Providers | pi | TBD |
| **M10** Use API keys from the environment | Provider env vars and key commands (`PIDOC:providers.md:22-85`); `--api-key` (`ARGS:118`, `:291`) | spawn only | partial: the child inherits the desktop's environment (`04` §Process chain, step 3); no UI | Inference: API key fields in Providers | none | TBD |
| **M11** List models from the shell | `--list-models [search]` (`ARGS:206`, `:324`) | yes: `get_available_models` (`RPCT:35`) | missing: Q1 | Inference: covered by M1 | none | TBD |
| **M12** Inspect credentials from the shell | `pi auth check`, `print-api-key`, `print-bearer-token` (`ARGS:284`; `PISRC:cli/auth-command.ts:52-56`) | no | missing: Q3 | Inference: "Check connection" per provider | pi (G3) | TBD |
| **M13** Tune network behavior | `transport`, `httpProxy`, `httpIdleTimeoutMs`, `websocketConnectTimeoutMs`, `cacheWarming` (`SM:137`, `:178-181`); `/settings` items `transport`, `http-idle-timeout`, `cache-warming-mode` | no | missing: Q21 | Inference: advanced settings | pi | TBD |

### Extensions, packages, skills, prompts, themes and MCP

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **E1** Install, update, remove and list packages | `pi install`, `remove`, `uninstall`, `update`, `list` (`ARGS:278-282`; `PISRC:package-manager-cli.ts:267-273`); `-l` writes project scope (`PIDOC:packages.md:19`); `packages` (`SM:157`) | no: G5 | missing: Q20 | Inference: Extensions screen (mockup) | pi (G5) | TBD |
| **E2** Enable or disable package resources | `pi config [-l]` TUI, Tab switches scope (`ARGS:283`; `PISRC:package-manager-cli.ts:796`); per-package filters (`SM:120-129`); built-in extensions can be disabled there (`PIDOC:mcp.md:184`) | no: G5 | missing: Q20 | Inference: per-resource toggles with scope | pi (G5) | TBD |
| **E3** Load extensions for one run | `--extension`, `-e` (`ARGS:176`, `:313`); `--no-extensions`, `-ne` (`ARGS:179`, `:314`); local `extensions` paths (`SM:158`) | spawn only | missing: argv has no such flags (`D:main/domain/session/PiSession.ts:127-133`) | Inference: developer option | none | TBD |
| **E4** Use skills | `/skill:name` when `enableSkillCommands` is on (`SM:162`; `PIDOC:slash-commands.md:58`); `--skill`, `--no-skills` (`ARGS:181`, `:198`); `skills` paths (`SM:159`) | partial: invoked through `prompt`, listed by `get_commands` | missing: Q13 | Inference: skills list in Extensions and the command palette | none | TBD |
| **E5** Use prompt templates | `/<template>` (`PIDOC:slash-commands.md:57`); `--prompt-template`, `--no-prompt-templates` (`ARGS:184`, `:200`); `prompts` paths (`SM:160`) | partial: invoked through `prompt`, listed by `get_commands` | missing: Q12, Q25 | Inference: templates in the command palette | none | TBD |
| **E6** Choose a theme | `/settings` Theme: one theme, or a light/dark pair (`PISRC:modes/interactive/components/settings-selector.ts:330-390`); `theme` (`SM:140`); built-ins `system` (default), `dark`, `light` (`PIDOC:themes.md:7`); `--theme`, `--use-theme`, `--no-themes` (`ARGS:187-203`) | no: under RPC `setTheme()` returns `{success:false}` and `getAllThemes()` returns `[]` (`04` §What RPC mode drops) | missing: tokens are hardcoded (`D:renderer/shared/theme/tokens.css:2-5`); Q19 | Inference: theme picker in Extensions | pi: theme data over RPC | TBD |
| **E7** Reload resources | `/reload` reloads keybindings, extensions, skills, prompts, themes and context files (`IM:3212`, handler `IM:6214`; `SC:42`) | no: no reload command in `RPCT:20-74` | missing: Q21 | Inference: "Reload" after installing an extension | pi | TBD |
| **E8** Manage MCP servers | `/mcp` built-in extension command (`PISRC:extensions/mcp/index.ts:901`); `pi mcp add`, `remove`, `list`, `login`, `logout` (`ARGS:285`; `PIDOC:mcp.md:85`); `mcp.json` (`PIDOC:configuration.md:15`) | partial: `/mcp` via `prompt`; outside the TUI it reports status with `notify` instead of the manager (`PISRC:extensions/mcp/index.ts:928-929`) | missing: Q16; `notify` is ignored (C20). In homes provisioned by gentle-shell, the built-in `/mcp` may be replaced (see [pi core rows that gentle-shell changes](#pi-core-rows-that-gentle-shell-changes)) | Inference: MCP section in Extensions | pi, for structured MCP state | TBD |
| **E9** Choose available tools | `--tools`, `-t`; `--exclude-tools`, `-xt`; `--no-tools`, `-nt`; `--no-builtin-tools`, `-nbt` (`ARGS:143-156`, `:306-311`); `defaultTools` (`SM:166`); built-in tool names (`ARGS:449-457`) | spawn only: no command changes tools (checked `RPCT:20-74`) | missing: argv has no such flags (`D:main/domain/session/PiSession.ts:127-133`) | Inference: per-chat tool toggles | pi | TBD |

### Project trust

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **T1** Decide whether to trust a project | Prompt at startup; `/trust` saves a decision (`IM:3185`, handler `IM:5196`); `--approve`, `-a` and `--no-approve`, `-na` (`ARGS:229-232`, `:327-328`); `defaultProjectTrust` `ask`/`always`/`never`, global only (`SM:149`, `:110`) | no. Under RPC there is no UI (`hasUI` is true only for interactive mode, `PISRC:main.ts:764`), so an undecided project resolves to **untrusted** unless `--approve`/`--no-approve` overrides it, the project has no trust-requiring resources (then it is trusted outright, `PISRC:core/project-trust.ts:47-52`; check in `PISRC:core/trust-manager.ts:186`), an extension answers `project_trust`, a decision is stored, or the default is `always` (`PISRC:core/project-trust.ts:54-88`). Project packages load only after trust is resolved (`PIDOC:packages.md:19-21`) | missing: Q14 | Inference: trust prompt when opening a new folder | pi (trust command or dialog). gentle-shell does not handle `project_trust` (Y5) | TBD |

### Display and terminal

These are mostly terminal mechanics. They matter to the desktop only as design input.

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **U1** Regular or fullscreen TUI | `--tui-mode` (`ARGS:213`, `:326`); `tuiMode`, `fullscreenExitOutput`, `fullscreenScrollbar`, `fullscreenCopyOnSelect`, `fullscreenWheelScrollLines` (`SM:182-186`) | n/a | n/a | — | none | TBD |
| **U2** Search the transcript and jump between prompts | `tui.altScreen.*`: search, next/previous match, previous/next prompt, paging (`TKB:160-209`; overrides `KB:81-92`) | host-side | missing: Q25 | Inference: find-in-chat | none | TBD |
| **U3** Terminal rendering options | `terminal.*` (`SM:57-65`); `editorPaddingX`, `outputPad`, `showHardwareCursor` (`SM:170-173`) | n/a | n/a | — | none | TBD |
| **U4** Startup header and changelog | `quietStartup` (`SM:148`); `--verbose` (`ARGS:227`, `:325`); `/changelog` (`IM:3160`, handler `IM:6558`); `collapseChangelog` (`SM:152`) | no | missing: Q21 | Inference: "What's new" after an update | pi | TBD |
| **U5** Shortcut help | `/hotkeys` (`IM:3165`, handler `IM:6593`) | host-side | partial: fixed composer hints (`D:renderer/features/conversation/components/Composer.tsx:61`) | Inference: shortcut sheet | none | TBD |
| **U6** Custom keybindings | `<agent-dir>/keybindings.json` (`KB:380`) | n/a | n/a: the desktop has its own shortcuts (Q24) | — | none | TBD |
| **U7** First-time setup | Asks for theme and analytics consent (`PISRC:modes/interactive/components/first-time-setup.ts`; run at `PISRC:main.ts:668-669`) | n/a: interactive mode only | partial: the desktop first run asks a different question, the home choice (`D:renderer/features/first-run/components/FirstRun.tsx`) | Inference: add theme and analytics steps | none | TBD |
| **U8** Telemetry, analytics and offline mode | `enableInstallTelemetry`, `enableAnalytics` (`SM:153-154`); `PI_TELEMETRY`, `PI_OFFLINE` (`ARGS:445-446`); `--offline` (`ARGS:233`, `:329`) | spawn only | missing: Q21 | Inference: privacy settings | none | TBD |

### Help and diagnostics

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **H1** Report a bug to the pi developers | `/bug [description]` (`IM:3139`, handler `IM:6406`; `PIDOC:sessions.md:62-66`) | no | missing: no bug-report action in `D:` | Inference: "Report a problem" (scope to decide: pi vs gentle-shell vs desktop) | pi | TBD |
| **H2** Dump debug state | `/debug` writes rendered lines and messages to `pi-debug.log` (`IM:3217`, handler `IM:6725`; `PIDOC:usage.md:92`). Hidden: not in `BUILTIN_SLASH_COMMANDS` | no | missing: child stderr is logged only (`04` §Framing) | Inference: "Copy diagnostics" | pi | TBD |
| **H3** Update pi, extensions or model catalogs | `pi update [source\|self\|pi]` (`ARGS:281`) | no | missing: Q20 | Inference: update notice | pi | TBD |
| **H4** Show the version | `--version`, `-v` (`ARGS:93`) | no: G10 | missing: no version check (`04` §Versioning) | Inference: About box | pi (G10) | TBD |

### Keybinding coverage

All 43 app keybindings from `KB:15-57`, with their row.

| Keybinding IDs | Row |
|---|---|
| `app.interrupt` | C3 |
| `app.clear`, `app.exit` | C15 |
| `app.suspend` | C16 |
| `app.thinking.cycle` | M5 |
| `app.thinking.save` | M6 |
| `app.model.cycleForward`, `app.model.cycleBackward` | M3 |
| `app.model.select` | M1 |
| `app.tools.expand` | C17 |
| `app.thinking.toggle` | C18 |
| `app.editor.external` | C13 |
| `app.message.copy` | S19 |
| `app.message.followUp` | C5 |
| `app.message.dequeue` | C6 |
| `app.clipboard.pasteImage` | C9 |
| `app.session.new` | S1 |
| `app.session.tree` | S8 |
| `app.session.fork` | S11 |
| `app.session.resume` | S3 |
| `app.session.toggleNamedFilter`, `app.session.togglePath`, `app.session.toggleSort` | S4 |
| `app.session.rename` | S5 |
| `app.session.delete`, `app.session.deleteNoninvasive` | S6 |
| `app.tree.foldOrUp`, `app.tree.unfoldOrDown`, `app.tree.filter.default`, `app.tree.filter.noTools`, `app.tree.filter.userOnly`, `app.tree.filter.labeledOnly`, `app.tree.filter.all`, `app.tree.filter.cycleForward`, `app.tree.filter.cycleBackward` | S8 |
| `app.tree.editLabel`, `app.tree.toggleLabelTimestamp` | S9 |
| `app.models.save`, `app.models.enableAll`, `app.models.clearAll`, `app.models.toggleProvider`, `app.models.reorderUp`, `app.models.reorderDown` | M4 |

The 47 TUI keybindings from `TKB:72-209`, by family:

| Family | IDs | Row |
|---|---|---|
| `tui.editor.*` | 23: `cursorUp`, `cursorDown`, `historyPrevious`, `historyNext`, `cursorLeft`, `cursorRight`, `cursorWordLeft`, `cursorWordRight`, `cursorLineStart`, `cursorLineEnd`, `jumpForward`, `jumpBackward`, `pageUp`, `pageDown`, `deleteCharBackward`, `deleteCharForward`, `deleteWordBackward`, `deleteWordForward`, `deleteToLineStart`, `deleteToLineEnd`, `yank`, `yankPop`, `undo` | C14 |
| `tui.input.*` | 4: `newLine` (C2), `submit` (C1), `tab` (C10), `copy` (S19) | as listed |
| `tui.select.*` | 6: `up`, `down`, `pageUp`, `pageDown`, `confirm`, `cancel` | Selector navigation inside S3, S8, M1, M4 and C19 |
| `tui.altScreen.*` | 14: `pageUp`, `pageDown`, `halfPageUp`, `halfPageDown`, `lineUp`, `lineDown`, `previousPrompt`, `nextPrompt`, `search`, `searchNext`, `searchPrevious`, `searchClose`, `top`, `bottom` | U2 |

`app.*` IDs are identical in pi 0.85.1 (checked with `diff`).

### CLI flag coverage

All 40 flags parsed in `ARGS:82-235`. The desktop passes only `--mode rpc` and `--session <path>` to pi, through the launcher (`D:main/domain/session/PiSession.ts:127-133`).

| Flags | Row |
|---|---|
| `--help`, `-h`; `--version`, `-v` | H4 (version); help has no GUI counterpart |
| `--mode`; `--print`, `-p` | Not interactive. `--mode rpc` is how the desktop runs pi (`04`). |
| `--continue`, `-c` | S2 |
| `--resume`, `-r`; `--session` | S3 |
| `--session-id` | S18 |
| `--fork` | S11 |
| `--session-dir` | S17 |
| `--no-session` | S16 |
| `--name`, `-n` | S5 |
| `--export` | S13 |
| `--provider`; `--model` | M1 |
| `--api-key` | M10 |
| `--models` | M4 |
| `--thinking` | M5 |
| `--list-models` | M11 |
| `--system-prompt`; `--append-system-prompt`; `--no-context-files`, `-nc` | K6 |
| `--tools`, `-t`; `--exclude-tools`, `-xt`; `--no-tools`, `-nt`; `--no-builtin-tools`, `-nbt` | E9 |
| `--extension`, `-e`; `--no-extensions`, `-ne` | E3 |
| `--skill`; `--no-skills`, `-ns` | E4 |
| `--prompt-template`; `--no-prompt-templates`, `-np` | E5 |
| `--theme`; `--use-theme`; `--no-themes` | E6 |
| `--approve`, `-a`; `--no-approve`, `-na` | T1 |
| `--tui-mode` | U1 |
| `--verbose` | U4 |
| `--offline` | U8 |

Also parsed: `--` ends option parsing (`ARGS:82`); `@file` arguments attach files (`ARGS:235-236`, C10); unknown `--flags` are kept for extensions (`ARGS:237-250`).

The 8 subcommands in `ARGS:277-286`: `install`, `remove`, `uninstall`, `update`, `list` (E1; `update` also H3), `config` (E2), `auth` (M12), `mcp` (E8).

### Settings coverage

All 55 top-level keys of `interface Settings` (`SM:131-187`). Settings live in `<agent-dir>/settings.json` (global) and `.pi/settings.json` (project), and the project layer is deep-merged over the global one (`SM:247-251`, `:298-299`). **Menu** means a `/settings` item: the menu calls exactly the setters in `IM:4778-5022`, so a key marked "file" has no menu item. **Desktop:** no pi setting is read or written by the desktop (Q21).

| Key | Set in the TUI by | RPC | Row |
|---|---|---|---|
| `lastChangelogVersion` | internal | no | U4 |
| `defaultProvider`, `defaultModel` | model selector "set as default" | no (G4) | M2 |
| `defaultThinkingLevel` | thinking selector `ctrl+s` | no | M6 |
| `modelThinkingLevels` | menu `model-thinking` | no | M6 |
| `transport` | menu `transport` | no | M13 |
| `steeringMode`, `followUpMode` | menu `steering-mode`, `follow-up-mode` | yes | C7 |
| `theme` | menu `theme` | no | E6 |
| `compaction` | menu `autocompact` (`enabled` only) | partial: `set_auto_compaction` | K2 |
| `branchSummary` | file | no | S10 |
| `retry` | file | partial: `set_auto_retry` | K5 |
| `hideThinkingBlock` | menu `hide-thinking`; `ctrl+t` | host-side | C18 |
| `showCacheMissNotices` | menu `cache-miss-notices` | no | C20 |
| `externalEditor` | file | host-side | C13 |
| `shellPath`, `shellCommandPrefix` | file | no | C8 |
| `quietStartup` | menu `quiet-startup` | n/a | U4 |
| `defaultProjectTrust` | menu `default-project-trust` (global only) | no | T1 |
| `npmCommand` | file | no | E1 |
| `collapseChangelog` | menu `collapse-changelog` | n/a | U4 |
| `enableInstallTelemetry` | menu `install-telemetry` | no | U8 |
| `enableAnalytics` | first-time setup | no | U7, U8 |
| `trackingId`, `deviceId` | internal, generated | no | U8 |
| `packages` | `pi install` / `remove` / `config` | no (G5) | E1, E2 |
| `extensions` | file; `pi config` | no (G5) | E2, E3 |
| `skills` | file; `pi config` | no | E4 |
| `prompts` | file; `pi config` | no | E5 |
| `themes` | file; `pi config` | no | E6 |
| `enableSkillCommands` | menu `skill-commands` | no | E4 |
| `terminal` | menu `show-images`, `image-width-cells`, `clear-on-shrink`, `terminal-progress` | n/a | U3 |
| `images` | menu `auto-resize-images`, `block-images` | no | C9 |
| `enabledModels` | `/scoped-models`; `--models` | no | M4 |
| `defaultTools` | file; tool flags | no | E9 |
| `doubleEscapeAction` | menu `double-escape-action` | n/a | S8, S11 |
| `treeFilterMode` | menu `tree-filter-mode` | n/a | S8 |
| `thinkingBudgets` | file | no | M6 |
| `editorPaddingX`, `outputPad`, `showHardwareCursor` | menu `editor-padding`, `output-padding`, `show-hardware-cursor` | n/a | U3 |
| `autocompleteMaxVisible` | menu `autocomplete-max-visible` | n/a | C10 |
| `markdown` | menu `mermaid-rendering` | host-side | C21 |
| `warnings` | menu `warnings` (submenu item `anthropic-extra-usage`) | no | C20 |
| `codemode` | file | no | E2 (built-in extension) |
| `sessionDir` | file; `--session-dir` | no | S17 |
| `httpProxy`, `httpIdleTimeoutMs`, `websocketConnectTimeoutMs` | file; menu `http-idle-timeout` | no | M13 |
| `cacheWarming` | menu `cache-warming-mode` (global only) | no | M13 |
| `tuiMode`, `fullscreenExitOutput`, `fullscreenScrollbar`, `fullscreenCopyOnSelect`, `fullscreenWheelScrollLines` | menu `tui-mode`, `fullscreen-*` | n/a | U1 |

Inference: apart from C7, K2 and K5, pi offers no way to read or write settings over RPC. A desktop settings screen would need a pi change or direct edits to `settings.json`.

### Differences between pi 0.85.1 and 0.99.1 that matter to the desktop

The desktop imports pi 0.85.1 in-process only to list sessions (`04` §Effective versions). These checks cover that path.

| Area | Finding | Evidence |
|---|---|---|
| Session file format | Same version: `CURRENT_SESSION_VERSION = 3` in both. | `pi@d981de1:packages/coding-agent/src/core/session-manager.ts:30`; `pi@d86654a:packages/coding-agent/src/core/session-manager.ts:41` |
| `SessionInfo` shape returned by `listAll()` | Identical (checked with `diff` of the interface). This settles the session-format question left `UNVERIFIED` in `04` compatibility observation 7 for the fields the list uses. | `pi@d981de1:…/session-manager.ts:174`; `pi@d86654a:…/session-manager.ts:229` |
| `listAll()` without a directory | Both read `<agent-dir>/sessions` only and ignore `sessionDir` and `PI_CODING_AGENT_SESSION_DIR`. See S17. 0.99.1 adds an optional `AbortSignal`. | `pi@d981de1:…/session-manager.ts:1685-1700`; `pi@d86654a:…/session-manager.ts:1921-1949`; `getSessionsDir` at `pi@d981de1:packages/coding-agent/src/config.ts:572-573` and `pi@d86654a:packages/coding-agent/src/config.ts:600-601` |
| Built-in slash commands | 0.99.1 adds `/bug` (H1); no other change. Not on the desktop's 0.85.1 path. | `diff` of `name:` entries in `SC:19-44` and the 0.85.1 file |
| App keybindings | No change. | `diff` of `KB:15-57` and the 0.85.1 file |

`UNVERIFIED:` whether 0.99.1 writes session entry types that 0.85.1 would read differently when it computes `firstMessage` or `name`. Only the version constant and the `SessionInfo` shape were compared.

## gentle-shell and gentle-ai

Everything gentle-shell 3.7.0 (npm package `gentle-pi`) adds on top of pi 0.99.1, plus the gentle-ai capabilities that reach a gentle-shell session or a desktop user. Columns and status words are the same as in [Columns](#columns).

### At a glance (gentle-shell and gentle-ai)

| Question | Answer |
|---|---|
| What does gentle-shell add? | A launcher (homes, setup, package loading), 17 extension entry points with 27 slash commands, 8 shortcuts, 23 new model tools, 7 re-registered built-in tools, 1 CLI flag, 1 provider and 4 message renderers, plus 3 themes, 12 skills and 1 prompt template. 75 rows in 9 groups below, 5 of them for gentle-ai. |
| How much reaches an RPC host? | Very little as **data**. Almost every command runs through `prompt`, but most of them answer only with `notify`, which the desktop ignores (C20), and every panel built on `ctx.ui.custom()` or a TUI-only API is lost under RPC (`04` §What RPC mode drops). |
| Biggest findings for the desktop | 1) `/gentle:profiles` and `/gentle:models` both open `ctx.ui.custom()` panels and then read `result.type`, so neither panel reaches an RPC host; `Inference:` (not run) each handler likely throws a `TypeError` (P1, P3). 2) YOLO and the review "allow for this session" grant require `ctx.mode === "tui"`, so a desktop session can never enable them (Y4, R3). 3) Command output is `notify`-only; handling `notify` (C20) unlocks most `/gentle:*` commands at once (V18). 4) Custom messages (review preflight, helper results) are dropped by the desktop because it only keeps `assistant` messages (V17, A7). 5) The first chat in a fresh isolated home blocks while the launcher installs companion packages, and the desktop shows no progress (L5). 6) gentle-shell does not handle `project_trust`, so T1 stands as written. |

### Method (gentle-shell part)

**Sources.** gentle-shell `1162ce9` (package `gentle-pi` 3.7.0): `bin/`, `lib/`, every file under `extensions/`, `themes/`, `skills/`, `prompts/`, `assets/`, and the docs `readme-reference.md`, `gentle-shell.md`, `prompt-history.md`, `yolo-mode.md`. gentle-ai `b388eb3`: `internal/app/app.go`, `internal/cli/review_mode.go`, `internal/cli/telemetry.go`, `internal/cli/review_facade.go`, `internal/agents/pi/adapter.go`. Desktop `5ab4a00` `src/`.

**Version caveat (gentle-ai).** gentle-shell 3.7.0 pins a package-local gentle-ai **v3.7.0** (`INSTALLER_VERSION = "3.7.0"`, `gentle-shell@1162ce9:scripts/gentle-ai-installer.mjs:39`). The `v3.7.0` tag (annotated tag object `7ef749d`) points at commit `6dee8f8` (`gentle-shell@1162ce9:scripts/gentle-ai-installer.mjs:48-50`), cited as `gentle-ai@6dee8f8`. The corpus pin `gentle-ai@b388eb3` is not a descendant of that commit (`git merge-base --is-ancestor 6dee8f8 b388eb3` fails). Where the two differ in a way that matters, both are cited.

**Citation keys** (in addition to the keys in [Citation keys](#citation-keys)):

| Key | Expands to |
|---|---|
| `GSX:` | `gentle-shell@1162ce9:extensions/` |
| `GSL:` | `gentle-shell@1162ce9:lib/` |
| `GS:` | `gentle-shell@1162ce9:` (any other path) |
| `RR:` | `gentle-shell@1162ce9:docs/readme-reference.md:` |
| `GSD:` | `gentle-shell@1162ce9:docs/gentle-shell.md:` |
| `GAI:` | `gentle-ai@b388eb3:` |

**How RPC exposure was decided.** Under `--mode rpc`, pi binds extensions with the RPC UI context and `mode: "rpc"` (`RPCM:318-321`), so `ctx.hasUI` is **true** and `ctx.mode` is `"rpc"` (`PISRC:core/extensions/runner.ts:564-567`, `:620-622`). A gate on `ctx.hasUI` therefore passes under RPC; a gate on `ctx.mode === "tui"` does not. `isInteractiveRpcHost` adds `GENTLE_SHELL_INTERACTIVE_HOST=1` (`GSL:rpc-host.ts:15-26`). Each row checks which gate applies and whether the feature uses `ctx.ui.custom()`, `setFooter`, `setHeader`, `setEditorComponent` or a component-factory `setWidget`, all lost under RPC (`04` §What RPC mode drops).

#### Completeness evidence

| Category | Enumerated with | Count | Coverage |
|---|---|---|---|
| Extension entry points | `pi.extensions: ["./extensions"]` (`GS:package.json:61-63`); top-level `extensions/*.ts` plus `extensions/history/index.ts` | 17 | All 17 mapped in [Extension coverage](#extension-coverage). |
| Slash commands | `rg -c '\.registerCommand\('` over `extensions/` and `lib/` | 25 call sites, 27 names | All 27 names mapped in [Command and shortcut coverage](#command-and-shortcut-coverage). One site registers `gentle:install-delegation` and `gentle:install-review` in a loop (`GSX:gentle-ai.ts:9562-9575`); three helper sites register four banner commands (`GSX:startup-banner.ts:642-645`). |
| Shortcuts | `rg '\.registerShortcut\('` | 9 hits, 8 calls | All 8 mapped. The ninth hit is a comment (`GSX:gentle-shell.ts:521`). |
| Model tools | `rg '\.registerTool\('` plus the `tool()` helper (`GSX:gentle-agents.ts:1238-1265`) and the quiet-tools loop (`GSX:quiet-tools.ts:802-804`) | 23 new names, 7 re-registered built-ins, 1 codemode wrapper (`GSL:codemode-renderer.ts:180`) | All mapped in [Tool coverage](#tool-coverage). |
| CLI flags registered by extensions | `rg '\.registerFlag\('` | 1 | `--no-skill-registry` (I3). |
| Providers | `rg '\.registerProvider\('` | 1 | `nan` (I6). |
| Message renderers | `rg '\.registerMessageRenderer\('` | 4 | `gentle-pi.review-preflight` (V17), `gentle-agents.message`, `gentle-agents.orchestrator-message`, `gentle-agents.result` (A7, A9). |
| Launcher flags and subcommands | `parseLauncherArgs` (`GSL:gentle-shell-launcher.ts:41-165`) and `helpText()` (`:1129-1172`) | 7 flags (`--link`, `--isolated`, `--home`, `--package-root`, `--help`/`-h`, `--version`, `--`), 2 own subcommands (`home`, `setup`), 7 forwarded pi subcommands (`PI_SUBCOMMANDS`, `:12`) | Rows L1–L8. |
| Themes, skills, prompts | `themes/*.json`, `skills/*/SKILL.md` `name:`, `prompts/*.md` | 3, 12, 1 | V10, I1, I2. |
| `project_trust` handling | `rg 'project_trust\|defaultProjectTrust\|--approve'` over the whole gentle-shell checkout | 0 hits | Y5. |

#### Desktop searches (gentle-shell part)

Same command form as [Desktop searches](#desktop-searches), at `gentle-shell-desktop@5ab4a00`.

| ID | Pattern | Result |
|---|---|---|
| Q26 | `gentle:` | 0 hits |
| Q27 | `profile` | 0 hits |
| Q28 | `yolo\|persona` | 0 hits |
| Q29 | `review\|rdd\|receipt` | Only the word "preview" in comments (`D:renderer/shared/bridge/mockBridge.ts:26`, `:30`, `:72`, `:87`) |
| Q30 | `todo` | 0 hits |
| Q31 | `usage` | 0 hits |
| Q32 | `\bodd\b` | Comments citing the desktop's own `odd/tasks/*.md` files only (e.g. `D:main/domain/session/PiSession.ts:61`) |
| Q33 | `memory\|engram` | 4 hits, comments only (`D:main/domain/rpc/chatReducer.ts:210`; `D:renderer/shared/bridge/mockBridge.ts:24`, `:271`; `D:renderer/shared/bridge/useBridge.ts:7`) |
| Q34 | `worktree` | 0 hits |
| Q35 | `telemetry\|doctor` | 0 hits |
| Q36 | `vim\|banner\|customize\|palette` | 0 hits |
| Q37 | `subagent_\|orchestrator` | 0 hits |
| Q38 | `setup\|provision` | Only the desktop's own home-choice `SetupService` (`D:main/adapters/setupService.ts:15-41`, `D:main/ports/index.ts:89-97`) |
| Q39 | `history` | Only `get_messages` history loading (`D:main/domain/session/ChatHost.ts:11-22`, `D:main/domain/rpc/history.ts`); no prompt history |

### Launcher and homes

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **L1** Choose the agent home | `--link` (`PI_CODING_AGENT_DIR` or `~/.pi/agent`), `--isolated` (`GENTLE_SHELL_HOME` or `~/.gentle-shell/agent`, the default), `--home <path>`; mutually exclusive (`GSL:gentle-shell-launcher.ts:80-118`, `:154-162`, `:191-214`; `RR:258-270`) | spawn only (`04` §Process chain, step 2) | done: first-run choice, persisted by the desktop, passed as `--link`/`--isolated`, or `--home` when `GENTLE_SHELL_HOME` is set (`D:main/domain/home/home.ts:33-37`, `D:main/adapters/setupService.ts:21-38`). Caveat: the launcher reads `GENTLE_SHELL_HOME` as the isolated directory (`GSL:gentle-shell-launcher.ts:197-199`), while the desktop turns it into path mode; path mode refuses to auto-provision a non-empty directory it does not own (`GS:bin/gentle-shell.mjs:1124-1131`) | First run (exists) | none | TBD |
| **L2** Persist the home choice for the terminal | `gentle-shell home [link\|isolated\|<path>]` reads or writes `~/.gentle-shell/config.json` (`GS:bin/gentle-shell.mjs:364-385`; `GSL:gentle-shell-launcher.ts:231-233`; `RR:272-274`) | no: separate launcher command, run out of band | partial: the desktop keeps its own choice and always passes a home flag, and a flag beats the launcher config (`GSL:gentle-shell-launcher.ts:204-212`). `Inference:` a terminal user's `gentle-shell home` choice is ignored by the app | Inference: "Same home as my terminal" option | none | TBD |
| **L3** Show versions | `gentle-shell --version` prints `gentle-shell <v>`, `pi <v>`, `home <mode> <dir>` (`GSL:gentle-shell-launcher.ts:90-93`, `:1121-1127`; `GS:bin/gentle-shell.mjs:1217-1219`) | no: G10 | missing: no version check (`04` §Versioning) | Inference: About box | none (G10) | TBD |
| **L4** Provision companion packages | `gentle-shell [home selector] setup [--dry-run]` runs the package-local gentle-ai as `install --agent pi --scope global` (`GSL:gentle-shell-launcher.ts:143-146`, `:1150-1152`; `GS:bin/gentle-shell.mjs:821`, `:944-954`; `RR:282-302`). Needs pinned gentle-ai ≥ 3.6.0 (`GSL:gentle-shell-launcher.ts:418`) | no | missing: Q38 | Inference: "Repair companions" in Extensions | none | TBD |
| **L5** Automatic first-run provisioning and re-sync | Plain launch against an isolated or `--home` home (never `--link`, never a pi subcommand) runs the setup flow when the home was never provisioned or the gentle-ai pin or gentle-pi version changed; marker `provisioned` in `config.json`; lock `<home>/.gentle-shell-setup.lock`; 15-minute child timeout; opt-out `GENTLE_SHELL_NO_AUTO_SETUP=1` (`GS:bin/gentle-shell.mjs:1114-1178`, `:1265-1278`; `RR:346-362`) | spawn: runs before pi starts; all child output goes to stderr, so RPC stdout stays clean (`GS:bin/gentle-shell.mjs:1160`; `RR:352`) | partial: every isolated spawn goes through it, but the desktop only logs stderr (`04` §Framing). `Inference:` the first chat in a new isolated home waits for a gentle-ai install with no visible progress | Inference: "Setting up Gentle…" progress on first launch | Inference: a machine-readable setup progress signal (gentle-shell) | TBD |
| **L6** Defaults for a new isolated home | Writes `"tuiMode": "fullscreen"`, `"theme": "Gentleman-Cute"` (if none), ownership marker `.gentle-shell-home`, and a stderr hint (`GS:bin/gentle-shell.mjs:1238-1243`; `RR:348`); disables pi's built-in `codemode` in homes gentle-shell owns (`GS:bin/gentle-shell.mjs:1279-1292`) | spawn | n/a: happens inside the launcher | — | none | TBD |
| **L7** Run pi package commands against the resolved home | `gentle-shell install\|remove\|uninstall\|update\|list\|config\|auth` forwarded to pi without package injection (`GSL:gentle-shell-launcher.ts:12`, `:1154-1163`; `RR:276-280`). `mcp` is not in `PI_SUBCOMMANDS` | no: G5 | missing: Q20 | Inference: Extensions screen | pi (G5), or out-of-band launcher calls (Inference) | TBD |
| **L8** Load gentle-pi and take over a conflicting copy | With no gentle-pi declaration in settings, injects only `-e <package root>`, and pi discovers the package's extensions, skills, prompts and themes; take-over pushes `--no-extensions`, then `-e` for every other settings package and loose extension entry, then `-e <package root>`; a matching declaration gets no injection (`GSL:gentle-shell-launcher.ts:904-940`). `--package-root <dir>` forces a take-over in `--link` mode (`GSL:gentle-shell-launcher.ts:125-133`; `GS:bin/gentle-shell.mjs:1294-1303`; `RR:342`). `RR:326` and `RR:333` still describe an extra `--theme <root>/themes --skill <root>/skills --prompt-template <root>/prompts`; that text is stale against the code | spawn | missing: argv has no `--package-root` (`D:main/domain/session/PiSession.ts:127-133`) | Inference: developer option | none | TBD |
| **L9** Choose the pi runtime | `GENTLE_SHELL_PI`, then bundled pi, then `pi` on `PATH`; floor 0.99.1; `.cmd`/`.bat` run through `cmd.exe` on win32 (`GSL:gentle-shell-launcher.ts:358-369`, `:382`; `RR:304-312`, `:364-366`) | spawn | partial: the child inherits the desktop environment, so `GENTLE_SHELL_PI` works; no UI or error mapping (`04` §Process chain) | Inference: "pi runtime" line in diagnostics | none | TBD |
| **L10** Resume hint on quit | Prints `To resume in gentle-shell:` after pi's hint (`GSL:gentle-shell-resume-hint.ts:17`, `:169`; `GSX:resume-hint.ts:38-40` requires `ctx.mode === "tui"`) | n/a: TUI quit only | n/a: the sidebar reopens chats (S3) | — | none | TBD |
| **L11** Herdr lifecycle bridge | Auto-loads `extensions/herdr-agent-state.ts` inside Herdr; skipped for RPC and non-TTY (`GS:bin/gentle-shell.mjs:186-199`; `RR:376-384`) | n/a | n/a: terminal multiplexer integration | — | none | TBD |
| **L12** Update gentle-shell | No update check: `rg` for update checks in `bin/`, `lib/`, `extensions/` finds none; the docs call runtime resolution "not an auto-updater" (`RR:310`). Upgrading is `npm i -g gentle-pi`, after which L5 re-syncs the home (`RR:350`) | no | missing: there is no version check (L3), so there is nothing to compare against | Inference: "Update available" notice | Inference: a version source (G10) | TBD |

### Shell experience

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **V1** Prompt frame with working, queued and phase label | `GentlePromptEditor` via `setEditorComponent` (`GSX:gentle-shell.ts:1084-1100`); petal, `working`/`queued` label, ODD phase label (`GSD:50-61`) | partial: `setEditorComponent` is dropped; queued state is available as `queue_update` (`04` §Events); phase as in O2 | partial: the composer only knows `working` (`D:main/domain/session/PiSession.ts:169-180`) | Inference: status chip in the composer | none (queue); G2 (phase) | TBD |
| **V2** Header and compact status bar | Fullscreen header: brand, cwd, branch, dirty count, `model · effort · profile`, context gauge, cost with `sub`, usage; compact bar below 140 columns adds extension statuses and session name (`GSX:gentle-shell.ts:1768-1823`; `GSD:24-48`). `GENTLE_PI_SHELL=0` restores pi's footer (`GSL:shell-bar.ts:99-103`) | partial: `setFooter` is dropped. Model and effort: `get_state`; cost and context: `get_session_stats`; cwd, branch, profile: none (`04` G6, G7) | missing: Q11, Q27, Q31 | Inference: status bar (mockup) | gentle-shell (G6), pi (G7) | TBD |
| **V3** Status card | Project (cwd, branch, session name, active profile), Changes, Integrations (other extensions' `setStatus`) (`GSD:33-34`) | partial: `setStatus` reaches the host (`04` §Extension UI requests); the rest as V2 | missing: `setStatus` is ignored (`D:main/domain/rpc/chatReducer.ts:183`) | Inference: side panel | as V2 | TBD |
| **V4** Subscription usage | `/gentle:usage`, `alt+u` (`GENTLE_PI_SHELL_USAGE_KEY`) (`GSX:gentle-shell.ts:1325-1326`, `:1613-1645`); providers Codex, Claude, NaN and any `gentle-pi:usage-source/v1` source (`GSD:104-139`) | no: the panel is `ctx.ui.custom()` (`GSX:gentle-shell.ts:1614`). `Inference:` usage is still fetched at session start under RPC, because only `ctx.hasUI` is checked (`GSX:gentle-shell.ts:1753`, `:1825`) | missing: Q31 | Inference: usage meters in Providers and the status bar | gentle-shell: publish usage as data | TBD |
| **V5** Captured changes | `/gentle:changes`, `alt+g` (`GENTLE_PI_SHELL_CHANGES_KEY`); widget `gentle-shell-changes`; two-pane diff overlay (`GSX:gentle-shell.ts:1143-1146`, `:1313-1320`, `:1875-1895`; `GSD:63-96`). Evidence is stored as session entries `gentle-pi.session-change/v1` (`GSL:session-change-capture.ts:28`; `GSD:83`) | partial: overlay and widget are TUI-only. `Inference:` the raw evidence is readable with `get_entries` and `entry_appended` (`04` §Commands, §Events) | missing: Q34 | Inference: "Changes" view with diffs per worktree | Inference: a documented entry schema (gentle-shell) | TBD |
| **V6** Register a session worktree | Model tool `session_worktree_register` (`GSX:gentle-shell.ts:1727-1730`); entries `gentle-pi.session-worktree/v1` (`GSL:session-worktree-registry.ts:114`) | yes: tool events | missing: tool calls are not rendered (C17) | Inference: worktree list in Changes | none | TBD |
| **V7** Command palette | `/gentle:commands`, `alt+k` (`GENTLE_PI_COMMANDS_KEY`); curated groups Configuration, Session, Diagnostics, Skills (`GSX:gentle-shell.ts:1149`, `:1896-1906`; `GSL:command-palette.ts:353-357`; `GSL:command-palette-catalog.ts:19-59`) | partial: the palette is `ctx.ui.custom()` (`GSX:gentle-shell.ts:1301`); the commands it lists run through `prompt` and appear in `get_commands` (`04`) | missing: Q12, Q36 | Inference: command palette reusing the curated groups and labels | none | TBD |
| **V8** Visual customization | `/gentle:customize`: Animations, Banner, Themes, Editor (Vim, YOLO), History, Layout, Cards (`neon`/`float`), Sections, Profiles (visual profiles), Reset (`GSX:gentle-shell.ts:1907-1913`; `GSL:visual-customize-view.ts:32`; `GSD:157-175`); files `visual-customization.json`, `visual-profiles.json`, `card-style.json` (`GSL:visual-profiles.ts:104`; `GSL:card-style-policy.ts:12`) | no: the command refuses unless `ctx.mode === "tui"` (`GSX:gentle-shell.ts:1910-1911`) | missing: tokens are hardcoded (Q19, Q36) | Inference: Appearance settings | none | TBD |
| **V9** Animation mode | `/gentle:animations [status\|quality\|performance\|potato]`; `animations.json` (`GSX:gentle-shell.ts:2244-2272`; `RR:964-976`) | partial: the command runs (`select`, `notify`); it only affects TUI rendering | n/a: terminal animation. `Inference:` maps to a reduced-motion setting | — | none | TBD |
| **V10** Themes shipped | `Gentle`, `Gentleman-Cute`, `Gentleman-Sexy` (`GS:themes/`; `GS:package.json:64-66`); default for isolated homes is `Gentleman-Cute` (L6) | no: E6 | partial: one hardcoded copy, `D:renderer/shared/theme/gentleman-cute.json` (Q19) | Inference: theme picker | pi (E6), or read the JSON files directly (Inference) | TBD |
| **V11** Startup banner | `/gentle:banner`, `/gentle:toggle-rose`, `/gentle:toggle-text-logo`, `/gentle:banner-color` (`pink`, `cyan`, `yellow`, `green`); `banner.json` (`GSX:startup-banner.ts:590-645`; `RR:996`). Header drawn with `setHeader` (`GSX:startup-banner.ts:750`) | partial: commands run (`select`, `notify`); the header is dropped | missing: Q36 | Inference: splash, low value | none | TBD |
| **V12** Vim prompt editing | `/gentle:vim [status\|enable\|disable]`; `vim.json` (`GSX:gentle-shell.ts:2220-2242`; `RR:978-1004`) | partial: the command runs; the editor is TUI-only | missing: Q36 | Inference: optional Vim mode in the composer | none | TBD |
| **V13** Esc behavior | Abort sends queued messages after the run settles; opt-in double Esc to cancel; idle double Esc clears a draft (`GSX:gentle-shell.ts:2338-2365`; `RR:932-962`); `/gentle:double-esc-cancel [status\|enable\|disable]`, `double-esc-cancel.json`, `GENTLE_PI_DOUBLE_ESC_CANCEL` (`GSX:gentle-shell.ts:1104`, `:2278-2307`) | host-side | partial: Escape aborts (C3); queueing is not supported (C4) | Inference: same semantics in the composer | none | TBD |
| **V14** Prompt history | `/history`, `ctrl+shift+r` (`GSX:history/index.ts:94`, `:1410-1418`); capture is opt-in via `/gentle:customize` → History, `history-capture.json` or `GENTLE_PI_HISTORY_CAPTURE` (`GS:docs/prompt-history.md:8-56`) | partial: the selector is `ctx.ui.custom()` (`GSX:history/index.ts:1193`). `Inference:` capture still runs under RPC when enabled, through `before_agent_start` (`GSX:history/index.ts:1376`) | missing: Q39 | Inference: Up-arrow history and search in the composer | none | TBD |
| **V15** Quiet tool cards and Code card | Re-registers `read`, `bash`, `grep`, `find`, `ls`, `edit`, `write` with card renderers; `GENTLE_PI_QUIET_TOOLS=0` opts out; compact `codemode` card (`GSX:quiet-tools.ts:32-40`, `:782-805`; `GSL:codemode-renderer.ts:180`; `GSD:151`, `:177-184`). Also bundles `@heyhuynhgiabuu/pi-pretty` 0.6.27 (`GSX:pi-pretty.ts`; `GS:package.json:75`). `UNVERIFIED:` what pi-pretty registers; the package is not installed in the reference checkout | yes for tool events (C17); rendering is TUI-only | missing: C17 | Inference: tool cards | none | TBD |
| **V16** Notification cards | Gentle notices as rounded or float cards (`GSD:141-155`) | yes: `notify` requests | missing: C20 | Inference: toasts | none | TBD |
| **V17** Review preflight card and dev-binary notice | Message renderer for `gentle-pi.review-preflight` (`GSX:gentle-shell.ts:1327`, `:1607-1612`); dev-binary widget `gentle-shell-dev-binary` (`GSX:gentle-shell.ts:1328`, `:1840-1845`) | partial: the preflight arrives as a custom message (R2); the dev-binary state also arrives as `notify` at session start (`GSX:gentle-ai.ts:9369-9370`) | missing: non-assistant messages are dropped (`D:main/domain/rpc/chatReducer.ts:81-82`; `D:main/domain/rpc/history.ts:18`); `notify` is ignored (C20) | Inference: reminder card in the chat; warning banner | none | TBD |
| **V18** Command output | Most `/gentle:*` commands answer only with `ctx.ui.notify` (87 calls in `GSX:gentle-ai.ts`, 29 in `GSX:gentle-shell.ts`, counted with `rg -o 'ctx\.ui\.notify'`) | yes: `notify` | missing: C20 | Inference: one toast or result card per command | none | TBD |

### Helpers (subagents)

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **A1** Delegate work to a helper | Model tools `subagent_list_agents`, `subagent_run` (`agent`, `task`, `label?`, `context?`, `workspace_root?` or `repository_root?`, `mode?`), `subagent_continue` (`GSX:gentle-agents.ts:62`, `:1363-1373`, `:1449-1452`; `GSD:217`). Background mode needs a live interactive or RPC parent (`GSX:gentle-agents.ts:1027`, `:1165`; `RR:907-909`). `GENTLE_PI_AGENTS=0` disables (`GSX:gentle-agents.ts:145-148`) | yes: model tools, plus the activity push under the interactive host (`04` §gentle-shell additions) | partial: Helpers list and thread (`D:renderer/features/helpers/HelpersContainer.tsx`), with the parser gaps in `04` observations 2 and 6 and [audit A5](03-architecture/audit.md#a5-helper-status-set-and-tool-items-do-not-match-gentle-shell). gentle-shell publishes `completed` and `timed_out` (`GSL:agents-protocol.ts:9-17`); the desktop drops a task with either status (`D:main/domain/rpc/helpersActivity.ts:21`, `:139-141`). `Inference:` (not run) a task first seen running is kept by the retention merge and turned into `done` (`D:main/domain/rpc/chatReducer.ts:225-240`), so a timed-out helper shows as done; only a task first seen already finished is missing. `Inference:` (not run) every real tool item is dropped, because the desktop requires a `callId` the publisher never sends (`D:main/domain/rpc/helpersActivity.ts:107-118`; `GSL:agents-rpc-publisher.ts:97-105`) | Helpers tab (exists) | none | TBD |
| **A2** Watch helpers live | Agents card above the editor with `model · effort`, tokens, cost, elapsed (`GSX:gentle-agents.ts:1008`; `GSD:204-211`); `ctrl+shift+a` collapses it (`GENTLE_PI_AGENTS_KEY`) (`GSL:agents-keys.ts:7`, `:17-21`; `GSX:gentle-agents.ts:1471-1480`) | partial: `gentle-agents.activity/v1` omits `model`, `tokens`, `cost` (`04` payload note) | partial: list and thread exist; no model, tokens or cost; the thread shows no tool rows and a timed-out helper shows as done (A1) | Helpers strip (exists) | gentle-shell: add fields (G8) | TBD |
| **A3** Agents overlay | `/gentle:agents`, `alt+a` (`GENTLE_PI_AGENTS_VIEW_KEY`): Current and All-sessions scope, Follow, Open session transcript in `$EDITOR`, fullscreen thread (`GSX:gentle-agents.ts:55`, `:1482-1491`; `GSL:agents-keys.ts:8`, `:11-15`; `GSD:225-230`) | no: returns early with "requires TUI mode" when `ctx.mode !== "tui"` (`GSX:gentle-agents.ts:917-922`) | partial: Helpers tab covers the current session only | Inference: "All sessions" scope; open transcript | gentle-shell (G8) | TBD |
| **A4** Stop helpers | `alt+s` (`GENTLE_PI_AGENTS_STOP_KEY`) stops owned active or queued helpers; overlay **Stop** (`s`) (`GSL:agents-keys.ts:9`, `:23-27`; `GSX:gentle-agents.ts:1492-1498`); model tool `subagent_cancel` (`:1438`) | no: G1 | missing: Stop is disabled (`D:renderer/features/helpers/components/HelpersFooter.tsx:16`, `:36`) | Stop button (mockup) | gentle-shell and an inbound channel (G1) | TBD |
| **A5** Answer a helper's question | A task-mode child's `select`/`confirm`/`input`/`editor` reaches the parent as an ordinary dialog; a background child's question is dismissed (`GSD:213`). Child queries via `subagent_parent_message` are answered with `subagent_reply` (`GSX:gentle-agents.ts:189-192`, `:1431`; `GSD:223`) | yes: task-mode child dialogs surface as parent dialogs; replies only through the model | partial: answered as ordinary dialog cards (C19), with no link to the helper (Inference) | Inference: question card inside the helper thread | none | TBD |
| **A6** Steer or continue a helper | Model tools `subagent_send_message`, `subagent_continue` (`GSX:gentle-agents.ts:1444`, `:1449`) | partial: only by asking the model through `prompt` | missing: Q37 | Inference: message box in the helper thread | inbound channel (G1 shape) | TBD |
| **A7** Receive background results | `gentle-agents.result` custom message starts a turn; Agent result and Stale agent result cards (`GSX:gentle-agents.ts:56`, `:612`, `:775-799`; `GSD:222`) | partial: custom message events | missing: non-assistant messages are dropped (`D:main/domain/rpc/chatReducer.ts:81-82`) | Inference: result card in the chat | none | TBD |
| **A8** Background subagents policy | `/gentle:background-subagents [status\|enable\|disable]`; project `.pi/gentle-ai/background-subagents.json` beats global `<configHome>/background-subagents.json` beats `GENTLE_PI_BACKGROUND_SUBAGENTS`; default `off` (`GSX:gentle-ai.ts:9812-9838`; `RR:905-930`) | partial: runs through `prompt`; no argument opens a `select`; the report is `notify` | missing: Q26 | Inference: settings toggle with the deciding source | none | TBD |
| **A9** Message other open sessions | Model tools `orchestrator_session_id`, `orchestrator_list`, `orchestrator_send_message`; consent Allow once / Allow for this session / Deny (`GSX:gentle-agents.ts:1268-1300`; `GSL:session-messaging-grants.ts:81`; `GSD:218`) | yes: consent is a `select` whenever `ctx.hasUI` | partial: consent answerable as a dialog card (C19); no view of other sessions | Inference: consent card naming the peer | none | TBD |
| **A10** Helpers in another repository | `subagent_run.repository_root` with an interactive grant (`GSL:foreign-target-grants.ts:21`; `GSD:220`) | no: refused when `ctx.mode !== "tui"` (`GSX:gentle-agents.ts:1054`) | missing: Q37 | Inference: grant dialog | gentle-shell | TBD |
| **A11** Helper definitions and packaged agents | Markdown agents in `<agent home>/agents/`, `<agent home>/subagents/`, `<cwd>/.pi/agents/`, `<cwd>/.pi/subagents/` (`GSL:agents-config.ts:214-217`). The agent home is `GENTLE_PI_AGENT_HOME`, then `PI_CODING_AGENT_DIR`, then `~/.pi/agent` (`GSL:agent-home.ts:6-8`; `GSD:202`), and the launcher sets both variables to the resolved home (`GSL:gentle-shell-launcher.ts:946`), so with `--isolated` these live under `~/.gentle-shell/agent` (L1). `subagents.json` keys `default_model`, `default_effort`, `default_mode`, `model_profiles`, `stall_timeout_ms`, `tool_stall_timeout_ms`, `max_concurrency`, `history_max_tasks` (`GSD:200-202`); `/gentle:install-delegation`, `/gentle:install-review` with `--force` (`GSX:gentle-ai.ts:9562-9575`; `RR:604-609`) | partial: install commands through `prompt` (`notify` only); definitions are files | missing: Q37 | Inference: helper list in Extensions | none | TBD |
| **A12** Helper history and transcripts | Finished tasks in `<agent home>/gentle-agents/tasks/`, child sessions in `<agent home>/gentle-agents/sessions/`, agent home as in A11 (`GSL:agents-history.ts:18-19`; `GSX:gentle-agents.ts:118-120`, `:345-351`; `GSD:232` shows the `~/.pi/agent` default) | no: G8 | missing: Q37 | Inference: "Why did it do that?" view (community proposal, context brief §2) | gentle-shell (G8) | TBD |

### ODD workflow and task tracking

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **O1** ODD on every request | Harness prompt with the 7 ODD steps (authorize, explore, resolve uncertainty, classify, track, implement, close) (`GSX:gentle-ai.ts:1235-1262`), appended in `before_agent_start` (`GSX:gentle-ai.ts:9411-9417`; `GSD:257`) | yes: the hook has no mode gate (`GSX:gentle-ai.ts:9411-9417`) | n/a: runs inside gentle-shell | Inference: none needed | none | TBD |
| **O2** ODD phase | Inferred from tool activity (`GSX:gentle-shell.ts:2323-2335`) and refined by the model tool `gentle_odd_phase` with `authorizing`, `exploring`, `researching`, `deciding`, `planning`, `implementing`, `checking`, `closing`, or `clear` (`GSX:gentle-ai.ts:8993-9047`; `GSL:odd-phase.ts:16-25`) | partial: G2. Explicit reports arrive as `tool_execution_*`; inferred phases stay in the TUI editor. `Inference:` inference runs under the interactive RPC host too (`isInteractiveMode` gate, `GSX:gentle-shell.ts:2331`), but nothing publishes it | missing: Q32; tool events are not rendered (C17) | ODD stepper (mockup). `Inference:` the mockup's five steps (Explore→Plan→Build→Verify→Deliver) need a mapping from these eight phases | gentle-shell (G2) | TBD |
| **O3** Feature documents | Model-written `odd/tasks/<feature-name>.md` and Engram mirror `odd/<feature-name>/tasks` (`GSX:gentle-ai.ts:1254`). No gentle-shell code reads or writes them: `rg 'odd/tasks'` in `extensions/` and `lib/` hits only that prompt line and one comment | host-side: `Inference:` the desktop can read the files in the project; the format is not specified (G2) | missing: Q32 | ODD panel tasks with commit and test evidence (mockup) | gentle-shell: a structured format (G2) | TBD |
| **O4** Todo list | Model tool `todo` (`write`, `add`, `update`, `clear`, `list`); card widget `gentle-todo`; `ctrl+shift+t` collapses it (`GENTLE_PI_TODO_KEY`); open tasks are injected each turn; amber `stale` after 2 untouched turns; `GENTLE_PI_TODO=0` disables (`GSX:gentle-todo.ts:29-30`, `:59-69`, `:161-175`, `:204-212`, `:229-238`; `GSL:shell-todo.ts:86-87`; `GSD:235-253`) | partial: the widget uses a component factory (`04` TUI-only table). The full state rides in each `todo` tool result as `details.gentleTodo` (`GSX:gentle-todo.ts:200`) | missing: Q30 | ODD panel task list (mockup) | none (Inference: parse tool results) | TBD |

### Review and RDD

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **R1** Turn receipt-driven development on or off | `/gentle:review-mode [status\|enable\|disable]` runs native `gentle-ai review mode` with `--scope clone`, so `enable` cannot override a global off (`GSX:gentle-ai.ts:9713-9760`). Native CLI: `gentle-ai review mode <enable\|disable\|status> [--cwd] [--scope global\|clone] [--expected-revision] [--json]`; on by default (`GAI:internal/cli/review_mode.go:48-77`; same usage line at `gentle-ai@6dee8f8:internal/cli/review_mode.go:48`). At v3.7.0 an unset mode resolves to on (`gentle-ai@6dee8f8:internal/reviewtransaction/rdd_mode.go:698-701`; `gentle-ai@6dee8f8:README.md:134`). gentle-shell contradicts this: its README says "RDD is opt-in" (`GS:README.md:290`) and its code says "RDD is off by default until explicitly enabled" (`GSX:gentle-ai.ts:5205`), and a code comment says gentle-ai v2.4.0 "made receipt-driven development opt-in" (`GSL:native-review-cli.ts:864-865`) | partial: runs through `prompt`; result is `notify` | missing: Q29 | `ODD · RDD on` in the status bar (mockup) | none. `Inference:` the desktop can read `gentle-ai review mode status --json` out of band | TBD |
| **R2** Review preflight reminder | At `agent_end`, with an own unreviewed mutation and a `review.start` transition, sends custom message `gentle-pi.review-preflight` as a follow-up turn (`GSX:gentle-ai.ts:9475-9511`) | yes: gated on `ctx.hasUI`, true under RPC (`GSX:gentle-ai.ts:9483`) | missing: non-assistant messages are dropped (`D:main/domain/rpc/chatReducer.ts:81-82`) | Inference: reminder card | none | TBD |
| **R3** Review consent | TUI: a custom panel; other modes: `select` with granted, declined, or allow for this session (`GSL:review-consent-ui.ts:73-105`). The host only presents it when it can capture a session identity, which requires `ctx.mode === "tui"` (`GSL:review-session-standing-permission.ts:144-162`; `GSX:gentle-ai.ts:9293-9312`) | partial (`Inference:`, not run): under RPC the host-side consent is skipped; the envelope returns to the model, which is told to use `ask_user_choice` or relay it as text (`GS:assets/orchestrator.md:82`). "Allow for this session" is unavailable | partial: an `ask_user_choice` dialog would render as a card (C19) | Inference: consent card with benefits and consequences | gentle-shell: RPC session identity | TBD |
| **R4** Review session permission | `/gentle:review-session-permission [status\|revoke]`; status key `gentle-review-session-permission` (`GSX:gentle-ai.ts:5875`, `:8926-8934`, `:9689-9711`) | no: reports that it requires the interactive TUI (`GSX:gentle-ai.ts:9704`) | missing: Q29 | Inference: indicator next to RDD | gentle-shell | TBD |
| **R5** Native review tools | Model tools `gentle_review`, `gentle_review_capture`, `gentle_review_capture_group`, `gentle_review_scope` (`GSX:gentle-ai.ts:9060`, `:9103`, `:9143`, `:9189`); RECOVER and REPAIR_LEGACY_ALIAS need a fresh `confirm` and fail closed without UI (`GSX:gentle-ai.ts:5486-5487`, `:8082-8083`) | yes: tool events; `confirm` dialogs reach the host | partial: confirm cards work (C19); tool cards are missing (C17) | Inference: review timeline in the ODD panel | none | TBD |

### Profiles, models and persona

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **P1** Agent-model profiles | `/gentle:profiles` panel: `enter` apply, `c` create, `s` snapshot, `d` duplicate, `r` rename, `x` delete, `e` export, `i` import, `p` local pin, `P` repository declaration; `~/.pi/gentle-ai/profiles.json`, `profiles.export.json`; the `orchestrator` key writes `defaultProvider`, `defaultModel`, `defaultThinkingLevel` (`GSX:gentle-ai.ts:9584-9589`, `:4052`; `RR:756-817`) | no: G6. `Inference:` (not run) the handler reads `result.type` after `ctx.ui.custom()` returns `undefined` and throws (`GSX:gentle-ai.ts:4631-4638`). Before that, when `profiles.json` is missing, it writes a seeded `current` profile and sends a `notify` (`GSX:gentle-ai.ts:4601-4611`), so the file is created even though the panel fails | missing: Q27 | Profiles screen; profile in the status bar (mockup) | gentle-shell (G6) | TBD |
| **P2** Per-repository profile pins | Local `<git-common-dir>/gentle-ai/profile-pin.json` (`p`), repository `<worktree-root>/.pi/gentle-ai/profile.json` (`P`); shown as `name (local)` or `name (repo)` (`RR:819-866`) | no: G6 | missing: Q27 | Inference: pin toggle per project | none. `Inference:` both files have a documented JSON shape the desktop could read (`RR:832-838`) | TBD |
| **P3** Model and effort per helper | `/gentle:models` panel: `x` export, `r` restore, `u` capture into the current profile, `ctrl+s` save; `~/.pi/gentle-ai/models.json`, `models.export.json`; writes `<cwd>/.pi/subagents.json` or `<agent home>/subagents.json`, agent home as in A11 (`GSX:gentle-ai.ts:2396-2400`, `:256-258`, `:9577-9582`, `:3309`; `RR:706-754`) | no: `Inference:` (not run) same failure as P1: `result.type` is read right after `ctx.ui.custom()` (`GSX:gentle-ai.ts:3347-3348`) | missing: Q27 | Inference: per-helper model and effort table | gentle-shell | TBD |
| **P4** Persona | `/gentle:persona` (`gentleman` or `neutral`); `~/.pi/gentle-ai/persona.json`, project override `.pi/gentle-ai/persona.json` (`GSX:gentle-ai.ts:9591-9596`, `:4653-4672`; `RR:681-704`) | yes: a `select`, then `notify` (`04` §gentle-shell additions) | partial: works if typed (C11) and answered as a dialog card (C19); the confirmation is dropped (C20); Q28 | Inference: persona switch in settings | none | TBD |

### Safety and permissions

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **Y1** Confirm risky shell commands | `bash` calls are classified allow, confirm or block; confirm uses `ctx.ui.confirm`; without UI the command is blocked (`GSX:gentle-ai.ts:1810-1860`). Config: `runtime-guardrails.json` global and project, `GENTLE_PI_AUTONOMOUS_MODE` (`GSX:gentle-ai.ts:1495-1530`) | yes: `confirm` dialog | done: confirm cards (`D:renderer/features/conversation/components/DialogCard.tsx:39-45`) | Confirmation card (exists) | none | TBD |
| **Y2** Block sensitive paths | `read`/`write`/`edit` on sensitive paths are blocked with a reason (`GSX:gentle-ai.ts:1560-1690`, `:9531-9535`) | yes: the reason is in the tool result | missing: tool results are not rendered (C17) | Inference: blocked-tool card | none | TBD |
| **Y3** Child safety | Helpers block recognized destructive commands (`GSX:child-safety.ts:4-21`) and drop orchestrator-only context blocks (`GSX:child-context.ts:9-26`) | n/a: inside helpers | n/a | — | none | TBD |
| **Y4** YOLO session permission | `/gentle:yolo [enable\|disable\|status]`; `/gentle:customize` → Editor; indicator `gentle:yolo` via `setStatus` and `setWidget` (`GSL:yolo-session-policy.ts:5-6`, `:105-108`, `:213-240`; `GS:docs/yolo-mode.md:1-30`) | no (`Inference:`, not run): activation captures a session identity that requires `ctx.mode === "tui"` (`GSL:yolo-session-policy.ts:115-118`, `GSL:review-session-standing-permission.ts:144-162`), so `enable` reports "activation requires an interactive primary TUI session" (`GSL:yolo-session-policy.ts:171-173`). This narrows the YOLO row in `04`: the indicator can reach a host, but never as active | missing: Q28 | Inference: YOLO toggle with the same warning | gentle-shell: RPC session identity | TBD |
| **Y5** Project trust | gentle-shell adds nothing: no `project_trust` handler, no `--approve`, no `defaultProjectTrust` write (0 hits, see [Completeness evidence](#completeness-evidence-1)). Profile pins avoid project settings on purpose so pi does not ask for trust (`RR:864`) | no: T1 applies unchanged | missing: Q14 | as T1 | as T1 | TBD |

### Integrations, skills, memory and diagnostics

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **I1** Packaged skills | 12 skills: `gentle-ai`, `gentle-ai-branch-pr`, `gentle-ai-chained-pr`, `gentle-ai-cognitive-doc-design`, `gentle-ai-comment-writer`, `gentle-ai-issue-creation`, `gentle-ai-judgment-day`, `gentle-ai-rdd-defect-workflow`, `gentle-ai-skill-creator`, `gentle-ai-skill-improver`, `gentle-ai-skill-registry`, `gentle-ai-work-unit-commits` (`GS:skills/*/SKILL.md`, `name:` lines) | partial: as E4 | missing: Q13 | Inference: skills list in Extensions | none | TBD |
| **I2** Prompt template | `/skill-creation` (`GS:prompts/skill-creation.md:1-5`) | partial: as E5 | missing: Q12 | Inference: command palette | none | TBD |
| **I3** Skill registry | `.atl/skill-registry.md` refreshed at session start and by a file watcher; `/skill-registry:refresh`; flag `--no-skill-registry`, `GENTLE_PI_NO_SKILL_REGISTRY=1` (`GSX:skill-registry.ts:24`, `:497-521`, `:557-609`; `RR:613-679`) | partial: refresh runs headless; the command runs through `prompt` (`notify` only); the flag is spawn only | missing: Q13 | Inference: "Refresh skills" action | none | TBD |
| **I4** Memory | Not bundled; `npm:gentle-engram` is installed by setup (L4; `GAI:internal/agents/pi/adapter.go:32`, `:64-69`; `RR:1019-1031`). `/gentle:doctor` reports whether Engram tools are active (`GSX:gentle-ai.ts:9665`) | yes: `Inference:` memory tools are ordinary model tools | missing: Q33 | Inference: memory indicator | none | TBD |
| **I5** CodeGraph tool | Model tool `codegraph` (`GSX:codegraph-tools.ts:280-300`, `:323`) | yes: tool events | missing: C17 | Inference: tool card | none | TBD |
| **I6** NaN provider | Provider `nan`, base URL `https://api.nan.builders/v1`, NaN API key (`GSX:nan-provider.ts:5`; `GSL:nan-provider.ts:5-6`, `:122-126`) | partial: models via `get_available_models`; sign-in is G3 | missing: M7 | Inference: provider entry in Providers | pi (G3) | TBD |
| **I7** Status and doctor | `/gentle:status`, `/gentle:doctor` (`GSX:gentle-ai.ts:9658-9687`, `:9840-9866`) | partial: run through `prompt`; output is `notify` only | missing: Q35 | Inference: Diagnostics panel | none | TBD |
| **I8** gentle-ai dev-binary override | `/gentle:dev-binary [status\|<absolute path>\|off]`, `GENTLE_PI_GENTLE_AI_DEV_BINARY`, `dev-binary.json` (`GSX:gentle-ai.ts:9633-9656`; `GSL:gentle-ai-binary.ts:58`) | partial: `notify` only | missing: Q26 | Inference: developer setting | none | TBD |
| **I9** Telemetry | `/gentle:telemetry [status\|enable\|disable\|preview]` relays `gentle-ai telemetry <op> --json` (`GSX:gentle-ai.ts:9762-9810`); runtime metrics and a session-start trigger; opt-outs `DO_NOT_TRACK=1`, `GENTLE_AI_TELEMETRY=0`, `CI=true` (`GSX:runtime-metrics.ts:13-17`; `GSL:telemetry-trigger.ts:63-75`; `RR:1033-1047`) | partial: `notify` only; env opt-outs are spawn only | missing: Q35 | Inference: privacy settings (with U8) | none | TBD |
| **I10** Structured questions | `ask_user_question` (1–4 questions, 2–4 options, multi-select, descriptions, previews) and `ask_user_choice` (`GSX:ask-user-question.ts:243-268`; `GSX:ask-user-choice.ts:217-231`) | partial: one `select` per question; descriptions, previews and the free-text "Type something." row are lost (`GSX:ask-user-question.ts:133-160`); needs the interactive host (`04`) | partial: each question renders as a `select` dialog card (C19); the descriptions, previews and free-text row lost over RPC are not shown | Question cards (exist); Inference: show option descriptions | gentle-shell: richer dialog payload | TBD |

### gentle-ai outside the session

Only what a gentle-shell or desktop user touches. gentle-ai also configures other agents (Claude Code, Codex, OpenCode, Cursor, Gemini and more, `GAI:internal/agents/`); that support is out of scope here.

| Capability | In the CLI | Exposed over RPC | Desktop status | Desktop surface | Upstream dependency | Priority |
|---|---|---|---|---|---|---|
| **GA1** Install and sync the pi stack | `gentle-ai install --agent pi --scope global`, `gentle-ai sync` (`GAI:internal/app/app.go:145-154`, `:306`, `:320`). Managed packages at `b388eb3`: `npm:gentle-pi`, `npm:gentle-engram`, `npm:pi-web-access`, `npm:pi-btw`; `npm:pi-mcp-adapter` is retired (`GAI:internal/agents/pi/adapter.go:22-29`, `:64-69`). At the pinned `v3.7.0` the list still includes `pi-mcp-adapter` (`gentle-ai@6dee8f8:internal/agents/pi/adapter.go:57-63`). At `b388eb3` the adapter targets `APPEND_SYSTEM.md` and `mcp.json` in the pi agent dir (`GAI:internal/agents/pi/adapter.go:33-34`, `:310-327`). At the pinned `v3.7.0`, `APPEND_SYSTEM.md` is still the system-prompt file (`gentle-ai@6dee8f8:internal/agents/pi/adapter.go:289-291`), but the adapter states that it does not write `mcp.json`: `pi-engram init`, run by `InstallCommand`, is its sole writer (`gentle-ai@6dee8f8:internal/agents/pi/adapter.go:276`, `:398-399`) | no | missing: Q38 | Inference: via L4 | none | TBD |
| **GA2** Review facade | `gentle-ai review <acknowledge-approved\|capture-result\|…\|assess\|start\|validate\|status\|…>` (`GAI:internal/cli/review_facade.go:598`); used by R5 | no: reached only through gentle-shell tools | missing: Q29 | Inference: read-only `review status` / `assess` for the status bar | none | TBD |
| **GA3** Telemetry CLI | `gentle-ai telemetry <status\|policy\|enable\|disable\|preview\|trigger\|runtime> [--json]` (`GAI:internal/cli/telemetry.go:62-80`) | no | missing: Q35 | Inference: privacy settings | none | TBD |
| **GA4** Skill registry and CodeGraph CLI | `gentle-ai skill-registry <refresh\|list>`, `gentle-ai codegraph` (`GAI:internal/app/app.go:120-123`, `:375-382`) | no | missing: Q13 | Inference: covered by I3, I5 | none | TBD |
| **GA5** Version, update, uninstall, restore, doctor | `gentle-ai version`, `update`, `upgrade`, `uninstall`, `restore`, `doctor` (`GAI:internal/app/app.go:104-106`, `:114`, `:155`, `:302-304`, `:331-333`) | no | missing: Q35 | Inference: Diagnostics panel | none | TBD |

### pi core rows that gentle-shell changes

| pi row | What gentle-shell changes | Evidence |
|---|---|---|
| C3, C4, C14 | Esc sends queued messages after an abort; opt-in double Esc; Vim mode; prompt history (V12, V13, V14). | `GSX:gentle-shell.ts:2338-2365`; `RR:932-1004` |
| C17 | The 7 built-in tools are re-registered with card renderers; `codemode` gets a compact card (V15). | `GSX:quiet-tools.ts:32-40`, `:802-804`; `GSL:codemode-renderer.ts:180` |
| K3, K4 | pi's footer is replaced by the shell header and bar (V2). | `GSX:gentle-shell.ts:1768` |
| E2, E9 | The launcher disables pi's built-in `codemode` in homes it owns (L6). | `GS:bin/gentle-shell.mjs:1279-1292` |
| E6, U1 | 3 themes ship; new isolated homes default to `Gentleman-Cute` and fullscreen (V10, L6). | `GS:package.json:64-66`; `RR:348` |
| E1 | Package commands run against the resolved home (L7). | `GSL:gentle-shell-launcher.ts:12` |
| M9 | Adds the `nan` provider (I6). | `GSX:nan-provider.ts:5` |
| E8 | Setup installs gentle-ai v3.7.0's managed packages, which include `npm:pi-mcp-adapter`, and gentle-ai adds it to the home's `settings.json` packages (L4, GA1). gentle-shell's post-setup cleanup removes only `@juicesharp/rpiv-ask-user-question` and `gentle-pi`, so the adapter stays. pi documents that an installed extension registering `/mcp`, naming `pi-mcp-adapter` as the example, replaces the built-in MCP support. `Inference:` the built-in `/mcp` behavior in E8 likely does not apply in a provisioned home. `UNVERIFIED:` whether `pi-mcp-adapter` registers `/mcp`; the package is not installed in any reference checkout. | `gentle-ai@6dee8f8:internal/agents/pi/adapter.go:57-63`, `:440`; `GSL:gentle-shell-launcher.ts:552-555`; `PIDOC:mcp.md:184`; `PISRC:extensions/index.ts:9-13` |
| U4 | The startup header is replaced by the banner (V11). | `GSX:startup-banner.ts:750` |
| T1 | Unchanged (Y5). | — |

### Extension coverage

| Extension entry point | Rows |
|---|---|
| `ask-user-choice.ts`, `ask-user-question.ts` | I10 |
| `child-context.ts`, `child-safety.ts` | Y3 |
| `codegraph-tools.ts` | I5 |
| `gentle-agents.ts` | A1–A7, A9, A10, A12; part of A8 and A11 (it reads the background policy and loads helper definitions, while their commands are registered in `gentle-ai.ts`, `GSX:gentle-ai.ts:9812`, `:9562-9575`) |
| `gentle-ai.ts` | O1, O2, R1–R5, P1, P3, P4, Y1, Y2, A8, A11, I4, I7, I8, I9 |
| `gentle-shell.ts` | V1–V9, V12–V14, V17, O2, V6 |
| `gentle-todo.ts` | O4 |
| `history/index.ts` | V14 |
| `nan-provider.ts` | I6 |
| `pi-pretty.ts` | V15 |
| `quiet-tools.ts` | V15 |
| `resume-hint.ts` | L10 |
| `runtime-metrics.ts` | I9 |
| `skill-registry.ts` | I3 |
| `startup-banner.ts` | V11 |
| `lib/yolo-session-policy.ts` (registered from `gentle-ai.ts:8925`) | Y4 |

### Command and shortcut coverage

| Command or shortcut | Default key / env override | Row |
|---|---|---|
| `/gentle:agents` | `alt+a` (`GENTLE_PI_AGENTS_VIEW_KEY`) | A3 |
| (stop helpers) | `alt+s` (`GENTLE_PI_AGENTS_STOP_KEY`) | A4 |
| (collapse agents card) | `ctrl+shift+a` (`GENTLE_PI_AGENTS_KEY`) | A2 |
| `/gentle:usage` | `alt+u` (`GENTLE_PI_SHELL_USAGE_KEY`) | V4 |
| `/gentle:changes` | `alt+g` (`GENTLE_PI_SHELL_CHANGES_KEY`) | V5 |
| `/gentle:commands` | `alt+k` (`GENTLE_PI_COMMANDS_KEY`) | V7 |
| (collapse todo card) | `ctrl+shift+t` (`GENTLE_PI_TODO_KEY`) | O4 |
| `/history` | `ctrl+shift+r` (fixed) | V14 |
| `/gentle:customize` | — | V8 |
| `/gentle:animations` | — | V9 |
| `/gentle:vim` | — | V12 |
| `/gentle:double-esc-cancel` | — | V13 |
| `/gentle:banner`, `/gentle:toggle-rose`, `/gentle:toggle-text-logo`, `/gentle:banner-color` | — | V11 |
| `/gentle:background-subagents` | — | A8 |
| `/gentle:install-delegation`, `/gentle:install-review` | — | A11 |
| `/gentle:review-mode` | — | R1 |
| `/gentle:review-session-permission` | — | R4 |
| `/gentle:profiles` | — | P1, P2 |
| `/gentle:models` | — | P3 |
| `/gentle:persona` | — | P4 |
| `/gentle:yolo` | — | Y4 |
| `/skill-registry:refresh` | — | I3 |
| `/gentle:status`, `/gentle:doctor` | — | I7 |
| `/gentle:dev-binary` | — | I8 |
| `/gentle:telemetry` | — | I9 |

27 command names and 8 shortcuts. Keys are defaults; `off` or an empty value disables each overridable key (`GSL:agents-keys.ts:11-27`; `GSX:gentle-shell.ts:1199-1209`; `GSL:command-palette.ts:353-357`; `GSX:gentle-todo.ts:65-69`). Shortcuts are terminal key bindings, so none reach an RPC host; the desktop needs its own.

### Tool coverage

| Tools | Row |
|---|---|
| `subagent_list_agents`, `subagent_run`, `subagent_status`, `subagent_result`, `subagent_list_tasks`, `subagent_continue` | A1 |
| `subagent_cancel` | A4 |
| `subagent_reply`, `subagent_parent_message` | A5 |
| `subagent_send_message` | A6 |
| `orchestrator_session_id`, `orchestrator_list`, `orchestrator_send_message` | A9 |
| `gentle_odd_phase` | O2 |
| `todo` | O4 |
| `gentle_review`, `gentle_review_capture`, `gentle_review_capture_group`, `gentle_review_scope` | R5 |
| `session_worktree_register` | V6 |
| `ask_user_question`, `ask_user_choice` | I10 |
| `codegraph` | I5 |
| Re-registered: `read`, `bash`, `grep`, `find`, `ls`, `edit`, `write`; wrapped: `codemode` | V15 |

### Settings gentle-shell owns

All live under the config home `GENTLE_PI_CONFIG_HOME`, default `~/.pi/gentle-ai` (`GSL:agent-home.ts:14-16`). The launcher sets `PI_CODING_AGENT_DIR` and `GENTLE_PI_AGENT_HOME` for the child, but not `GENTLE_PI_CONFIG_HOME` (`GSL:gentle-shell-launcher.ts:946`). `Inference:` these settings are shared between `--link`, `--isolated` and `--home` sessions, unlike pi's own settings.

| File (under the config home unless noted) | Set by | Row |
|---|---|---|
| `persona.json`; project `.pi/gentle-ai/persona.json` | `/gentle:persona` | P4 |
| `models.json`, `models.export.json` | `/gentle:models` | P3 |
| `profiles.json`, `profiles.export.json`; `<git-common-dir>/gentle-ai/profile-pin.json`; `<worktree>/.pi/gentle-ai/profile.json` | `/gentle:profiles` | P1, P2 |
| `background-subagents.json`; project `.pi/gentle-ai/background-subagents.json` | `/gentle:background-subagents` | A8 |
| `double-esc-cancel.json` | `/gentle:double-esc-cancel` | V13 |
| `animations.json` | `/gentle:animations` | V9 |
| `vim.json` | `/gentle:vim` | V12 |
| `banner.json` | `/gentle:banner` and toggles | V11 |
| `card-style.json`, `visual-customization.json`, `visual-profiles.json` | `/gentle:customize` | V8 |
| `history-capture.json` | `/gentle:customize` → History | V14 |
| `runtime-guardrails.json`; project `.pi/gentle-ai/runtime-guardrails.json` | file only | Y1 |
| `dev-binary.json` | `/gentle:dev-binary` | I8 |
| `~/.gentle-shell/config.json` (`home`, `provisioned`) | `gentle-shell home`, L5 | L2, L5 |

### Open questions

- `UNVERIFIED:` whether `/gentle:profiles` and `/gentle:models` really throw under RPC. The code path is read, not run (P1, P3).
- `UNVERIFIED:` what `@heyhuynhgiabuu/pi-pretty` 0.6.27 registers (V15).
- `UNVERIFIED:` how long a first-run provisioning takes in practice (L5).
