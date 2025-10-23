import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PixelConfigCard } from '../PixelConfigCard';
import { Facebook } from 'lucide-react';

describe('PixelConfigCard', () => {
  const defaultProps = {
    platform: {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'blue',
      description: 'Suivi des conversions Facebook et Instagram',
      events: ['Vue de contenu', 'Ajout au panier', 'Achat', 'Lead']
    },
    pixelId: '123456789012345',
    isEnabled: false,
    isActive: false,
    events: {},
    onPixelIdChange: vi.fn(),
    onEnabledChange: vi.fn(),
    onEventChange: vi.fn(),
  };

  it('affiche le nom et la description de la plateforme', () => {
    render(<PixelConfigCard {...defaultProps} />);
    
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Suivi des conversions Facebook et Instagram')).toBeInTheDocument();
  });

  it('affiche le badge "Actif" quand isActive est true', () => {
    render(<PixelConfigCard {...defaultProps} isActive={true} />);
    
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('ne affiche pas le badge "Actif" quand isActive est false', () => {
    render(<PixelConfigCard {...defaultProps} isActive={false} />);
    
    expect(screen.queryByText('Actif')).not.toBeInTheDocument();
  });

  it('affiche le Pixel ID avec le bon placeholder', () => {
    render(<PixelConfigCard {...defaultProps} />);
    
    const input = screen.getByLabelText('ID du pixel Facebook');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('123456789012345');
    expect(input).toHaveAttribute('placeholder', '123456789012345');
  });

  it('appelle onPixelIdChange quand le Pixel ID change', () => {
    const onPixelIdChange = vi.fn();
    render(<PixelConfigCard {...defaultProps} onPixelIdChange={onPixelIdChange} />);
    
    const input = screen.getByLabelText('ID du pixel Facebook');
    fireEvent.change(input, { target: { value: '987654321098765' } });
    
    expect(onPixelIdChange).toHaveBeenCalledWith('987654321098765');
  });

  it('affiche le switch pour activer le pixel', () => {
    render(<PixelConfigCard {...defaultProps} />);
    
    expect(screen.getByLabelText('Activer ou désactiver le pixel Facebook')).toBeInTheDocument();
  });

  it('appelle onEnabledChange quand le switch est activé', () => {
    const onEnabledChange = vi.fn();
    render(<PixelConfigCard {...defaultProps} onEnabledChange={onEnabledChange} />);
    
    const switchElement = screen.getByLabelText('Activer ou désactiver le pixel Facebook');
    fireEvent.click(switchElement);
    
    expect(onEnabledChange).toHaveBeenCalled();
  });

  it('n\'affiche pas les événements quand isEnabled est false', () => {
    render(<PixelConfigCard {...defaultProps} isEnabled={false} />);
    
    expect(screen.queryByText('Événements à tracker')).not.toBeInTheDocument();
  });

  it('affiche les événements quand isEnabled est true', () => {
    render(<PixelConfigCard {...defaultProps} isEnabled={true} />);
    
    expect(screen.getByText('Événements à tracker')).toBeInTheDocument();
    expect(screen.getByText('Vue de contenu')).toBeInTheDocument();
    expect(screen.getByText('Ajout au panier')).toBeInTheDocument();
    expect(screen.getByText('Achat')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
  });

  it('appelle onEventChange quand un événement est activé', () => {
    const onEventChange = vi.fn();
    render(<PixelConfigCard {...defaultProps} isEnabled={true} onEventChange={onEventChange} />);
    
    const eventSwitch = screen.getByLabelText('Activer le tracking de l\'événement Vue de contenu');
    fireEvent.click(eventSwitch);
    
    expect(onEventChange).toHaveBeenCalledWith('facebook_vue_de_contenu', expect.any(Boolean));
  });

  it('applique les bonnes classes de couleur pour chaque plateforme', () => {
    const { container } = render(<PixelConfigCard {...defaultProps} />);
    
    const iconContainer = container.querySelector('.bg-blue-500\\/20');
    expect(iconContainer).toBeInTheDocument();
  });

  it('affiche le texte d\'aide pour le Pixel ID', () => {
    render(<PixelConfigCard {...defaultProps} />);
    
    expect(screen.getByText('ID unique de votre pixel Facebook')).toBeInTheDocument();
  });

  it('affiche le bon placeholder pour Google Analytics', () => {
    const googleProps = {
      ...defaultProps,
      platform: {
        ...defaultProps.platform,
        id: 'google',
        name: 'Google',
      }
    };
    
    render(<PixelConfigCard {...googleProps} />);
    
    const input = screen.getByLabelText('ID du pixel Google');
    expect(input).toHaveAttribute('placeholder', 'GA-XXXXXXXXX');
  });

  it('affiche le bon placeholder pour TikTok', () => {
    const tiktokProps = {
      ...defaultProps,
      platform: {
        ...defaultProps.platform,
        id: 'tiktok',
        name: 'TikTok',
      }
    };
    
    render(<PixelConfigCard {...tiktokProps} />);
    
    const input = screen.getByLabelText('ID du pixel TikTok');
    expect(input).toHaveAttribute('placeholder', 'CXXXXXXXXXXXXXXX');
  });

  it('marque les événements actifs dans le state events', () => {
    const eventsState = {
      facebook_vue_de_contenu: true,
      facebook_achat: true
    };
    
    render(<PixelConfigCard {...defaultProps} isEnabled={true} events={eventsState} />);
    
    const viewContentSwitch = screen.getByLabelText('Activer le tracking de l\'événement Vue de contenu');
    const purchaseSwitch = screen.getByLabelText('Activer le tracking de l\'événement Achat');
    
    expect(viewContentSwitch).toBeChecked();
    expect(purchaseSwitch).toBeChecked();
  });

  it('a les attributs ARIA corrects pour l\'accessibilité', () => {
    render(<PixelConfigCard {...defaultProps} isEnabled={true} />);
    
    const pixelIdInput = screen.getByLabelText('ID du pixel Facebook');
    expect(pixelIdInput).toHaveAttribute('aria-label', 'ID du pixel Facebook');
    expect(pixelIdInput).toHaveAttribute('aria-describedby', 'facebook_pixel_help');
    
    const enableSwitch = screen.getByLabelText('Activer ou désactiver le pixel Facebook');
    expect(enableSwitch).toHaveAttribute('aria-label', 'Activer ou désactiver le pixel Facebook');
  });
});

