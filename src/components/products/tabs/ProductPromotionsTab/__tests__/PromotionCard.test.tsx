import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromotionCard, Promotion } from '../PromotionCard';

describe('PromotionCard', () => {
  const mockPromotion: Promotion = {
    id: 'promo-1',
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

  const defaultProps = {
    promotion: mockPromotion,
    index: 0,
    isEditing: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onUpdate: vi.fn(),
    currencySymbol: 'FCFA'
  };

  it('affiche le nom de la promotion', () => {
    render(<PromotionCard {...defaultProps} />);
    
    expect(screen.getByText('Réduction de lancement')).toBeInTheDocument();
  });

  it('affiche "Promotion X" quand le nom est vide', () => {
    const promotionWithoutName = { ...mockPromotion, name: '' };
    render(<PromotionCard {...defaultProps} promotion={promotionWithoutName} />);
    
    expect(screen.getByText('Promotion 1')).toBeInTheDocument();
  });

  it('affiche le badge "Active" quand is_active est true', () => {
    render(<PromotionCard {...defaultProps} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('affiche le badge "Inactive" quand is_active est false', () => {
    const inactivePromotion = { ...mockPromotion, is_active: false };
    render(<PromotionCard {...defaultProps} promotion={inactivePromotion} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('affiche le type de promotion "Pourcentage"', () => {
    render(<PromotionCard {...defaultProps} />);
    
    expect(screen.getByText('Pourcentage')).toBeInTheDocument();
  });

  it('affiche le type de promotion "Montant fixe"', () => {
    const fixedPromotion = { ...mockPromotion, type: 'fixed' as const };
    render(<PromotionCard {...defaultProps} promotion={fixedPromotion} />);
    
    expect(screen.getByText('Montant fixe')).toBeInTheDocument();
  });

  it('affiche le type de promotion "Acheter X obtenir Y"', () => {
    const buyXGetYPromotion = { ...mockPromotion, type: 'buy_x_get_y' as const };
    render(<PromotionCard {...defaultProps} promotion={buyXGetYPromotion} />);
    
    expect(screen.getByText('Acheter X obtenir Y')).toBeInTheDocument();
  });

  it('appelle onEdit quand le bouton éditer est cliqué', () => {
    const onEdit = vi.fn();
    render(<PromotionCard {...defaultProps} onEdit={onEdit} />);
    
    const editButton = screen.getByLabelText('Éditer la promotion Réduction de lancement');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('appelle onDelete quand le bouton supprimer est cliqué', () => {
    const onDelete = vi.fn();
    render(<PromotionCard {...defaultProps} onDelete={onDelete} />);
    
    const deleteButton = screen.getByLabelText('Supprimer la promotion Réduction de lancement');
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('appelle onToggleActive quand le switch est cliqué', () => {
    const onToggleActive = vi.fn();
    render(<PromotionCard {...defaultProps} onToggleActive={onToggleActive} />);
    
    const toggleSwitch = screen.getByLabelText('Désactiver la promotion Réduction de lancement');
    fireEvent.click(toggleSwitch);
    
    expect(onToggleActive).toHaveBeenCalledTimes(1);
  });

  it('affiche le résumé en mode non-édition', () => {
    render(<PromotionCard {...defaultProps} isEditing={false} />);
    
    expect(screen.getByText('Valeur:')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Qté min:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Début:')).toBeInTheDocument();
    expect(screen.getByText('01/01/2025')).toBeInTheDocument();
    expect(screen.getByText('Fin:')).toBeInTheDocument();
    expect(screen.getByText('31/12/2025')).toBeInTheDocument();
  });

  it('affiche le formulaire en mode édition', () => {
    render(<PromotionCard {...defaultProps} isEditing={true} />);
    
    expect(screen.getByLabelText('Nom de la promotion')).toBeInTheDocument();
    expect(screen.getByLabelText('Type de promotion')).toBeInTheDocument();
    expect(screen.getByLabelText('Pourcentage (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantité minimum')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre maximum d\'utilisations')).toBeInTheDocument();
    expect(screen.getByLabelText('Limite par client')).toBeInTheDocument();
  });

  it('appelle onUpdate quand le nom est modifié', () => {
    const onUpdate = vi.fn();
    render(<PromotionCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const nameInput = screen.getByLabelText('Nom de la promotion');
    fireEvent.change(nameInput, { target: { value: 'Nouvelle promotion' } });
    
    expect(onUpdate).toHaveBeenCalledWith('name', 'Nouvelle promotion');
  });

  it('appelle onUpdate quand la valeur est modifiée', () => {
    const onUpdate = vi.fn();
    render(<PromotionCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const valueInput = screen.getByLabelText('Pourcentage (%)');
    fireEvent.change(valueInput, { target: { value: '30' } });
    
    expect(onUpdate).toHaveBeenCalledWith('value', 30);
  });

  it('appelle onUpdate quand la quantité minimum est modifiée', () => {
    const onUpdate = vi.fn();
    render(<PromotionCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const minQtyInput = screen.getByLabelText('Quantité minimum');
    fireEvent.change(minQtyInput, { target: { value: '5' } });
    
    expect(onUpdate).toHaveBeenCalledWith('min_quantity', 5);
  });

  it('affiche le label "Montant fixe" quand le type est fixed', () => {
    const fixedPromotion = { ...mockPromotion, type: 'fixed' as const };
    render(<PromotionCard {...defaultProps} promotion={fixedPromotion} isEditing={true} />);
    
    expect(screen.getByLabelText('Montant fixe')).toBeInTheDocument();
  });

  it('affiche le symbole % pour les promotions en pourcentage', () => {
    render(<PromotionCard {...defaultProps} isEditing={true} />);
    
    const valueField = screen.getByLabelText('Pourcentage (%)').closest('div');
    expect(valueField?.textContent).toContain('%');
  });

  it('affiche le symbole de la devise pour les promotions en montant fixe', () => {
    const fixedPromotion = { ...mockPromotion, type: 'fixed' as const };
    render(<PromotionCard {...defaultProps} promotion={fixedPromotion} isEditing={true} currencySymbol="€" />);
    
    const valueField = screen.getByLabelText('Montant fixe').closest('div');
    expect(valueField?.textContent).toContain('€');
  });

  it('affiche "Illimité" comme placeholder pour max_uses', () => {
    render(<PromotionCard {...defaultProps} isEditing={true} />);
    
    const maxUsesInput = screen.getByLabelText('Nombre maximum d\'utilisations');
    expect(maxUsesInput).toHaveAttribute('placeholder', 'Illimité');
  });

  it('affiche "Illimité" comme placeholder pour customer_limit', () => {
    render(<PromotionCard {...defaultProps} isEditing={true} />);
    
    const customerLimitInput = screen.getByLabelText('Limite par client');
    expect(customerLimitInput).toHaveAttribute('placeholder', 'Illimité');
  });

  it('appelle onUpdate avec null quand max_uses est vidé', () => {
    const onUpdate = vi.fn();
    render(<PromotionCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const maxUsesInput = screen.getByLabelText('Nombre maximum d\'utilisations');
    fireEvent.change(maxUsesInput, { target: { value: '' } });
    
    expect(onUpdate).toHaveBeenCalledWith('max_uses', null);
  });

  it('appelle onUpdate avec null quand customer_limit est vidé', () => {
    const onUpdate = vi.fn();
    render(<PromotionCard {...defaultProps} isEditing={true} onUpdate={onUpdate} />);
    
    const customerLimitInput = screen.getByLabelText('Limite par client');
    fireEvent.change(customerLimitInput, { target: { value: '' } });
    
    expect(onUpdate).toHaveBeenCalledWith('customer_limit', null);
  });

  it('applique une opacité réduite quand la promotion est inactive', () => {
    const inactivePromotion = { ...mockPromotion, is_active: false };
    const { container } = render(<PromotionCard {...defaultProps} promotion={inactivePromotion} />);
    
    const card = container.querySelector('.opacity-70');
    expect(card).toBeInTheDocument();
  });

  it('affiche "—" quand start_date est null', () => {
    const promotionWithoutStartDate = { ...mockPromotion, start_date: null };
    render(<PromotionCard {...defaultProps} promotion={promotionWithoutStartDate} isEditing={false} />);
    
    expect(screen.getAllByText('—')[0]).toBeInTheDocument();
  });

  it('affiche "—" quand end_date est null', () => {
    const promotionWithoutEndDate = { ...mockPromotion, end_date: null };
    render(<PromotionCard {...defaultProps} promotion={promotionWithoutEndDate} isEditing={false} />);
    
    expect(screen.getAllByText('—')[0]).toBeInTheDocument();
  });

  it('affiche les dates au format français', () => {
    render(<PromotionCard {...defaultProps} isEditing={false} />);
    
    expect(screen.getByText('01/01/2025')).toBeInTheDocument();
    expect(screen.getByText('31/12/2025')).toBeInTheDocument();
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    render(<PromotionCard {...defaultProps} isEditing={true} />);
    
    const nameInput = screen.getByLabelText('Nom de la promotion');
    expect(nameInput).toHaveAttribute('aria-label', 'Nom de la promotion');
    
    const editButton = screen.getByLabelText('Éditer la promotion Réduction de lancement');
    expect(editButton).toHaveAttribute('aria-label', 'Éditer la promotion Réduction de lancement');
    
    const deleteButton = screen.getByLabelText('Supprimer la promotion Réduction de lancement');
    expect(deleteButton).toHaveAttribute('aria-label', 'Supprimer la promotion Réduction de lancement');
  });

  it('utilise step="1" pour les promotions en pourcentage', () => {
    render(<PromotionCard {...defaultProps} isEditing={true} />);
    
    const valueInput = screen.getByLabelText('Pourcentage (%)');
    expect(valueInput).toHaveAttribute('step', '1');
  });

  it('utilise step="0.01" pour les promotions en montant fixe', () => {
    const fixedPromotion = { ...mockPromotion, type: 'fixed' as const };
    render(<PromotionCard {...defaultProps} promotion={fixedPromotion} isEditing={true} />);
    
    const valueInput = screen.getByLabelText('Montant fixe');
    expect(valueInput).toHaveAttribute('step', '0.01');
  });

  it('affiche la valeur avec le symbole de devise dans le résumé pour fixed', () => {
    const fixedPromotion = { ...mockPromotion, type: 'fixed' as const, value: 500 };
    render(<PromotionCard {...defaultProps} promotion={fixedPromotion} isEditing={false} currencySymbol="€" />);
    
    expect(screen.getByText('500 €')).toBeInTheDocument();
  });
});

