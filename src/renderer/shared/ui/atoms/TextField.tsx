import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import "./TextField.css";

interface SingleLineProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly multiline?: false;
}

interface MultilineProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly multiline: true;
}

export type TextFieldProps = SingleLineProps | MultilineProps;

// React 19: ref is a normal prop, no forwardRef wrapper needed.
export function TextField(props: TextFieldProps) {
  const { className, multiline, ...rest } = props;
  const classes = ["gc-text-field", className].filter(Boolean).join(" ");

  if (multiline) {
    return (
      <textarea
        className={classes}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return (
    <input
      className={classes}
      {...(rest as InputHTMLAttributes<HTMLInputElement>)}
    />
  );
}
