import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WithdrawalsList } from '../WithdrawalsList';
import { StoreWithdrawal, StoreWithdrawalStatus } from '@/types/store-withdrawals';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/hooks/use-toast');
vi.mock('@/lib/withdrawal-export', () => ({
  downloadWithdrawalsCSV: vi.fn(),
  downloadWithdrawalsJSON: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const mockToast = vi.fn();
(useToast as any).mockReturnValue({ toast: mockToast });

const  mockWithdrawals: StoreWithdrawal[] = [
  {
    id: '1',
    store_id: 'store-1',
    amount: 10000,
    currency: 'XOF',
    payment_method: 'mobile_money',
    payment_details: { phone: '+22670123456', operator: 'orange_money' },
    status: 'pending',
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejection_reason: null,
    processed_at: null,
    processed_by: null,
    transaction_reference: null,
    proof_url: null,
    failed_at: null,
    failure_reason: null,
    notes: null,
    admin_notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    store_id: 'store-1',
    amount: 20000,
    currency: 'XOF',
    payment_method: 'bank_transfer',
    payment_details: { account_number: '123456', bank_name: 'Bank' },
    status: 'completed',
    approved_at: '2025-01-02T00:00:00Z',
    approved_by: 'admin-1',
    rejected_at: null,
    rejection_reason: null,
    processed_at: '2025-01-02T01:00:00Z',
    processed_by: 'admin-1',
    transaction_reference: 'TXN-123',
    proof_url: null,
    failed_at: null,
    failure_reason: null,
    notes: null,
    admin_notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T01:00:00Z',
  },
];

describe('WithdrawalsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    render(<WithdrawalsList withdrawals={[]} loading={true} />);
    expect(screen.getByText(/historique des retraits/i)).toBeInTheDocument();
  });

  it('should render withdrawals list', () => {
    render(<WithdrawalsList withdrawals={mockWithdrawals} loading={false} />);
    expect(screen.getByText(/historique des retraits/i)).toBeInTheDocument();
    expect(screen.getByText(/10[,\s\u202F]?000/i)).toBeInTheDocument();
    expect(screen.getByText(/20[,\s\u202F]?000/i)).toBeInTheDocument();
  });

  it('should filter withdrawals by status', async () => {
    render(<WithdrawalsList withdrawals={mockWithdrawals} loading={false} />);
    
    // Find and click the status filter
    const filterSelect = screen.getByRole('combobox');
    fireEvent.click(filterSelect);
    
    // Select "completed" status
    const completedOption = screen.getByText(/complété/i);
    fireEvent.click(completedOption);
    
    await waitFor(() => {
      expect(screen.getByText(/20[,\s\u202F]?000/i)).toBeInTheDocument();
      expect(screen.queryByText(/10[,\s\u202F]?000/i)).not.toBeInTheDocument();
    });
  });

  it('should display correct status badges', () => {
    render(<WithdrawalsList withdrawals={mockWithdrawals} loading={false} />);
    
    expect(screen.getByText(/en attente/i)).toBeInTheDocument();
    expect(screen.getByText(/complété/i)).toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const manyWithdrawals = Array.from({ length: 25 }, (_, i) => ({
      ...mockWithdrawals[0],
      id: `withdrawal-${i}`,
      amount: (i + 1) * 1000,
    }));
    
    render(<WithdrawalsList withdrawals={manyWithdrawals} loading={false} />);
    
    // Should show first page (10 items)
    expect(screen.getByText(/1[,\s\u202F]?000/i)).toBeInTheDocument();
    expect(screen.getByText(/10[,\s\u202F]?000/i)).toBeInTheDocument();
    
    // Click next page
    const nextButton = screen.getByLabelText(/suivant/i);
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/11[,\s\u202F]?000/i)).toBeInTheDocument();
    });
  });

  it('should export to CSV', async () => {
    const { downloadWithdrawalsCSV } = await import('@/lib/withdrawal-export');
    
    render(<WithdrawalsList withdrawals={mockWithdrawals} loading={false} showExport={true} />);
    
    const exportButton = screen.getByText(/exporter en csv/i);
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(downloadWithdrawalsCSV).toHaveBeenCalledWith(mockWithdrawals);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Export réussi',
        })
      );
    });
  });

  it('should export to JSON', async () => {
    const { downloadWithdrawalsJSON } = await import('@/lib/withdrawal-export');
    
    render(<WithdrawalsList withdrawals={mockWithdrawals} loading={false} showExport={true} />);
    
    const exportButton = screen.getByText(/exporter en json/i);
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(downloadWithdrawalsJSON).toHaveBeenCalledWith(mockWithdrawals);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Export réussi',
        })
      );
    });
  });

  it('should handle export errors', async () => {
    const { downloadWithdrawalsCSV } = await import('@/lib/withdrawal-export');
    (downloadWithdrawalsCSV as any).mockImplementation(() => {
      throw new Error('Export failed');
    });
    
    render(<WithdrawalsList withdrawals={mockWithdrawals} loading={false} showExport={true} />);
    
    const exportButton = screen.getByText(/exporter en csv/i);
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur',
          variant: 'destructive',
        })
      );
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn().mockResolvedValue(undefined);
    
    render(
      <WithdrawalsList 
        withdrawals={mockWithdrawals} 
        loading={false} 
        onCancel={onCancel}
      />
    );
    
    // Find cancel button for pending withdrawal
    const cancelButtons = screen.getAllByText(/annuler/i);
    fireEvent.click(cancelButtons[0]);
    
    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledWith('1');
    });
  });

  it('should display empty state when no withdrawals', () => {
    render(<WithdrawalsList withdrawals={[]} loading={false} />);
    expect(screen.getByText(/historique des retraits/i)).toBeInTheDocument();
  });
});











