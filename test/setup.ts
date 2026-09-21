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
