import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonVariant = "primary" | "secondary" | "ghost";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio: un botón de solo ícono siempre necesita nombre accesible. */
  "aria-label": string;
  icon: ReactNode;
  variant?: IconButtonVariant;
}

const variantClasses: Record<IconButtonVariant, string> = {
  primary:
    "bg-accent-terracotta text-text-inverse hover:bg-accent-terracotta-hover",
  secondary:
    "bg-transparent text-secondary-olive border border-secondary-olive hover:bg-secondary-olive hover:text-text-inverse",
  ghost: "bg-transparent text-text-primary hover:bg-bg-surface-alt",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "ghost", disabled, className = "", ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  ),
);

IconButton.displayName = "IconButton";
