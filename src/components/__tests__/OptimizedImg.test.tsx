/**
 * Tests pour le composant OptimizedImg
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizedImg } from '@/components/shared/OptimizedImg';

describe('OptimizedImg', () => {
  it('renders correctly with required props', () => {
    render(<OptimizedImg src="/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('applies lazy loading by default', () => {
    render(<OptimizedImg src="/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('applies eager loading when priority is true', () => {
    render(<OptimizedImg src="/test.jpg" alt="Test image" priority />);
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('applies async decoding by default', () => {
    render(<OptimizedImg src="/test.jpg" alt="Test image" />);
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    expect(img.getAttribute('decoding')).toBe('async');
  });

  it('applies custom className', () => {
    render(<OptimizedImg src="/test.jpg" alt="Test image" className="custom-class" />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('custom-class');
  });
});

