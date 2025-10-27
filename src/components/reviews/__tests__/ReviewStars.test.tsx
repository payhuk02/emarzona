/**
 * Tests unitaires pour ReviewStars
 * Date : 27 octobre 2025
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewStars } from '../ReviewStars';

describe('ReviewStars', () => {
  describe('Display mode', () => {
    it('should render 5 stars', () => {
      const { container } = render(<ReviewStars rating={3} />);
      const stars = container.querySelectorAll('svg');
      expect(stars).toHaveLength(5);
    });

    it('should fill correct number of stars based on rating', () => {
      const { container } = render(<ReviewStars rating={3} />);
      const filledStars = container.querySelectorAll('.fill-primary');
      expect(filledStars).toHaveLength(3);
    });

    it('should render half star for decimal rating', () => {
      const { container } = render(<ReviewStars rating={3.5} />);
      const halfStars = container.querySelectorAll('[data-half="true"]');
      expect(halfStars.length).toBeGreaterThan(0);
    });

    it('should apply custom size class', () => {
      const { container } = render(<ReviewStars rating={3} size="lg" />);
      const stars = container.querySelectorAll('.h-6');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive mode', () => {
    it('should call onChange when star is clicked', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <ReviewStars rating={0} onChange={handleChange} interactive />
      );
      
      const stars = container.querySelectorAll('button');
      fireEvent.click(stars[2]); // Click 3rd star
      
      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it('should highlight stars on hover', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <ReviewStars rating={0} onChange={handleChange} interactive />
      );
      
      const stars = container.querySelectorAll('button');
      fireEvent.mouseEnter(stars[3]);
      
      // Should highlight 4 stars
      const highlighted = container.querySelectorAll('.text-primary');
      expect(highlighted.length).toBeGreaterThanOrEqual(4);
    });

    it('should be disabled when interactive is false', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <ReviewStars rating={3} onChange={handleChange} interactive={false} />
      );
      
      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for rating', () => {
      render(<ReviewStars rating={4} />);
      expect(screen.getByText(/4/)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const handleChange = vi.fn();
      const { container } = render(
        <ReviewStars rating={0} onChange={handleChange} interactive />
      );
      
      const firstStar = container.querySelector('button');
      firstStar?.focus();
      
      fireEvent.keyDown(firstStar!, { key: 'Enter' });
      expect(handleChange).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = render(<ReviewStars rating={3} interactive />);
      const stars = container.querySelectorAll('[role="button"]');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle rating of 0', () => {
      const { container } = render(<ReviewStars rating={0} />);
      const filledStars = container.querySelectorAll('.fill-primary');
      expect(filledStars).toHaveLength(0);
    });

    it('should handle rating of 5', () => {
      const { container } = render(<ReviewStars rating={5} />);
      const filledStars = container.querySelectorAll('.fill-primary');
      expect(filledStars).toHaveLength(5);
    });

    it('should clamp rating above 5', () => {
      const { container } = render(<ReviewStars rating={6} />);
      const filledStars = container.querySelectorAll('.fill-primary');
      expect(filledStars.length).toBeLessThanOrEqual(5);
    });

    it('should handle negative rating', () => {
      const { container } = render(<ReviewStars rating={-1} />);
      const filledStars = container.querySelectorAll('.fill-primary');
      expect(filledStars).toHaveLength(0);
    });
  });
});

