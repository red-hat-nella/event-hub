import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, MapPin } from "lucide-react";
import { useAuth } from "../../app/auth-context";
import { useMyRegistrations } from "../registrations/hooks";
import { Badge } from "../../design-system/atoms/Badge";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { SkeletonRow } from "../../design-system/molecules/SkeletonRow";

const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

const RECENT_COUNT = 3;

/**
 * Dashboard personal (`/mi-cuenta`, US4): saludo, resumen de inscripciones
 * activas (primeras 3) y acceso rápido a explorar más eventos.
 */
export function UserDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyRegistrations("ACTIVE");
  const upcoming = data?.items.slice(0, RECENT_COUNT) ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Hola, {user?.name}</h1>
        <p className="mt-1 text-text-secondary">
          {!isLoading && !isError &&
            `Tienes ${data?.items.length ?? 0} ${
              data?.items.length === 1 ? "inscripción activa" : "inscripciones activas"
            }.`}
        </p>
      </div>

      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          {Array.from({ length: RECENT_COUNT }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title="No pudimos cargar tu resumen"
          description="Ocurrió un problema de conexión. Intenta nuevamente."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      {!isLoading && !isError && upcoming.length === 0 && (
        <EmptyState
          title="Aún no tienes inscripciones"
          description="Explora el catálogo y encuentra tu próximo evento."
          action={
            <Link to="/eventos" className={buttonClassNames("primary", "sm")}>
              Explorar eventos
            </Link>
          }
        />
      )}

      {!isLoading && !isError && upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          {upcoming.map((registration) => (
            <Link
              key={registration.id}
              to={`/mi-cuenta/inscripciones/${registration.id}`}
              className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-bg-surface p-4 transition-shadow duration-150 ease-out hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-lg text-text-primary">{registration.eventName}</span>
                <Badge variant="active">Activa</Badge>
              </div>
              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
                {dateFormatter.format(new Date(registration.eventStartsAt))}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
                {registration.eventLocation}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/eventos" className={buttonClassNames("primary", "sm")}>
          Explorar eventos
        </Link>
        <Link to="/mi-cuenta/inscripciones" className={buttonClassNames("secondary", "sm")}>
          Ver todas mis inscripciones
        </Link>
      </div>
    </div>
  );
}
