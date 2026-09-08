export const account = { id: 'u1', name: 'Ana Ejemplo', email: 'ana@example.test', role: 'USER' as const };
export const registration = {
  id: 'r1', eventId: 'e1', status: 'ACTIVE' as const,
  createdAt: '2026-09-07T12:00:00.000Z', cancelledAt: null as string | null,
  eventName: 'Encuentro de arte', eventStartsAt: '2030-10-01T18:00:00.000Z', eventLocation: 'Parque Central',
};
export function accountRegistrations(count: number) {
  return Array.from({ length: count }, (_, i) => ({ ...registration,
    id: `r${i}`, eventId: `e${i}`, status: i % 3 === 0 ? 'CANCELLED' as const : 'ACTIVE' as const,
    cancelledAt: i % 3 === 0 ? '2026-09-08T12:00:00.000Z' : null,
    eventStartsAt: new Date(Date.UTC(2030, 9, i + 1)).toISOString(),
  }));
}
