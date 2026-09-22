import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config.ts runs with `globals: false`, so Testing Library's
// auto-cleanup (which only registers when it detects the global afterEach)
// never fires. Without this, component trees rendered by one test file stay
// mounted into the next, leaking DOM nodes across tests (e.g. duplicate
// `role="alert"` matches when two component tests share a jsdom document).
afterEach(() => {
  cleanup();
});

// This project's jsdom (v30) does not implement Element.scrollIntoView at
// all (not even a no-op stub), so any component that calls it — e.g.
// MessageThread's auto-scroll-to-bottom — throws "is not a function" under
// every jsdom test, not just its own. Read through a small structural type
// instead of the ambient DOM `Element` (tsconfig.node.json has no "dom"
// lib, since main-process tests run under Node where Element never exists;
// referencing the real `Element` type there fails typecheck).
interface ElementLike {
  readonly prototype: { scrollIntoView?: () => void };
}
const globalScope = globalThis as typeof globalThis & { Element?: ElementLike };
if (globalScope.Element && !globalScope.Element.prototype.scrollIntoView) {
  globalScope.Element.prototype.scrollIntoView = () => {};
}
