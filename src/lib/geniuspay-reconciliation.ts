/**
 * Réconciliation transactions plateforme (MoneyFusion + GeniusPay legacy).
 */

import { supabase } from '@/integrations/supabase/client';
import { geniuspayClient } from './geniuspay-client';
import { logger } from './logger';
import { parseGeniusPayError } from './geniuspay-errors';
import {
  isMoneyFusionProvider,
  isPlatformCheckoutProvider,
  PLATFORM_CHECKOUT_PROVIDERS,
  resolveExternalPaymentId,
} from '@/lib/payments/platform-payment-providers';

export interface ReconciliationResult {
  transactionId: string;
  status: 'matched' | 'mismatched' | 'missing_in_db' | 'missing_in_geniuspay' | 'error';
  discrepancies?: {
    amount?: { db: number; provider: number; geniuspay?: number };
    status?: { db: string; provider: string; geniuspay?: string };
    currency?: { db: string; provider: string; geniuspay?: string };
  };
  error?: string;
}

export interface ReconciliationReport {
  totalTransactions: number;
  matched: number;
  mismatched: number;
  missingInDb: number;
  missingInGeniusPay: number;
  errors: number;
  results: ReconciliationResult[];
  generatedAt: string;
}

type PspSnapshot = {
  amount: number;
  status: string;
  currency: string;
  raw: Record<string, unknown>;
};

function mapPspStatus(status: string): string {
  const statusMap: Record<string, string> = {
    completed: 'completed',
    success: 'completed',
    paid: 'completed',
    failed: 'failed',
    failure: 'failed',
    pending: 'processing',
    processing: 'processing',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    'no paid': 'cancelled',
    refunded: 'refunded',
  };
  return statusMap[status?.toLowerCase()] || 'processing';
}

async function fetchMoneyFusionSnapshot(token: string): Promise<PspSnapshot> {
  const { data, error } = await supabase.functions.invoke('moneyfusion', {
    body: { action: 'verify_payment', data: { paymentId: token, token } },
  });
  if (error) {
    throw new Error(error.message || 'MoneyFusion verify failed');
  }
  const payload = (data || {}) as Record<string, unknown>;
  if (payload.error || payload.success === false) {
    throw new Error(String(payload.reason || payload.message || payload.error || 'verify failed'));
  }
  // Nouveau shape sync : data.statut = completed|processing|…
  // Ancien shape MF : data.data.statut = paid|pending|…
  const outer = (payload.data || payload) as Record<string, unknown>;
  const nested =
    outer.data && typeof outer.data === 'object' ? (outer.data as Record<string, unknown>) : null;
  const inner = nested || outer;
  const statut = String(inner.statut ?? inner.status ?? outer.statut ?? '')
    .toLowerCase()
    .trim();
  const amountRaw = inner.Montant ?? inner.montant ?? inner.amount ?? 0;
  const feesRaw = inner.frais ?? inner.fee ?? 0;
  const base = typeof amountRaw === 'string' ? parseFloat(amountRaw) : Number(amountRaw) || 0;
  const fees = typeof feesRaw === 'string' ? parseFloat(feesRaw) : Number(feesRaw) || 0;
  const currency = String(inner.currency ?? inner.devise ?? 'XOF');
  return {
    amount: base + fees,
    status: mapPspStatus(statut),
    currency,
    raw: inner,
  };
}

async function fetchGeniusPaySnapshot(paymentId: string): Promise<PspSnapshot> {
  const payment = await geniuspayClient.getPayment(paymentId);
  return {
    amount: parseFloat(payment.amount?.toString() || '0'),
    status: mapPspStatus(String(payment.status || '')),
    currency: payment.currency || 'XOF',
    raw: payment as unknown as Record<string, unknown>,
  };
}

/**
 * Réconcilie une transaction avec son PSP (MoneyFusion ou GeniusPay).
 */
