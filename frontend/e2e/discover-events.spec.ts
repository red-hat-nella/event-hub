import { test, expect } from "@playwright/test";

/**
 * Flujo US1 sin sesión: explorar catálogo, aplicar un filtro y abrir el
 * detalle de un evento. Requiere un catálogo ya poblado (quickstart.md §1-4).
 */
test.describe("Descubrir eventos sin sesión", () => {
  test("navega de Home al catálogo y filtra eventos", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("link", { name: /explorar todos los eventos/i }).click();
    await expect(page).toHaveURL(/\/eventos/);
    await expect(page.getByRole("heading", { name: "Explorar eventos" })).toBeVisible();

    await page.getByLabel("Buscar").fill("cerámica");
    await page.getByRole("button", { name: /^buscar$/i }).click();

    await expect(page).toHaveURL(/search=cer/);
  });

  test("abre el detalle de un evento desde el catálogo", async ({ page }) => {
    await page.goto("/eventos");

    const firstCard = page.getByRole("link", { name: /ver detalle/i }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page).toHaveURL(/\/eventos\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("muestra el CTA de inicio de sesión en el detalle sin sesión activa", async ({ page }) => {
    await page.goto("/eventos");
    await page.getByRole("link", { name: /ver detalle/i }).first().click();

    await expect(page.getByRole("link", { name: /inicia sesión para inscribirte/i })).toBeVisible();
  });
});
