import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductPixelsTab } from '../ProductPixelsTab';
import { TooltipProvider } from '@/components/ui/tooltip';

// Helper pour wrapper avec TooltipProvider
const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('ProductPixelsTab', () => {
  const defaultFormData = {
    facebook_pixel_id: '',
    google_analytics_id: '',
    tiktok_pixel_id: '',
    pinterest_pixel_id: '',
    facebook_pixel_enabled: false,
    google_enhanced_ecommerce: false,
    tiktok_pixel_enabled: false,
    pinterest_pixel_enabled: false,
    cross_domain_tracking: false,
    privacy_compliant: false,
    debug_mode: false,
    custom_events: ''
  };

  const updateFormData = vi.fn();

  it('affiche le titre et la description', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Pixels de Tracking')).toBeInTheDocument();
    expect(screen.getByText('Intégrez et gérez vos pixels de conversion pour un suivi précis')).toBeInTheDocument();
  });

  it('affiche le statut des 4 plateformes (Facebook, Google, TikTok, Pinterest)', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    // Vérifier que les 4 plateformes sont affichées
    expect(screen.getAllByText('Facebook')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Google')[0]).toBeInTheDocument();
    expect(screen.getAllByText('TikTok')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Pinterest')[0]).toBeInTheDocument();
  });

  it('affiche "Inactif" pour tous les pixels par défaut', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const inactifElements = screen.getAllByText('Inactif');
    expect(inactifElements.length).toBeGreaterThanOrEqual(4);
  });

  it('affiche "Actif" pour Facebook quand facebook_pixel_id est rempli', () => {
    const formDataWithFacebook = {
      ...defaultFormData,
      facebook_pixel_id: '123456789012345'
    };
    
    renderWithTooltip(<ProductPixelsTab formData={formDataWithFacebook} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('appelle updateFormData quand cross_domain_tracking est activé', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const crossDomainSwitch = screen.getByLabelText('Activer le tracking cross-domain');
    fireEvent.click(crossDomainSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('cross_domain_tracking', true);
  });

  it('appelle updateFormData quand privacy_compliant est activé', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const privacySwitch = screen.getByLabelText('Conformité RGPD et confidentialité');
    fireEvent.click(privacySwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('privacy_compliant', true);
  });

  it('appelle updateFormData quand debug_mode est activé', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const debugSwitch = screen.getByLabelText('Activer le mode débogage');
    fireEvent.click(debugSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('debug_mode', true);
  });

  it('appelle updateFormData quand custom_events est modifié', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const customEventsInput = screen.getByLabelText('Événements personnalisés (JSON)');
    fireEvent.change(customEventsInput, { target: { value: '{"event": "test"}' } });
    
    expect(updateFormData).toHaveBeenCalledWith('custom_events', '{"event": "test"}');
  });

  it('affiche les 4 PixelConfigCard avec les bonnes props', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    // Vérifier que chaque pixel a son ID input
    expect(screen.getByLabelText('ID du pixel Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('ID du pixel Google Analytics')).toBeInTheDocument();
    expect(screen.getByLabelText('ID du pixel TikTok')).toBeInTheDocument();
    expect(screen.getByLabelText('ID du pixel Pinterest')).toBeInTheDocument();
  });

  it('appelle updateFormData quand Facebook Pixel ID est modifié', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const facebookPixelInput = screen.getByLabelText('ID du pixel Facebook');
    fireEvent.change(facebookPixelInput, { target: { value: '123456789012345' } });
    
    expect(updateFormData).toHaveBeenCalledWith('facebook_pixel_id', '123456789012345');
  });

  it('appelle updateFormData quand Google Analytics ID est modifié', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const googlePixelInput = screen.getByLabelText('ID du pixel Google Analytics');
    fireEvent.change(googlePixelInput, { target: { value: 'GA-123456789' } });
    
    expect(updateFormData).toHaveBeenCalledWith('google_analytics_id', 'GA-123456789');
  });

  it('affiche les switches pour activer chaque pixel', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByLabelText('Activer ou désactiver le pixel Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Activer ou désactiver le pixel Google Analytics')).toBeInTheDocument();
    expect(screen.getByLabelText('Activer ou désactiver le pixel TikTok')).toBeInTheDocument();
    expect(screen.getByLabelText('Activer ou désactiver le pixel Pinterest')).toBeInTheDocument();
  });

  it('affiche le nombre total de pixels actifs', () => {
    const formDataWithMultiplePixels = {
      ...defaultFormData,
      facebook_pixel_id: '123456789012345',
      google_analytics_id: 'GA-123456789',
      tiktok_pixel_id: 'C123456789012345'
    };
    
    renderWithTooltip(<ProductPixelsTab formData={formDataWithMultiplePixels} updateFormData={updateFormData} />);
    
    // 3 pixels actifs
    const actifElements = screen.getAllByText('Actif');
    expect(actifElements.length).toBe(3);
  });

  it('affiche l\'avertissement RGPD quand privacy_compliant est false', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText(/Assurez-vous de respecter le RGPD/)).toBeInTheDocument();
  });

  it('affiche l\'information debug quand debug_mode est true', () => {
    const formDataWithDebug = {
      ...defaultFormData,
      debug_mode: true
    };
    
    renderWithTooltip(<ProductPixelsTab formData={formDataWithDebug} updateFormData={updateFormData} />);
    
    expect(screen.getByText(/Mode débogage activé/)).toBeInTheDocument();
  });

  it('utilise le dark mode avec les bonnes classes CSS', () => {
    const { container } = renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const cards = container.querySelectorAll('.bg-gray-800\\/50');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const crossDomainSwitch = screen.getByLabelText('Activer le tracking cross-domain');
    expect(crossDomainSwitch).toHaveAttribute('aria-label', 'Activer le tracking cross-domain');
    
    const privacySwitch = screen.getByLabelText('Conformité RGPD et confidentialité');
    expect(privacySwitch).toHaveAttribute('aria-label', 'Conformité RGPD et confidentialité');
  });

  it('affiche les icônes correctes pour chaque plateforme', () => {
    const { container } = renderWithTooltip(<ProductPixelsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    // Vérifier qu'il y a plusieurs icônes SVG (une par plateforme)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(4);
  });

  it('gère correctement les valeurs vides pour custom_events', () => {
    const formDataWithEmptyCustomEvents = {
      ...defaultFormData,
      custom_events: ''
    };
    
    renderWithTooltip(<ProductPixelsTab formData={formDataWithEmptyCustomEvents} updateFormData={updateFormData} />);
    
    const customEventsInput = screen.getByLabelText('Événements personnalisés (JSON)');
    expect(customEventsInput).toHaveValue('');
  });

  it('gère correctement les valeurs JSON pour custom_events', () => {
    const formDataWithCustomEvents = {
      ...defaultFormData,
      custom_events: '{"event": "custom_event", "data": {"key": "value"}}'
    };
    
    renderWithTooltip(<ProductPixelsTab formData={formDataWithCustomEvents} updateFormData={updateFormData} />);
    
    const customEventsInput = screen.getByLabelText('Événements personnalisés (JSON)');
    expect(customEventsInput).toHaveValue('{"event": "custom_event", "data": {"key": "value"}}');
  });

  it('met à jour correctement l\'état des switches', () => {
    const formDataWithSwitchesEnabled = {
      ...defaultFormData,
      cross_domain_tracking: true,
      privacy_compliant: true,
      debug_mode: true
    };
    
    renderWithTooltip(<ProductPixelsTab formData={formDataWithSwitchesEnabled} updateFormData={updateFormData} />);
    
    expect(screen.getByLabelText('Activer le tracking cross-domain')).toBeChecked();
    expect(screen.getByLabelText('Conformité RGPD et confidentialité')).toBeChecked();
    expect(screen.getByLabelText('Activer le mode débogage')).toBeChecked();
  });
});

