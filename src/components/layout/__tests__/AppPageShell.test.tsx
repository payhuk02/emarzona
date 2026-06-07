import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';

vi.mock('@/components/AppSidebar', () => ({
  AppSidebar: () => <aside data-testid="app-sidebar">AppSidebar</aside>,
}));

vi.mock('@/components/layout/SectionContextSidebar', () => ({
  ConfigContextSidebar: ({ configId }: { configId: string }) => (
    <nav data-testid="context-sidebar" data-config-id={configId}>
      ContextSidebar
    </nav>
  ),
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
  it('renders AppSidebar, utility bar, and main content for default layout', () => {
    renderShell(<p>Page body</p>, { path: '/dashboard' });

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('utility-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('context-sidebar')).not.toBeInTheDocument();

    const main = screen.getByRole('main', { name: /contenu principal/i });
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveTextContent('Page body');
  });

  it('renders context sidebar when layoutType maps to a config', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings']}>
        <AppPageShell layoutType="settings">
          <p>Settings</p>
        </AppPageShell>
      </MemoryRouter>
    );

    const contextSidebar = screen.getByTestId('context-sidebar');
    expect(contextSidebar).toBeInTheDocument();
    expect(contextSidebar).toHaveAttribute('data-config-id', 'settings');
  });

  it('auto-detects context sidebar from pathname when layoutType is omitted', () => {
    renderShell(<p>Orders</p>, { path: '/dashboard/orders' });

    expect(screen.getByTestId('context-sidebar')).toHaveAttribute('data-config-id', 'orders');
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
