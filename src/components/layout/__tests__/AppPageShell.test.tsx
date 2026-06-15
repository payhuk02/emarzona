import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';

vi.mock('@/components/AppSidebar', () => ({
  AppSidebar: () => <aside data-testid="app-sidebar">AppSidebar</aside>,
}));

vi.mock('@/components/layout/HorizontalContextNav', () => ({
  HorizontalContextNav: () => <nav data-testid="horizontal-context-nav">HorizontalContextNav</nav>,
}));

vi.mock('@/components/layout/UtilityBarHeader', () => ({
  UtilityBarHeader: () => <header data-testid="utility-bar">UtilityBar</header>,
}));

function renderShell(ui: ReactNode, { path = '/dashboard' }: { path?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppPageShell>{ui}</AppPageShell>
    </MemoryRouter>
  );
}

describe('AppPageShell', () => {
  it('renders AppSidebar, utility bar, and main content for default layout', async () => {
    renderShell(<p>Page body</p>, { path: '/dashboard' });

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('utility-bar')).toBeInTheDocument();
    expect(await screen.findByTestId('horizontal-context-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('context-sidebar')).not.toBeInTheDocument();

    const main = screen.getByRole('main', { name: /contenu principal/i });
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveTextContent('Page body');
  });

  it('renders horizontal nav on finance routes (replaces vertical context sidebar)', async () => {
    renderShell(<p>Payments</p>, { path: '/dashboard/payments-customers' });
    expect(await screen.findByTestId('horizontal-context-nav')).toBeInTheDocument();
    expect(screen.queryByTestId('context-sidebar')).not.toBeInTheDocument();
  });

  it('hides horizontal nav on non-seller routes', () => {
    renderShell(<p>Marketplace</p>, { path: '/marketplace' });
    expect(screen.queryByTestId('horizontal-context-nav')).not.toBeInTheDocument();
  });

  it('hides utility bar when showUtilityBar is false', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppPageShell showUtilityBar={false}>
          <p>No utility bar</p>
        </AppPageShell>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('utility-bar')).not.toBeInTheDocument();
  });
});
