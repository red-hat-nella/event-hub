import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import * as api from "../services/api-client";
import type { CurrentUser } from "../services/api-client";

interface AuthContextValue {
  /** `undefined` mientras se resuelve `GET /api/auth/me` al montar. */
  user: CurrentUser | undefined;
  status: "loading" | "authenticated" | "anonymous";
  isAdmin: boolean;
  login: (dto: api.LoginDto) => Promise<CurrentUser>;
  register: (dto: api.RegisterDto) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Fuente única de verdad de la sesión (id/nombre/rol). Como las cookies de
 * sesión son `httpOnly`, la única forma de saber si hay sesión activa es
 * preguntarle a `GET /api/auth/me` — se hace una vez al montar la app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | undefined>(undefined);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((currentUser) => {
        if (cancelled) return;
        setUser(currentUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setUser(undefined);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (dto: api.LoginDto) => {
    const currentUser = await api.login(dto);
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }, []);

  const register = useCallback(async (dto: api.RegisterDto) => {
    await api.register(dto);
    // Auto-login tras registro (SC-001: minimizar pasos).
    return login({ email: dto.email, password: dto.password });
  }, [login]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(undefined);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
    }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
