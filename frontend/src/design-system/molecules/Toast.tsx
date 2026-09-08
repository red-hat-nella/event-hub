import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { IconButton } from "../atoms/IconButton";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  /** Encola un toast; se auto-descarta a los 5s. */
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 5000;

const variantStyles: Record<ToastVariant, string> = {
  success: "border-success/30 bg-bg-canvas text-success",
  error: "border-error/30 bg-bg-canvas text-error",
  info: "border-border-subtle bg-bg-canvas text-text-primary",
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={20} strokeWidth={1.5} aria-hidden="true" />,
  error: <AlertCircle size={20} strokeWidth={1.5} aria-hidden="true" />,
  info: <Info size={20} strokeWidth={1.5} aria-hidden="true" />,
};

/** Envuelve la app entera (ver `app/providers.tsx`); expone `useToast()`. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, variant, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return context;
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:inset-x-auto"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-md border px-4 py-3 shadow-md ${variantStyles[toast.variant]}`}
        >
          {variantIcons[toast.variant]}
          <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
          <IconButton
            aria-label="Cerrar notificación"
            icon={<X size={16} strokeWidth={1.5} />}
            variant="ghost"
            className="h-6 w-6 text-text-secondary"
            onClick={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
