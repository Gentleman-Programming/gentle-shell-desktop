import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@renderer/shared/ui/atoms/Button";
import { TextField } from "@renderer/shared/ui/atoms/TextField";
import "./Composer.css";

export interface ComposerProps {
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
}

// Presentational: local text state and the bridge call both live in
// ConversationContainer. Enter-to-send / Shift+Enter-newline / Esc-to-abort
// key handling is T4 scope; this is the composer skeleton only.
export function Composer({ value, disabled, onChange, onSubmit }: ComposerProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="gc-composer" onSubmit={handleSubmit}>
      <TextField
        multiline
        rows={2}
        placeholder="Message Gentle…"
        value={value}
        disabled={disabled}
        onChange={handleChange}
      />
      <Button type="submit" disabled={disabled || value.trim().length === 0}>
        Send
      </Button>
    </form>
  );
}
