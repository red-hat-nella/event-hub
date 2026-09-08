import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "../atoms/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Detalle concreto de la consecuencia (NFR-011), p. ej. "3 personas perderán su cupo". */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Usa el estilo `destructive` del botón de confirmación. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo de confirmación usado por toda acción destructiva o irreversible
 * (cancelar inscripción, eliminar evento). `role="alertdialog"`, atrapa el
 * foco mientras está abierto, `Esc` cierra y el foco vuelve al disparador.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    const dialogNode = dialogRef.current;
    const focusable = dialogNode?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogNode) {
        const elements = Array.from(
          dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (elements.length === 0) return;
        const first = elements[0]!;
        const last = elements[elements.length - 1]!;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-sm rounded-lg bg-bg-canvas p-6 shadow-md"
      >
        <h2 id="confirm-dialog-title" className="font-display text-xl text-text-primary">
          {title}
        </h2>
        <div id="confirm-dialog-description" className="mt-2 text-sm text-text-secondary">
          {description}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
