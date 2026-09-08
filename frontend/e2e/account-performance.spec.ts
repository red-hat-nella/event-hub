import { test, expect } from '@playwright/test';
import { account, accountRegistrations } from '../src/test/fixtures/account';
test('SC-005: twenty cold openings per account view at 10 Mbps / 100 ms', async ({ page, context }) => {
  test.setTimeout(240_000);
  const items = accountRegistrations(100);
  await page.route('**/api/auth/me', route => route.fulfill({ json: account }));
  await page.route('**/api/registrations/me*', route => route.fulfill({ json: { items } }));
  await page.route('**/api/registrations/r1', route => route.fulfill({ json: items[1] }));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 10_000_000 / 8, uploadThroughput: 10_000_000 / 8 });
  for (const [path, heading] of [['/mi-cuenta', 'Tu espacio'], ['/mi-cuenta/inscripciones', 'Mis inscripciones'], ['/mi-cuenta/perfil', 'Mi perfil'], ['/mi-cuenta/inscripciones/r1', 'Encuentro de arte']]) {
    const samples: number[] = [];
    for (let index = 0; index < 20; index++) {
      const start = Date.now();
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      if (path === '/mi-cuenta') await expect(page.getByText('66', { exact: true })).toBeVisible();
      if (path === '/mi-cuenta/inscripciones') await expect(page.getByRole('link', { name: 'Encuentro de arte', exact: true }).first()).toBeVisible();
      samples.push(Date.now() - start);
    }
    console.log(JSON.stringify({ metric: 'SC-005', path, samples, under3000: samples.filter(ms => ms < 3000).length }));
    expect(samples.filter(ms => ms < 3000).length).toBeGreaterThanOrEqual(19);
  }
});