export async function reconcileTransaction(transactionId: string): Promise<ReconciliationResult> {
  try {
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .select(
        'id,payment_provider,payment_id,geniuspay_transaction_id,status,amount,currency,order_id,geniuspay_response,updated_at'
      )
      .eq('id', transactionId)
      .single();

    if (dbError || !transaction) {
      return {
        transactionId,
        status: 'missing_in_db',
        error: 'Transaction not found in database',
      };
    }

    if (!isPlatformCheckoutProvider(transaction.payment_provider)) {
      return {
        transactionId,
        status: 'error',
        error: `Provider non supporté pour la réconciliation: ${transaction.payment_provider || 'unknown'}`,
      };
    }

    const externalId = resolveExternalPaymentId(transaction);
    if (!externalId) {
      return {
        transactionId,
        status: 'error',
        error: 'Identifiant paiement PSP manquant (payment_id / geniuspay_transaction_id)',
      };
    }

    let psp: PspSnapshot;
    try {
      psp = isMoneyFusionProvider(transaction.payment_provider)
        ? await fetchMoneyFusionSnapshot(externalId)
        : await fetchGeniusPaySnapshot(externalId);
    } catch (pspError) {
      return {
        transactionId,
        status: 'missing_in_geniuspay',
        error: `Transaction introuvable côté PSP: ${
          pspError instanceof Error ? pspError.message : 'Unknown error'
        }`,
      };
    }

    const discrepancies: ReconciliationResult['discrepancies'] = {};
    let hasDiscrepancy = false;

    const dbAmount = parseFloat(transaction.amount.toString());
    if (Math.abs(dbAmount - psp.amount) > 0.01) {
      discrepancies.amount = { db: dbAmount, provider: psp.amount, geniuspay: psp.amount };
      hasDiscrepancy = true;
    }

    const dbStatus = transaction.status;
    if (dbStatus !== psp.status) {
      discrepancies.status = { db: dbStatus, provider: psp.status, geniuspay: psp.status };
      hasDiscrepancy = true;
    }

    const dbCurrency = transaction.currency || 'XOF';
    if (dbCurrency !== psp.currency) {
      discrepancies.currency = {
        db: dbCurrency,
        provider: psp.currency,
        geniuspay: psp.currency,
      };
      hasDiscrepancy = true;
    }

    if (hasDiscrepancy) {
      await supabase
        .from('transactions')
        .update({
          status: psp.status,
          amount: psp.amount,
          currency: psp.currency,
          geniuspay_response: psp.raw,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      await supabase.from('transaction_logs').insert({
        transaction_id: transactionId,
        event_type: 'reconciliation_mismatch',
        status: psp.status,
        response_data: {
          discrepancies,
          provider: transaction.payment_provider,
          psp_data: psp.raw,
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
    const parsed = parseGeniusPayError(error);
    logger.error('Reconciliation error:', {
      transactionId,
      error: parsed.message,
    });

    return {
      transactionId,
      status: 'error',
      error: parsed.message,
    };
  }
}

/**
 * Réconcilie les transactions plateforme (MoneyFusion + GeniusPay) sur une période.
 */
export async function reconcileTransactions(
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<ReconciliationReport> {
  try {
    let query = supabase
      .from('transactions')
      .select(
        'id, payment_provider, payment_id, geniuspay_transaction_id, status, amount, currency'
      )
      .in('payment_provider', [...PLATFORM_CHECKOUT_PROVIDERS])
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
        missingInGeniusPay: 0,
        errors: 0,
        results: [],
        generatedAt: new Date().toISOString(),
      };
    }

    const results: ReconciliationResult[] = [];
    let matched = 0;
    let mismatched = 0;
    let missingInDb = 0;
    let missingInGeniusPay = 0;
    let errors = 0;

    for (const transaction of transactions) {
      const externalId = resolveExternalPaymentId(transaction);
      if (!externalId) {
        errors++;
        results.push({
          transactionId: transaction.id,
          status: 'error',
          error: 'Identifiant PSP manquant',
        });
        continue;
      }

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
        case 'missing_in_geniuspay':
          missingInGeniusPay++;
          break;
        case 'error':
          errors++;
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      totalTransactions: transactions.length,
      matched,
      mismatched,
      missingInDb,
      missingInGeniusPay,
      errors,
      results,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    const parsed = parseGeniusPayError(error);
    logger.error('Bulk reconciliation error:', {
      error: parsed.message,
    });
    throw parsed;
  }
}

export async function generateReconciliationReport(
  startDate?: Date,
  endDate?: Date
): Promise<ReconciliationReport> {
  const report = await reconcileTransactions(startDate, endDate);

  logger.log('Reconciliation report generated:', {
    totalTransactions: report.totalTransactions,
    matched: report.matched,
    mismatched: report.mismatched,
    generatedAt: report.generatedAt,
  });

  return report;
}
