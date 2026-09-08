import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Eye, Pencil, Trash2 } from "lucide-react";
import { useEvents } from "../events/hooks";
import { useDeleteEventDialog } from "./hooks";
import { DeleteEventDialog } from "./DeleteEventDialog";
import { Badge } from "../../design-system/atoms/Badge";
import type { BadgeVariant } from "../../design-system/atoms/Badge";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { IconButton } from "../../design-system/atoms/IconButton";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { Pagination } from "../../design-system/molecules/Pagination";
import { SkeletonRow } from "../../design-system/molecules/SkeletonRow";

const ADMIN_PAGE_SIZE = 20;

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

const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

const iconLinkClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-md text-text-primary transition-colors " +
  "duration-150 ease-out hover:bg-bg-surface-alt focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Gestión de eventos (`/admin/eventos`, US5, T106): CRUD completo del
 * catálogo. Eliminar consulta primero las inscripciones activas del evento
 * (`useDeleteEventDialog`) para advertir la consecuencia concreta antes de
 * confirmar (NFR-011).
 */
export function EventsListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useEvents({
    page,
    pageSize: ADMIN_PAGE_SIZE,
    sort: "startsAt",
  });
  const deleteDialog = useDeleteEventDialog();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-text-primary">Gestión de eventos</h1>
        <Link to="/admin/eventos/nuevo" className={buttonClassNames("primary", "sm")}>
          Crear evento
        </Link>
      </div>

      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title="No pudimos cargar los eventos"
          description="Ocurrió un problema de conexión. Intenta nuevamente."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length === 0 && (
        <EmptyState
          title="Aún no hay eventos"
          description="Crea el primer evento del catálogo."
          action={
            <Link to="/admin/eventos/nuevo" className={buttonClassNames("primary", "sm")}>
              Crear evento
            </Link>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-bg-surface-alt text-text-secondary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Ubicación
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Cupos
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((event) => (
                  <tr key={event.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 text-text-primary">{event.name}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {dateFormatter.format(new Date(event.startsAt))}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{event.location}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {event.availableSlots} de {event.maxCapacity}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={TEMPORAL_BADGE_VARIANT[event.temporalStatus] ?? "upcoming"}>
                        {TEMPORAL_LABEL[event.temporalStatus] ?? event.temporalStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/eventos/${event.id}`}
                          aria-label={`Ver ${event.name}`}
                          className={iconLinkClass}
                        >
                          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                        </Link>
                        <Link
                          to={`/admin/eventos/${event.id}/editar`}
                          aria-label={`Editar ${event.name}`}
                          className={iconLinkClass}
                        >
                          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                        </Link>
                        <IconButton
                          aria-label={`Eliminar ${event.name}`}
                          icon={<Trash2 size={16} strokeWidth={1.5} />}
                          onClick={() => deleteDialog.request(event)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}

      <DeleteEventDialog dialog={deleteDialog} />
    </div>
  );
}
