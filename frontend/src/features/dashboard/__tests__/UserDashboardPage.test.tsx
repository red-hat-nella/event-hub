import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserDashboardPage } from '../UserDashboardPage';
import { account, accountRegistrations } from '../../../test/fixtures/account';
const state = vi.hoisted(() => ({ user: {} as any, query: {} as any }));
vi.mock('../../../app/auth-context', () => ({ useAuth: () => ({ user: state.user, isAdmin: state.user.role === 'ADMIN' }) }));
vi.mock('../../registrations/hooks', () => ({ useMyRegistrations: () => state.query }));
beforeEach(() => { state.user = account; state.query = { data: { items: accountRegistrations(21) }, isLoading: false, isError: false, refetch: vi.fn() }; });
describe('personal dashboard', () => {
  it('shows complete counts, next participation and account navigation', () => {
    render(<MemoryRouter><UserDashboardPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Tu espacio' })).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver inscripción' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });
  it('unknown activity is not zero and admin gets appropriate access', () => {
    state.query = { isLoading: false, isError: true, refetch: vi.fn() };
    state.user = { ...account, name: null, role: 'ADMIN' };
    render(<MemoryRouter><UserDashboardPage /></MemoryRouter>);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Administración' })).toBeInTheDocument();
  });
});
