import { TicketCheck, Archive } from 'lucide-react';
export function AccountSummaryCards({ activeCount, cancelledCount, loading = false }: { activeCount?: number; cancelledCount?: number; loading?: boolean }) {
  return <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {[{ label: 'Inscripciones activas', value: activeCount, note: 'Tus encuentros, pasados y futuros', icon: TicketCheck }, { label: 'Inscripciones canceladas', value: cancelledCount, note: 'Tu historial, siempre a mano', icon: Archive }].map(({ label, value, note, icon: Icon }) => <div key={label} className="rounded-lg border border-border-subtle bg-bg-surface p-5 sm:p-6">
      <dt className="flex items-center justify-between gap-3 text-sm font-medium text-text-secondary">{label}<Icon size={21} strokeWidth={1.5} aria-hidden="true" /></dt>
      <dd className="mt-4 font-display text-4xl tabular-nums text-text-primary">{loading ? <span className="block h-10 w-16 animate-pulse rounded-md bg-bg-surface-alt" aria-label="Cargando resumen" /> : value === undefined ? <span className="font-body text-lg">No disponible</span> : value}</dd>
      <p className="mt-3 text-xs leading-relaxed text-text-secondary">{note}</p>
    </div>)}
  </dl>;
}
