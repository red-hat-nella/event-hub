import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

/** Casilla accesible: el `label` es obligatorio (nunca solo un ícono). */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", id, ...rest }, ref) => {
    const inputId = id ?? `checkbox-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <label
        htmlFor={inputId}
        className={`inline-flex items-center gap-2 text-sm text-text-primary select-none ${className}`}
      >
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer h-5 w-5 appearance-none rounded-sm border border-border-subtle bg-bg-canvas checked:bg-accent-terracotta checked:border-accent-terracotta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
            {...rest}
          />
          <Check
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute hidden text-text-inverse peer-checked:block"
            aria-hidden="true"
          />
        </span>
        {label}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
