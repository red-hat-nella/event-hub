import type { ReactNode } from "react";
import { Compass } from "lucide-react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vacío editorial (icono + mensaje + acción sugerida). Se usa tanto
 * para "sin datos aún" como para "sin resultados de filtro" — distinguir el
 * `title`/`description`/`action` en cada caso queda a cargo de quien la usa
 * (ver `CatalogPage` para el ejemplo de los dos vacíos distintos).
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-subtle bg-bg-surface px-6 py-12 text-center ${className}`}
    >
      <span className="text-accent-terracotta" aria-hidden="true">
        {icon ?? <Compass size={40} strokeWidth={1.5} />}
      </span>
      <h3 className="font-display text-lg text-text-primary">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      )}
      {action}
    </div>
  );
}
