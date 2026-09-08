import { useEffect, useState } from 'react';
import { useAuth } from '../../app/auth-context';
import { useMyRegistrations } from '../registrations/hooks';
import { accountName } from '../../design-system/account-formatters';
import { QueryErrorState } from '../../design-system/molecules/QueryErrorState';
import { AccountNavigation } from './AccountNavigation';
import { AccountSummaryCards } from './AccountSummaryCards';
import { NextParticipation, UpcomingRegistrations } from './UpcomingRegistrations';
import { summarizeAccount } from './account-summary';

export function UserDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyRegistrations();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const summary = data && !isError ? summarizeAccount(data.items, now) : undefined;
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="mb-8 border-b border-border-subtle pb-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-terracotta-hover">MI CUENTA / EVENT HUB</p>
      <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Tu espacio</h1>
      <p className="mt-4 max-w-2xl break-words leading-relaxed text-text-secondary">Hola, {accountName(user?.name)}. Aquí están tus planes, tus encuentros y todo lo que viene.</p>
    </header>
    <div className="grid min-w-0 gap-8 lg:grid-cols-[208px_minmax(0,1fr)]">
      <AccountNavigation />
      <div className="flex min-w-0 flex-col gap-8">
        <AccountSummaryCards activeCount={summary?.activeCount} cancelledCount={summary?.cancelledCount} loading={isLoading} />
        {isLoading && <section role="status" aria-label="Cargando actividad" className="h-72 animate-pulse rounded-lg bg-bg-surface-alt" />}
        {isError && <QueryErrorState onRetry={() => { void refetch({ cancelRefetch: true }); }} />}
        {summary && <><NextParticipation registration={summary.nextParticipation} /><UpcomingRegistrations registrations={summary.upcoming} /></>}
        <p className="border-t border-border-subtle pt-5 text-xs leading-relaxed text-text-secondary">Hecho para encontrarnos. Tu actividad es privada y solo tú puedes gestionar tus inscripciones.</p>
      </div>
    </div>
  </div>;
}
