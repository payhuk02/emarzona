/**
 * Tests unitaires pour le composant Button
 * 
 * Couverture :
 * - Rendu des variantes
 * - Gestion des tailles
 * - Accessibilité (aria-label)
 * - États disabled
 * - Gestion des événements
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
    
    rerender(<Button variant="outline">Cancel</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border-input');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');
    
    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should call onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should have aria-label when children is string', () => {
    render(<Button>Save</Button>);
    
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toHaveAttribute('aria-label', 'Save');
  });

  it('should use explicit aria-label when provided', () => {
    render(<Button aria-label="Custom label">Save</Button>);
    
    const button = screen.getByRole('button', { name: /custom label/i });
    expect(button).toHaveAttribute('aria-label', 'Custom label');
  });
});

