import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../auth-context';
import { ToastProvider } from '../../design-system/molecules/Toast';
import * as api from '../../services/api-client';
import { useCancelRegistration } from '../../features/registrations/hooks';
import { registration } from '../../test/fixtures/account';
import { safeReturnPath } from '../safe-return-path';
import { privateQueryKey } from '../private-query-keys';
describe('private session primitives', () => {
  it.each(['https://evil.test', '//evil.test', '/\\evil.test', '%2F%2Fevil.test', '/%2f%2fevil.test'])('rejects unsafe from %s', value => expect(safeReturnPath(value)).toBe('/mi-cuenta'));
  it('preserves internal path and query', () => expect(safeReturnPath('/mi-cuenta/inscripciones?status=ACTIVE')).toBe('/mi-cuenta/inscripciones?status=ACTIVE'));
  it('keys distinguish users and generations', () => {
    expect(privateQueryKey('a', 1, 'registrations')).not.toEqual(privateQueryKey('b', 1, 'registrations'));
    expect(privateQueryKey('a', 1, 'registrations')).not.toEqual(privateQueryKey('a', 2, 'registrations'));
  });
});

it('initial network failure is recoverable, not an anonymous session', async () => {
  let auth: ReturnType<typeof useAuth>;
  function Probe() { auth = useAuth(); return <span>{auth.status}</span>; }
  const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValue(new Response(JSON.stringify({ id: 'a', name: 'Ana', email: 'a@example.test', role: 'USER' })));
  vi.stubGlobal('fetch', fetchMock);
  render(<QueryClientProvider client={new QueryClient()}><ToastProvider><AuthProvider><Probe /></AuthProvider></ToastProvider></QueryClientProvider>);
  await screen.findByText('error');
  act(() => auth!.retrySession());
  await screen.findByText('authenticated');
});

it('late cancellation cannot trigger success callbacks or toasts after logout', async () => {
  let auth: ReturnType<typeof useAuth>;
  let mutation: ReturnType<typeof useCancelRegistration>;
  let release: (value: Response) => void = () => {};
  function Probe() { auth = useAuth(); mutation = useCancelRegistration('r1'); return <span>{auth.status}</span>; }
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.endsWith('/auth/me')) return Promise.resolve(new Response(JSON.stringify({ id: 'a', name: 'Ana', email: 'a@example.test', role: 'USER' })));
    if (url.endsWith('/auth/logout')) return Promise.resolve(new Response(null, { status: 204 }));
    return new Promise<Response>(resolve => { release = resolve; });
  }));
  render(<QueryClientProvider client={new QueryClient()}><ToastProvider><AuthProvider><Probe /></AuthProvider></ToastProvider></QueryClientProvider>);
  await screen.findByText('authenticated');
  const success = vi.fn();
  let pending: Promise<unknown>;
  await act(async () => { pending = mutation!.mutateAsync(undefined, { onSuccess: success }).catch(error => error); });
  await act(async () => { await auth!.logout(); release(new Response(JSON.stringify({ ...registration, status: 'CANCELLED', cancelledAt: '2026-09-08T00:00:00Z' }))); await pending; });
  expect(success).not.toHaveBeenCalled();
  expect(screen.queryByText('Inscripción cancelada.')).not.toBeInTheDocument();
});

afterEach(() => vi.unstubAllGlobals());
it('isolates cache and stale 401 across logout/login; 403 preserves session', async () => {
  let auth: ReturnType<typeof useAuth>;
  function Probe() { auth = useAuth(); return <span>{auth.user?.id || auth.status}</span>; }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let release: (value: Response) => void = () => {};
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.endsWith('/auth/me')) return Promise.resolve(new Response(JSON.stringify({ id: 'A', name: null, email: 'a@example.test', role: 'USER' })));
    if (url.endsWith('/auth/logout')) return Promise.resolve(new Response(null, { status: 204 }));
    if (url.endsWith('/auth/login')) return Promise.resolve(new Response(JSON.stringify({ id: 'B', name: 'Bea', email: 'b@example.test', role: 'USER' })));
    return new Promise<Response>(resolve => { release = resolve; });
  }));
  render(<QueryClientProvider client={client}><ToastProvider><AuthProvider><Probe /></AuthProvider></ToastProvider></QueryClientProvider>);
  await screen.findByText('A');
  client.setQueryData(privateQueryKey('A', auth!.generation, 'registrations'), { items: ['private-A'] });
  const stale = api.getMyRegistrations().catch(() => {});
  await act(async () => { await auth!.logout(); await auth!.login({ email: 'b@example.test', password: 'test-only-password' }); });
  expect(screen.getByText('B')).toBeInTheDocument();
  expect(client.getQueriesData({ queryKey: ['private'] })).toEqual([]);
  await act(async () => { release(new Response('{}', { status: 401 })); await stale; });
  expect(screen.getByText('B')).toBeInTheDocument();
  const forbidden = api.getMyRegistrations().catch(() => {});
  await act(async () => { release(new Response('{}', { status: 403 })); await forbidden; });
  expect(screen.getByText('B')).toBeInTheDocument();
  const expired = api.getMyRegistrations().catch(() => {});
  await act(async () => { release(new Response('{}', { status: 401 })); await expired; });
  await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
});
