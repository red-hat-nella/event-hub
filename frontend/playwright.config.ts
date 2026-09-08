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
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: process.env.ACCOUNT_PRODUCTION_TEST ? "npm run preview -- --port 5173" : "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
