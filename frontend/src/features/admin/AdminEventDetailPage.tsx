import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CalendarDays, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { useEvent } from "../events/hooks";
import { useDeleteEventDialog } from "./hooks";
import { DeleteEventDialog } from "./DeleteEventDialog";
import { ApiError } from "../../services/api-client";
import { Badge } from "../../design-system/atoms/Badge";
import type { BadgeVariant } from "../../design-system/atoms/Badge";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { EmptyState } from "../../design-system/molecules/EmptyState";

const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "full", timeStyle: "short" });

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
 * Detalle administrativo del evento (`/admin/eventos/:id`, US5, T109): la
 * misma información que el detalle público más la barra de acciones
 * Editar/Eliminar/Ver inscripciones y el conteo de cupos ocupados en
 * primer plano.
 */
export function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, isError, error, refetch } = useEvent(id);
  const deleteDialog = useDeleteEventDialog();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6" aria-hidden="true">
        <div className="aspect-[16/9] w-full rounded-lg bg-bg-surface-alt" />
        <div className="mt-6 h-8 w-2/3 rounded-sm bg-bg-surface-alt" />
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title={notFound ? "Este evento ya no está disponible" : "No pudimos cargar este evento"}
          description={
            notFound
              ? "Puede que haya sido eliminado."
              : "Ocurrió un problema de conexión. Intenta nuevamente."
          }
          action={
            notFound ? (
              <Link to="/admin/eventos" className={buttonClassNames("secondary", "sm")}>
                <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Volver a la lista
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

  const occupied = event.maxCapacity - event.availableSlots;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        to="/admin/eventos"
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-terracotta"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Volver a la lista
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl text-text-primary">{event.name}</h1>
          <Badge variant={TEMPORAL_BADGE_VARIANT[event.temporalStatus] ?? "upcoming"}>
            {TEMPORAL_LABEL[event.temporalStatus] ?? event.temporalStatus}
          </Badge>
        </div>

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

        <p className="text-lg font-medium text-text-primary">
          {occupied} ocupados / {event.availableSlots} disponibles de {event.maxCapacity}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link to={`/admin/eventos/${event.id}/editar`} className={buttonClassNames("secondary", "sm")}>
            <Pencil size={16} strokeWidth={1.5} aria-hidden="true" /> Editar
          </Link>
          <Link
            to={`/admin/eventos/${event.id}/inscripciones`}
            className={buttonClassNames("secondary", "sm")}
          >
            <Users size={16} strokeWidth={1.5} aria-hidden="true" /> Ver inscripciones
          </Link>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 size={16} strokeWidth={1.5} />}
            onClick={() => deleteDialog.request(event)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      <DeleteEventDialog
        dialog={deleteDialog}
        onDeleted={() => navigate("/admin/eventos", { replace: true })}
      />
    </div>
  );
}
