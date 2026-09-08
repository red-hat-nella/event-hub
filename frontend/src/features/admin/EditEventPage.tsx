import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEvent } from "../events/hooks";
import { useUpdateEvent } from "./hooks";
import { EventForm } from "./EventForm";
import { normalizeCategory, splitStartsAt } from "./event-form.schema";
import { ApiError } from "../../services/api-client";
import type { CreateEventDto } from "../../services/api-client";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { EmptyState } from "../../design-system/molecules/EmptyState";

/**
 * Editar evento (`/admin/eventos/:id/editar`, US5, T108), precargado desde
 * `GET /api/events/:id`. `409 CAPACITY_BELOW_ACTIVE_REGISTRATIONS` (BR-011)
 * se maneja dentro de `EventForm`, asociado al campo de capacidad.
 */
export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, isError, error, refetch } = useEvent(id);
  const updateEvent = useUpdateEvent(id ?? "");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse px-4 py-10 sm:px-6" aria-hidden="true">
        <div className="h-8 w-1/2 rounded-sm bg-bg-surface-alt" />
        <div className="mt-6 h-64 w-full rounded-sm bg-bg-surface-alt" />
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title={notFound ? "Este evento ya no está disponible" : "No pudimos cargar el evento"}
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

  const { date, time } = splitStartsAt(event.startsAt);
  const eventId = event.id;

  async function handleSubmit(dto: CreateEventDto) {
    await updateEvent.mutateAsync(dto);
    navigate(`/admin/eventos/${eventId}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Editar evento</h1>
        <p className="mt-1 text-text-secondary">{event.name}</p>
      </div>
      <EventForm
        submitLabel="Guardar cambios"
        defaultValues={{
          name: event.name,
          description: event.description,
          date,
          time,
          location: event.location,
          maxCapacity: event.maxCapacity,
          category: normalizeCategory(event.category),
          imageUrl: event.imageUrl ?? "",
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/admin/eventos/${event.id}`)}
      />
    </div>
  );
}
