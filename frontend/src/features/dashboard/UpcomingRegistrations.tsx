import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, CalendarDays } from 'lucide-react';
import type { RegistrationSummary } from '../../services/api-client';
import { accountName, formatAccountDate } from '../../design-system/account-formatters';
const cta = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium transition-colors duration-150';
export function NextParticipation({ registration }: { registration: RegistrationSummary | null }) {
  return <section className="relative overflow-hidden rounded-lg bg-text-primary p-6 text-text-inverse sm:p-8">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]"><CalendarDays size={16} aria-hidden="true" /> Tu próximo encuentro</div>
    {registration ? <>
      <p className="mt-6 text-sm">{formatAccountDate(registration.eventStartsAt)}</p>
      <h2 className="mt-2 max-w-xl break-words font-display text-3xl leading-tight sm:text-4xl">{accountName(registration.eventName, 'Evento no disponible')}</h2>
      <p className="mt-4 flex items-center gap-2 text-sm"><MapPin size={17} aria-hidden="true" />{accountName(registration.eventLocation, 'Ubicación no disponible')}</p>
      <Link to={`/mi-cuenta/inscripciones/${registration.id}`} className={`${cta} mt-7 bg-bg-canvas text-text-primary hover:bg-bg-surface-alt`}>Ver inscripción <ArrowRight size={17} aria-hidden="true" /></Link>
    </> : <>
      <h2 className="mt-6 max-w-lg font-display text-3xl leading-tight sm:text-4xl">Lo próximo empieza<br className="hidden sm:block" /> con un buen plan.</h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed">Aún no tienes participaciones próximas. Descubre encuentros, aprende algo nuevo y conecta con tu comunidad.</p>
      <Link to="/eventos" className={`${cta} mt-7 bg-bg-canvas text-text-primary hover:bg-bg-surface-alt`}>Explorar eventos <ArrowRight size={17} aria-hidden="true" /></Link>
    </>}
  </section>;
}
export function UpcomingRegistrations({ registrations }: { registrations: RegistrationSummary[] }) {
  return <section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-display text-2xl">En tu agenda</h2>
      <Link to="/mi-cuenta/inscripciones" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-terracotta-hover hover:underline">Ver todas <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    {registrations.length ? <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
      {registrations.map(registration => <li key={registration.id}><Link to={`/mi-cuenta/inscripciones/${registration.id}`} className="flex min-h-20 items-center gap-4 rounded-lg p-4 transition-colors hover:bg-bg-surface sm:p-5">
        <CalendarDays size={24} className="shrink-0 text-secondary-olive-hover" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0 flex-1"><p className="break-words font-display text-lg">{accountName(registration.eventName, 'Evento no disponible')}</p><p className="mt-1 text-sm text-text-secondary">{formatAccountDate(registration.eventStartsAt)}</p></div>
        <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
      </Link></li>)}
    </ul> : <p className="rounded-lg border border-dashed border-border-subtle p-6 text-sm leading-relaxed text-text-secondary">Cuando te inscribas a un evento futuro, aparecerá aquí. Tus inscripciones anteriores siguen disponibles en el historial.</p>}
  </section>;
}
