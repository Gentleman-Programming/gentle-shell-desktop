// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Markdown } from "./Markdown";

describe("Markdown", () => {
  it("renders Markdown text as real HTML elements", () => {
    const { container } = render(<Markdown text="**bold** and `code`" />);

    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("code")).toHaveTextContent("code");
  });

  it("renders into a .gs-markdown container", () => {
    const { container } = render(<Markdown text="hello" />);

    expect(container.querySelector(".gs-markdown")).not.toBeNull();
  });

  it("renders a list as real <ul>/<li> elements", () => {
    const { container } = render(<Markdown text={"- one\n- two"} />);

    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("one");
    expect(items[1]).toHaveTextContent("two");
  });
});
