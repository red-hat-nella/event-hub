import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const base =
  "w-full rounded-sm border bg-bg-canvas px-3 h-11 text-base text-text-primary placeholder:text-text-secondary/60 " +
  "transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

/** Control de texto base. Se usa siempre envuelto en `FormField` para label + error inline (NFR-005). */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className = "", ...rest }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${base} ${invalid ? "border-error" : "border-border-subtle"} ${className}`}
      {...rest}
    />
  ),
);

Input.displayName = "Input";
