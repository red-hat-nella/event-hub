import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Estado de carga: deshabilita el botón, muestra spinner y `aria-busy`. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-body font-medium rounded-md " +
  "transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-terracotta text-text-inverse hover:bg-accent-terracotta-hover active:bg-accent-terracotta-hover",
  secondary:
    "bg-transparent text-secondary-olive border border-secondary-olive hover:bg-secondary-olive hover:text-text-inverse active:bg-secondary-olive-hover active:border-secondary-olive-hover",
  ghost:
    "bg-transparent text-text-primary hover:bg-bg-surface-alt active:bg-bg-surface-alt",
  destructive:
    "bg-error text-text-inverse hover:opacity-90 active:opacity-80",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
};

/**
 * Clases de `Button` reutilizables para elementos que no pueden ser un
 * `<button>` (p. ej. `Link` de react-router usado como CTA). Mantiene la
 * apariencia idéntica sin duplicar la escala de variantes/tamaños.
 */
export function buttonClassNames(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

/**
 * Botón base del sistema de diseño. Convención para el resto de la app:
 * usar siempre `variant`/`size`/`loading` en vez de clases ad-hoc; nunca un
 * tamaño "gigante" (solo `sm`/`md` por decisión de `ux-design.md §4`).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? <Spinner size={16} /> : leftIcon}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
