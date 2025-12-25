/**
 * Hook React pour la réconciliation Moneroo
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  reconcileTransaction,
  reconcileTransactions,
  generateReconciliationReport,
  type ReconciliationResult,
  type ReconciliationReport,
} from '@/lib/moneroo-reconciliation';

/**
 * Hook pour réconcilier une transaction spécifique
 */
export function useReconcileTransaction() {
  return useMutation<ReconciliationResult, Error, string>({
    mutationFn: (transactionId: string) => reconcileTransaction(transactionId),
  });
}

/**
 * Hook pour réconcilier plusieurs transactions
 */
export function useReconcileTransactions() {
  return useMutation<
    ReconciliationReport,
    Error,
    { startDate?: Date; endDate?: Date; limit?: number }
  >({
    mutationFn: ({ startDate, endDate, limit }) =>
      reconcileTransactions(startDate, endDate, limit),
  });
}

/**
 * Hook pour générer un rapport de réconciliation
 */
export function useGenerateReconciliationReport() {
  return useMutation<
    ReconciliationReport,
    Error,
    { startDate?: Date; endDate?: Date }
  >({
    mutationFn: ({ startDate, endDate }) =>
      generateReconciliationReport(startDate, endDate),
  });
}







