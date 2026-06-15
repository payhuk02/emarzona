import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { ShoppingCart, User } from 'lucide-react';

const mockHandlePlanLock = vi.fn();

const buyerNavItems = [
  {
    title: 'Compte',
    url: '/account',
    path: '/account',
    icon: User,
    locked: false,
  },
  {
    title: 'Panier',
    url: '/cart',
    path: '/cart',
    icon: ShoppingCart,
    locked: false,
  },
  {
    title: 'Campagnes email',
    url: '/dashboard/emails/campaigns',
    path: '/dashboard/emails/campaigns',
    icon: ShoppingCart,
    locked: true,
  },
];

vi.mock('@/hooks/useResolvedNavItems', () => ({
  useResolvedNavItems: vi.fn(() => buyerNavItems),
}));

vi.mock('@/hooks/useSidebarPersona', () => ({
  useSidebarPersona: vi.fn(() => ({
    persona: 'buyer',
    setPersona: vi.fn(),
    resetPersona: vi.fn(),
  })),
}));

vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn(() => ({ isAdmin: false })),
}));

vi.mock('@/hooks/usePlanLockNavAction', () => ({
  usePlanLockNavAction: vi.fn(() => mockHandlePlanLock),
}));

describe('BottomNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders buyer bottom nav links', () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <BottomNavigation />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Compte' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: 'Panier' })).toHaveAttribute('href', '/cart');
  });

  it('marks the active route with aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <BottomNavigation />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Panier' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens plan-lock modal instead of navigating for locked items', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/account']}>
        <BottomNavigation />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation');
    await user.click(within(nav).getByText('Campagnes email'));
    expect(mockHandlePlanLock).toHaveBeenCalledWith(
      'Campagnes email',
      '/dashboard/emails/campaigns'
    );
  });
});
