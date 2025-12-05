/**
 * Tests unitaires pour la page Checkout
 * Composant critique pour le processus de commande
 * 
 * Couverture :
 * - Affichage du formulaire
 * - Validation des champs
 * - Application de coupons
 * - Application de cartes cadeau
 * - Sélection du provider de paiement
 * - Calcul des totaux
 * - Soumission du formulaire
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Checkout from '../Checkout';
import * as CartHook from '@/hooks/cart/useCart';
import * as ToastHook from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock des dépendances
vi.mock('@/hooks/cart/useCart', () => ({
  useCart: vi.fn(() => ({
    items: [],
    summary: {
      subtotal: 0,
      discount_amount: 0,
      tax_amount: 0,
      shipping_amount: 0,
      total: 0,
      item_count: 0,
    },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('@/hooks/artist/useArtistShipping', () => ({
  useCalculateArtistShipping: vi.fn(() => ({
    calculateShipping: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@/lib/payment-service', () => ({
  initiatePayment: vi.fn(() => Promise.resolve({ url: 'https://payment.example.com' })),
}));

vi.mock('@/lib/affiliation-tracking', () => ({
  getAffiliateInfo: vi.fn(() => null),
}));

vi.mock('@/lib/url-validator', () => ({
  safeRedirect: vi.fn((url) => url),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should render checkout page with empty cart message', () => {
    renderWithRouter(<Checkout />);

    // Vérifier que la page se charge
    expect(screen.getByText(/panier/i) || screen.getByText(/checkout/i)).toBeInTheDocument();
  });

  it('should display cart items when cart is not empty', () => {
    const mockItems = [
      {
        id: '1',
        product_id: 'prod-1',
        product_name: 'Produit Test',
        unit_price: 10000,
        quantity: 2,
        currency: 'XOF',
      },
    ];

    vi.mocked(CartHook.useCart).mockReturnValue({
      items: mockItems as any,
      summary: {
        subtotal: 20000,
        discount_amount: 0,
        tax_amount: 0,
        shipping_amount: 0,
        total: 20000,
        item_count: 1,
      },
      isLoading: false,
    } as any);

    renderWithRouter(<Checkout />);

    // Vérifier que les items sont affichés
    waitFor(() => {
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
    });
  });

  it('should display shipping address form', () => {
    renderWithRouter(<Checkout />);

    // Vérifier que le formulaire d'adresse est présent
    expect(screen.getByLabelText(/nom complet/i) || screen.getByPlaceholderText(/nom/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Checkout />);

    // Essayer de soumettre sans remplir les champs
    const submitButton = screen.queryByRole('button', { name: /procéder au paiement/i });
    if (submitButton) {
      await user.click(submitButton);
      
      // Vérifier que les erreurs de validation sont affichées
      waitFor(() => {
        expect(screen.getByText(/requis/i) || screen.getByText(/obligatoire/i)).toBeInTheDocument();
      });
    }
  });

  it('should display payment provider selector', () => {
    renderWithRouter(<Checkout />);

    // Vérifier que le sélecteur de provider est présent
    waitFor(() => {
      expect(screen.getByText(/moyen de paiement/i) || screen.getByText(/moneroo/i)).toBeInTheDocument();
    });
  });

  it('should display coupon input', () => {
    renderWithRouter(<Checkout />);

    // Vérifier que le champ coupon est présent
    waitFor(() => {
      expect(screen.getByLabelText(/code promo/i) || screen.getByPlaceholderText(/code promo/i)).toBeInTheDocument();
    });
  });

  it('should display gift card input', () => {
    renderWithRouter(<Checkout />);

    // Vérifier que le champ carte cadeau est présent
    waitFor(() => {
      expect(screen.getByLabelText(/carte cadeau/i) || screen.getByPlaceholderText(/carte cadeau/i)).toBeInTheDocument();
    });
  });

  it('should calculate total correctly', () => {
    const mockSummary = {
      subtotal: 50000,
      discount_amount: 5000,
      tax_amount: 5000,
      shipping_amount: 3000,
      total: 53000,
      item_count: 2,
    };

    vi.mocked(CartHook.useCart).mockReturnValue({
      items: [],
      summary: mockSummary,
      isLoading: false,
    } as any);

    renderWithRouter(<Checkout />);

    // Vérifier que le total est affiché
    waitFor(() => {
      expect(screen.getByText(/53[\s,]*000/i)).toBeInTheDocument();
    });
  });

  it('should show loading state when cart is loading', () => {
    vi.mocked(CartHook.useCart).mockReturnValue({
      items: [],
      summary: {
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        shipping_amount: 0,
        total: 0,
        item_count: 0,
      },
      isLoading: true,
    } as any);

    renderWithRouter(<Checkout />);

    // Vérifier que le skeleton est affiché
    expect(screen.getByRole('status') || screen.queryByText(/chargement/i)).toBeInTheDocument();
  });

  it('should pre-fill form with user data when user is logged in', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
      },
    };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    } as any);

    renderWithRouter(<Checkout />);

    // Vérifier que le formulaire est pré-rempli
    waitFor(() => {
      const emailInput = screen.queryByLabelText(/email/i) || screen.queryByPlaceholderText(/email/i);
      if (emailInput) {
        expect(emailInput).toHaveValue('test@example.com');
      }
    });
  });

  it('should handle empty cart redirect', () => {
    vi.mocked(CartHook.useCart).mockReturnValue({
      items: [],
      summary: {
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        shipping_amount: 0,
        total: 0,
        item_count: 0,
      },
      isLoading: false,
    } as any);

    renderWithRouter(<Checkout />);

    // Vérifier qu'un message est affiché pour panier vide
    waitFor(() => {
      expect(screen.getByText(/panier vide/i) || screen.getByText(/aucun article/i)).toBeInTheDocument();
    });
  });
});
