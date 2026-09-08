import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, MapPin, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEvent } from "./hooks";
import { useCreateRegistration, useMyRegistrations } from "../registrations/hooks";
import { useAuth } from "../../app/auth-context";
import { ApiError } from "../../services/api-client";
import { eventCategoryLabel } from "../../lib/event-categories";
import { Badge } from "../../design-system/atoms/Badge";
import type { BadgeVariant } from "../../design-system/atoms/Badge";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { EmptyState } from "../../design-system/molecules/EmptyState";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "full",
  timeStyle: "short",
});

const TEMPORAL_LABEL: Record<string, string> = {
  UPCOMING: "Próximo",
  ONGOING: "En curso",
  FINISHED: "Finalizado",
};

const TEMPORAL_BADGE_VARIANT: Record<string, BadgeVariant> = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  FINISHED: "finished",
};

/**
 * Detalle público del evento (`/eventos/:id`). El CTA de inscripción (US3)
 * se habilita con sesión + cupo disponible + evento aún no iniciado; si ya
 * hay una inscripción activa, ofrece verla en vez de repetir la acción
 * (evita el viaje redundante a `409 ALREADY_REGISTERED`).
 */
export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status: authStatus } = useAuth();
  const { data: event, isLoading, isError, error, refetch } = useEvent(id);
  const { data: myRegistrations } = useMyRegistrations("ACTIVE", {
    enabled: authStatus === "authenticated",
  });
  const createRegistration = useCreateRegistration(id ?? "");
  const [registerError, setRegisterError] = useState<string | undefined>(undefined);
  const [justRegistered, setJustRegistered] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6" aria-hidden="true">
        <div className="aspect-[16/9] w-full rounded-lg bg-bg-surface-alt" />
        <div className="mt-6 h-8 w-2/3 rounded-sm bg-bg-surface-alt" />
        <div className="mt-3 h-4 w-1/3 rounded-sm bg-bg-surface-alt" />
        <div className="mt-6 h-24 w-full rounded-sm bg-bg-surface-alt" />
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title={
            notFound
              ? "Este evento ya no está disponible"
              : "No pudimos cargar este evento"
          }
          description={
            notFound
              ? "Puede que haya sido eliminado o que el enlace sea incorrecto."
              : "Ocurrió un problema de conexión. Intenta nuevamente."
          }
          action={
            notFound ? (
              <Link to="/eventos" className={buttonClassNames("secondary", "sm")}>
                <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Volver al catálogo
              </Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            )
          }
        />
      </div>
    );
  }

  if (!event) return null;

  const isSoldOut = event.availableSlots <= 0;
  const occupied = event.maxCapacity - event.availableSlots;
  const occupiedPercent = event.maxCapacity > 0 ? Math.round((occupied / event.maxCapacity) * 100) : 0;
  const fromParam = encodeURIComponent(`/eventos/${event.id}`);
  const activeRegistration = myRegistrations?.items.find((item) => item.eventId === event.id);
  const canRegister = event.temporalStatus === "UPCOMING" && !isSoldOut;

  function handleRegister() {
    setRegisterError(undefined);
    createRegistration.mutate(undefined, {
      onSuccess: () => setJustRegistered(true),
      onError: (mutationError) => {
        setRegisterError(
          mutationError instanceof ApiError
            ? mutationError.message
            : "Ocurrió un error inesperado. Intenta de nuevo.",
        );
      },
    });
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-bg-surface-alt">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-clay/30 to-secondary-olive/20 text-accent-terracotta">
            <CalendarDays size={56} strokeWidth={1} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {eventCategoryLabel(event.category) && (
            <span className="inline-flex items-center rounded-pill bg-bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
              {eventCategoryLabel(event.category)}
            </span>
          )}
          <Badge variant={TEMPORAL_BADGE_VARIANT[event.temporalStatus] ?? "upcoming"}>
            {TEMPORAL_LABEL[event.temporalStatus] ?? event.temporalStatus}
          </Badge>
        </div>

        <h1 className="font-display text-3xl text-text-primary">{event.name}</h1>

        <div className="flex flex-col gap-1.5 text-text-secondary">
          <span className="flex items-center gap-2">
            <CalendarDays size={18} strokeWidth={1.5} aria-hidden="true" />
            {dateFormatter.format(new Date(event.startsAt))}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
            {event.location}
          </span>
        </div>

        <p className="whitespace-pre-line text-text-primary">{event.description}</p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span>
              {event.availableSlots} de {event.maxCapacity} disponibles
            </span>
            {isSoldOut && <Badge variant="soldout">Agotado</Badge>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-pill bg-bg-surface-alt">
            <div
              className="h-full rounded-pill bg-accent-terracotta transition-[width] duration-200 ease-out"
              style={{ width: `${occupiedPercent}%` }}
            />
          </div>
        </div>

        {authStatus === "anonymous" && (
          <Link
            to={`/login?from=${fromParam}`}
            className={buttonClassNames("primary", "md")}
          >
            Inicia sesión para inscribirte
          </Link>
        )}

        {authStatus === "authenticated" && (
          <div className="flex flex-col gap-3">
            {(justRegistered || activeRegistration) && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-sm border border-success/30 bg-success/5 px-3 py-2 text-sm text-success"
              >
                <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" />
                {justRegistered
                  ? "¡Inscripción confirmada! Te esperamos en el evento."
                  : "Ya estás inscrito en este evento."}
              </p>
            )}

            {registerError && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-sm border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
              >
                <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
                {registerError}
              </p>
            )}

            {activeRegistration ? (
              <Link
                to={`/mi-cuenta/inscripciones/${activeRegistration.id}`}
                className={buttonClassNames("secondary", "md")}
              >
                Ver mi inscripción
              </Link>
            ) : (
              <Button
                variant="primary"
                size="md"
                loading={createRegistration.isPending}
                disabled={!canRegister}
                onClick={handleRegister}
              >
                {isSoldOut
                  ? "Sin cupos disponibles"
                  : event.temporalStatus !== "UPCOMING"
                    ? "Inscripciones cerradas"
                    : "Inscribirme"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
