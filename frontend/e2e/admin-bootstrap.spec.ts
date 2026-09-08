import { test, expect } from '@playwright/test';
test('configured initial administrator can log in and manage a synthetic event', async ({ page }) => {
  test.skip(!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD, 'Private fixture access required');
  // API login avoids placing credentials in screenshots or assertion payloads.
  const login = await page.request.post('/api/auth/login', { data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD } });
  expect(login.status()).toBe(200);
  expect((await login.json()).role).toBe('ADMIN');
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
  const created = await page.request.post('/api/events', { data: { name: `Bootstrap ${Date.now()}`, description: 'Fixture de bootstrap administrado.', location: 'Sala de pruebas', startsAt: new Date(Date.now() + 86400000).toISOString(), maxCapacity: 5 } });
  expect(created.status()).toBe(201);
  const event = await created.json();
  try { expect((await page.request.put(`/api/events/${event.id}`, { data: { name: 'Bootstrap verificado' } })).status()).toBe(200); }
  finally { await page.request.delete(`/api/events/${event.id}`); }
});
