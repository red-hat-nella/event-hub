import { describe, it, expect } from 'vitest';
import { registrationListSchema, registrationSchema } from '../account-schemas';
import { registration } from '../../test/fixtures/account';
describe('account public contract', () => {
  it.each([null, [], {}, { items: null }, { items: {} }, { items: [{ ...registration, id: '' }] }, { items: [{ ...registration, status: 'UNKNOWN' }] }])('rejects malformed essentials %j', data => {
    expect(registrationListSchema.safeParse(data).success).toBe(false);
  });
  it('distinguishes valid empty', () => expect(registrationListSchema.parse({ items: [] })).toEqual({ items: [] }));
  it('normalizes unknown metadata', () => expect(registrationSchema.parse({ ...registration, eventName: undefined, eventStartsAt: 'bad', eventLocation: 42 })).toMatchObject({ eventName: null, eventStartsAt: null, eventLocation: null }));
  it('rejects corrupt state timestamps', () => {
    expect(registrationSchema.safeParse({ ...registration, createdAt: 'bad' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...registration, status: 'CANCELLED', cancelledAt: null }).success).toBe(false);
  });
});
