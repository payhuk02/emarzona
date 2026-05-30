/**
 * Tests unitaires pour PaginationControls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginationControls } from '../PaginationControls';

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

const expectResultsText = (pattern: RegExp) => {
  expect(document.body.textContent?.replace(/\s+/g, ' ').trim()).toMatch(pattern);
};

describe('PaginationControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render pagination controls', () => {
    render(<PaginationControls {...defaultProps} />);

    expectResultsText(/Affichage de\s*1\s*à\s*20\s*sur\s*100\s*résultats/);
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('should display correct range for first page', () => {
    render(<PaginationControls {...defaultProps} />);

    expectResultsText(/Affichage de\s*1\s*à\s*20\s*sur\s*100\s*résultats/);
  });

  it('should display correct range for last page', () => {
    render(
      <PaginationControls {...defaultProps} page={5} hasNextPage={false} hasPreviousPage={true} />
    );

    expectResultsText(/Affichage de\s*81\s*à\s*100\s*sur\s*100\s*résultats/);
  });

  it('should call onPageChange when clicking next page', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Page précédente' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Première page' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Dernière page' }));

    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('should call onPageChange when clicking page number', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} page={1} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageSizeChange when changing page size', async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageSizeChange={onPageSizeChange} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: '50' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it('should disable previous buttons on first page', () => {
    render(<PaginationControls {...defaultProps} page={1} hasPreviousPage={false} />);

    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Première page' })).toBeDisabled();
  });

  it('should disable next buttons on last page', () => {
    render(<PaginationControls {...defaultProps} page={5} hasNextPage={false} />);

    expect(screen.getByRole('button', { name: 'Page suivante' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Dernière page' })).toBeDisabled();
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

    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
  });

  it('should highlight current page', () => {
    render(
      <PaginationControls {...defaultProps} page={3} hasPreviousPage={true} hasNextPage={true} />
    );

    const page3Button = screen.getByRole('button', { name: 'Page 3' });
    expect(page3Button.className).toMatch(/bg-primary/);
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

    expectResultsText(/Affichage de\s*0\s*à\s*0\s*sur\s*0\s*résultats/);
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

    expectResultsText(/Affichage de\s*1\s*à\s*15\s*sur\s*15\s*résultats/);
  });
});
