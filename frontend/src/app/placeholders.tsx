import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { buttonClassNames } from "../design-system/atoms/Button";

export interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Placeholder simple para pantallas de US3-US6 (`/mi-cuenta*`, `/admin*`)
 * que otro agente construirá a continuación. Mantiene la ruta protegida
 * funcionando (guardas + layout) sin implementar la pantalla final.
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
      <Construction size={40} strokeWidth={1.5} className="text-accent-terracotta" aria-hidden="true" />
      <h1 className="font-display text-2xl text-text-primary">{title}</h1>
      {description && <p className="text-text-secondary">{description}</p>}
      <Link to="/" className={buttonClassNames("secondary", "sm")}>
        Volver al inicio
      </Link>
    </div>
  );
}
