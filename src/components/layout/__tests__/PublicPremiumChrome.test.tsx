import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicPremiumChrome } from '@/components/layout/PublicPremiumChrome';
import { StorefrontShellProvider } from '@/contexts/StorefrontShellContext';

vi.mock('@/components/landing/premium/PremiumNav', () => ({
  PremiumNav: () => <nav data-testid="premium-nav">PremiumNav</nav>,
}));

describe('PublicPremiumChrome', () => {
  it('shows platform PremiumNav outside storefront shell', () => {
    render(
      <PublicPremiumChrome mainAriaLabel="Test">
        <p>content</p>
      </PublicPremiumChrome>
    );
    expect(screen.getByTestId('premium-nav')).toBeInTheDocument();
  });

  it('hides platform PremiumNav inside storefront shell', () => {
    render(
      <StorefrontShellProvider value={{ chromeProvided: true, store: null, storeLoading: false }}>
        <PublicPremiumChrome mainAriaLabel="Test boutique">
          <p>content</p>
        </PublicPremiumChrome>
      </StorefrontShellProvider>
    );
    expect(screen.queryByTestId('premium-nav')).not.toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
