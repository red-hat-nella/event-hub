import { ConfirmDialog } from "../../design-system/molecules/ConfirmDialog";
import { ApiError } from "../../services/api-client";
import type { useDeleteEventDialog } from "./hooks";

export interface DeleteEventDialogProps {
  dialog: ReturnType<typeof useDeleteEventDialog>;
  /** Se ejecuta tras eliminar con éxito (p. ej. redirigir a la lista). */
  onDeleted?: () => void;
}

/**
 * `ConfirmDialog` compartido por `EventsListPage` y `AdminEventDetailPage`
 * para eliminar un evento: siempre advierte explícitamente cuántas
 * inscripciones activas se perderían (NFR-011) antes de confirmar.
 */
export function DeleteEventDialog({ dialog, onDeleted }: DeleteEventDialogProps) {
  const { target, close, confirm, deleteEvent, countLoading } = dialog;

  return (
    <ConfirmDialog
      open={Boolean(target)}
      title="Eliminar evento"
      description={
        target ? (
          <div className="flex flex-col gap-2">
            <span>
              ¿Seguro que quieres eliminar &ldquo;{target.event.name}&rdquo;? Esta acción no se
              puede deshacer.
            </span>
            {target.loadError ? (
              <span role="alert" className="text-error">
                {target.loadError}
              </span>
            ) : target.activeRegistrations === undefined ? (
              <span className="text-text-secondary">Consultando inscripciones activas…</span>
            ) : target.activeRegistrations > 0 ? (
              <span className="font-medium text-warning">
                {target.activeRegistrations}{" "}
                {target.activeRegistrations === 1
                  ? "persona inscrita perderá"
                  : "personas inscritas perderán"}{" "}
                su cupo.
              </span>
            ) : (
              <span className="text-text-secondary">Sin inscritos: nadie perderá su cupo.</span>
            )}
            {deleteEvent.isError && (
              <span role="alert" className="text-error">
                {deleteEvent.error instanceof ApiError
                  ? deleteEvent.error.message
                  : "No pudimos eliminar el evento."}
              </span>
            )}
          </div>
        ) : (
          ""
        )
      }
      confirmLabel="Eliminar evento"
      destructive
      loading={deleteEvent.isPending || countLoading}
      onConfirm={() => confirm(onDeleted)}
      onClose={close}
    />
  );
}
