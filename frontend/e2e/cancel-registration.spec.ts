import { test, expect } from "@playwright/test";

/**
 * Flujo US4: inscribirse a un evento y cancelar la inscripción desde "Mis
 * inscripciones" confirmando en el `ConfirmDialog`, verificando que la fila
 * pasa a "Cancelada" sin recargar la página completa (FR-017). Requiere el
 * stack completo con al menos un evento próximo con cupo (quickstart.md §1-4).
 */
test.describe("Cancelar inscripción", () => {
  test("cancela con confirmación explícita y el cupo se libera", async ({ page }) => {
    const uniqueEmail = `e2e-cancel-${Date.now()}@event-hub.local`;
    const password = "Contraseña123!";

    await page.goto("/registro");
    await page.getByLabel("Nombre").fill("Persona Cancela");
    await page.getByLabel("Correo electrónico").fill(uniqueEmail);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Confirmar contraseña").fill(password);
    await page.getByRole("button", { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/\/mi-cuenta/);

    await page.goto("/eventos");
    await page.getByRole("link", { name: /ver detalle/i }).first().click();
    await page.getByRole("button", { name: /^inscribirme$/i }).click();
    await expect(page.getByRole("link", { name: /ver mi inscripción/i })).toBeVisible();

    await page.goto("/mi-cuenta/inscripciones");
    await expect(page.getByRole("heading", { name: "Mis inscripciones" })).toBeVisible();

    await page.getByRole("button", { name: /^cancelar$/i }).first().click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/tu cupo quedará disponible/i);
    await dialog.getByRole("button", { name: /cancelar inscripción/i }).click();
    await expect(dialog).not.toBeVisible();

    // La inscripción cancelada desaparece del filtro "Activas" (FR-017,
    // actualización inmediata sin recarga completa).
    await expect(page.getByText("Aún no tienes inscripciones")).toBeVisible();

    // Y aparece con su nuevo estado en el filtro "Canceladas".
    await page.getByRole("button", { name: /^canceladas$/i }).click();
    await expect(page.getByText("Cancelada").first()).toBeVisible();
  });
});
