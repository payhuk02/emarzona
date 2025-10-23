import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainSettings } from '../DomainSettings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock du hook useStores
vi.mock('@/hooks/useStores', () => ({
  useStores: () => ({
    stores: [
      {
        id: 'store-1',
        name: 'Ma Boutique',
        slug: 'ma-boutique',
        user_id: 'user-1',
        is_active: true,
        custom_domain: 'maboutique.com',
        domain_status: 'verified',
        domain_verification_token: 'payhula-verify-abc123',
        domain_verified_at: '2025-10-20T10:00:00Z',
        ssl_enabled: true,
        redirect_https: true,
        redirect_www: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-10-20T10:00:00Z'
      }
    ],
    loading: false,
    error: null,
    updateStore: vi.fn().mockResolvedValue(true),
    createStore: vi.fn(),
    deleteStore: vi.fn(),
    canCreateStore: () => true,
    getRemainingStores: () => 2,
    refetch: vi.fn()
  })
}));

// Mock du hook useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock de fetch pour l'API DNS Google
global.fetch = vi.fn();

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('DomainSettings - Toggle SSL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche les 3 switches SSL/HTTPS/WWW', () => {
    renderWithProviders(<DomainSettings />);
    
    expect(screen.getByLabelText(/SSL\/TLS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Redirection HTTPS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Redirection WWW/i)).toBeInTheDocument();
  });

  it('SSL switch est désactivé si domaine non vérifié', () => {
    // Mock avec domaine non vérifié
    vi.mocked(useStores).mockReturnValue({
      stores: [{
        ...mockStore,
        domain_status: 'pending'
      }],
      loading: false,
      updateStore: vi.fn()
    });

    renderWithProviders(<DomainSettings />);
    
    const sslSwitch = screen.getByLabelText(/SSL\/TLS/i);
    expect(sslSwitch).toBeDisabled();
  });

  it('toggle SSL avec succès', async () => {
    const user = userEvent.setup();
    const updateStore = vi.fn().mockResolvedValue(true);
    
    vi.mocked(useStores).mockReturnValue({
      stores: [mockStore],
      loading: false,
      updateStore
    });

    renderWithProviders(<DomainSettings />);
    
    const sslSwitch = screen.getByLabelText(/SSL\/TLS/i);
    await user.click(sslSwitch);

    await waitFor(() => {
      expect(updateStore).toHaveBeenCalledWith('store-1', {
        ssl_enabled: false // Passe de true à false
      });
    });
  });

  it('désactive HTTPS redirect si SSL désactivé', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<DomainSettings />);
    
    const httpsSwitch = screen.getByLabelText(/Redirection HTTPS/i);
    
    // Si SSL est activé, le switch HTTPS est actif
    expect(httpsSwitch).not.toBeDisabled();
    
    // TODO: Tester la désactivation automatique quand SSL est off
  });

  it('affiche un toast de confirmation après toggle', async () => {
    const user = userEvent.setup();
    const toast = vi.fn();
    
    vi.mocked(useToast).mockReturnValue({ toast });

    renderWithProviders(<DomainSettings />);
    
    const wwwSwitch = screen.getByLabelText(/Redirection WWW/i);
    await user.click(wwwSwitch);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Redirection WWW mise à jour"
        })
      );
    });
  });
});

describe('DomainSettings - Validation formulaire', () => {
  it('refuse un domaine invalide', async () => {
    const user = userEvent.setup();
    
    // Mock sans domaine configuré
    vi.mocked(useStores).mockReturnValue({
      stores: [{
        ...mockStore,
        custom_domain: null,
        domain_status: 'not_configured'
      }],
      loading: false,
      updateStore: vi.fn()
    });

    renderWithProviders(<DomainSettings />);
    
    const domainInput = screen.getByPlaceholderText(/maboutique.com/i);
    const connectButton = screen.getByRole('button', { name: /Connecter/i });

    await user.type(domainInput, 'domaine-invalide');
    await user.click(connectButton);

    await waitFor(() => {
      expect(screen.getByText(/Domaine invalide/i)).toBeInTheDocument();
    });
  });

  it('accepte un domaine valide', async () => {
    const user = userEvent.setup();
    const updateStore = vi.fn().mockResolvedValue(true);
    
    vi.mocked(useStores).mockReturnValue({
      stores: [{
        ...mockStore,
        custom_domain: null,
        domain_status: 'not_configured'
      }],
      loading: false,
      updateStore
    });

    renderWithProviders(<DomainSettings />);
    
    const domainInput = screen.getByPlaceholderText(/maboutique.com/i);
    const connectButton = screen.getByRole('button', { name: /Connecter/i });

    await user.type(domainInput, 'maboutique.com');
    await user.click(connectButton);

    await waitFor(() => {
      expect(updateStore).toHaveBeenCalledWith(
        'store-1',
        expect.objectContaining({
          custom_domain: 'maboutique.com',
          domain_status: 'pending'
        })
      );
    });
  });
});

describe('DomainSettings - Helpers (domainUtils)', () => {
  it('validateDomain accepte les domaines valides', () => {
    const { validateDomain } = require('@/lib/domainUtils');
    
    expect(validateDomain('example.com')).toBe(true);
    expect(validateDomain('mon-site.fr')).toBe(true);
    expect(validateDomain('shop.example.co.uk')).toBe(true);
  });

  it('validateDomain rejette les domaines invalides', () => {
    const { validateDomain } = require('@/lib/domainUtils');
    
    expect(validateDomain('invalid')).toBe(false);
    expect(validateDomain('-example.com')).toBe(false);
    expect(validateDomain('example')).toBe(false);
    expect(validateDomain('')).toBe(false);
  });

  it('generateVerificationToken crée un token unique', () => {
    const { generateVerificationToken } = require('@/lib/domainUtils');
    
    const token1 = generateVerificationToken();
    const token2 = generateVerificationToken();
    
    expect(token1).toContain('payhula-verify-');
    expect(token2).toContain('payhula-verify-');
    expect(token1).not.toBe(token2);
  });

  it('getDNSInstructions retourne les bonnes instructions', () => {
    const { getDNSInstructions } = require('@/lib/domainUtils');
    
    const instructions = getDNSInstructions('example.com', 'payhula-verify-test123');
    
    expect(instructions.aRecord.value).toBe('185.158.133.1');
    expect(instructions.wwwRecord.name).toBe('www.example.com');
    expect(instructions.txtRecord.value).toBe('payhula-verify-test123');
  });
});

// Mock store par défaut
const mockStore = {
  id: 'store-1',
  name: 'Ma Boutique',
  slug: 'ma-boutique',
  user_id: 'user-1',
  is_active: true,
  custom_domain: 'maboutique.com',
  domain_status: 'verified' as const,
  domain_verification_token: 'payhula-verify-abc123',
  domain_verified_at: '2025-10-20T10:00:00Z',
  ssl_enabled: true,
  redirect_https: true,
  redirect_www: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-10-20T10:00:00Z'
};

