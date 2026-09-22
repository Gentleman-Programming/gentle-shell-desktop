import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: true });

// Assistant text is model output, never trusted. DOMPurify strips raw HTML
// the model may have emitted (scripts, event handler attributes, etc.) and
// this hook additionally hardens every surviving <a> so a link the user
// clicks always opens in a new tab without handing it `window.opener`
// (reverse tabnabbing).
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

// Tight allowlist: no <img> (avoid the model exfiltrating data through
// image requests to attacker-controlled URLs) and no raw <script>/<style>/
// event-handler surface. Headings, tables and blockquotes are allowed
// because assistant replies (docs, plans, tool summaries) commonly use them.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "del",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
];

const ALLOWED_ATTR = ["href"];

// Only http(s)/mailto links survive; javascript:, data: and other schemes
// are dropped by DOMPurify before this regexp is even consulted for
// anything outside it.
const ALLOWED_URI_REGEXP = /^(?:https?|mailto):/i;

/**
 * Converts assistant Markdown text into sanitized HTML safe to inject via
 * `dangerouslySetInnerHTML` (see Markdown.tsx). Two-stage: marked.parse
 * turns Markdown into HTML (GFM + single-newline breaks, matching how a
 * model naturally paragraphs replies), then DOMPurify strips anything the
 * allowlist below does not recognize — including any raw HTML the model
 * embedded directly.
 */
export function renderMarkdown(text: string): string {
  const rawHtml = marked.parse(text, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
}
