import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@event-hub.local";
const ADMIN_PASSWORD = "changeme-admin-password";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await expect(page).toHaveURL(/\/mi-cuenta/);
}

async function logout(page: Page, accountMenuName: RegExp) {
  await page.getByRole("button", { name: accountMenuName }).click();
  await page.getByRole("menuitem", { name: /cerrar sesión/i }).click();
  await expect(page).toHaveURL("/");
}

/**
 * Flujo US6: como administrador, crear un evento y verificar que la vista
 * de inscripciones (`/admin/eventos/:id/inscripciones`) refleja en vivo una
 * inscripción y una cancelación realizadas por una persona usuaria. Usa la
 * cuenta `ADMIN` sembrada por `user-service` (quickstart.md §2, `.env.example`).
 */
test.describe("Consultar inscripciones de un evento (admin)", () => {
  test("ve el conteo y el estado actualizados tras inscripción y cancelación", async ({ page }) => {
    const eventName = `Evento Inscripciones E2E ${Date.now()}`;

    // 1. El admin crea un evento con cupo limitado.
    await loginAsAdmin(page);

    await page.goto("/admin/eventos/nuevo");
    await page.getByLabel("Nombre del evento").fill(eventName);
    await page.getByLabel("Descripción").fill("Descripción de prueba E2E.");
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.getByLabel("Fecha").fill(futureDate);
    await page.getByLabel("Hora").fill("18:00");
    await page.getByLabel("Ubicación").fill("Sala E2E");
    await page.getByLabel("Capacidad máxima").fill("5");
    await page.getByRole("button", { name: /crear evento/i }).click();
    await expect(page).toHaveURL(/\/admin\/eventos\/[^/]+$/);
    const eventId = page.url().split("/").filter(Boolean).pop();

    // Sin inscritos todavía: el vacío editorial de US6 debe aparecer.
    await page.goto(`/admin/eventos/${eventId}/inscripciones`);
    await expect(page.getByText("Aún no hay inscritos en este evento")).toBeVisible();

    await logout(page, /administrador/i);

    // 2. Una persona usuaria se registra y se inscribe al evento.
    const uniqueEmail = `e2e-admin-regs-${Date.now()}@event-hub.local`;
    const password = "Contraseña123!";
    await page.goto("/registro");
    await page.getByLabel("Nombre").fill("Persona Inscrita Admin");
    await page.getByLabel("Correo electrónico").fill(uniqueEmail);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Confirmar contraseña").fill(password);
    await page.getByRole("button", { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/\/mi-cuenta/);

    await page.goto(`/eventos/${eventId}`);
    await page.getByRole("button", { name: /^inscribirme$/i }).click();
    await expect(page.getByRole("link", { name: /ver mi inscripción/i })).toBeVisible();

    // 3. Cancela su propia inscripción.
    await page.goto("/mi-cuenta/inscripciones");
    await page.getByRole("button", { name: /^cancelar$/i }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: /cancelar inscripción/i }).click();

    await logout(page, /persona inscrita admin/i);

    // 4. El admin ve el conteo actualizado y la inscripción cancelada.
    await loginAsAdmin(page);
    await page.goto(`/admin/eventos/${eventId}/inscripciones`);
    await expect(page.getByText("0 ocupados / 5 disponibles de 5")).toBeVisible();

    await page.getByRole("button", { name: /^canceladas$/i }).click();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });
});
