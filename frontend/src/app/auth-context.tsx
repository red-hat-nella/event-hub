import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api-client';
import { useToast } from '../design-system/molecules/Toast';

interface AuthContextValue {
  user: api.CurrentUser | undefined;
  status: 'loading' | 'authenticated' | 'anonymous' | 'error';
  generation: number;
  isAdmin: boolean;
  retrySession: () => void;
  login: (dto: api.LoginDto) => Promise<api.CurrentUser>;
  register: (dto: api.RegisterDto) => Promise<api.CurrentUser>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const { clearToasts } = useToast();
  const [user, setUser] = useState<api.CurrentUser>();
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [generation, setGeneration] = useState(api.getSessionGeneration);
  const [attempt, setAttempt] = useState(0);
  const sessionRequest = useRef<AbortController>();
  const transition = useCallback((next?: api.CurrentUser) => {
    sessionRequest.current?.abort();
    setGeneration(api.advanceSession());
    clearToasts();
    void client.cancelQueries({ queryKey: ['private'] });
    client.removeQueries({ queryKey: ['private'] });
    setUser(next);
    setStatus(next ? 'authenticated' : 'anonymous');
  }, [client, clearToasts]);
  useEffect(() => api.onPrivateUnauthorized(epoch => {
    if (epoch === api.getSessionGeneration()) transition();
  }), [transition]);
  useEffect(() => {
    const controller = new AbortController();
    sessionRequest.current = controller;
    const epoch = api.getSessionGeneration();
    setStatus('loading');
    api.me(controller.signal).then(next => {
      if (!controller.signal.aborted && epoch === api.getSessionGeneration()) transition(next);
    }).catch(error => {
      if (controller.signal.aborted || epoch !== api.getSessionGeneration()) return;
      if (error instanceof api.ApiError && error.status === 401) transition();
      else setStatus('error');
    });
    return () => controller.abort();
  }, [attempt, transition]);
  const login = useCallback(async (dto: api.LoginDto) => {
    transition();
    const epoch = api.getSessionGeneration();
    const next = await api.login(dto);
    if (epoch !== api.getSessionGeneration()) throw new DOMException('Sesión reemplazada', 'AbortError');
    transition(next);
    return next;
  }, [transition]);
  const register = useCallback(async (dto: api.RegisterDto) => {
    await api.register(dto);
    return login({ email: dto.email, password: dto.password });
  }, [login]);
  const logout = useCallback(async () => {
    transition();
    await api.logout();
  }, [transition]);
  const value = useMemo(() => ({ user, status, generation, isAdmin: user?.role === 'ADMIN', retrySession: () => setAttempt(value => value + 1), login, register, logout }), [user, status, generation, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
