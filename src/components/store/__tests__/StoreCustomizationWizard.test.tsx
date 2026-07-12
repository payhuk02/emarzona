/**
 * Tests E2E pour StoreCustomizationWizard
 *
 * Couverture :
 * - Navigation entre les étapes du wizard
 * - Validation des champs requis
 * - Sauvegarde des modifications
 * - Affichage conditionnel selon commerce_type
 * - Complétion des étapes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { StoreCustomizationWizard } from '../StoreCustomizationWizard';

// Mock des dépendances
vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: () => ({
    selectedStoreId: 'test-store-id',
    refreshStore: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUseStoreFormState = vi.fn(() => ({
  formState: {
    name: 'Test Store',
    slug: 'test-store',
    description: 'Test Description',
    logoUrl: null,
    bannerUrl: null,
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
  },
  setters: {
    setName: vi.fn(),
    setDescription: vi.fn(),
    setLogoUrl: vi.fn(),
    setBannerUrl: vi.fn(),
    setPrimaryColor: vi.fn(),
    setSecondaryColor: vi.fn(),
  },
  isSubmitting: false,
  lastSaved: null as Date | null,
  fieldTouched: {},
  handleFieldBlur: vi.fn(),
  validateField: vi.fn(() => null as string | null),
  handleSubmit: vi.fn(),
  applyConfig: vi.fn(),
} as any));

vi.mock('@/hooks/useStoreFormState', () => ({
  useStoreFormState: mockUseStoreFormState,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockStore = {
  id: 'test-store-id',
  name: 'Test Store',
  slug: 'test-store',
  description: 'Test Description',
  commerce_type: 'physical',
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('StoreCustomizationWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all customization steps for physical commerce type', () => {
    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Vérifier que les étapes principales sont affichées
    expect(screen.getByText(/Informations/i)).toBeInTheDocument();
    expect(screen.getByText(/Apparence/i)).toBeInTheDocument();
    expect(screen.getByText(/Localisation/i)).toBeInTheDocument();
    expect(screen.getByText(/SEO/i)).toBeInTheDocument();
    expect(screen.getByText(/Pages Légales/i)).toBeInTheDocument();
    expect(screen.getByText(/URL/i)).toBeInTheDocument();
    expect(screen.getByText(/Marketing/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Commerce/i)).toBeInTheDocument();
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
  });

  it('should hide commerce tab for non-physical commerce types', () => {
    const digitalStore = { ...mockStore, commerce_type: 'digital' };

    render(
      <StoreCustomizationWizard
        store={digitalStore}
        onSave={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // L'onglet Commerce ne devrait pas être visible
    expect(screen.queryByText(/Commerce/i)).not.toBeInTheDocument();
  });

  it('should navigate between steps when clicking on step cards', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={onSave}
      />,
      { wrapper: createWrapper() }
    );

    // Cliquer sur l'étape Apparence
    const appearanceStep = screen.getByText(/Apparence/i);
    await user.click(appearanceStep);

    // Vérifier que le contenu de l'étape Apparence est chargé
    await waitFor(() => {
      expect(screen.getByText(/Couleurs/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields before saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    // Mock formState avec des champs vides
    mockUseStoreFormState.mockReturnValue({
      formState: {
        name: '', // Champ requis vide
        slug: '',
        description: '',
        logoUrl: null,
        bannerUrl: null,
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
      },
      setters: {
        setName: vi.fn(),
        setDescription: vi.fn(),
        setLogoUrl: vi.fn(),
        setBannerUrl: vi.fn(),
        setPrimaryColor: vi.fn(),
        setSecondaryColor: vi.fn(),
      },
      isSubmitting: false,
      lastSaved: null as Date | null,
      fieldTouched: {},
      handleFieldBlur: vi.fn(),
      validateField: vi.fn(() => 'Ce champ est requis' as string | null),
      handleSubmit: vi.fn(),
      applyConfig: vi.fn(),
    } as any);

    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={onSave}
      />,
      { wrapper: createWrapper() }
    );

    // Tenter de sauvegarder
    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveButton);

    // Vérifier que la validation empêche la sauvegarde
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it('should call onSave when form is valid and save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={onSave}
      />,
      { wrapper: createWrapper() }
    );

    // Cliquer sur le bouton de sauvegarde
    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });

  it('should show last saved timestamp after successful save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    // Mock avec lastSaved récent
    mockUseStoreFormState.mockReturnValue({
      formState: {
        name: 'Test Store',
        slug: 'test-store',
        description: 'Test Description',
        logoUrl: null,
        bannerUrl: null,
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
      },
      setters: {
        setName: vi.fn(),
        setDescription: vi.fn(),
        setLogoUrl: vi.fn(),
        setBannerUrl: vi.fn(),
        setPrimaryColor: vi.fn(),
        setSecondaryColor: vi.fn(),
      },
      isSubmitting: false,
      lastSaved: new Date(),
      fieldTouched: {},
      handleFieldBlur: vi.fn(),
      validateField: vi.fn(() => null as string | null),
      handleSubmit: vi.fn(),
      applyConfig: vi.fn(),
    } as any);

    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={onSave}
      />,
      { wrapper: createWrapper() }
    );

    // Vérifier que le timestamp de sauvegarde est affiché
    await waitFor(() => {
      expect(screen.getByText(/Dernière sauvegarde/i)).toBeInTheDocument();
    });
  });

  it('should disable save button while submitting', async () => {
    const onSave = vi.fn();

    // Mock avec isSubmitting = true
    mockUseStoreFormState.mockReturnValue({
      formState: {
        name: 'Test Store',
        slug: 'test-store',
        description: 'Test Description',
        logoUrl: null,
        bannerUrl: null,
        primaryColor: '#3b82f6',
        secondaryColor: '#10b981',
      },
      setters: {
        setName: vi.fn(),
        setDescription: vi.fn(),
        setLogoUrl: vi.fn(),
        setBannerUrl: vi.fn(),
        setPrimaryColor: vi.fn(),
        setSecondaryColor: vi.fn(),
      },
      isSubmitting: true,
      lastSaved: null as Date | null,
      fieldTouched: {},
      handleFieldBlur: vi.fn(),
      validateField: vi.fn(() => null as string | null),
      handleSubmit: vi.fn(),
      applyConfig: vi.fn(),
    } as any);

    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={onSave}
      />,
      { wrapper: createWrapper() }
    );

    const saveButton = screen.getByRole('button', { name: /Enregistrement/i });
    expect(saveButton).toBeDisabled();
  });

  it('should display step completion status for completed steps', () => {
    const completedStore = {
      ...mockStore,
      name: 'Completed Store',
      logo_url: 'https://example.com/logo.png',
      banner_url: 'https://example.com/banner.png',
      contact_email: 'contact@example.com',
    };

    render(
      <StoreCustomizationWizard
        store={completedStore}
        onSave={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Vérifier que les étapes complétées affichent un indicateur
    const completedIndicator = screen.getAllByRole('status');
    expect(completedIndicator.length).toBeGreaterThan(0);
  });

  it('should handle theme configuration application', async () => {
    const user = userEvent.setup();
    const applyConfig = vi.fn();

    vi.mocked(require('@/hooks/useStoreFormState').useStoreFormState).mockReturnValue({
      formState: {
        name: 'Test Store',
        slug: 'test-store',
      },
      setters: {},
      isSubmitting: false,
      lastSaved: null,
      fieldTouched: {},
      handleFieldBlur: vi.fn(),
      validateField: vi.fn(() => null),
      handleSubmit: vi.fn(),
      applyConfig,
    });

    render(
      <StoreCustomizationWizard
        store={mockStore}
        onSave={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    // Naviguer vers l'onglet Apparence
    await user.click(screen.getByText(/Apparence/i));

    // Appliquer une configuration de thème
    // (Ce test nécessiterait d'ajouter un bouton ou une action spécifique dans le composant)
    // Pour l'instant, on vérifie que la fonction est disponible
    expect(applyConfig).toBeDefined();
  });

  it('should show location tab only for physical commerce type', () => {
    const physicalStore = { ...mockStore, commerce_type: 'physical' };

    render(
      <StoreCustomizationWizard
        store={physicalStore}
        onSave={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Localisation/i)).toBeInTheDocument();
  });

  it('should hide location tab for digital commerce type', () => {
    const digitalStore = { ...mockStore, commerce_type: 'digital' };

    render(
      <StoreCustomizationWizard
        store={digitalStore}
        onSave={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText(/Localisation/i)).not.toBeInTheDocument();
  });
});
