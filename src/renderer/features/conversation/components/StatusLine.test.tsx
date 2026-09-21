// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusLine } from "./StatusLine";

describe("StatusLine", () => {
  it("renders nothing when there is no error", () => {
    const { container } = render(<StatusLine />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the error message with role status", () => {
    render(<StatusLine error="pi exited unexpectedly" />);
    expect(screen.getByRole("status")).toHaveTextContent("pi exited unexpectedly");
  });
});
