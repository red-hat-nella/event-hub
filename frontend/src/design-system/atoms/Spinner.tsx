import { Loader2 } from "lucide-react";

export interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

/** Spinner discreto usado en botones/estados `loading` (NFR: aria-busy en el contenedor). */
export function Spinner({ size = 20, className = "", label = "Cargando" }: SpinnerProps) {
  return (
    <span role="status" className={`inline-flex items-center ${className}`}>
      <Loader2
        size={size}
        strokeWidth={1.5}
        className="animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
