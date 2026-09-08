import { z } from 'zod';
const temporalStatus = z.enum(['upcoming', 'ongoing', 'finished', 'UPCOMING', 'ONGOING', 'FINISHED'])
  .transform(value => value.toUpperCase() as 'UPCOMING' | 'ONGOING' | 'FINISHED');
const eventSummary = z.object({
  id: z.string().min(1), name: z.string(), startsAt: z.string().datetime({ offset: true }), location: z.string(),
  category: z.string().nullable(), imageUrl: z.string().nullable(), maxCapacity: z.number().int().nonnegative(),
  availableSlots: z.number().int().nonnegative(), temporalStatus,
});
export const eventDetailSchema = eventSummary.extend({ description: z.string() });
export const eventsPageSchema = z.object({ items: z.array(eventSummary), page: z.number().int(), pageSize: z.number().int(), total: z.number().int().nonnegative(), totalPages: z.number().int() });
