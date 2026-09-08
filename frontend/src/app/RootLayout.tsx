import { Outlet } from "react-router-dom";
import { AppHeader } from "../design-system/organisms/AppHeader";
import { AppFooter } from "../design-system/organisms/AppFooter";

/** Layout persistente (header + contenido + footer) para todas las rutas. */
export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
