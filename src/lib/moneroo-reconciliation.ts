/**
 * Service de réconciliation Moneroo
 * Compare les transactions Moneroo avec la base de données pour détecter les divergences
 */

import { supabase } from "@/integrations/supabase/client";
import { monerooClient } from "./moneroo-client";
import { logger } from './logger';
import {
  parseMonerooError,
  MonerooError,
} from "./moneroo-errors";

export interface ReconciliationResult {
  transactionId: string;
  status: 'matched' | 'mismatched' | 'missing_in_db' | 'missing_in_moneroo' | 'error';
  discrepancies?: {
    amount?: { db: number; moneroo: number };
    status?: { db: string; moneroo: string };
    currency?: { db: string; moneroo: string };
  };
  error?: string;
}

export interface ReconciliationReport {
  totalTransactions: number;
  matched: number;
  mismatched: number;
  missingInDb: number;
  missingInMoneroo: number;
  errors: number;
  results: ReconciliationResult[];
  generatedAt: string;
}

/**
 * Réconcilie une transaction spécifique avec Moneroo
 */
export async function reconcileTransaction(
  transactionId: string
): Promise<ReconciliationResult> {
  try {
    // Récupérer la transaction depuis la base de données
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (dbError || !transaction) {
      return {
        transactionId,
        status: 'missing_in_db',
        error: 'Transaction not found in database',
      };
    }

    // Vérifier que c'est une transaction Moneroo
    if (transaction.payment_provider !== 'moneroo' || !transaction.moneroo_transaction_id) {
      return {
        transactionId,
        status: 'error',
        error: 'Transaction is not a Moneroo payment',
      };
    }

    // Récupérer les détails depuis Moneroo
    let monerooPayment;
    try {
      monerooPayment = await monerooClient.getPayment(transaction.moneroo_transaction_id);
    } catch (monerooError) {
      return {
        transactionId,
        status: 'missing_in_moneroo',
        error: `Transaction not found in Moneroo: ${monerooError instanceof Error ? monerooError.message : 'Unknown error'}`,
      };
    }

    // Comparer les données
    const discrepancies: ReconciliationResult['discrepancies'] = {};
    let hasDiscrepancy = false;

    // Comparer le montant
    const dbAmount = parseFloat(transaction.amount.toString());
    const monerooAmount = parseFloat(monerooPayment.amount?.toString() || '0');
    if (Math.abs(dbAmount - monerooAmount) > 0.01) {
      discrepancies.amount = { db: dbAmount, moneroo: monerooAmount };
      hasDiscrepancy = true;
    }

    // Comparer le statut
    const dbStatus = transaction.status;
    const monerooStatus = mapMonerooStatus(monerooPayment.status);
    if (dbStatus !== monerooStatus) {
      discrepancies.status = { db: dbStatus, moneroo: monerooStatus };
      hasDiscrepancy = true;
    }

    // Comparer la devise
    const dbCurrency = transaction.currency || 'XOF';
    const monerooCurrency = monerooPayment.currency || 'XOF';
    if (dbCurrency !== monerooCurrency) {
      discrepancies.currency = { db: dbCurrency, moneroo: monerooCurrency };
      hasDiscrepancy = true;
    }

    // Si des divergences sont détectées, mettre à jour la transaction
    if (hasDiscrepancy) {
      await supabase
        .from('transactions')
        .update({
          status: monerooStatus,
          amount: monerooAmount,
          currency: monerooCurrency,
          moneroo_response: monerooPayment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      // Logger la réconciliation
      await supabase.from('transaction_logs').insert({
        transaction_id: transactionId,
        event_type: 'reconciliation_mismatch',
        status: monerooStatus,
        response_data: {
          discrepancies,
          moneroo_data: monerooPayment,
        },
      });

      return {
        transactionId,
        status: 'mismatched',
        discrepancies,
      };
    }

    return {
      transactionId,
      status: 'matched',
    };
  } catch (error) {
    const monerooError = parseMonerooError(error);
    logger.error('Reconciliation error:', {
      transactionId,
      error: monerooError.message,
    });

    return {
      transactionId,
      status: 'error',
      error: monerooError.message,
    };
  }
}

/**
 * Réconcilie toutes les transactions Moneroo dans une période
 */
export async function reconcileTransactions(
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<ReconciliationReport> {
  try {
    // Construire la requête
    let query = supabase
      .from('transactions')
      .select('id, moneroo_transaction_id, status, amount, currency')
      .eq('payment_provider', 'moneroo')
      .not('moneroo_transaction_id', 'is', null)
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return {
        totalTransactions: 0,
        matched: 0,
        mismatched: 0,
        missingInDb: 0,
        missingInMoneroo: 0,
        errors: 0,
        results: [],
        generatedAt: new Date().toISOString(),
      };
    }

    // Réconcilier chaque transaction
    const results: ReconciliationResult[] = [];
    let matched = 0;
    let mismatched = 0;
    let missingInDb = 0;
    let missingInMoneroo = 0;
    let errors = 0;

    for (const transaction of transactions) {
      const result = await reconcileTransaction(transaction.id);
      results.push(result);

      switch (result.status) {
        case 'matched':
          matched++;
          break;
        case 'mismatched':
          mismatched++;
          break;
        case 'missing_in_db':
          missingInDb++;
          break;
        case 'missing_in_moneroo':
          missingInMoneroo++;
          break;
        case 'error':
          errors++;
          break;
      }

      // Petite pause pour éviter de surcharger l'API Moneroo
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      totalTransactions: transactions.length,
      matched,
      mismatched,
      missingInDb,
      missingInMoneroo,
      errors,
      results,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const monerooError = parseMonerooError(error);
    logger.error('Bulk reconciliation error:', {
      error: monerooError.message,
    });

    throw monerooError;
  }
}

/**
 * Mappe le statut Moneroo vers le statut interne
 */
function mapMonerooStatus(monerooStatus: string): string {
  const statusMap: Record<string, string> = {
    'completed': 'completed',
    'success': 'completed',
    'failed': 'failed',
    'pending': 'processing',
    'processing': 'processing',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
  };

  return statusMap[monerooStatus?.toLowerCase()] || 'processing';
}

/**
 * Génère un rapport de réconciliation et le sauvegarde
 */
export async function generateReconciliationReport(
  startDate?: Date,
  endDate?: Date
): Promise<ReconciliationReport> {
  const report = await reconcileTransactions(startDate, endDate);

  // Sauvegarder le rapport (optionnel - peut être stocké dans une table dédiée)
  logger.log('Reconciliation report generated:', {
    totalTransactions: report.totalTransactions,
    matched: report.matched,
    mismatched: report.mismatched,
    generatedAt: report.generatedAt,
  });

  return report;
}







