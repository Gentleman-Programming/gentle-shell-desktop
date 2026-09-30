# Electron System Design and Engineering Guide

A project-agnostic guide to Electron's process model, safe inter-process communication, security, debugging, and testing. It is intended as a starting point for designing or diagnosing an Electron application, not as a description of any particular repository.

## Start with the mental model

Treat an Electron app as a small distributed system running on one user's machine. Its processes have different responsibilities, capabilities, failure modes, and debugging surfaces. Pass data and requests across boundaries deliberately; do not treat the app as one JavaScript runtime.

```text
                         ┌──────────────────────┐
                         │      Main process    │
                         │ lifecycle · windows  │
                         │ OS APIs · IPC router │
                         └──────┬────────┬──────┘
                                │        │
                     IPC / API │        │ messages / ports
                                │        │
             ┌──────────────────▼─┐   ┌──▼────────────────┐
             │ Preload → Renderer │   │ Utility process   │
             │ narrow bridge      │   │ isolated Node work │
             │ UI / web platform  │   └───────────────────┘
             └────────────────────┘
```

| Component | Runtime and role | Good fit | Avoid |
| --- | --- | --- | --- |
| **Main process** | Node.js; one per app | App lifecycle, window management, native menus/dialogs, trusted orchestration | Long CPU-bound work, rendering UI, accepting unvalidated renderer requests |
| **Renderer process** | Chromium; typically a separate renderer for each window or web embed | UI, application presentation, web-platform code | Direct Node.js access, trusted access to the filesystem or shell |
| **Preload script** | Runs before page code in a renderer, with privileged capabilities | Small, purpose-built bridge between UI and approved main-process operations | Exposing raw Electron/IPC APIs or broad privileged objects |
| **Utility process** | Separate Node.js child process | CPU-heavy, crash-prone, or service-like work that benefits from process isolation | Treating it as a security sandbox for arbitrary hostile code |

Electron documents the main process as the app entry point and lifecycle owner. A `BrowserWindow` creates web contents in a renderer process. Utility processes are an option for work that should not run in the main process and can communicate through message ports.

## Choose process boundaries by responsibility

A practical default allocation:

- **Renderer:** UI state and presentation; normal web APIs and frontend tooling.
- **Preload:** a small capability API that the UI actually needs.
- **Main:** application lifecycle, native integrations, authorization decisions, and coordination.
- **Utility process:** isolated, expensive, or crash-prone Node.js work.

Keep state close to the process that owns it. Make the main process the authority for privileged operations, rather than trusting a renderer's claim that a user action or permission is valid. Move work out of the main process when it could block lifecycle handling or make the whole app unresponsive.

## Design IPC as an API boundary

IPC connects processes that do not share ordinary in-memory state. Treat each channel like a public API: name it, constrain its inputs, authorize its caller, and define its result and failure behavior.

### Request/response

For a renderer request that needs a result, use `ipcRenderer.invoke` with `ipcMain.handle`. For a notification that needs no response, use `ipcRenderer.send` with `ipcMain.on`. Electron recommends avoiding synchronous IPC in normal app flows because it blocks the renderer.

Expose narrow operations in preload rather than a generic channel escape hatch:

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  openFile: () => ipcRenderer.invoke('file:open'),
  onImportProgress: (callback) => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('file:import-progress', listener)
    return () => ipcRenderer.removeListener('file:import-progress', listener)
  }
})
```

```js
// main.js
const { ipcMain, dialog } = require('electron')

