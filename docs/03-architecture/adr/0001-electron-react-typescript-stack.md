# 0001. Electron, React and TypeScript as the desktop stack

> Status: draft.

## Context

Gentle Shell only existed inside pi's terminal UI. The goal was a chat window for people who do not want a terminal (`odd/tasks/desktop-m1-chat-core.md:9-11`). pi is a Node program (`odd/tasks/desktop-m1-chat-core.md:18`).

## Decision

- **Shell:** Electron + React, "chosen by the maintainer on 2026-09-21" (`odd/tasks/desktop-m1-chat-core.md:18`).
- **Stack:** Electron + React + TypeScript (strict), Vite through `electron-vite`, pnpm, and `electron-builder` for unsigned dev builds (`odd/tasks/desktop-m1-chat-core.md:26`).
- **Tests:** vitest, with a Node environment for main/protocol code and jsdom for the renderer (`odd/tasks/desktop-m1-chat-core.md:27`).

## Consequences

- **Three processes.** The app runs as main, preload and renderer, each built as its own bundle (`electron.vite.config.ts:5-40`; [0002](0002-process-roles-and-typed-preload-bridge.md)).
- **Node in main.** The main process can spawn children and import Node packages, which is what makes the in-process session list possible ([0006](0006-in-process-session-list.md)).
- **Package size.** The unsigned macOS build was 156 MiB at M1 close (`odd/tasks/desktop-m1-chat-core.md:61`).
- **Platforms.** Only macOS Apple silicon has been tested (`README.md:7`).

## Status

accepted (recorded in `odd/tasks/desktop-m1-chat-core.md:18`, `:26`)
