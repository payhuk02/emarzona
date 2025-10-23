import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductPromotionsTab } from '../ProductPromotionsTab';
import { Promotion } from '../ProductPromotionsTab/PromotionCard';
import { TooltipProvider } from '@/components/ui/tooltip';

// Helper pour wrapper avec TooltipProvider
const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('ProductPromotionsTab', () => {
  const mockPromotion: Promotion = {
    id: '1',
    name: 'Réduction de lancement',
    type: 'percentage',
    value: 20,
    start_date: new Date('2025-01-01'),
    end_date: new Date('2025-12-31'),
    min_quantity: 1,
    max_uses: 100,
    customer_limit: 5,
    is_active: true
  };

  const defaultFormData = {
    promotions: [],
    launch_discount: false,
    seasonal_discount: false,
    clearance_discount: false,
    buy_2_get_1: false,
    family_pack: false,
    flash_offer: false,
    first_order_discount: false,
    loyalty_discount: false,
    birthday_discount: false,
    stackable_promotions: false,
    automatic_promotions: false,
    promotion_notifications: false,
    geo_promotions: false
  };

  const updateFormData = vi.fn();

  it('affiche le titre et la description', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Promotions & Réductions')).toBeInTheDocument();
    expect(screen.getByText(/Configurez des promotions pour booster/)).toBeInTheDocument();
  });

  it('affiche "Aucune promotion" quand la liste est vide', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Aucune promotion')).toBeInTheDocument();
    expect(screen.getByText(/Cliquez sur "Ajouter une promotion" pour commencer/)).toBeInTheDocument();
  });

  it('affiche le bouton "Ajouter une promotion"', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Ajouter une promotion')).toBeInTheDocument();
  });

  it('ajoute une nouvelle promotion quand le bouton est cliqué', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const addButton = screen.getByText('Ajouter une promotion');
    fireEvent.click(addButton);
    
    expect(updateFormData).toHaveBeenCalledWith('promotions', expect.arrayContaining([
      expect.objectContaining({
        name: '',
        type: 'percentage',
        value: 0,
        is_active: true,
        min_quantity: 1
      })
    ]));
  });

  it('affiche les promotions existantes', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Réduction de lancement')).toBeInTheDocument();
  });

  it('affiche le nombre de promotions actives', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion, { ...mockPromotion, id: '2', is_active: false }]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Nombre de promotions actives
  });

  it('affiche le nombre de promotions en pourcentage', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion, { ...mockPromotion, id: '2', type: 'fixed' as const }]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('1 en %')).toBeInTheDocument();
  });

  it('affiche le nombre de promotions en montant fixe', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [{ ...mockPromotion, type: 'fixed' as const }]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('1 fixe')).toBeInTheDocument();
  });

  it('affiche les types de réductions', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Réduction de lancement')).toBeInTheDocument();
    expect(screen.getByText('Réduction saisonnière')).toBeInTheDocument();
    expect(screen.getByText('Déstockage')).toBeInTheDocument();
  });

  it('affiche les offres spéciales', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Achetez-en 2, obtenez-en 1')).toBeInTheDocument();
    expect(screen.getByText('Pack familial')).toBeInTheDocument();
    expect(screen.getByText('Vente flash')).toBeInTheDocument();
  });

  it('affiche les promotions clients', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Première commande')).toBeInTheDocument();
    expect(screen.getByText('Programme de fidélité')).toBeInTheDocument();
    expect(screen.getByText('Anniversaire')).toBeInTheDocument();
  });

  it('affiche la configuration avancée', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Promotions cumulables')).toBeInTheDocument();
    expect(screen.getByText('Application automatique')).toBeInTheDocument();
    expect(screen.getByText('Notifications push')).toBeInTheDocument();
    expect(screen.getByText('Ciblage géographique')).toBeInTheDocument();
  });

  it('appelle updateFormData quand launch_discount est activé', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const launchSwitch = screen.getByLabelText('Activer la réduction de lancement');
    fireEvent.click(launchSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('launch_discount', true);
  });

  it('appelle updateFormData quand buy_2_get_1 est activé', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const buy2Get1Switch = screen.getByLabelText('Activer l\'offre Achetez-en 2, obtenez-en 1');
    fireEvent.click(buy2Get1Switch);
    
    expect(updateFormData).toHaveBeenCalledWith('buy_2_get_1', true);
  });

  it('appelle updateFormData quand stackable_promotions est activé', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const stackableSwitch = screen.getByLabelText('Activer les promotions cumulables');
    fireEvent.click(stackableSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('stackable_promotions', true);
  });

  it('ouvre le formulaire d\'édition quand le bouton éditer est cliqué', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    const editButton = screen.getByLabelText('Éditer la promotion Réduction de lancement');
    fireEvent.click(editButton);
    
    // Vérifier que le formulaire d'édition apparaît
    expect(screen.getByLabelText('Nom de la promotion')).toBeInTheDocument();
    expect(screen.getByLabelText('Type de promotion')).toBeInTheDocument();
  });

  it('supprime une promotion quand le bouton supprimer est cliqué', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    const deleteButton = screen.getByLabelText('Supprimer la promotion Réduction de lancement');
    fireEvent.click(deleteButton);
    
    expect(updateFormData).toHaveBeenCalledWith('promotions', []);
  });

  it('toggle l\'activation d\'une promotion', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    const toggleSwitch = screen.getByLabelText('Désactiver la promotion Réduction de lancement');
    fireEvent.click(toggleSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('promotions', [
      expect.objectContaining({
        ...mockPromotion,
        is_active: false
      })
    ]);
  });

  it('affiche le récapitulatif avec les bonnes statistiques', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [
        mockPromotion,
        { ...mockPromotion, id: '2', is_active: false, type: 'fixed' as const },
        { ...mockPromotion, id: '3', type: 'percentage' as const }
      ]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total promotions
    expect(screen.getByText('2')).toBeInTheDocument(); // Actives
    expect(screen.getByText('2 en %')).toBeInTheDocument(); // En pourcentage
    expect(screen.getByText('1 fixe')).toBeInTheDocument(); // Montant fixe
  });

  it('utilise le dark mode avec les bonnes classes CSS', () => {
    const { container } = renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const cards = container.querySelectorAll('.bg-gray-800\\/50');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const launchSwitch = screen.getByLabelText('Activer la réduction de lancement');
    expect(launchSwitch).toHaveAttribute('aria-label', 'Activer la réduction de lancement');
    
    const addButton = screen.getByLabelText('Ajouter une nouvelle promotion');
    expect(addButton).toHaveAttribute('aria-label', 'Ajouter une nouvelle promotion');
  });

  it('affiche les icônes correctes pour chaque section', () => {
    const { container } = renderWithTooltip(<ProductPromotionsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(5);
  });

  it('met à jour une promotion correctement', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [mockPromotion]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    // Ouvrir le formulaire d'édition
    const editButton = screen.getByLabelText('Éditer la promotion Réduction de lancement');
    fireEvent.click(editButton);
    
    // Modifier le nom
    const nameInput = screen.getByLabelText('Nom de la promotion');
    fireEvent.change(nameInput, { target: { value: 'Nouvelle promotion' } });
    
    expect(updateFormData).toHaveBeenCalledWith('promotions', [
      expect.objectContaining({
        ...mockPromotion,
        name: 'Nouvelle promotion'
      })
    ]);
  });

  it('affiche les badges corrects pour chaque type de promotion', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [
        mockPromotion,
        { ...mockPromotion, id: '2', type: 'fixed' as const },
        { ...mockPromotion, id: '3', type: 'buy_x_get_y' as const }
      ]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Pourcentage')).toBeInTheDocument();
    expect(screen.getByText('Montant fixe')).toBeInTheDocument();
    expect(screen.getByText('Acheter X obtenir Y')).toBeInTheDocument();
  });

  it('compte correctement les promotions par type', () => {
    const formDataWithPromotions = {
      ...defaultFormData,
      promotions: [
        { ...mockPromotion, id: '1', type: 'percentage' as const },
        { ...mockPromotion, id: '2', type: 'percentage' as const },
        { ...mockPromotion, id: '3', type: 'fixed' as const }
      ]
    };
    
    renderWithTooltip(<ProductPromotionsTab formData={formDataWithPromotions} updateFormData={updateFormData} />);
    
    expect(screen.getByText('2 en %')).toBeInTheDocument();
    expect(screen.getByText('1 fixe')).toBeInTheDocument();
  });
});

