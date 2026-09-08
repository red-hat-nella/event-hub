export const internalRegistration = {
  id: 'r1',
  userId: 'u1',
  eventId: 'e1',
  status: 'ACTIVE',
  createdAt: '2026-09-07T12:00:00.000Z',
  cancelledAt: null,
  eventNameSnapshot: 'Encuentro de arte',
  eventStartsAtSnapshot: '2030-10-01T18:00:00.000Z',
  eventLocationSnapshot: 'Parque Central',
};
export const publicRegistration = {
  id: 'r1',
  eventId: 'e1',
  status: 'ACTIVE',
  createdAt: internalRegistration.createdAt,
  cancelledAt: null,
  eventName: internalRegistration.eventNameSnapshot,
  eventStartsAt: internalRegistration.eventStartsAtSnapshot,
  eventLocation: internalRegistration.eventLocationSnapshot,
};
export const invalidMetadata = {
  ...internalRegistration,
  eventNameSnapshot: null,
  eventStartsAtSnapshot: 'invalid',
  eventLocationSnapshot: 42,
};
export const invalidCore = { ...internalRegistration, status: 'UNKNOWN' };
