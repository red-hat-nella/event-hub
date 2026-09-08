import type { RegistrationSummary } from '../../services/api-client';
export function summarizeAccount(items: RegistrationSummary[], now = Date.now()) {
  const active = items.filter(r => r.status === 'ACTIVE');
  const upcoming = active.filter(r => r.eventStartsAt !== null && Date.parse(r.eventStartsAt) > now)
    .sort((a, b) => Date.parse(a.eventStartsAt!) - Date.parse(b.eventStartsAt!) || a.id.localeCompare(b.id)).slice(0, 3);
  return { activeCount: active.length, cancelledCount: items.filter(r => r.status === 'CANCELLED').length, upcoming, nextParticipation: upcoming[0] ?? null };
}
