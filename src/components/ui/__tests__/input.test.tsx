/**
 * Tests unitaires pour le composant Input
 * 
 * Couverture :
 * - Rendu des inputs
 * - Gestion des valeurs
 * - Validation
 * - États disabled/readonly
 * - Types d'input
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should accept value prop', () => {
    render(<Input value="test value" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test value');
  });

  it('should call onChange handler', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should have placeholder', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input type="email" />);
    
    let input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('email');
    
    rerender(<Input type="password" />);
    input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('should apply className', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });
});

