import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';

vi.mock('@/hooks/useDeferHorizontalContextNav', () => ({
  useDeferHorizontalContextNav: () => true,
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, loading: false }),
}));

vi.mock('@/components/AppSidebar', () => ({
  AppSidebar: () => <aside data-testid="app-sidebar">AppSidebar</aside>,
}));

vi.mock('@/components/layout/HorizontalContextNav', () => ({
  HorizontalContextNav: () => <nav data-testid="horizontal-context-nav">HorizontalContextNav</nav>,
}));

vi.mock('@/components/layout/UtilityBarHeader', () => ({
  UtilityBarHeader: () => <header data-testid="utility-bar-header">UtilityBar</header>,
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
    expect(screen.getByTestId('utility-bar-header')).toBeInTheDocument();
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

  it('shows horizontal nav on buyer discovery routes', async () => {
    renderShell(<p>Marketplace</p>, { path: '/marketplace' });
    expect(await screen.findByTestId('horizontal-context-nav')).toBeInTheDocument();
  });

  it('hides horizontal nav on public routes outside nav shell', () => {
    renderShell(<p>Landing</p>, { path: '/pricing' });
    expect(screen.queryByTestId('horizontal-context-nav')).not.toBeInTheDocument();
  });

  it('renders horizontal nav on buyer account routes', async () => {
    renderShell(<p>Account</p>, { path: '/account/orders' });
    expect(await screen.findByTestId('horizontal-context-nav')).toBeInTheDocument();
  });

  it('hides utility bar when showUtilityBar is false', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppPageShell showUtilityBar={false}>
          <p>No utility bar</p>
        </AppPageShell>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('utility-bar-header')).not.toBeInTheDocument();
  });

  it('pads #main-content when padForBottomNav is true', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppPageShell padForBottomNav>
          <p>Padded</p>
        </AppPageShell>
      </MemoryRouter>
    );

    const main = screen.getByRole('main', { name: /contenu principal/i });
    expect(main.className).toMatch(/pb-\[calc\(4rem/);
    expect(document.querySelector('[data-bottom-nav="true"]')).toBeTruthy();
  });

  it('nested AppPageShell does not remount chrome', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppPageShell>
          <AppPageShell shellClassName="nested-class">
            <p>Nested body</p>
          </AppPageShell>
        </AppPageShell>
      </MemoryRouter>
    );

    expect(screen.getAllByTestId('app-sidebar')).toHaveLength(1);
    expect(screen.getAllByTestId('utility-bar-header')).toHaveLength(1);
    expect(document.querySelector('[data-app-shell-nested]')).toBeTruthy();
    expect(screen.getByText('Nested body')).toBeInTheDocument();
  });
});
