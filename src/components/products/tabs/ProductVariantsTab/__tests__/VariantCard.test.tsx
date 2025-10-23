import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariantCard, ProductVariant } from '../VariantCard';

describe('VariantCard', () => {
  const mockVariant: ProductVariant = {
    id: 'variant-1',
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

  const defaultProps = {
    variant: mockVariant,
    index: 0,
    isEditing: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onUpdate: vi.fn(),
    currencySymbol: 'FCFA'
  };

  it('affiche le nom de la variante avec l\'index', () => {
    render(<VariantCard {...defaultProps} />);
    
    expect(screen.getByText('Variante 1: Rouge - Taille L')).toBeInTheDocument();
  });

  it('affiche "Variante X" quand le nom est vide', () => {
    const variantWithoutName = { ...mockVariant, name: '' };
    render(<VariantCard {...defaultProps} variant={variantWithoutName} />);
    
    expect(screen.getByText('Variante 1')).toBeInTheDocument();
  });

  it('affiche le badge "Active" quand is_active est true', () => {
    render(<VariantCard {...defaultProps} />);
    
    const activeElements = screen.getAllByText('Active');
    expect(activeElements.length).toBeGreaterThan(0);
  });

  it('affiche le badge "Inactive" quand is_active est false', () => {
    const inactiveVariant = { ...mockVariant, is_active: false };
    render(<VariantCard {...defaultProps} variant={inactiveVariant} />);
    
    const inactiveElements = screen.getAllByText('Inactive');
    expect(inactiveElements.length).toBeGreaterThan(0);
  });

  it('affiche le badge "Rupture de stock" quand stock est 0', () => {
    const outOfStockVariant = { ...mockVariant, stock: 0 };
    render(<VariantCard {...defaultProps} variant={outOfStockVariant} />);
    
    expect(screen.getByText('Rupture de stock')).toBeInTheDocument();
  });

  it('appelle onEdit quand le bouton éditer est cliqué', () => {
    const onEdit = vi.fn();
    render(<VariantCard {...defaultProps} onEdit={onEdit} />);
    
    const editButton = screen.getByLabelText('Éditer la variante Rouge - Taille L');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('appelle onDelete quand le bouton supprimer est cliqué', () => {
    const onDelete = vi.fn();
    render(<VariantCard {...defaultProps} onDelete={onDelete} />);
    
    const deleteButton = screen.getByLabelText('Supprimer la variante Rouge - Taille L');
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('appelle onToggleActive quand le switch est cliqué', () => {
    const onToggleActive = vi.fn();
    render(<VariantCard {...defaultProps} onToggleActive={onToggleActive} />);
    
    const toggleSwitch = screen.getByLabelText('Désactiver la variante Rouge - Taille L');
    fireEvent.click(toggleSwitch);
    
    expect(onToggleActive).toHaveBeenCalledTimes(1);
  });

  it('affiche le résumé en mode non-édition', () => {
    render(<VariantCard {...defaultProps} isEditing={false} />);
    
    expect(screen.getByText('SKU:')).toBeInTheDocument();
    expect(screen.getByText('PROD-RED-L')).toBeInTheDocument();
    expect(screen.getByText('Prix:')).toBeInTheDocument();
    expect(screen.getByText('2 500 FCFA')).toBeInTheDocument();
    expect(screen.getByText('Stock:')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('affiche le formulaire en mode édition', () => {
    render(<VariantCard {...defaultProps} isEditing={true} />);
    
    expect(screen.getByLabelText('Nom de la variante')).toBeInTheDocument();
    expect(screen.getByLabelText('SKU de la variante')).toBeInTheDocument();
    expect(screen.getByLabelText('Prix de la variante')).toBeInTheDocument();
    expect(screen.getByLabelText('Stock de la variante')).toBeInTheDocument();
    expect(screen.getByLabelText('URL de l\'image de la variante')).toBeInTheDocument();
  });

  it('appelle onUpdate quand le nom est modifié', () => {
    const onUpdate = vi.fn();
    render(<VariantCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const nameInput = screen.getByLabelText('Nom de la variante');
    fireEvent.change(nameInput, { target: { value: 'Bleu - Taille M' } });
    
    expect(onUpdate).toHaveBeenCalledWith('name', 'Bleu - Taille M');
  });

  it('appelle onUpdate quand le SKU est modifié', () => {
    const onUpdate = vi.fn();
    render(<VariantCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const skuInput = screen.getByLabelText('SKU de la variante');
    fireEvent.change(skuInput, { target: { value: 'PROD-BLUE-M' } });
    
    expect(onUpdate).toHaveBeenCalledWith('sku', 'PROD-BLUE-M');
  });

  it('appelle onUpdate avec un nombre quand le prix est modifié', () => {
    const onUpdate = vi.fn();
    render(<VariantCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const priceInput = screen.getByLabelText('Prix de la variante');
    fireEvent.change(priceInput, { target: { value: '3000' } });
    
    expect(onUpdate).toHaveBeenCalledWith('price', 3000);
  });

  it('appelle onUpdate avec un nombre quand le stock est modifié', () => {
    const onUpdate = vi.fn();
    render(<VariantCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const stockInput = screen.getByLabelText('Stock de la variante');
    fireEvent.change(stockInput, { target: { value: '20' } });
    
    expect(onUpdate).toHaveBeenCalledWith('stock', 20);
  });

  it('appelle onUpdate quand l\'image est modifiée', () => {
    const onUpdate = vi.fn();
    render(<VariantCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const imageInput = screen.getByLabelText('URL de l\'image de la variante');
    fireEvent.change(imageInput, { target: { value: 'https://example.com/new-image.jpg' } });
    
    expect(onUpdate).toHaveBeenCalledWith('image', 'https://example.com/new-image.jpg');
  });

  it('affiche le stock en vert quand > 10', () => {
    const highStockVariant = { ...mockVariant, stock: 15 };
    render(<VariantCard {...defaultProps} variant={highStockVariant} isEditing={false} />);
    
    const stockElement = screen.getByText('15');
    expect(stockElement).toHaveClass('text-green-400');
  });

  it('affiche le stock en jaune quand entre 1 et 10', () => {
    const lowStockVariant = { ...mockVariant, stock: 5 };
    render(<VariantCard {...defaultProps} variant={lowStockVariant} isEditing={false} />);
    
    const stockElement = screen.getByText('5');
    expect(stockElement).toHaveClass('text-yellow-400');
  });

  it('affiche le stock en rouge quand égal à 0', () => {
    const outOfStockVariant = { ...mockVariant, stock: 0 };
    render(<VariantCard {...defaultProps} variant={outOfStockVariant} isEditing={false} />);
    
    const stockElement = screen.getByText('0');
    expect(stockElement).toHaveClass('text-red-400');
  });

  it('applique une opacité réduite quand la variante est inactive', () => {
    const inactiveVariant = { ...mockVariant, is_active: false };
    const { container } = render(<VariantCard {...defaultProps} variant={inactiveVariant} />);
    
    const card = container.querySelector('.opacity-70');
    expect(card).toBeInTheDocument();
  });

  it('affiche un tiret quand le SKU est vide', () => {
    const variantWithoutSKU = { ...mockVariant, sku: '' };
    render(<VariantCard {...defaultProps} variant={variantWithoutSKU} isEditing={false} />);
    
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('applique une bordure rouge au stock quand stock est 0 en mode édition', () => {
    const outOfStockVariant = { ...mockVariant, stock: 0 };
    render(<VariantCard {...defaultProps} variant={outOfStockVariant} isEditing={true} />);
    
    const stockInput = screen.getByLabelText('Stock de la variante');
    expect(stockInput).toHaveClass('border-red-500/50');
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    render(<VariantCard {...defaultProps} isEditing={true} />);
    
    const nameInput = screen.getByLabelText('Nom de la variante');
    expect(nameInput).toHaveAttribute('aria-label', 'Nom de la variante');
    
    const editButton = screen.getByLabelText('Éditer la variante Rouge - Taille L');
    expect(editButton).toHaveAttribute('aria-label', 'Éditer la variante Rouge - Taille L');
    
    const deleteButton = screen.getByLabelText('Supprimer la variante Rouge - Taille L');
    expect(deleteButton).toHaveAttribute('aria-label', 'Supprimer la variante Rouge - Taille L');
  });

  it('affiche le symbole de la devise dans les champs de prix', () => {
    render(<VariantCard {...defaultProps} isEditing={true} currencySymbol="€" />);
    
    const priceField = screen.getByLabelText('Prix de la variante').closest('div');
    expect(priceField?.textContent).toContain('€');
  });

  it('affiche le symbole de la devise dans le résumé', () => {
    render(<VariantCard {...defaultProps} isEditing={false} currencySymbol="$" />);
    
    expect(screen.getByText('2 500 $')).toBeInTheDocument();
  });
});

