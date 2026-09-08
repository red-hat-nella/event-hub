import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, UserRound, Compass, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../app/auth-context';
export function AccountNavigation() {
  const { isAdmin } = useAuth();
  const links = [
    { to: '/mi-cuenta', label: 'Mi resumen', icon: LayoutDashboard, end: true },
    { to: '/mi-cuenta/inscripciones', label: 'Mis inscripciones', icon: Ticket, end: false },
    { to: '/mi-cuenta/perfil', label: 'Mi perfil', icon: UserRound, end: false },
    { to: '/eventos', label: 'Catálogo de eventos', icon: Compass, end: false },
    ...(isAdmin ? [{ to: '/admin', label: 'Administración', icon: ShieldCheck, end: false }] : []),
  ];
  return <aside className="min-w-0 lg:border-r lg:border-border-subtle lg:pr-6">
    <p className="mb-4 hidden text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary lg:block">Tu cuenta, a mano</p>
    <nav aria-label="Navegación de cuenta" className="flex flex-wrap gap-2 lg:flex-col">
      {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-bg-surface-alt text-text-primary' : 'text-text-secondary hover:bg-bg-surface'}`}>
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span>
      </NavLink>)}
    </nav>
    <div className="mt-12 hidden rounded-lg bg-bg-surface p-4 lg:block">
      <ArrowUpRight size={22} className="mb-3 text-accent-terracotta-hover" aria-hidden="true" />
      <p className="font-display text-lg">Haz espacio para algo nuevo.</p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">Tu próximo encuentro puede estar más cerca de lo que imaginas.</p>
    </div>
  </aside>;
}
