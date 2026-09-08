import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const base =
  "w-full rounded-sm border bg-bg-canvas px-3 h-11 text-base text-text-primary " +
  "transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid = false, className = "", children, ...rest }, ref) => (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${base} ${invalid ? "border-error" : "border-border-subtle"} ${className}`}
      {...rest}
    >
      {children}
    </select>
  ),
);

Select.displayName = "Select";
