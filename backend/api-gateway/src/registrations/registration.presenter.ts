import { BadGatewayException } from '@nestjs/common';

const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const timestamp = (value: unknown): value is string =>
  text(value) &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  Number.isFinite(Date.parse(value));
export function invalidRegistrationResponse(): never {
  throw new BadGatewayException({
    error: {
      code: 'INVALID_UPSTREAM_RESPONSE',
      message: 'No pudimos cargar la información de inscripciones.',
    },
  });
}
export function presentRegistration(value: unknown) {
  if (!value || typeof value !== 'object') return invalidRegistrationResponse();
  const r = value as Record<string, unknown>;
  if (
    !text(r.id) ||
    !text(r.eventId) ||
    !text(r.userId) ||
    !timestamp(r.createdAt) ||
    !['ACTIVE', 'CANCELLED'].includes(String(r.status)) ||
    (r.status === 'ACTIVE' ? r.cancelledAt !== null : !timestamp(r.cancelledAt))
  )
    return invalidRegistrationResponse();
  return {
    id: r.id,
    eventId: r.eventId,
    status: r.status as 'ACTIVE' | 'CANCELLED',
    createdAt: r.createdAt,
    cancelledAt: r.cancelledAt as string | null,
    eventName: text(r.eventNameSnapshot) ? r.eventNameSnapshot.trim() : null,
    eventStartsAt: timestamp(r.eventStartsAtSnapshot)
      ? r.eventStartsAtSnapshot
      : null,
    eventLocation: text(r.eventLocationSnapshot)
      ? r.eventLocationSnapshot.trim()
      : null,
  };
}
export function presentRegistrationList(value: unknown) {
  if (!Array.isArray(value)) return invalidRegistrationResponse();
  return { items: value.map(presentRegistration) };
}