ipcMain.handle('file:open', async (event) => {
  if (!isTrustedFrame(event.senderFrame)) {
    throw new Error('Untrusted IPC sender')
  }

  const result = await dialog.showOpenDialog({ properties: ['openFile'] })
  return result.canceled ? null : result.filePaths[0]
})
```

The example is illustrative: production code should define its own sender policy, input validation, error contract, and TypeScript types as appropriate. Do not pass an IPC event object through the exposed callback; forward only the intended data. Be deliberate about listener cleanup to avoid duplicate handlers after UI remounts.

### IPC checklist

- [ ] Use named, task-specific methods and channels.
- [ ] Validate payload shape, size, and allowed values on the receiving side.
- [ ] Validate the sender frame/origin in main-process handlers where it matters.
- [ ] Return only data the renderer needs; use stable, intentional error results.
- [ ] Use asynchronous request/response APIs for operations that return a value.
- [ ] Remove event listeners when their owner is disposed.
- [ ] Use a main-process broker or `MessagePort` for renderer-to-renderer communication; renderers do not communicate directly through `ipcMain`/`ipcRenderer`.

Errors thrown by an `ipcMain.handle` handler cross a serialization boundary; Electron notes that the original error does not arrive transparently. Do not make UI behavior depend on preserving a rich native error object.

## Security baseline

Electron apps combine web content with desktop capabilities. A renderer vulnerability can therefore have consequences beyond a normal website. Apply defense in depth, especially if any renderer loads remote or user-provided content.

For every renderer, start from these settings and verify them explicitly:

```js
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true
  }
})
```

Then:

1. **Load only trusted local code or securely served content.** Never enable Node.js integration for remote content.
2. **Keep context isolation and sandboxing enabled.** These are distinct protections; disabling context isolation can also disable sandboxing.
3. **Expose the smallest useful preload API.** Never expose raw `ipcRenderer`, all of `require`, filesystem access, or a general-purpose command executor to page code.
4. **Authorize IPC.** Validate sender identity and request arguments in the privileged process; a channel name is not authorization.
5. **Constrain navigation and new windows.** Allow only destinations the application expects; route intended external links through a controlled OS-browser path.
6. **Use a restrictive Content Security Policy.** Keep `webSecurity` enabled and avoid insecure-content exceptions.
7. **Handle remote permissions explicitly.** Configure session permission request handlers for sessions that display remote content.
8. **Update Electron and audit dependencies.** The shipped Electron version includes Chromium and Node.js; keeping it current is part of security maintenance.
9. **Review Electron fuses and packaged configuration.** Avoid speculative feature flags and ensure production settings match the intended security posture.

A configuration flag is not a complete threat model. Identify which renderers can load untrusted content, what capabilities each preload exposes, and what a compromised renderer could cause main to do.

## Debug by process and boundary

First determine which process owns the symptom. A blank window, an IPC timeout, a blocked UI, and a main-process crash are different classes of fault.

| Symptom | Inspect first | Useful evidence |
| --- | --- | --- |
| Broken layout, failed renderer code, frontend exception | Renderer DevTools | Console, sources/breakpoints, network, DOM, performance |
| Handler not called, bad payload, wrong authorization | IPC boundary | Channel name, request ID, sender frame, validated arguments, handler outcome |
| Startup, native dialog, lifecycle, filesystem integration | Main process | Node inspector, structured logs, startup/lifecycle event sequence |
| Main remains responsive but background task fails | Utility process | Spawn/exit events, message sequence, stderr/logs, exit code |
| UI hangs during an operation | Renderer and main together | Long tasks, synchronous IPC, blocking main-process work, missing replies |
| Crash or intermittent failure | Owning process and packaged build | Crash/exit telemetry, Electron version, OS/architecture, reproduction steps |

Recommended practices:

- Use Chromium DevTools for renderer debugging and the Node.js inspector/debugger for the main process. Configure debugger attach behavior in the local development launch setup; do not expose inspector ports on untrusted network interfaces.
- Add structured logs at process boundaries. Include a correlation/request ID so one action can be traced through renderer → preload → main → utility process.
- Log lifecycle and failure signals: window creation/destruction, IPC start/result/error, utility-process spawn/exit, and shutdown.
- Distinguish routine diagnostic output from user-facing errors. Avoid logging credentials, file contents, or other sensitive payloads.
- Test the packaged application as well as development mode; resource paths, signing, permissions, and process startup can differ.

## Test at multiple levels

Use the cheapest test that gives meaningful evidence, and add end-to-end coverage for behavior that depends on Electron or the operating system.

| Layer | What to cover | Typical approach |
| --- | --- | --- |
| **Unit** | Business logic, reducers, validation, serialization | Plain Node.js or browser test runner; no Electron launch required |
| **Integration** | IPC handlers, preload API contract, main-process services | Test handlers through injected dependencies or a controlled Electron test process |
| **End-to-end** | Critical user workflows, windows, keyboard/mouse input, native integration | Launch Electron and interact with the real app |
| **Packaged smoke** | Startup, essential navigation, resources and platform-specific behavior | Run built/packaged app on supported OS targets |

Electron's automated-testing guide describes WebdriverIO and Selenium, and also describes Playwright's Electron support as **experimental**. Confirm the current state of the chosen framework and its Electron compatibility before adopting it. Electron does not maintain its own end-to-end test framework.

Test design tips:

- Prefer stable accessible selectors or explicit test IDs over brittle DOM structure selectors.
- Wait for observable states and events rather than fixed sleeps.
- Give each test isolated user data and clean up processes, temporary files, and test state even on failure.
- Keep a small set of end-to-end tests for high-value cross-process flows; test most business rules without booting Electron.
- Include negative tests: invalid IPC input, untrusted sender, denied permission, utility-process failure, and app shutdown during work.
- Exercise supported operating systems for features whose behavior depends on platform-native APIs.

## A focused debugging and testing workflow

1. **Reproduce and classify:** record the exact action and identify the likely owning process.
2. **Trace the boundary:** use request IDs and logs to locate the last successful process/message transition.
3. **Inspect locally:** attach the debugger or DevTools for that process; check the actual runtime configuration.
4. **Add a focused regression test:** prefer a unit or integration test unless the defect depends on real Electron behavior.
5. **Verify the real app path:** run the relevant end-to-end flow and, when packaging/platform behavior is involved, a packaged smoke test.
6. **Review security impact:** if untrusted content, preload exposure, or IPC authorization is involved, test the denied path too.

## Design review checklist

- [ ] Each process has an explicit responsibility and capability level.
- [ ] The main process stays responsive and is the authority for privileged actions.
- [ ] Preload exposes narrow operations, not a generic IPC bridge.
- [ ] IPC validates caller and data, handles errors, and cleans up listeners.
- [ ] Renderer security settings, CSP, navigation, and remote permissions are intentional.
- [ ] Unit/integration tests cover logic and contracts; E2E covers critical Electron behavior.
- [ ] The app is debugged and smoke-tested in the process/build configuration users will run.

## Official references

- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Automated Testing](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
- [BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)
- [UtilityProcess API](https://www.electronjs.org/docs/latest/api/utility-process)
