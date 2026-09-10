import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BuyerDiscoveryPageLayout } from '@/components/layout/BuyerDiscoveryPageLayout';

vi.mock('@/components/layout/AppPageShell', () => ({
  AppPageShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-page-shell">{children}</div>
  ),
}));

vi.mock('@/components/landing/premium/PremiumNav', () => ({
  PremiumNav: () => <header data-testid="premium-nav">PremiumNav</header>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: () => ({ stores: [], loading: false }),
}));

describe('BuyerDiscoveryPageLayout', () => {
  it('uses AppPageShell when authenticated', () => {
    render(
      <MemoryRouter>
        <BuyerDiscoveryPageLayout authenticated mainAriaLabel="Discover">
          <p>Auth content</p>
        </BuyerDiscoveryPageLayout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('app-page-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('premium-nav')).not.toBeInTheDocument();
    expect(screen.getByText('Auth content')).toBeInTheDocument();
  });

  it('renders PremiumNav for guests by default', () => {
    render(
      <MemoryRouter>
        <BuyerDiscoveryPageLayout authenticated={false} mainAriaLabel="Discover">
          <p>Guest content</p>
        </BuyerDiscoveryPageLayout>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('app-page-shell')).not.toBeInTheDocument();
    expect(screen.getByTestId('premium-nav')).toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Discover' })).toBeInTheDocument();
    expect(screen.getByText('Guest content')).toBeInTheDocument();
  });

  it('can omit guest PremiumNav', () => {
    render(
      <MemoryRouter>
        <BuyerDiscoveryPageLayout
          authenticated={false}
          mainAriaLabel="Marketplace"
          guestPremiumNav={false}
        >
          <p>Custom chrome</p>
        </BuyerDiscoveryPageLayout>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('premium-nav')).not.toBeInTheDocument();
  });
});
