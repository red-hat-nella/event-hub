import { test, expect } from "@playwright/test";

/**
 * Flujo dorado US3: crear una cuenta, abrir el detalle de un evento con
 * cupo disponible e inscribirse, verificando la confirmación inline + el
 * cambio de CTA a "Ver mi inscripción". Requiere el stack completo con al
 * menos un evento próximo con cupo (quickstart.md §1-4).
 */
test.describe("Inscribirse a un evento", () => {
  test("se inscribe desde el detalle y ve la confirmación", async ({ page }) => {
    const uniqueEmail = `e2e-register-${Date.now()}@event-hub.local`;
    const password = "Contraseña123!";

    await page.goto("/registro");
    await page.getByLabel("Nombre").fill("Persona Inscrita");
    await page.getByLabel("Correo electrónico").fill(uniqueEmail);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Confirmar contraseña").fill(password);
    await page.getByRole("button", { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/\/mi-cuenta/);

    await page.goto("/eventos");
    await page.getByRole("link", { name: /ver detalle/i }).first().click();
    await expect(page).toHaveURL(/\/eventos\/.+/);

    const registerButton = page.getByRole("button", { name: /^inscribirme$/i });
    await expect(registerButton).toBeEnabled();
    await registerButton.click();

    await expect(
      page.getByRole("status").filter({ hasText: /inscripción confirmada/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /ver mi inscripción/i })).toBeVisible();

    // La confirmación también se refleja en "Mis inscripciones" (US4 checkpoint).
    await page.goto("/mi-cuenta/inscripciones");
    await expect(page.getByText("Activa").first()).toBeVisible();
  });

  test("ofrece iniciar sesión en vez del CTA de inscripción sin sesión activa", async ({ page }) => {
    await page.goto("/eventos");
    await page.getByRole("link", { name: /ver detalle/i }).first().click();

    await expect(page.getByRole("link", { name: /inicia sesión para inscribirte/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^inscribirme$/i })).not.toBeVisible();
  });
});
