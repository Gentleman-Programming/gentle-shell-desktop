import { renderMarkdown } from "./renderMarkdown";
import "./Markdown.css";

export interface MarkdownProps {
  readonly text: string;
}

// Presentational. `dangerouslySetInnerHTML` is safe here only because
// `renderMarkdown` always runs the text through DOMPurify first (tight
// allowlist, no <script>/event handlers, links forced to a safe scheme) —
// never render unsanitized HTML this way anywhere else. Shared under
// renderer/shared (Scope Rule: 2+ consumers) because both the conversation
// thread (assistant bubbles) and, later, the helpers thread (assistant-like
// narrated text, see HelperThreadItem.tsx) render Markdown the same way.
export function Markdown({ text }: MarkdownProps) {
  const html = renderMarkdown(text);

  return <div className="gs-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}
