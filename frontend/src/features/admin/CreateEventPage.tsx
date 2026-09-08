import { useNavigate } from "react-router-dom";
import { useCreateEvent } from "./hooks";
import { EventForm } from "./EventForm";
import type { CreateEventDto } from "../../services/api-client";

/**
 * Crear evento (`/admin/eventos/nuevo`, US5, T107). Al guardar redirige al
 * detalle administrativo del evento recién creado (SC-006).
 */
export function CreateEventPage() {
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  async function handleSubmit(dto: CreateEventDto) {
    const event = await createEvent.mutateAsync(dto);
    navigate(`/admin/eventos/${event.id}`, { replace: true });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Crear evento</h1>
        <p className="mt-1 text-text-secondary">Publica un nuevo evento en el catálogo.</p>
      </div>
      <EventForm
        submitLabel="Crear evento"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/admin/eventos")}
      />
    </div>
  );
}
