import { test, expect } from '@playwright/test';
import { account, accountRegistrations } from '../src/test/fixtures/account';
for (const width of [360, 768, 1440]) {
  for (const mode of ['empty', 'content', 'error']) {
    test(`dashboard ${mode} at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/auth/me', route => route.fulfill({ json: { ...account, name: 'Ana con un nombre especialmente largo para verificar los saltos de línea' } }));
      await page.route('**/api/registrations/me*', route => route.fulfill({ json: mode === 'error' ? null : { items: accountRegistrations(mode === 'empty' ? 0 : 21) } }));
      await page.goto('/mi-cuenta');
      await expect(page.getByRole('heading', { name: 'Tu espacio' })).toBeVisible();
      if (mode === 'error') await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
      else if (mode === 'content') await expect(page.getByRole('link', { name: 'Ver inscripción', exact: true })).toBeVisible();
      else await expect(page.getByRole('main').getByRole('link', { name: 'Explorar eventos', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: info.outputPath(`dashboard-${mode}-${width}.png`), fullPage: true });
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');
      const tooSmall = await page.getByRole('main').locator('a, button').evaluateAll(elements => elements.filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      }).map(element => element.textContent));
      expect(tooSmall).toEqual([]);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
