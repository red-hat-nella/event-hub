import type { ReactNode } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  CircleCheck,
  Ban,
} from "lucide-react";

export type BadgeVariant =
  | "available"
  | "soldout"
  | "upcoming"
  | "ongoing"
  | "finished"
  | "active"
  | "cancelled";

export interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  available: "bg-secondary-olive/10 text-secondary-olive",
  soldout: "bg-warning/10 text-warning",
  upcoming: "bg-accent-clay/15 text-accent-terracotta-hover",
  ongoing: "bg-success/10 text-success",
  finished: "bg-bg-surface-alt text-text-secondary",
  active: "bg-success/10 text-success",
  cancelled: "bg-error/10 text-error",
};

const variantIcons: Record<BadgeVariant, ReactNode> = {
  available: <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" />,
  soldout: <XCircle size={14} strokeWidth={1.5} aria-hidden="true" />,
  upcoming: <Clock size={14} strokeWidth={1.5} aria-hidden="true" />,
  ongoing: <PlayCircle size={14} strokeWidth={1.5} aria-hidden="true" />,
  finished: <CircleCheck size={14} strokeWidth={1.5} aria-hidden="true" />,
  active: <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" />,
  cancelled: <Ban size={14} strokeWidth={1.5} aria-hidden="true" />,
};

/**
 * Insignia de estado. Nunca comunica el estado solo por color (NFR-012):
 * siempre combina ícono `lucide-react` + texto.
 */
export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {variantIcons[variant]}
      {children}
    </span>
  );
}
