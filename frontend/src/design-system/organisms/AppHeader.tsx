import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "../../app/auth-context";
import { Avatar } from "../atoms/Avatar";
import { Spinner } from "../atoms/Spinner";
import { buttonClassNames } from "../atoms/Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors duration-150 ease-out hover:text-accent-terracotta ${
    isActive ? "text-accent-terracotta" : "text-text-primary"
  }`;

/**
 * Header persistente. La navegación es idéntica en estructura para Usuario
 * y Administrador (NFR-013): solo el menú de cuenta agrega "Panel de
 * administración" cuando `role === "ADMIN"`.
 */
export function AppHeader() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl text-text-primary">
            Event Hub
          </Link>
          <nav
            className="hidden items-center gap-6 sm:flex"
            aria-label="Navegación principal"
          >
            <NavLink to="/eventos" className={navLinkClass}>
              Explorar eventos
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {status === "loading" && <Spinner size={20} label="Cargando sesión" />}

          {status === "anonymous" && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className={buttonClassNames("ghost", "sm")}>
                Iniciar sesión
              </Link>
              <Link to="/registro" className={buttonClassNames("primary", "sm")}>
                Crear cuenta
              </Link>
            </div>
          )}

          {status === "authenticated" && user && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <Avatar name={user.name} size={32} />
                <span className="hidden text-sm font-medium text-text-primary sm:inline">
                  {user.name}
                </span>
                <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Menú de cuenta"
                  className="absolute right-0 mt-2 w-56 rounded-md border border-border-subtle bg-bg-canvas py-1 shadow-md"
                >
                  <Link
                    role="menuitem"
                    to="/mi-cuenta"
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-alt"
                    onClick={() => setMenuOpen(false)}
                  >
                    Mi cuenta
                  </Link>
                  <Link
                    role="menuitem"
                    to="/mi-cuenta/inscripciones"
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-alt"
                    onClick={() => setMenuOpen(false)}
                  >
                    Mis inscripciones
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      role="menuitem"
                      to="/admin"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-bg-surface-alt"
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel de administración
                    </Link>
                  )}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-bg-surface-alt"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md sm:hidden"
            aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? (
              <X size={22} strokeWidth={1.5} />
            ) : (
              <Menu size={22} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <nav
          className="flex flex-col gap-2 border-t border-border-subtle px-4 py-3 sm:hidden"
          aria-label="Navegación principal (móvil)"
        >
          <NavLink
            to="/eventos"
            className={navLinkClass}
            onClick={() => setMobileNavOpen(false)}
          >
            Explorar eventos
          </NavLink>
          {status === "anonymous" && (
            <>
              <Link to="/login" onClick={() => setMobileNavOpen(false)}>
                Iniciar sesión
              </Link>
              <Link to="/registro" onClick={() => setMobileNavOpen(false)}>
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
