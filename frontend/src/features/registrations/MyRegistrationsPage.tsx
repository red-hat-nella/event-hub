import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CalendarDays, MapPin } from "lucide-react";
import { useCancelRegistration, useMyRegistrations } from "./hooks";
import { ApiError } from "../../services/api-client";
import type { RegistrationStatus, RegistrationSummary } from "../../services/api-client";
import { Badge } from "../../design-system/atoms/Badge";
import type { BadgeVariant } from "../../design-system/atoms/Badge";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { ConfirmDialog } from "../../design-system/molecules/ConfirmDialog";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { SkeletonRow } from "../../design-system/molecules/SkeletonRow";

import { formatAccountDate, accountName, isFutureDate } from "../../design-system/account-formatters";

const STATUS_BADGE: Record<RegistrationStatus, BadgeVariant> = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
};

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
};

function eventAlreadyStarted(registration: RegistrationSummary): boolean {
  return !isFutureDate(registration.eventStartsAt);
}

/**
 * Mis inscripciones (`/mi-cuenta/inscripciones`, US4): filtro Activas /
 * Canceladas y cancelación con `ConfirmDialog` (NFR-011). Al confirmar, el
 * hook invalida la lista y la fila refleja el nuevo estado sin recarga
 * completa (FR-017).
 */
export function MyRegistrationsPage() {
  const [params, setParams] = useSearchParams();
  const filter: RegistrationStatus = params.get("status") === "CANCELLED" ? "CANCELLED" : "ACTIVE";
  const setFilter = (status: RegistrationStatus) => setParams({ status });
  const [cancelTarget, setCancelTarget] = useState<RegistrationSummary | undefined>(undefined);
  const { data, isLoading, isError, refetch } = useMyRegistrations(filter);
  const cancelRegistration = useCancelRegistration(cancelTarget?.id);

  function closeDialog() {
    if (cancelRegistration.isPending) return;
    setCancelTarget(undefined);
  }

  function confirmCancel() {
    if (cancelRegistration.isPending) return;
    cancelRegistration.mutate(undefined, {
      onSuccess: () => setCancelTarget(undefined),
    });
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Mis inscripciones</h1>
        <p className="mt-1 text-text-secondary">Consulta y gestiona tus inscripciones a eventos.</p>
      </div>

      <div role="group" aria-label="Filtrar inscripciones" className="flex gap-2">
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
          title="No pudimos cargar tus inscripciones"
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
          title={
            filter === "CANCELLED"
              ? "No tienes inscripciones canceladas"
              : "Aún no tienes inscripciones"
          }
          description="Explora el catálogo y encuentra tu próximo evento."
          action={
            <Link to="/eventos" className={buttonClassNames("primary", "sm")}>
              Explorar eventos
            </Link>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.items.map((registration) => (
            <li
              key={registration.id}
              className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <Link
                  to={`/mi-cuenta/inscripciones/${registration.id}`}
                  className="font-display text-lg text-text-primary hover:text-accent-terracotta"
                >
                  {accountName(registration.eventName, "Evento no disponible")}
                </Link>
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
                  {formatAccountDate(registration.eventStartsAt)}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
                  {accountName(registration.eventLocation, "Ubicación no disponible")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_BADGE[registration.status]}>
                  {STATUS_LABEL[registration.status]}
                </Badge>
                {registration.status === "ACTIVE" && !eventAlreadyStarted(registration) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCancelTarget(registration)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancelar inscripción"
        description={
          <div className="flex flex-col gap-2">
            <span>
              ¿Seguro que quieres cancelar tu inscripción a &ldquo;{cancelTarget?.eventName}&rdquo;?
              Tu cupo quedará disponible para otra persona.
            </span>
            {cancelRegistration.isError && (
              <span role="alert" className="text-error">
                {cancelRegistration.error instanceof ApiError
                  ? cancelRegistration.error.message
                  : "No pudimos cancelar la inscripción. Intenta de nuevo."}
              </span>
            )}
          </div>
        }
        confirmLabel="Cancelar inscripción"
        cancelLabel="Volver"
        destructive
        loading={cancelRegistration.isPending}
        onConfirm={confirmCancel}
        onClose={closeDialog}
      />
    </div>
  );
}
