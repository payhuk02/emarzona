/**
 * Tests unitaires pour ReviewStars
 * Date : 27 octobre 2025
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewStars } from '../ReviewStars';

function countFilledStars(container: HTMLElement) {
  return container.querySelectorAll('.fill-yellow-400').length;
}

describe('ReviewStars', () => {
  describe('Display mode', () => {
    it('should render 5 stars', () => {
      const { container } = render(<ReviewStars rating={3} />);
      const stars = container.querySelectorAll('svg');
      expect(stars).toHaveLength(5);
    });

    it('should fill correct number of stars based on rating', () => {
      const { container } = render(<ReviewStars rating={3} />);
      expect(countFilledStars(container)).toBe(3);
    });

    it('should render half star for decimal rating', () => {
      const { container } = render(<ReviewStars rating={3.5} />);
      expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(5);
      expect(countFilledStars(container)).toBeGreaterThanOrEqual(3);
    });

    it('should apply custom size class', () => {
      const { container } = render(<ReviewStars rating={3} size="lg" />);
      const stars = container.querySelectorAll('.w-5.h-5');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive mode', () => {
    it('should call onChange when star is clicked', () => {
      const handleChange = vi.fn();
      const { container } = render(<ReviewStars rating={0} onChange={handleChange} interactive />);

      const stars = container.querySelectorAll('button');
      fireEvent.click(stars[2]);

      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it('should highlight stars on hover', () => {
      const handleChange = vi.fn();
      const { container } = render(<ReviewStars rating={0} onChange={handleChange} interactive />);

      const stars = container.querySelectorAll('button');
      fireEvent.mouseEnter(stars[3]);

      expect(countFilledStars(container)).toBeGreaterThanOrEqual(4);
    });

    it('should disable buttons when interactive is false', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <ReviewStars rating={3} onChange={handleChange} interactive={false} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(5);
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for rating', () => {
      render(<ReviewStars rating={4} showNumber />);
      expect(screen.getByText('(4.0)')).toBeInTheDocument();
    });

    it('should expose star buttons with aria labels', () => {
      render(<ReviewStars rating={0} onChange={vi.fn()} interactive />);
      expect(screen.getByRole('button', { name: /1 étoile/ })).toBeInTheDocument();
    });

    it('should have proper button elements for interactive stars', () => {
      const { container } = render(<ReviewStars rating={3} onChange={vi.fn()} interactive />);
      const stars = container.querySelectorAll('button');
      expect(stars.length).toBe(5);
    });
  });

  describe('Edge cases', () => {
    it('should handle rating of 0', () => {
      const { container } = render(<ReviewStars rating={0} />);
      expect(countFilledStars(container)).toBe(0);
    });

    it('should handle rating of 5', () => {
      const { container } = render(<ReviewStars rating={5} />);
      expect(countFilledStars(container)).toBe(5);
    });

    it('should clamp rating above 5', () => {
      const { container } = render(<ReviewStars rating={6} />);
      expect(countFilledStars(container)).toBeLessThanOrEqual(5);
    });

    it('should handle negative rating', () => {
      const { container } = render(<ReviewStars rating={-1} />);
      expect(countFilledStars(container)).toBe(0);
    });
  });
});
