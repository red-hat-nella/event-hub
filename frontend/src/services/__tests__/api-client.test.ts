import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMyRegistrations, getEvent } from '../api-client';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('account HTTP', () => {
  it('normalizes the real lowercase event status for registration actions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'e1', name: 'Encuentro', description: 'Descripción', startsAt: '2030-01-01T12:00:00Z', location: 'Sala', category: null, imageUrl: null, maxCapacity: 10, availableSlots: 10, temporalStatus: 'upcoming' }))));
    expect((await getEvent('e1')).temporalStatus).toBe('UPCOMING');
  });
  it('rejects malformed successful JSON and envelopes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not json', { status: 200 })));
    await expect(getMyRegistrations()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 200 })));
    await expect(getMyRegistrations()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('aborts at eight seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))));
    const assertion = expect(getMyRegistrations()).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });
});
