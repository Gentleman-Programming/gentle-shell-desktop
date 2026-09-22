import { useState } from "react";
import type { FormEvent } from "react";
import { DIALOG_METHOD, type Dialog, type DialogAnswer } from "@shared/bridge-types";
import { Button } from "@renderer/shared/ui/atoms/Button";
import { TextField } from "@renderer/shared/ui/atoms/TextField";
import "./DialogCard.css";

export interface DialogCardProps {
  readonly dialog: Dialog;
  readonly onAnswer: (answer: DialogAnswer) => void;
}

/**
 * A blocking extension_ui_request rendered inline in the thread (MessageThread).
 * Presentational except for the input/editor draft text, which is ephemeral
 * UI state local to this card (nothing else needs it) — same pattern as a
 * plain <input>'s own value while uncontrolled. Every method can be
 * dismissed with Cancel, answering { cancelled: true } (rpc-types.ts allows
 * cancelling any dialog method).
 */
export function DialogCard({ dialog, onAnswer }: DialogCardProps) {
  const handleCancel = (): void => onAnswer({ cancelled: true });

  return (
    <div className="gc-dialog-card">
      <div className="gc-dialog-card__header">
        <h3 className="gc-dialog-card__title">{dialog.title}</h3>
        <button type="button" className="gc-dialog-card__cancel" aria-label="Cancel" onClick={handleCancel}>
          ✕
        </button>
      </div>
      <DialogCardBody dialog={dialog} onAnswer={onAnswer} />
    </div>
  );
}

function DialogCardBody({ dialog, onAnswer }: DialogCardProps) {
  switch (dialog.method) {
    case DIALOG_METHOD.SELECT:
      return <SelectBody options={dialog.options ?? []} onAnswer={onAnswer} />;
    case DIALOG_METHOD.CONFIRM:
      return <ConfirmBody message={dialog.message} onAnswer={onAnswer} />;
    case DIALOG_METHOD.INPUT:
      return <TextBody placeholder={dialog.placeholder} multiline={false} onAnswer={onAnswer} />;
    case DIALOG_METHOD.EDITOR:
      return <TextBody placeholder={dialog.placeholder} initialValue={dialog.prefill} multiline onAnswer={onAnswer} />;
    default:
      return null;
  }
}

interface SelectBodyProps {
  readonly options: readonly string[];
  readonly onAnswer: (answer: DialogAnswer) => void;
}

function SelectBody({ options, onAnswer }: SelectBodyProps) {
  return (
    <div className="gc-dialog-card__options">
      {options.map((option) => (
        <Button key={option} variant="ghost" type="button" onClick={() => onAnswer({ value: option })}>
          {option}
        </Button>
      ))}
    </div>
  );
}

interface ConfirmBodyProps {
  readonly message?: string;
  readonly onAnswer: (answer: DialogAnswer) => void;
}

function ConfirmBody({ message, onAnswer }: ConfirmBodyProps) {
  return (
    <div className="gc-dialog-card__confirm">
      {message && <p className="gc-dialog-card__message">{message}</p>}
      <div className="gc-dialog-card__options">
        <Button type="button" onClick={() => onAnswer({ confirmed: true })}>
          Yes
        </Button>
        <Button variant="ghost" type="button" onClick={() => onAnswer({ confirmed: false })}>
          No
        </Button>
      </div>
    </div>
  );
}

interface TextBodyProps {
  readonly placeholder?: string;
  readonly initialValue?: string;
  readonly multiline: boolean;
  readonly onAnswer: (answer: DialogAnswer) => void;
}

function TextBody({ placeholder, initialValue, multiline, onAnswer }: TextBodyProps) {
  const [value, setValue] = useState(initialValue ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onAnswer({ value });
  };

  return (
    <form className="gc-dialog-card__text-form" onSubmit={handleSubmit}>
      {multiline ? (
        <TextField
          multiline
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      ) : (
        <TextField placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)} />
      )}
      <Button type="submit">Send</Button>
    </form>
  );
}
