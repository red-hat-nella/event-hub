import { test, expect } from "@playwright/test";

/**
 * Flujo US2: crear una cuenta (auto-login), cerrar sesión y volver a
 * iniciar sesión con las mismas credenciales. Requiere el stack completo
 * corriendo (quickstart.md §1-4).
 */
test.describe("Registro, logout, login", () => {
  test("registra una cuenta nueva, cierra sesión y vuelve a iniciar sesión", async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@event-hub.local`;
    const password = "Contraseña123!";

    await page.goto("/registro");
    await page.getByLabel("Nombre").fill("Usuaria de Prueba");
    await page.getByLabel("Correo electrónico").fill(uniqueEmail);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Confirmar contraseña").fill(password);
    await page.getByRole("button", { name: /crear cuenta/i }).click();

    // Auto-login tras registro: termina en una ruta protegida, no en /login.
    await expect(page).toHaveURL(/\/mi-cuenta/);

    await page.getByRole("button", { name: /usuaria de prueba/i }).click();
    await page.getByRole("menuitem", { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(uniqueEmail);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(page).toHaveURL(/\/mi-cuenta/);
  });

  test("muestra un mensaje genérico ante credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("no-existe@event-hub.local");
    await page.getByLabel("Contraseña", { exact: true }).fill("cualquier-cosa");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    await expect(page.getByRole("alert")).toContainText(/correo o contraseña incorrectos/i);
  });
});
