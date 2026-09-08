import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración E2E (research.md §14): requiere el stack completo
 * corriendo (backend + frontend, ver quickstart.md §1-4). No se ejecuta
 * como parte de `npm run build`/`npm run test`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
