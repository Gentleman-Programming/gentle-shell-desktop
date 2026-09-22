// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./renderMarkdown";

describe("renderMarkdown", () => {
  it("renders bold text as <strong>", () => {
    expect(renderMarkdown("**approved**")).toContain("<strong>approved</strong>");
  });

  it("renders inline code as <code>", () => {
    expect(renderMarkdown("run `pnpm test`")).toContain("<code>pnpm test</code>");
  });

  it("renders a bullet list as <ul><li>", () => {
    const html = renderMarkdown("- one\n- two");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
  });

  it("renders a link with a safe target and rel", () => {
    const html = renderMarkdown("[docs](https://example.com)");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("strips <script> tags", () => {
    const html = renderMarkdown('before<script>alert("x")</script>after');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert");
  });

  it("strips event handler attributes such as onerror", () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror");
  });

  it("removes javascript: links", () => {
    const html = renderMarkdown('[click me](javascript:alert(1))');
    expect(html).not.toContain("javascript:");
  });

  it("removes images", () => {
    const html = renderMarkdown("![alt text](https://example.com/pic.png)");
    expect(html).not.toContain("<img");
  });
});
