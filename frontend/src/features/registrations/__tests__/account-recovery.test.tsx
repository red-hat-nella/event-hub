import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryErrorState } from '../../../design-system/molecules/QueryErrorState';
import { RouteErrorBoundary } from '../../../app/RouteErrorBoundary';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom';
describe('recoverable account states', () => {
  it('offers retry without claiming zero registrations', async () => {
    const retry = vi.fn();
    render(<QueryErrorState onRetry={retry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
  it('offers safe navigation without a technical stack', () => {
    render(<RouteErrorBoundary />);
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
    expect(screen.queryByText(/TypeError|Unexpected Application Error/)).not.toBeInTheDocument();
  });
  it('catches a real child render exception while preserving shell navigation', async () => {
    const diagnostics = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken() { throw new Error('synthetic render failure'); return null; }
    const router = createMemoryRouter([{ element: <><a href="/eventos">Catálogo seguro</a><Outlet /></>, children: [{ path: '/', element: <Broken />, errorElement: <RouteErrorBoundary /> }] }]);
    try {
      render(<RouterProvider router={router} />);
      expect(await screen.findByRole('link', { name: 'Catálogo seguro' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Volver al inicio' })).toBeInTheDocument();
      expect(screen.queryByText('synthetic render failure')).not.toBeInTheDocument();
    } finally { diagnostics.mockRestore(); }
  });
});
