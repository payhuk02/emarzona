import type { StoreWithdrawal } from '@/types/store-withdrawals';

export function isAutoPayoutSuggestedWithdrawal(withdrawal: StoreWithdrawal): boolean {
  if (withdrawal.withdrawal_source === 'auto_payout_suggested') {
    return true;
  }
  const haystack = `${withdrawal.admin_notes ?? ''} ${withdrawal.notes ?? ''}`.toLowerCase();
  return haystack.includes('auto-payout') || haystack.includes('reversement automatique');
}

export const AUTO_PAYOUT_SUGGESTED_BADGE = 'Suggéré par le système — validation admin requise';
