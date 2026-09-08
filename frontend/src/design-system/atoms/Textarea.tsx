import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const base =
  "w-full rounded-sm border bg-bg-canvas px-3 py-2 text-base text-text-primary placeholder:text-text-secondary/60 " +
  "transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, className = "", rows = 5, ...rest }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${base} ${invalid ? "border-error" : "border-border-subtle"} ${className}`}
      {...rest}
    />
  ),
);

Textarea.displayName = "Textarea";
