import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Button } from "@renderer/shared/ui/atoms/Button";
import { TextField } from "@renderer/shared/ui/atoms/TextField";
import "./Composer.css";

export interface ComposerProps {
  readonly value: string;
  readonly working: boolean;
  readonly onChange: (value: string) => void;
  readonly onSend: () => void;
  readonly onAbort: () => void;
}

/**
 * Presentational: local draft text and the bridge calls both live in
 * ConversationContainer. Enter sends (and is prevented from inserting a
 * newline), Shift+Enter inserts a newline (default textarea behaviour, left
 * alone), Esc aborts while working. The field is `readOnly` (not
 * `disabled`) while working: a disabled textarea would stop receiving the
 * Escape keydown the abort shortcut depends on.
 */
export function Composer({ value, working, onChange, onSend, onAbort }: ComposerProps) {
  const canSend = !working && value.trim().length > 0;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Escape") {
      if (working) onAbort();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (canSend) onSend();
  };

  return (
    <form className="gc-composer" onSubmit={handleSubmit}>
      <div className="gc-composer__row">
        <TextField
          multiline
          rows={2}
          placeholder="Tell Gentle what you need…"
          value={value}
          readOnly={working}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <Button type="submit" disabled={!canSend}>
          Send
        </Button>
      </div>
      <p className="gc-composer__hints">Enter to send · Shift+Enter for a new line · Esc to stop</p>
    </form>
  );
}
