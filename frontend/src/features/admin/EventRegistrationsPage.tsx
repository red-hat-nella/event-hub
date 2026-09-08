import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEvent } from "../events/hooks";
import { useEventRegistrations } from "./hooks";
import { ApiError } from "../../services/api-client";
import type { RegistrationStatus } from "../../services/api-client";
import { AdminRegistrationsTable } from "../../design-system/organisms/AdminRegistrationsTable";
import { Button } from "../../design-system/atoms/Button";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { SkeletonRow } from "../../design-system/molecules/SkeletonRow";

type FilterValue = RegistrationStatus | undefined;

/**
 * Gestión de inscripciones por evento (`/admin/eventos/:id/inscripciones`,
 * US6, T117): conteo ocupados/disponibles en vivo (se refresca junto con
 * la lista) y filtro Activas/Canceladas sobre `GET /api/events/:id/registrations`.
 */
export function EventRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const [filter, setFilter] = useState<FilterValue>(undefined);
  const { data: event } = useEvent(id);
  const { data, isLoading, isError, error, refetch } = useEventRegistrations(id, filter);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        to={`/admin/eventos/${id}`}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-terracotta"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Volver al evento
      </Link>

      <div>
        <h1 className="font-display text-3xl text-text-primary">
          Inscripciones{event ? ` — ${event.name}` : ""}
        </h1>
        {data && (
          <p className="mt-2 text-lg font-medium text-text-primary">
            {data.occupied} ocupados / {data.available} disponibles de {data.capacity}
          </p>
        )}
      </div>

      <div role="group" aria-label="Filtrar inscripciones" className="flex gap-2">
        <Button
          type="button"
          aria-pressed={filter === undefined}
          variant={filter === undefined ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter(undefined)}
        >
          Todas
        </Button>
        <Button
          type="button"
          aria-pressed={filter === "ACTIVE"}
          variant={filter === "ACTIVE" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("ACTIVE")}
        >
          Activas
        </Button>
        <Button
          type="button"
          aria-pressed={filter === "CANCELLED"}
          variant={filter === "CANCELLED" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setFilter("CANCELLED")}
        >
          Canceladas
        </Button>
      </div>

      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title="No pudimos cargar las inscripciones"
          description={
            error instanceof ApiError ? error.message : "Ocurrió un problema de conexión. Intenta nuevamente."
          }
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState
          title="Aún no hay inscritos en este evento"
          description="Cuando alguien se inscriba, aparecerá aquí."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <AdminRegistrationsTable registrations={data.items} />
      )}
    </div>
  );
}
