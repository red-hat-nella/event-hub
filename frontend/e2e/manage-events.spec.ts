import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function loginAsAdmin(page: Page) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Private administrator fixture configuration required");
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/mi-cuenta/);
}

/**
 * Flujo US5: como administrador, crear un evento, editarlo y eliminarlo
 * viendo la advertencia de inscritos activos. Usa la cuenta `ADMIN`
 * sembrada por `user-service` a partir de `SEED_ADMIN_EMAIL`/
 * `SEED_ADMIN_PASSWORD` (quickstart.md §2, `.env.example`).
 */
test.describe("Administrar el catálogo de eventos", () => {
  test("crea, edita y elimina un evento sin inscritos", async ({ page }) => {
    const eventName = `Evento E2E ${Date.now()}`;

    await loginAsAdmin(page);

    await page.goto("/admin/eventos/nuevo");
    await page.getByLabel("Nombre del evento").fill(eventName);
    await page.getByLabel("Descripción").fill("Descripción de prueba E2E.");

    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.getByLabel("Fecha").fill(futureDate);
    await page.getByLabel("Hora").fill("18:00");
    await page.getByLabel("Ubicación").fill("Sala E2E");
    await page.getByLabel("Capacidad máxima").fill("10");

    await page.getByRole("button", { name: /crear evento/i }).click();
    await expect(page).toHaveURL(/\/admin\/eventos\/[^/]+$/);
    await expect(page.getByRole("heading", { name: eventName })).toBeVisible();

    await page.getByRole("link", { name: /^editar$/i }).click();
    await page.getByLabel("Capacidad máxima").fill("20");
    await page.getByRole("button", { name: /guardar cambios/i }).click();
    await expect(page.getByText("20 disponibles de 20")).toBeVisible();

    await page.getByRole("button", { name: /^eliminar$/i }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/sin inscritos/i);
    await dialog.getByRole("button", { name: /eliminar evento/i }).click();

    await expect(page).toHaveURL(/\/admin\/eventos$/);
    await expect(page.getByRole("heading", { name: eventName })).not.toBeVisible();
  });

  test("advierte la fecha pasada al crear un evento", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/eventos/nuevo");
    await page.getByLabel("Nombre del evento").fill("Evento con fecha inválida");
    await page.getByLabel("Descripción").fill("Descripción de prueba.");
    await page.getByLabel("Fecha").fill("2000-01-01");
    await page.getByLabel("Hora").fill("10:00");
    await page.getByLabel("Ubicación").fill("Sala E2E");
    await page.getByLabel("Capacidad máxima").fill("5");
    await page.getByRole("button", { name: /crear evento/i }).click();

    await expect(page.getByText(/posteriores al momento actual/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/eventos\/nuevo/);
  });
});
