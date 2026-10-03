# Architecture audit

> Status: draft.

This audit covers 19 findings about `gentle-shell-desktop@5ab4a00`. The four that matter most are:

- The single-session host blocks multi-chat (A3).
- Windows cannot spawn the launcher at all, as a tester reports in desktop issue #23 (A4).
- Real helper data does not match the desktop parser (A5).
- The chat list runs on a different pi version than the chat itself (A1, A2).

[Recommendations and order](#recommendations-and-order) groups the fixes. The architecture these findings refer to is described in [current.md](current.md).

## Method and scope

- **Sources.** Desktop source and docs at `gentle-shell-desktop@5ab4a00` (source on `docs/corpus` is unchanged), `gentle-shell@ac67159` (gentle-shell `main`, package version 4.0.0), `pi@d981de1` (0.85.1) and `pi@a13d35a` (1.0.0); refreshed 2026-10-03, with desktop issues #23–#25 and open PRs #26 and #27 read on GitHub that day. `gentle-shell@1162ce9` (3.7.0) and `pi@d86654a` (0.99.1) appear only in version comparisons. Protocol findings defer to [04-rpc-contract.md](../04-rpc-contract.md). IDs from other pages are qualified (`gap G9`, `inventory C20`); unqualified M1–M6 are the maintainer's milestones, and T-numbers are tasks inside them.
- **Method.** Static reading only. Nothing was built, run or installed. Behavior derived from reading code is labelled `Inference:` with "(not run)".
- **Not covered.** Rendering performance, accessibility, packaged-app size, and a line-by-line comparison of pi 0.85.1 and 0.99.1 session parsing.

### Severity criteria

| Severity | Criterion |
|---|---|
| **High** | Blocks a stated product goal (README milestones, mockup intent), or breaks a core flow for some users on a configured platform. |
| **Medium** | Shows the user wrong or missing data, or is a latent defect with a plausible trigger, or a missing safeguard on a component that needs it (CI, version check). |
| **Low** | Maintainability, documentation drift, or a defect with a narrow trigger or cosmetic effect. Includes hardening gaps with no identified attack path. |

## Findings

### Summary

| # | Finding | Severity | Group |
|---|---|---|---|
| A1 | Two data paths to pi and a global `PI_CODING_AGENT_DIR` mutation | Medium | Multi-chat |
| A2 | pi version skew between the two paths | Medium | Correctness |
| A3 | Single-session host with positional message ids | High | Multi-chat |
| A4 | Windows `.cmd` launcher spawned without a shell | High | Platform |
| A5 | Helper status set and tool items do not match gentle-shell | Medium | Correctness |
| A6 | Reducer drops non-assistant messages from the live view | Low | Correctness |
| A7 | Prompts declined while working, despite steer and follow-up | Medium | Correctness |
| A8 | No version handshake | Medium | Correctness |
| A9 | Launcher first-run provisioning shows no progress | Medium | Platform |
| A10 | New chats run in the app's working directory | Medium | Correctness |
| A11 | Chat list and selection lifecycle | Medium | Multi-chat |
| A12 | Dialog timeouts not modeled | Low | Correctness |
| A13 | Previous chat's thread stays visible while switching | Low | Correctness |
| A14 | Preload and IPC hardening | Low | Security |
| A15 | Silent mock-bridge fallback in packaged builds | Medium | Correctness |
| A16 | Test coverage and CI gaps | Medium | Process |
| A17 | Drift from the stated structure rules | Low | Maintainability |
| A18 | Launcher discovery and platform coverage | Low | Platform |
| A19 | Two persisted home choices | Low | Correctness |

### A1. Two data paths to pi and a global `PI_CODING_AGENT_DIR` mutation

**Evidence**
- The chat list imports pi in-process: `gentle-shell-desktop@5ab4a00:src/main/adapters/piSessionStore.ts:30`.
- That adapter sets `process.env.PI_CODING_AGENT_DIR`, awaits `SessionManager.listAll()`, then restores the previous value (`:32-39`). Its comment calls this "a real, accepted M1 limitation" (`:22-25`).
- Chat goes through the spawned CLI: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:126-135`.
- The same `process.env` object feeds other code:
  - `ChatHost` env: `gentle-shell-desktop@5ab4a00:src/main/index.ts:64`.
  - `setupService` and `detectPi`: `gentle-shell-desktop@5ab4a00:src/main/adapters/setupService.ts:17`, `:22`, and `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:45-47`.
- Two `listAll()` calls can overlap. Each `ChatHost.openChat` runs one (`gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:104`). The sidebar runs one on mount (`gentle-shell-desktop@5ab4a00:src/renderer/features/chats/ChatsContainer.tsx:29-44`). React `StrictMode` runs mount effects twice in development (`gentle-shell-desktop@5ab4a00:src/renderer/main.tsx:13`).

**Impact**
- The desktop depends on pi's library API and on-disk layout as well as the RPC contract, so the RPC contract alone does not describe the desktop's coupling to pi.
- `Inference:` (not run) two overlapping calls can leave the variable set for good. Call A saves `undefined`. Call B saves A's value. A then deletes the variable, and B restores A's value. Once leaked, `detectPi` and the `link` directory resolve to the listed home instead of the user's real pi dir. Every later spawn also inherits the leaked value. The launcher overrides it for pi itself (`gentle-shell@ac67159:lib/gentle-shell-launcher.ts:960`), but since 4.0.0 it derives `GENTLE_SHELL_USER_PI_HOME` from the inherited `PI_CODING_AGENT_DIR` when no `GENTLE_SHELL_USER_PI_HOME` is inherited (`:197-205`, `:962`), so `/gentle:stats` would then read the listed home as the user's pi home.
- Running several chats or homes at once would make this race routine.

**Severity:** Medium. A latent defect with a plausible trigger; impact is limited while there is only one home.

**Recommendation:** Do one of the following:
- Move session listing behind the RPC child (pi has no list command today; see the [command table](../04-rpc-contract.md#commands-desktop--runtime)).
- Read the session directory without mutating the environment, for example by enumerating `<home>/sessions/*/` and calling the `listAll(sessionDir)` overload per subdirectory (`gentle-shell-desktop@5ab4a00:src/main/adapters/piSessionStore.ts:10-17`).
- At minimum, serialize `listAll()` calls.

### A2. pi version skew between the two paths

**Evidence**
- The desktop depends on pi `^0.85.1`, locked to 0.85.1: `gentle-shell-desktop@5ab4a00:package.json:42`, `gentle-shell-desktop@5ab4a00:pnpm-lock.yaml:323`.
- The RPC peer is at least 0.99.1, and gentle-shell 4.0.0 develops against ≥ 1.0.0: `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`, `gentle-shell@ac67159:package.json:78`, `:95`. The skew is now 0.85.1 against ≥ 0.99.1, with 1.0.0 the development target.
- The session format version is 3 in all three: `pi@d981de1:packages/coding-agent/src/core/session-manager.ts:30`, `pi@a13d35a:packages/coding-agent/src/core/session-manager.ts:41` (byte-identical in 0.99.1).
- The bundled pi brings transitive install scripts: `gentle-shell-desktop@5ab4a00:pnpm-workspace.yaml:1-10`.

**Impact**
- The sidebar reads sessions written by a newer pi with an older parser.
- `UNVERIFIED:` whether 0.99.1 or 1.0.0 session headers or entries break 0.85.1's `listAll()` was not checked. The equal format version lowers, but does not remove, the risk.
- `Inference:` the packaged app also ships a full pi library only to list sessions.

**Severity:** Medium. A latent defect whose trigger is any future session format change.

**Recommendation:** Remove the in-process path (see A1). If it stays, pin the desktop's pi to the same minor as gentle-shell's floor and add a fixture test that lists session files written by pi 0.99.1 and 1.0.0.

### A3. Single-session host with positional message ids

**Evidence**
- One session at a time:
  - `ChatHost` keeps one `current` session and stops it before starting another: `gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:61-70`, `:156-157`.
  - `ChatState` and the `chat.state` push carry no chat id: `gentle-shell-desktop@5ab4a00:src/shared/bridge-types.ts:122-129`, `gentle-shell-desktop@5ab4a00:src/main/ipc/registerHandlers.ts:39`.
  - The bridge sends to "whichever chat is currently open": `gentle-shell-desktop@5ab4a00:src/shared/bridge-types.ts:279-282`.
- Positional ids:
  - Message ids are `msg-<array length>`: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:334`, `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:85`, `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/history.ts:20-48`.
  - Dropping an empty assistant message hands its id to the next message: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:133-138`.
- Sidebar status:
  - Every listed chat is `idle`: `gentle-shell-desktop@5ab4a00:src/main/domain/session/sessionList.ts:20-22`, `:35`.

**Impact**
- The mockup's sidebar statuses ("working", "needs you") and toasts about other chats cannot be built ([gap G9](../04-rpc-contract.md#gaps-the-desktop-needs)).
- Ids are not tied to pi entry ids, so nothing can anchor helpers under a message, fork, or survive a reload. `Inference:` reused ids can make React reuse a component for a different message.

**Severity:** High. Blocks a stated product goal (concurrent chats in the mockup).

**Recommendation**
1. Introduce a session registry keyed by pi session id: one `PiSession` per open chat, as allowed by the protocol ([gap G9](../04-rpc-contract.md#gaps-the-desktop-needs)).
2. Add a `chatId` to every push and command.
3. Derive per-chat status from each session's state.
4. Take message ids from pi (entry ids via `get_entries`/`entry_appended`, or the message's own identity) instead of array positions.

### A4. Windows `.cmd` launcher spawned without a shell

**Evidence**
- On win32 the locator picks `gentle-shell.cmd` first: `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:48`.
- The spawner calls `spawn` with no `shell` option: `gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:10`.
- gentle-shell documents the same failure for its own pi spawn ("Current Node releases refuse to spawn a batch file directly without `shell: true` (EINVAL)") and routes `.cmd`/`.bat` through `cmd.exe` with explicit quoting, unchanged in 4.0.0: `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:969-1019`. Its own pi spawn passes no `windowsHide` (`gentle-shell@ac67159:bin/gentle-shell.mjs:1396`).

**Impact:** on Windows with an npm-installed launcher, every spawn fails, so no chat can start. Desktop issue #23 (Mayloparra24, 2026-09-26, open) reports this with reproduction steps on gentle-pi 3.7.0 and "Pi version 0.87.1": `spawn EFTYPE`, "on some Node versions `spawn EINVAL`"; pointing `GENTLE_SHELL_BIN` at the package's `bin/gentle-shell.mjs` works around it. `Inference:` the reported pi version is questionable: 0.87.1 is below the launcher's `MIN_PI_VERSION = "0.99.1"` at 3.7.0 and on `main` (`gentle-shell@1162ce9:lib/gentle-shell-launcher.ts:382`; `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:392`), so it is probably not the pi the launcher resolves. Issue #24 (same author, open) reports one visible console window per open chat and notes it "may belong to the grandchild `pi` process"; `UNVERIFIED:` which process owns the window. **Not reproduced by the corpus authors.**

**Severity:** High. Breaks the core flow on a configured platform (`gentle-shell-desktop@5ab4a00:electron-builder.yml:31-34`).

**Recommendation:** Mirror gentle-shell's `planSpawn` in `nodeProcessSpawner` or the locator. For `.cmd`/`.bat` on win32, run through `cmd.exe` with quoted tokens. Unit-test the plan with `platform` injected. Reproduce on Windows before and after the fix. Open PR #26 (head `615dd87`, not merged as of 2026-10-03; closes #23 and #24) always sets `windowsHide: true` and sets `shell: true` on win32 when the command ends in `.cmd`/`.bat`, but passes the command and arguments unquoted, unlike `planSpawn`; the desktop's arguments include paths (`--session <path>`, and `--home <dir>` when `GENTLE_SHELL_HOME` is set: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:127-133`, `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:33-36`), and the locator returns an unquoted path (`gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:53-54`). `Inference:` (not run) a path with spaces or `cmd.exe` metacharacters would be split or interpreted by `cmd.exe`. Details: [10-platforms.md](../10-platforms.md#spawning-batch-shims).

### A5. Helper status set and tool items do not match gentle-shell

**Evidence**
- gentle-shell task statuses are `queued`, `running`, `waiting`, `completed`, `failed`, `cancelled`, `timed_out`: `gentle-shell@ac67159:lib/agents-protocol.ts:9-17`. The activity files (`lib/agents-protocol.ts`, `lib/agents-rpc-publisher.ts`, `docs/gentle-agents-activity.md`) are byte-identical between 3.7.0 (`1162ce9`) and `ac67159`, so this finding stands as written.
- The desktop accepts `queued`, `running`, `waiting`, `done`, `failed`, `cancelled`, and `toTask` drops a task with any other status: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:21`, `:83-85`, `:139-141`.
- gentle-shell's tool thread items have no `callId` (`gentle-shell@ac67159:lib/agents-rpc-publisher.ts:96-105`). The desktop requires one (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/helpersActivity.ts:107-108`) and uses it as the React key (`gentle-shell-desktop@5ab4a00:src/renderer/features/helpers/components/HelperThread.tsx:24`).
- The fixture uses `done` and includes `callId` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/__fixtures__/helpers-activity.jsonl:2`, `:4`). The mock bridge does too (`gentle-shell-desktop@5ab4a00:src/renderer/shared/bridge/mockBridge.ts:359`).

**Impact:** `Inference:` (not run):
- **Tool rows never appear.** Every real tool item is dropped from the Helpers thread.
- **Wrong final status.** A task seen while running and then sent as `completed` or `timed_out` is dropped from the frame, so the retention merge keeps its last record and turns `running` into `done` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:225-240`). `completed` ends up correct by accident; a timeout shows as done. `failed` and `cancelled` are accepted and shown correctly.
- **Missing helpers.** A task first seen already `completed` or `timed_out`, for example after opening a chat, is dropped.

This refines [04-rpc-contract.md observation 6](../04-rpc-contract.md#compatibility-observations): the retention merge hides part of the loss.

**Severity:** Medium. Wrong or missing data shown to the user.

**Recommendation:** Accept the gentle-shell status set, mapping `completed` to done and keeping `timed_out` distinct. Make `callId` optional and key tool items by index. Regenerate the fixture from real `gentle-agents.activity/v1` output.

### A6. Reducer drops non-assistant messages from the live view

**Evidence**
- `message_start` and `message_end` are ignored unless `role === "assistant"`: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:81-82`, `:115-116`.
- User messages appear live only because `PiSession.prompt` appends them locally: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:182`.
- History keeps user and assistant messages: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/history.ts:36-50`.
- pi 0.99.1 adds a `system` role ([04-rpc-contract.md](../04-rpc-contract.md#differences-between-pi-0851-and-0991-events)). Since gentle-shell 4.0.0, a helper result for an idle parent is stored as a custom message without a turn, then the parent is woken by a user-role message, "[System-generated Gentle Agents notification, not written by the user] …" (`gentle-shell@ac67159:extensions/gentle-agents.ts:63-65`, `:691`, `:698-706`; [inventory A7](../05-capability-inventory.md#helpers-subagents)).

**Impact:** User messages that do not come from the composer appear only after a reload, so the live thread and the reloaded thread can differ. Examples are messages injected by extensions or delivered from a steer or follow-up queue. `Inference:` (not run) with gentle-shell 4.0.0 the idle-parent wake is such a message: it happens whenever a helper finishes while the chat is idle, the live view hides it, and after a reload it appears as a user bubble without the helper result. Hiding tools and thinking is intended ([ADR 0007](adr/0007-text-only-chat-view.md)); hiding these messages is a side effect.

**Severity:** Low today, unchanged by the 4.0.0 wake: its visible effect appears only after a reload, and the text labels itself as system-generated. It rises to Medium once the desktop sends `steer` or `follow_up` (A7).

**Recommendation:** Build the thread from pi's message events for every role the view shows, instead of appending locally, and reconcile by message identity (A3).

### A7. Prompts declined while working, despite steer and follow-up

**Evidence**
- `PiSession.prompt` returns `{queued:false, reason:"Gentle is still working"}` while `working`: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:168-180`.
- The composer blocks sends while `working`: `gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/ConversationContainer.tsx:99`.
- `RpcCommand` has no `streamingBehavior`, `steer` or `follow_up`: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/types.ts:27-41`.
- pi supports both, and runs extension commands immediately even during streaming: `pi@a13d35a:packages/coding-agent/docs/rpc-commands.md:27-31`.
- `working` is cleared on `agent_end` even when a retry will follow: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:56-58` ([observation 3](../04-rpc-contract.md#compatibility-observations)).

**Impact**
- Users cannot steer a running agent or queue a follow-up.
- `/gentle:*` commands are blocked while working.
- `Inference:` (not run) during an auto-retry the composer re-enables, and a prompt sent then is rejected by pi with an error.

**Severity:** Medium. A core interaction is missing, and there is a plausible error path.

**Recommendation:** Send `prompt` with `streamingBehavior` (or `steer`/`follow_up`) while working, and always pass extension commands through. Clear `working` only on `agent_settled`. Read `queue_update` to show what is queued.

### A8. No version handshake

**Evidence**
- `src/main` never runs `--version` or compares versions. The only version text is an error message: `gentle-shell-desktop@5ab4a00:src/main/adapters/launcherLocator.ts:26-28`.
- The protocol has no version field ([04-rpc-contract.md: Versioning](../04-rpc-contract.md#is-there-a-version-handshake)).

**Impact:** An older gentle-pi degrades silently. For example, the Helpers tab stays empty without 3.7.0 (`gentle-shell-desktop@5ab4a00:README.md:89-91`). Skew problems (A2, A5) are found only by symptoms.

**Severity:** Medium. A missing safeguard on a cross-repository boundary.

**Recommendation:** Run `gentle-shell --version` once per launch (`gentle-shell@ac67159:bin/gentle-shell.mjs:1217-1219`), show the versions, and warn below a minimum. Longer term, propose a versioned capability record upstream ([gap G10](../04-rpc-contract.md#gaps-the-desktop-needs)).

### A9. Launcher first-run provisioning shows no progress

**Evidence**
- On the first run in an isolated or `--home` home, the launcher installs the gentle-ai companion packages before starting pi, still at `ac67159`: `gentle-shell@ac67159:bin/gentle-shell.mjs:1114-1140`, `:1265-1268`.
- Progress goes only to stderr: `:819`, `:1139-1140`, `:1160`.
- Each child may take up to 15 minutes: `:1089`.
- The desktop logs child stderr to its own console and never shows it: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:292-295`, `gentle-shell-desktop@5ab4a00:src/main/index.ts:42-44`.
- `isolated` is the default when no pi is found: `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:17-19`, `gentle-shell-desktop@5ab4a00:src/main/adapters/setupService.ts:24`.
- The app spawns a new chat as soon as it opens: `gentle-shell-desktop@5ab4a00:src/renderer/app/App.tsx:9`, `:35`.
- Switching chats stops the child after 3 s: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:57`, `:213-235`.

**Impact:** `Inference:` (not run):
- A new user without pi sees an idle chat for minutes, with no sign of work.
- A prompt sent meanwhile waits in the stdin pipe.
- Switching chats during provisioning kills the launcher. It treats the signal as an interrupt and retries on the next run (`gentle-shell@ac67159:bin/gentle-shell.mjs:1102-1113`).

**Severity:** Medium. A degraded first experience on the default path.

**Recommendation:** Run `gentle-shell setup` (or an equivalent) as a visible step in the first-run screen, or surface the launcher's stderr lines while no RPC record has arrived yet. Do not auto-spawn a chat before the user acts.

### A10. New chats run in the app's working directory

**Evidence**
- `PiSession` supports `cwd` (`gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:15`, `:135`), but `ChatHost` never passes one (`gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:159-166`).
- The spawner then inherits the Electron process's working directory (`gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:10`), and so does the launcher (`gentle-shell@ac67159:bin/gentle-shell.mjs:1396`).
- pi creates a new session in `process.cwd()`: `pi@a13d35a:packages/coding-agent/src/main.ts:448`, `:591`, `:693`.
- pi reopens a session in its header cwd: `pi@a13d35a:packages/coding-agent/src/core/session-manager.ts:1782`.

**Impact:** New chats work in whatever directory the app was started from. There is no way to choose a project folder. The mockup status bar shows a cwd ([gap G7](../04-rpc-contract.md#gaps-the-desktop-needs)). `UNVERIFIED:` the working directory of a macOS app launched from Finder was not checked.

**Severity:** Medium. Wrong context for the agent's file and tool operations.

**Recommendation:** Add a project folder choice to "New chat" and pass it as `cwd`. Show the cwd per chat (`ChatSummary.cwd` already exists, `gentle-shell-desktop@5ab4a00:src/shared/bridge-types.ts:26-27`).

### A11. Chat list and selection lifecycle

**Evidence**
- **The sidebar loads once.** It calls `listChats()` on mount and never again: `gentle-shell-desktop@5ab4a00:src/renderer/features/chats/ChatsContainer.tsx:29-44`.
- **"New chat" can be a no-op.** The new-chat selection is a single constant, `NEW_CHAT`, and "New chat" sets it again (`gentle-shell-desktop@5ab4a00:src/renderer/app/App.tsx:9`, `:58-60`). The open effect depends on that object (`gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/ConversationContainer.tsx:81-95`).
- **A chat starts on launch.** `App` selects a new chat on mount (`gentle-shell-desktop@5ab4a00:src/renderer/app/App.tsx:35`).

**Impact:** `Inference:` (not run):
- Chats created in the app never appear in the sidebar until a restart.
- Clicking "New chat" while a new chat is open does nothing, because React skips an update to the same state value, so a second fresh chat cannot be started without opening another chat first.
- Every launch spawns a child, even just to browse.

**Severity:** Medium. Wrong or missing data in the sidebar.

**Recommendation:** Refresh the list after `newChat` and after each completed turn (or push list changes from main). Create a fresh selection object (or a counter) per "New chat" click. Spawn on first send instead of on mount.

### A12. Dialog timeouts not modeled

**Evidence**
- The codec decodes `timeout` (`gentle-shell-desktop@5ab4a00:src/main/domain/rpc/codec.ts:161`, `:172`, `:183`), but the reducer and the `Dialog` type drop it: `gentle-shell-desktop@5ab4a00:src/main/domain/rpc/chatReducer.ts:167-179`, `gentle-shell-desktop@5ab4a00:src/shared/bridge-types.ts:70-82`.
- pi resolves a timed-out dialog on its own (`pi@a13d35a:packages/coding-agent/src/modes/rpc/rpc-mode.ts:115-120`) and silently drops a late response ([Correlation and errors](../04-rpc-contract.md#correlation-and-errors)).

**Impact:** `Inference:` (not run) the card stays on screen after pi has moved on, and the user's answer is ignored with no feedback.

**Severity:** Low. A narrow trigger: only dialogs that set a timeout.

**Recommendation:** Carry `timeout` into `Dialog`, show a countdown, and remove the card when it expires.

### A13. Previous chat's thread stays visible while switching

**Evidence**
- The old session is fully stopped before the new one is built. `performStart` awaits `this.current?.stop()` first: `gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:156-159`.
- `stop()` waits on `exited`, or kills after a 3 s grace period and waits again: `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.ts:57`, `:213-235`.
- `exited` settles on the child's `'close'` event (`gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:33-42`). Node emits `'close'` after the child's stdio streams have closed (https://nodejs.org/api/child_process.html#event-close). Stdout lines are handled synchronously on `data` and `end` (`gentle-shell-desktop@5ab4a00:src/main/adapters/nodeProcessSpawner.ts:74-88`). So no stdout event from the old child arrives after `stop()` resolves.
- `ChatHost` never detaches the old session's `state` and `error` listeners (`gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:167-168`), but after `stop()` resolves the old child has no output left to emit.
- The renderer does not reset the thread on a switch. The open effect clears only the bridge error and replaces `chatState` when the open call resolves: `gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/ConversationContainer.tsx:81-95`. The header title follows the new selection at once (`:118`).
- The open call resolves after the old stop, the `listAll()` lookup for an existing chat, the spawn, and for an existing chat the history load: `gentle-shell-desktop@5ab4a00:src/main/domain/session/ChatHost.ts:103-107`, `:172-184`.

**Impact:** `Inference:` (not run) after a click on another chat, the previous chat's messages stay on screen under the new chat's title until the new session pushes a state or the open call resolves. Pushes from the old session during its stop still update that stale view (`gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/ConversationContainer.tsx:60-67`). A late event from the old session cannot overwrite the new chat's state, because the new session does not exist until the old one has stopped.

**Severity:** Low. Cosmetic and transient: the wrong thread is shown, but no state is mixed between chats.

**Recommendation:** Reset `chatState` (or show a loading state) when `activeChat` changes. Tag pushes with a chat id when multi-chat lands (A3).

### A14. Preload and IPC hardening

**Evidence**
- `sandbox: false`: `gentle-shell-desktop@5ab4a00:src/main/index.ts:85`.
- IPC handlers use the renderer's arguments as-is, with no type checks and no sender check: `gentle-shell-desktop@5ab4a00:src/main/ipc/registerHandlers.ts:28-37`.
- The production CSP allows `'unsafe-eval'` and loads fonts from Google at runtime: `gentle-shell-desktop@5ab4a00:src/renderer/index.html:5-16`.
- No `will-navigate` guard exists (search for `will-navigate` in `src/` returns nothing).
- Mitigations in place:
  - `contextIsolation: true` and `nodeIntegration: false`: `gentle-shell-desktop@5ab4a00:src/main/index.ts:83-84`.
  - All new windows are denied: `:97-102`.
  - Markdown is sanitized with DOMPurify: `gentle-shell-desktop@5ab4a00:src/renderer/shared/markdown/renderMarkdown.ts:58-72`.

**Impact:** No attack path was identified, but the renderer shows model output, and the bridge reaches a process that runs tools. Defense in depth is thin. An offline launch also loses the fonts.

**Severity:** Low. No attack path identified.

**Recommendation:**
- Validate IPC arguments in `registerHandlers`.
- Enable the sandbox. `UNVERIFIED:` whether the ESM preload (`preload/index.mjs`, `gentle-shell-desktop@5ab4a00:src/main/index.ts:82`) prevents this was not checked against Electron's documentation.
- Drop `'unsafe-eval'` from the production CSP and bundle the fonts.
- Add a `will-navigate` deny handler.

### A15. Silent mock-bridge fallback in packaged builds

**Evidence**
- `useBridge()` returns the mock whenever `window.gentle` is missing, with no environment check: `gentle-shell-desktop@5ab4a00:src/renderer/shared/bridge/useBridge.ts:10-12`.
- The smoke check passes if the body contains "Chats", which the mock UI also renders: `gentle-shell-desktop@5ab4a00:scripts/smoke-electron.mjs:39-56`.
- M1 already hit a preload crash that left a blank window: `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:56`.

**Impact:** `Inference:` (not run) if the preload fails in a packaged build, the user sees fake chats and fake streamed replies instead of an error, and the smoke check still passes.

**Severity:** Medium. Shows wrong data with no signal.

**Recommendation:** Use the mock only in the `dev:web` build (for example behind an `import.meta.env` flag). Show an explicit error when the bridge is missing in Electron. Make the smoke check assert that `window.gentle` exists.

### A16. Test coverage and CI gaps

**Evidence**
- **No CI.** `.github/` holds only issue templates (file listing at `5ab4a00`).
- **Fixtures not from real output.** They encode the desktop's assumptions, not gentle-shell output (A5).
- **No tests for:**
  - the composition root and quit path: `src/main/index.ts`;
  - the Windows paths in `launcherLocator`;
  - `HelpersSummary`: no dedicated test file and no assertion on its text was found; it is only rendered inside `HelpersContainer.test.tsx`.

  This list comes from a sibling-test scan with `fd`, then a search of parent tests.
- **No dedicated test file, but covered through parents:**
  - `ChatListItem`, by `gentle-shell-desktop@5ab4a00:src/renderer/features/chats/components/ChatList.test.tsx:22-53`;
  - `HelperListItem`, by `gentle-shell-desktop@5ab4a00:src/renderer/features/helpers/components/HelperList.test.tsx`;
  - `HelperThreadItem`, by `gentle-shell-desktop@5ab4a00:src/renderer/features/helpers/components/HelperThread.test.tsx`;
  - `HelpersFooter` (Back to chat, Show tool details, disabled Stop), by `gentle-shell-desktop@5ab4a00:src/renderer/features/helpers/HelpersContainer.test.tsx:93-131`;
  - `HelpersStrip`, by `gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/ConversationContainer.test.tsx:264`;
  - the atoms (`Button`, `Pill`, `TextField`), rendered by the components that use them;
  - `nodeProcessSpawner`, by `gentle-shell-desktop@5ab4a00:src/main/domain/session/PiSession.test.ts:130-140`.
- **No automated test runs against a real gentle-shell.** At M1 close the real chat had not been exercised at all: `gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m1-chat-core.md:65`. M2 later recorded manual end-to-end runs against a real pi, including the maintainer's real home (`gentle-shell-desktop@5ab4a00:odd/tasks/desktop-m2-helpers.md:57`, `:64`). Those runs are not part of the test suite.

**Impact:** Regressions reach `main` unchecked. Contract drift with gentle-shell passes the tests (A5).

**Severity:** Medium. A missing safeguard.

**Recommendation:** Add a CI workflow (`pnpm test`, `pnpm typecheck`, `pnpm build`, and `smoke:electron` under xvfb on Linux), with a Windows job once A4 is fixed. Record fixtures from a real gentle-shell run. Add a contract test that loads gentle-shell's published activity example.

### A17. Drift from the stated structure rules

**Evidence**
- **Node imports in the domain.** `src/main/domain/home/home.ts` imports `node:fs`, `node:os` and `node:path` (`gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:1-3`), despite "no Electron or Node imports allowed here" (`gentle-shell-desktop@5ab4a00:src/main/domain/index.ts:1-4`). `src/README.md` states the narrower rule that the domain stays "free of Electron imports" (`gentle-shell-desktop@5ab4a00:src/README.md:45-51`), which `home.ts` does not break.
- **A shared module with one consumer.** `renderer/shared/markdown` has one consumer (`MessageBubble`) and justifies itself by a "later" helpers use (`gentle-shell-desktop@5ab4a00:src/renderer/shared/markdown/Markdown.tsx:11-14`). `src/README.md:34-35` says "Nothing moves there speculatively".
- **A note that does not exist.** `App.tsx` cites a "Selected chat" note in the M1 document (`gentle-shell-desktop@5ab4a00:src/renderer/app/App.tsx:21-23`). That note is not in `odd/tasks/desktop-m1-chat-core.md`. `ConversationContainer.tsx` cites the M1 document in general for "no global store for M1" (`gentle-shell-desktop@5ab4a00:src/renderer/features/conversation/ConversationContainer.tsx:13-14`), and no such statement was found there either.
- **A stale placeholder.** `SessionPlaceholder` and its "placeholder for T3" comment remain: `gentle-shell-desktop@5ab4a00:src/main/domain/index.ts:8-9`, `:16-18`.

**Impact:** Small, but these rules are what contributors are told to follow.

**Severity:** Low.

**Recommendation:** Move the `fs`/`homedir` lookups behind a port or into an adapter. Either move Markdown into `conversation` or record the exception. Fix the dangling reference. Delete the placeholder.

### A18. Launcher discovery and platform coverage

**Evidence**
- Apps opened from Finder lack the shell `PATH`, so the launcher is not found: `gentle-shell-desktop@5ab4a00:README.md:52-58`.
- `dev:local-pi` uses POSIX `${VAR:-default}` syntax: `gentle-shell-desktop@5ab4a00:package.json:23`. Desktop issue #25 (open) reports that it fails under Windows PowerShell. Open PR #27 (head `f42c3bd`, not merged as of 2026-10-03; closes #25) replaces the script with `node scripts/dev-local-pi.mjs`, which resolves `GENTLE_SHELL_BIN` or the default path and spawns `electron-vite dev` with `shell` on win32.
- Only macOS Apple silicon is tested: `gentle-shell-desktop@5ab4a00:README.md:7`.
- No signing or notarization: `gentle-shell-desktop@5ab4a00:electron-builder.yml:30`, `gentle-shell-desktop@5ab4a00:README.md:64`.

**Impact:** A packaged macOS app fails on a normal launch unless started from a terminal or given `GENTLE_SHELL_BIN`. `Inference:` `dev:local-pi` fails under Windows `cmd.exe`.

**Severity:** Low. Documented, and has workarounds.

**Recommendation:** Resolve the login shell `PATH` at startup on macOS, or let the user pick the launcher path in the app and save it. Make `dev:local-pi` cross-platform (open PR #27 proposes this). Platform requirements of the upstream pieces: [10-platforms.md](../10-platforms.md).

### A19. Two persisted home choices

**Evidence**
- The desktop saves its own `{home}` in `userData/config.json`: `gentle-shell-desktop@5ab4a00:src/main/adapters/appConfigStore.ts:20-42`.
- gentle-shell saves a home choice in `~/.gentle-shell/config.json` and uses it when no flag is passed: `gentle-shell@ac67159:lib/gentle-shell-launcher.ts:218-224`, `:241-243`.
- The desktop always passes a flag: `gentle-shell-desktop@5ab4a00:src/main/domain/home/home.ts:33-37`.

**Impact:** `Inference:` the terminal `gentle-shell` and the desktop can use different homes, so a chat started in one does not appear in the other.

**Severity:** Low.

**Recommendation:** Read gentle-shell's saved choice as the default for the desktop's first run, or write the desktop's choice through `gentle-shell` itself. This needs a maintainer decision (see [ADR index](adr/README.md#undecided--not-recorded)).

## Risks for scaling the UI

These follow from the findings. They are not separate defects.

| Planned surface | Blocking findings | Note |
|---|---|---|
| Several chats at once (mockup sidebar statuses, toasts) | A3, A1, A11 | Needs a session registry and chat-scoped pushes before any UI work. |
| ODD panel (M3) | A3, A8 | Needs structured ODD state, which RPC does not provide ([gap G2](../04-rpc-contract.md#gaps-the-desktop-needs)). |
| Helper Stop | A5 | Needs an RPC command upstream ([gap G1](../04-rpc-contract.md#gaps-the-desktop-needs)). The desktop parser must be correct first. |
| Providers and extensions screens (M4) | A2, A8 | Either more in-process pi (which makes A1 and A2 worse) or new RPC commands ([gaps G3–G5](../04-rpc-contract.md#gaps-the-desktop-needs)). |
| Windows and Linux releases | A4, A16, A18 | No CI and no tested platforms besides macOS. Platform detail: [10-platforms.md](../10-platforms.md). |

## Recommendations and order

Within each group, the order is the suggested sequence.

### 1. Unblock multi-chat

1. **A3:** session registry keyed by pi session id; `chatId` on every push and command; stable message ids.
2. **A11:** refresh the chat list; per-click new-chat selection; spawn on first send.
3. **A1:** stop mutating `PI_CODING_AGENT_DIR`; at minimum serialize `listAll()`.

### 2. Fix correctness bugs

1. **A5:** align helper statuses and make `callId` optional; real fixtures.
2. **A7:** steer and follow-up while working; clear `working` on `agent_settled`.
3. **A15:** limit the mock bridge to `dev:web`; smoke check asserts `window.gentle`.
4. **A10:** project folder per new chat.
5. **A8:** read and show versions at launch; warn below minimums.
6. **A2:** align or remove the in-process pi dependency.
7. **A6, A12, A13, A19:** live thread from pi events; dialog timeouts; reset the thread on chat switch; home choice alignment.

### 3. Platform

1. **A4:** Windows `.cmd` spawn through `cmd.exe` with quoted tokens (reproduce first; open PR #26 does not quote).
2. **A16:** CI with test, typecheck, build and smoke; add Windows once A4 lands.
3. **A9:** visible first-run provisioning.
4. **A18:** macOS `PATH` resolution or a saved launcher path; cross-platform scripts.

### 4. Hygiene

- **A14:** IPC argument validation, sandbox, CSP without `'unsafe-eval'`, bundled fonts, `will-navigate` guard.
- **A17:** structure drift fixes.
