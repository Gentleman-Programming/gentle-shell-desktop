// @vitest-environment jsdom
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb(): never {
  throw new Error("boom");
}

it("renders the fallback when a child throws", () => {
  render(<ErrorBoundary><Bomb /></ErrorBoundary>);
  expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
});
