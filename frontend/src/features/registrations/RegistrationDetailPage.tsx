import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { useCancelRegistration, useRegistration } from "./hooks";
import { ApiError } from "../../services/api-client";
import type { RegistrationStatus } from "../../services/api-client";
import { Badge } from "../../design-system/atoms/Badge";
import type { BadgeVariant } from "../../design-system/atoms/Badge";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { ConfirmDialog } from "../../design-system/molecules/ConfirmDialog";
import { EmptyState } from "../../design-system/molecules/EmptyState";

import { formatAccountDate, accountName, isFutureDate } from "../../design-system/account-formatters";

const STATUS_BADGE: Record<RegistrationStatus, BadgeVariant> = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
};

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
};

/**
 * Detalle de una inscripción propia (`/mi-cuenta/inscripciones/:id`, US4).
 * `403/404` (no es la dueña o ya no existe) se tratan igual: "no
 * disponible" + volver al listado (E-006, FR-020).
 */
export function RegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: registration, isLoading, isError, error, refetch } = useRegistration(id);
  const cancelRegistration = useCancelRegistration(id);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl animate-pulse px-4 py-10 sm:px-6" aria-hidden="true">
        <div className="h-8 w-2/3 rounded-sm bg-bg-surface-alt" />
        <div className="mt-4 h-4 w-1/3 rounded-sm bg-bg-surface-alt" />
        <div className="mt-2 h-4 w-1/2 rounded-sm bg-bg-surface-alt" />
      </div>
    );
  }

  if (isError) {
    const unavailable = error instanceof ApiError && (error.status === 403 || error.status === 404);
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title={unavailable ? "Esta inscripción no está disponible" : "No pudimos cargar la inscripción"}
          description={
            unavailable
              ? "Puede que haya sido eliminada o que no tengas acceso a ella."
              : "Ocurrió un problema de conexión. Intenta nuevamente."
          }
          action={
            unavailable ? (
              <Link to="/mi-cuenta/inscripciones" className={buttonClassNames("secondary", "sm")}>
                <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Volver a mis inscripciones
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

  if (!registration) return null;

  const canCancel =
    registration.status === "ACTIVE" &&
    isFutureDate(registration.eventStartsAt);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6">
      <Link
        to="/mi-cuenta/inscripciones"
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-terracotta"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" /> Volver a mis inscripciones
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl text-text-primary">{accountName(registration.eventName, "Evento no disponible")}</h1>
          <Badge variant={STATUS_BADGE[registration.status]}>{STATUS_LABEL[registration.status]}</Badge>
        </div>

        <div className="flex flex-col gap-1.5 text-text-secondary">
          <span className="flex items-center gap-2">
            <CalendarDays size={18} strokeWidth={1.5} aria-hidden="true" />
            {formatAccountDate(registration.eventStartsAt)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={18} strokeWidth={1.5} aria-hidden="true" />
            {accountName(registration.eventLocation, "Ubicación no disponible")}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-text-primary">Fecha de inscripción</dt>
            <dd className="text-text-secondary">{formatAccountDate(registration.createdAt)}</dd>
          </div>
          {registration.cancelledAt && (
            <div>
              <dt className="font-medium text-text-primary">Fecha de cancelación</dt>
              <dd className="text-text-secondary">{formatAccountDate(registration.cancelledAt)}</dd>
            </div>
          )}
        </dl>

        {registration.status === "CANCELLED" && (
          <p className="flex items-center gap-2 text-sm text-text-secondary">
            <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" className="text-secondary-olive" />
            Esta inscripción fue cancelada.
          </p>
        )}

        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            className="self-start"
            onClick={() => setDialogOpen(true)}
          >
            Cancelar inscripción
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title="Cancelar inscripción"
        description={
          <div className="flex flex-col gap-2">
            <span>
              ¿Seguro que quieres cancelar tu inscripción a &ldquo;{accountName(registration.eventName, "Evento no disponible")}&rdquo;? Tu
              cupo quedará disponible para otra persona.
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
        onConfirm={() =>
          cancelRegistration.mutate(undefined, {
            onSuccess: () => setDialogOpen(false),
          })
        }
        onClose={() => {
          if (!cancelRegistration.isPending) setDialogOpen(false);
        }}
      />
    </div>
  );
}
