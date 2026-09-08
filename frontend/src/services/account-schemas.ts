import { z } from 'zod';
const id = z.string().trim().min(1);
const timestamp = z.string().datetime({ offset: true }).refine(value => Number.isFinite(Date.parse(value)));
const metadata = z.unknown().transform(value => typeof value === 'string' && value.trim() ? value.trim() : null);
const optionalDate = z.unknown().transform(value => timestamp.safeParse(value).success ? value as string : null);
export const registrationSchema = z.object({
  id, eventId: id, status: z.enum(['ACTIVE', 'CANCELLED']), createdAt: timestamp, cancelledAt: timestamp.nullable(),
  eventName: metadata, eventStartsAt: optionalDate, eventLocation: metadata,
}).refine(r => r.status === 'ACTIVE' ? r.cancelledAt === null : r.cancelledAt !== null);
export const registrationListSchema = z.object({ items: z.array(registrationSchema) });
export const currentUserSchema = z.object({ id, name: metadata, email: z.string().email(), role: z.enum(['USER', 'ADMIN']) });
export const adminRegistrationsSchema = z.object({ items: z.array(z.object({
  registrationId: id, userId: id, userName: metadata, userEmail: metadata,
  status: z.enum(['ACTIVE', 'CANCELLED']), createdAt: timestamp, cancelledAt: timestamp.nullable(),
})), capacity: z.number().int().nonnegative(), occupied: z.number().int().nonnegative(), available: z.number().int().nonnegative() });
