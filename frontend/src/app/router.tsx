import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { ProtectedRoute, AdminRoute } from "./route-guards";
import { PlaceholderPage } from "./placeholders";
import { HomePage } from "../features/events/HomePage";
import { CatalogPage } from "../features/events/CatalogPage";
import { EventDetailPage } from "../features/events/EventDetailPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { UserDashboardPage } from "../features/dashboard/UserDashboardPage";
import { ProfilePage } from "../features/dashboard/ProfilePage";
import { MyRegistrationsPage } from "../features/registrations/MyRegistrationsPage";
import { RegistrationDetailPage } from "../features/registrations/RegistrationDetailPage";
import { AdminDashboardPage } from "../features/admin/AdminDashboardPage";
import { EventsListPage } from "../features/admin/EventsListPage";
import { CreateEventPage } from "../features/admin/CreateEventPage";
import { EditEventPage } from "../features/admin/EditEventPage";
import { AdminEventDetailPage } from "../features/admin/AdminEventDetailPage";
import { EventRegistrationsPage } from "../features/admin/EventRegistrationsPage";

/**
 * Árbol de rutas completo de `ux-design.md §3`. Todas las historias de
 * usuario (US1-US6) están conectadas a páginas reales; solo la ruta `*`
 * (no encontrada) usa `PlaceholderPage`, que es su propósito original.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "eventos", element: <CatalogPage /> },
      { path: "eventos/:id", element: <EventDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "registro", element: <RegisterPage /> },

      {
        path: "mi-cuenta",
        element: (
          <ProtectedRoute>
            <UserDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "mi-cuenta/inscripciones",
        element: (
          <ProtectedRoute>
            <MyRegistrationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "mi-cuenta/inscripciones/:id",
        element: (
          <ProtectedRoute>
            <RegistrationDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "mi-cuenta/perfil",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },

      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/eventos",
        element: (
          <AdminRoute>
            <EventsListPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/eventos/nuevo",
        element: (
          <AdminRoute>
            <CreateEventPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/eventos/:id/editar",
        element: (
          <AdminRoute>
            <EditEventPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/eventos/:id",
        element: (
          <AdminRoute>
            <AdminEventDetailPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/eventos/:id/inscripciones",
        element: (
          <AdminRoute>
            <EventRegistrationsPage />
          </AdminRoute>
        ),
      },

      {
        path: "*",
        element: (
          <PlaceholderPage
            title="Página no encontrada"
            description="La página que buscas no existe o fue movida."
          />
        ),
      },
    ],
  },
]);
