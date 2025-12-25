/**
 * Tests unitaires pour PaginationControls
 * Date : Janvier 2025
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationControls } from '../PaginationControls';

describe('PaginationControls', () => {
  const defaultProps = {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: false,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render pagination controls', () => {
    render(<PaginationControls {...defaultProps} />);
    
    expect(screen.getByText('Affichage de 1 à 20 sur 100 résultats')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display correct range for first page', () => {
    render(<PaginationControls {...defaultProps} />);
    
    expect(screen.getByText('Affichage de 1 à 20 sur 100 résultats')).toBeInTheDocument();
  });

  it('should display correct range for last page', () => {
    render(
      <PaginationControls
        {...defaultProps}
        page={5}
        hasNextPage={false}
        hasPreviousPage={true}
      />
    );
    
    expect(screen.getByText('Affichage de 81 à 100 sur 100 résultats')).toBeInTheDocument();
  });

  it('should call onPageChange when clicking next page', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        onPageChange={onPageChange}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /suivant/i });
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when clicking previous page', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        page={2}
        hasPreviousPage={true}
        onPageChange={onPageChange}
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /précédent/i });
    fireEvent.click(prevButton);
    
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange when clicking first page', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        page={3}
        hasPreviousPage={true}
        onPageChange={onPageChange}
      />
    );
    
    const firstButton = screen.getByRole('button', { name: /première/i });
    fireEvent.click(firstButton);
    
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange when clicking last page', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        page={3}
        hasNextPage={true}
        onPageChange={onPageChange}
      />
    );
    
    const lastButton = screen.getByRole('button', { name: /dernière/i });
    fireEvent.click(lastButton);
    
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('should call onPageChange when clicking page number', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        page={1}
        onPageChange={onPageChange}
      />
    );
    
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageSizeChange when changing page size', () => {
    const onPageSizeChange = vi.fn();
    render(
      <PaginationControls
        {...defaultProps}
        onPageSizeChange={onPageSizeChange}
      />
    );
    
    const pageSizeSelect = screen.getByRole('combobox');
    fireEvent.click(pageSizeSelect);
    
    const option50 = screen.getByText('50');
    fireEvent.click(option50);
    
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('should disable previous buttons on first page', () => {
    render(
      <PaginationControls
        {...defaultProps}
        page={1}
        hasPreviousPage={false}
      />
    );
    
    const prevButton = screen.getByRole('button', { name: /précédent/i });
    const firstButton = screen.getByRole('button', { name: /première/i });
    
    expect(prevButton).toBeDisabled();
    expect(firstButton).toBeDisabled();
  });

  it('should disable next buttons on last page', () => {
    render(
      <PaginationControls
        {...defaultProps}
        page={5}
        hasNextPage={false}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /suivant/i });
    const lastButton = screen.getByRole('button', { name: /dernière/i });
    
    expect(nextButton).toBeDisabled();
    expect(lastButton).toBeDisabled();
  });

  it('should display correct page numbers (max 5 visible)', () => {
    render(
      <PaginationControls
        {...defaultProps}
        page={3}
        totalPages={10}
        hasPreviousPage={true}
        hasNextPage={true}
      />
    );
    
    // Should show pages 1, 2, 3, 4, 5
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(
      <PaginationControls
        {...defaultProps}
        page={3}
        hasPreviousPage={true}
        hasNextPage={true}
      />
    );
    
    const page3Button = screen.getByRole('button', { name: '3' });
    expect(page3Button).toHaveClass('bg-primary'); // Active page should have primary background
  });

  it('should handle zero total correctly', () => {
    render(
      <PaginationControls
        {...defaultProps}
        total={0}
        totalPages={0}
        hasNextPage={false}
        hasPreviousPage={false}
      />
    );
    
    expect(screen.getByText('Affichage de 0 à 0 sur 0 résultats')).toBeInTheDocument();
  });

  it('should handle single page correctly', () => {
    render(
      <PaginationControls
        {...defaultProps}
        total={15}
        totalPages={1}
        hasNextPage={false}
        hasPreviousPage={false}
      />
    );
    
    expect(screen.getByText('Affichage de 1 à 15 sur 15 résultats')).toBeInTheDocument();
  });
});

