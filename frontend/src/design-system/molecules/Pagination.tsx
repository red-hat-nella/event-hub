import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "../atoms/IconButton";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación"
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <IconButton
        aria-label="Página anterior"
        icon={<ChevronLeft size={18} strokeWidth={1.5} />}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      <span className="text-sm text-text-secondary" aria-live="polite">
        Página {page} de {totalPages}
      </span>
      <IconButton
        aria-label="Página siguiente"
        icon={<ChevronRight size={18} strokeWidth={1.5} />}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}
