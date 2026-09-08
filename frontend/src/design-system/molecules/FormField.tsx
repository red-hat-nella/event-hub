import { cloneElement, isValidElement, type ReactNode } from "react";

export interface FormFieldProps {
  /** Debe coincidir con el `id`/`name` del control hijo. */
  htmlFor: string;
  label: string;
  /** Mensaje de error inline (NFR-005); si está presente, se asocia por `aria-describedby`. */
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Envoltorio label + control + mensaje de error/ayuda inline. Convención
 * para el resto de la app: todo control de formulario (`Input`, `Select`,
 * `Textarea`) se usa dentro de `FormField`, nunca suelto con un `<label>`
 * ad-hoc, para mantener foco/errores consistentes.
 */
export function FormField({
  htmlFor,
  label,
  error,
  hint,
  required = false,
  children,
  className = "",
}: FormFieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint ? `${htmlFor}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-1 text-sm font-medium">
        <label htmlFor={htmlFor} className="text-text-primary">{label}</label>
        {required && <span aria-hidden="true" className="text-error"> *</span>}
      </div>
      {required && isValidElement<{ 'aria-required'?: boolean }>(children) ? cloneElement(children, { 'aria-required': true }) : children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Helper para pasar `aria-describedby`/`aria-invalid` consistentes al control hijo. */
export function fieldA11yProps(htmlFor: string, error?: string) {
  return {
    id: htmlFor,
    invalid: Boolean(error),
    "aria-describedby": error ? `${htmlFor}-error` : undefined,
  } as const;
}
