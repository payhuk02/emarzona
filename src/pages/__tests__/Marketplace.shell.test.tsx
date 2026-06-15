import { describe, expect, it, vi } from 'vitest';
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

describe('Marketplace authenticated shell', () => {
  it('shows buyer horizontal nav on marketplace route', async () => {
    render(
      <MemoryRouter initialEntries={['/marketplace']}>
        <AppPageShell>
          <p>Marketplace catalog</p>
        </AppPageShell>
      </MemoryRouter>
    );

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('utility-bar')).toBeInTheDocument();
    expect(await screen.findByTestId('horizontal-context-nav')).toBeInTheDocument();
    expect(screen.getByText('Marketplace catalog')).toBeInTheDocument();
  });
});
