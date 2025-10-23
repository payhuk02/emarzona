import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProductVariantsTab } from '../ProductVariantsTab';
import { ProductVariant } from '../ProductVariantsTab/VariantCard';
import { TooltipProvider } from '@/components/ui/tooltip';

// Helper pour wrapper avec TooltipProvider
const renderWithTooltip = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('ProductVariantsTab', () => {
  const mockVariant: ProductVariant = {
    id: '1',
    name: 'Rouge - Taille L',
    sku: 'PROD-RED-L',
    price: 2500,
    stock: 10,
    is_active: true,
    attributes: {
      color: 'Rouge',
      size: 'L'
    },
    image: 'https://example.com/red-l.jpg'
  };

  const defaultFormData = {
    variants: [],
    color_variants: false,
    pattern_variants: false,
    finish_variants: false,
    size_variants: false,
    dimension_variants: false,
    weight_variants: false,
    centralized_stock: false,
    low_stock_alerts: false,
    preorder_allowed: false,
    hide_when_out_of_stock: false,
    different_prices_per_variant: false,
    price_surcharge: false,
    quantity_discounts: false
  };

  const updateFormData = vi.fn();

  it('affiche le titre et la description', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Variantes de Produit')).toBeInTheDocument();
    expect(screen.getByText(/Créez différentes versions de votre produit/)).toBeInTheDocument();
  });

  it('affiche "Aucune variante" quand la liste est vide', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Aucune variante')).toBeInTheDocument();
    expect(screen.getByText(/Cliquez sur "Ajouter une variante" pour commencer/)).toBeInTheDocument();
  });

  it('affiche le bouton "Ajouter une variante"', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Ajouter une variante')).toBeInTheDocument();
  });

  it('ajoute une nouvelle variante quand le bouton est cliqué', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const addButton = screen.getByText('Ajouter une variante');
    fireEvent.click(addButton);
    
    expect(updateFormData).toHaveBeenCalledWith('variants', expect.arrayContaining([
      expect.objectContaining({
        name: '',
        sku: '',
        price: 0,
        stock: 0,
        is_active: true
      })
    ]));
  });

  it('affiche les variantes existantes', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Variante 1: Rouge - Taille L')).toBeInTheDocument();
  });

  it('affiche le nombre de variantes actives', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant, { ...mockVariant, id: '2', is_active: false }]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    expect(screen.getByText('1 active')).toBeInTheDocument();
  });

  it('affiche la valeur totale du stock', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant, { ...mockVariant, id: '2', stock: 5 }]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('affiche les options d\'attributs visuels', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Couleurs disponibles')).toBeInTheDocument();
    expect(screen.getByText('Motifs/Textures')).toBeInTheDocument();
    expect(screen.getByText('Finitions')).toBeInTheDocument();
  });

  it('affiche les options d\'attributs dimensionnels', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Tailles disponibles')).toBeInTheDocument();
    expect(screen.getByText('Dimensions personnalisées')).toBeInTheDocument();
    expect(screen.getByText('Poids variable')).toBeInTheDocument();
  });

  it('affiche les options de gestion de stock', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Stock centralisé')).toBeInTheDocument();
    expect(screen.getByText('Alertes de stock bas')).toBeInTheDocument();
    expect(screen.getByText('Précommandes autorisées')).toBeInTheDocument();
    expect(screen.getByText('Masquer si rupture de stock')).toBeInTheDocument();
  });

  it('affiche les règles de prix', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Prix différents par variante')).toBeInTheDocument();
    expect(screen.getByText('Supplément de prix')).toBeInTheDocument();
    expect(screen.getByText('Remises sur quantité')).toBeInTheDocument();
  });

  it('appelle updateFormData quand color_variants est activé', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const colorSwitch = screen.getByLabelText('Activer les couleurs disponibles');
    fireEvent.click(colorSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('color_variants', true);
  });

  it('appelle updateFormData quand size_variants est activé', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const sizeSwitch = screen.getByLabelText('Activer les tailles disponibles');
    fireEvent.click(sizeSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('size_variants', true);
  });

  it('appelle updateFormData quand low_stock_alerts est activé', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const lowStockSwitch = screen.getByLabelText('Activer les alertes de stock bas');
    fireEvent.click(lowStockSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('low_stock_alerts', true);
  });

  it('ouvre le formulaire d\'édition quand le bouton éditer est cliqué', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    const editButton = screen.getByLabelText('Éditer la variante Rouge - Taille L');
    fireEvent.click(editButton);
    
    // Vérifier que le formulaire d'édition apparaît
    expect(screen.getByLabelText('Nom de la variante')).toBeInTheDocument();
    expect(screen.getByLabelText('SKU de la variante')).toBeInTheDocument();
  });

  it('supprime une variante quand le bouton supprimer est cliqué', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    const deleteButton = screen.getByLabelText('Supprimer la variante Rouge - Taille L');
    fireEvent.click(deleteButton);
    
    expect(updateFormData).toHaveBeenCalledWith('variants', []);
  });

  it('toggle l\'activation d\'une variante', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    const toggleSwitch = screen.getByLabelText('Désactiver la variante Rouge - Taille L');
    fireEvent.click(toggleSwitch);
    
    expect(updateFormData).toHaveBeenCalledWith('variants', [
      expect.objectContaining({
        ...mockVariant,
        is_active: false
      })
    ]);
  });

  it('affiche le récapitulatif avec les bonnes statistiques', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [
        mockVariant,
        { ...mockVariant, id: '2', is_active: false, stock: 5 },
        { ...mockVariant, id: '3', stock: 8 }
      ]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Total variantes
    expect(screen.getByText('2 actives')).toBeInTheDocument(); // Variantes actives
    expect(screen.getByText('23')).toBeInTheDocument(); // Stock total
  });

  it('utilise le dark mode avec les bonnes classes CSS', () => {
    const { container } = renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const cards = container.querySelectorAll('.bg-gray-800\\/50');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const colorSwitch = screen.getByLabelText('Activer les couleurs disponibles');
    expect(colorSwitch).toHaveAttribute('aria-label', 'Activer les couleurs disponibles');
    
    const addButton = screen.getByLabelText('Ajouter une nouvelle variante de produit');
    expect(addButton).toHaveAttribute('aria-label', 'Ajouter une nouvelle variante de produit');
  });

  it('affiche les icônes correctes pour chaque section', () => {
    const { container } = renderWithTooltip(<ProductVariantsTab formData={defaultFormData} updateFormData={updateFormData} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(5);
  });

  it('affiche le badge "Rupture de stock" quand stock est 0', () => {
    const outOfStockVariant = { ...mockVariant, stock: 0 };
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [outOfStockVariant]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    expect(screen.getByText('Rupture de stock')).toBeInTheDocument();
  });

  it('met à jour une variante correctement', () => {
    const formDataWithVariants = {
      ...defaultFormData,
      variants: [mockVariant]
    };
    
    renderWithTooltip(<ProductVariantsTab formData={formDataWithVariants} updateFormData={updateFormData} />);
    
    // Ouvrir le formulaire d'édition
    const editButton = screen.getByLabelText('Éditer la variante Rouge - Taille L');
    fireEvent.click(editButton);
    
    // Modifier le nom
    const nameInput = screen.getByLabelText('Nom de la variante');
    fireEvent.change(nameInput, { target: { value: 'Bleu - Taille M' } });
    
    expect(updateFormData).toHaveBeenCalledWith('variants', [
      expect.objectContaining({
        ...mockVariant,
        name: 'Bleu - Taille M'
      })
    ]);
  });
});

