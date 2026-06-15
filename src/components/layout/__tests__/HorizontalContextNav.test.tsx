import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HorizontalContextNav } from '@/components/layout/HorizontalContextNav';
import type { HorizontalNavDomain } from '@/lib/navigation/resolveHorizontalNav';
import { LayoutDashboard, ShoppingCart } from 'lucide-react';

const mockDomains: HorizontalNavDomain[] = [
  {
    domainKey: 'ventes_logistique',
    sectionKey: 'ventes_logistique',
    shortLabel: 'Ventes',
    label: 'Ventes & Logistique',
    rootPath: '/dashboard/orders',
    items: [
      {
        title: 'Commandes',
        url: '/dashboard/orders',
        path: '/dashboard/orders',
        icon: ShoppingCart,
        locked: false,
      },
      {
        title: 'Inventaire',
        url: '/dashboard/inventory',
        path: '/dashboard/inventory',
        icon: LayoutDashboard,
        locked: false,
      },
    ],
    subgroups: [
      {
        groupKey: 'commandes',
        label: 'Commandes',
        items: [
          {
            title: 'Commandes',
            url: '/dashboard/orders',
            path: '/dashboard/orders',
            icon: ShoppingCart,
            locked: false,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    domainKey: 'configuration',
    sectionKey: 'configuration',
    shortLabel: 'Paramètres',
    label: 'Configuration',
    rootPath: '/dashboard/settings',
    items: [
      {
        title: 'Paramètres',
        url: '/dashboard/settings',
        path: '/dashboard/settings',
        icon: LayoutDashboard,
        locked: false,
      },
    ],
    subgroups: null,
    isActive: false,
  },
];

vi.mock('@/hooks/useHorizontalContextNav', () => ({
  useHorizontalContextNav: vi.fn(() => mockDomains),
}));

vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn(() => ({ isAdmin: false })),
}));

vi.mock('@/hooks/useSidebarPersona', () => ({
  useSidebarPersona: vi.fn(() => ({
    persona: 'seller',
    setPersona: vi.fn(),
    resetPersona: vi.fn(),
  })),
}));

vi.mock('@/hooks/usePlanLockNavAction', () => ({
  usePlanLockNavAction: vi.fn(() => vi.fn()),
}));

describe('HorizontalContextNav mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders mobile nav strip with domain triggers', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/orders']}>
        <HorizontalContextNav />
      </MemoryRouter>
    );

    expect(screen.getByTestId('horizontal-context-nav-mobile')).toBeInTheDocument();
    const mobileNav = screen.getByTestId('horizontal-context-nav-mobile');
    expect(within(mobileNav).getByRole('button', { name: /ventes/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('link', { name: /paramètres/i })).toBeInTheDocument();
  });

  it('opens a left vertical drawer with sidebar links when tapping a domain', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/dashboard/orders']}>
        <HorizontalContextNav />
      </MemoryRouter>
    );

    const mobileNav = screen.getByTestId('horizontal-context-nav-mobile');
    await user.click(within(mobileNav).getByRole('button', { name: /ventes/i }));

    const drawer = await screen.findByTestId('mobile-domain-drawer-ventes_logistique');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('id', 'mobile-domain-drawer-ventes_logistique');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^commandes$/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /ventes & logistique/i })).toBeInTheDocument();
  });
});
