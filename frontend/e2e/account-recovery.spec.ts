import { test, expect } from '@playwright/test';
import { registration } from '../src/test/fixtures/account';
const user = { id: 'u1', name: 'Ana', email: 'ana@example.test', role: 'USER' };
test('private route preserves filter through corrupt response and retry', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: user }));
  let healthy = false;
  await page.route('**/api/registrations/me*', route => route.fulfill({ json: healthy ? { items: [] } : null }));
  await page.goto('/mi-cuenta/inscripciones?status=ACTIVE');
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
  healthy = true;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
  await expect(page).toHaveURL(/status=ACTIVE/);
});

test('partial metadata, failed cancellation, unavailable detail and back navigation remain usable', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ json: { ...user, name: null } }));
  await page.route('**/api/registrations/me*', route => route.fulfill({ json: { items: [{ ...registration, eventName: null, eventStartsAt: 'invalid', eventLocation: null }] } }));
  await page.goto('/mi-cuenta/inscripciones');
  await expect(page.getByText('Fecha no disponible')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0);
  await page.route('**/api/registrations/r1', route => route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND' } } }));
  await page.getByRole('link', { name: 'Evento no disponible' }).click();
  await expect(page.getByText('Esta inscripción no está disponible')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Mis inscripciones' })).toBeVisible();
  await page.unroute('**/api/registrations/r1');
  await page.route('**/api/registrations/r1', route => route.fulfill(route.request().method() === 'DELETE' ? { status: 503, json: { error: { code: 'SERVICE_UNAVAILABLE' } } } : { json: registration }));
  await page.goto('/mi-cuenta/inscripciones/r1');
  await page.getByRole('button', { name: 'Cancelar inscripción', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar inscripción' }).click();
  await expect(page.getByRole('alertdialog').getByRole('alert')).toBeVisible();
  await expect(page.getByText('Esta inscripción fue cancelada.')).toHaveCount(0);
  await page.getByRole('alertdialog').getByRole('button', { name: 'Volver', exact: true }).click();
  await page.goto('/mi-cuenta/perfil');
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
});
test('expired private session returns through internal login destination', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED' } } }));
  await page.goto('/mi-cuenta/inscripciones');
  await expect(page).toHaveURL(/login\?from=/);
});
