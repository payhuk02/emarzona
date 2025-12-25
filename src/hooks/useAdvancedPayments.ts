import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  AdvancedPayment,
  PaymentType,
  PaymentStatus,
  PaymentOptions,
  PercentagePaymentOptions,
  SecuredPaymentOptions,
  PaymentResponse,
  PaymentFilters,
  PaymentStats,
} from '@/types/advanced-features';

export const useAdvancedPayments = (
  storeId?: string,
  filters?: PaymentFilters,
  pagination?: { page?: number; pageSize?: number }
) => {
  const [payments, setPayments] = useState<AdvancedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 50;

  // Fonction pour normaliser une transaction Moneroo en AdvancedPayment
  const normalizeTransaction = useCallback(
    async (
      transaction: {
        id: string;
        store_id: string;
        order_id?: string | null;
        customer_id?: string | null;
        customer_name?: string | null;
        customer_email?: string | null;
        moneroo_payment_method?: string | null;
        amount: number | null;
        currency?: string | null;
        status?: string | null;
        metadata?: Record<string, unknown> | null;
        moneroo_transaction_id?: string | null;
        error_message?: string | null;
        created_at: string;
        updated_at: string;
      },
      storeId: string
    ): Promise<AdvancedPayment> => {
      // Déterminer le payment_type depuis metadata ou par défaut 'full'
      let paymentType: PaymentType = 'full';
      if (transaction.metadata && typeof transaction.metadata === 'object') {
        const metadata = transaction.metadata as Record<string, unknown>;
        if (metadata.payment_type) {
          paymentType = metadata.payment_type as PaymentType;
        }
      }

      // Déterminer le statut (mapper les statuts transactions vers PaymentStatus)
      let status: PaymentStatus = 'pending';
      const transactionStatus = transaction.status?.toLowerCase();
      if (transactionStatus === 'completed' || transactionStatus === 'success') {
        status = 'completed';
      } else if (transactionStatus === 'failed' || transactionStatus === 'error') {
        status = 'failed';
      } else if (transactionStatus === 'pending' || transactionStatus === 'processing') {
        status = 'pending';
      }

      // Récupérer les informations customer si customer_id existe
      let customerData = null;
      if (transaction.customer_id) {
        try {
          const { data } = await supabase
            .from('customers')
            .select('name, email, full_name')
            .eq('id', transaction.customer_id)
            .eq('store_id', storeId)
            .single();
          if (data) {
            customerData = {
              name: data.name || data.full_name || transaction.customer_name || 'N/A',
              email: data.email || transaction.customer_email || undefined,
            };
          }
        } catch (customerError) {
          logger.warn('Error fetching customer for transaction', {
            transactionId: transaction.id,
            customerId: transaction.customer_id,
            error: customerError,
          });
        }
      }

      // Si pas de customerData, utiliser les données de la transaction
      if (!customerData) {
        customerData = {
          name: transaction.customer_name || 'N/A',
          email: transaction.customer_email || undefined,
        };
      }

      // Récupérer order_number si order_id existe
      let orderData = null;
      if (transaction.order_id) {
        try {
          const { data, error: orderError } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', transaction.order_id)
            .eq('store_id', storeId)
            .single();

          // 🔧 AMÉLIORATION: Gestion spécifique des erreurs Supabase
          if (orderError) {
            const errorCode = orderError.code;
            const errorMessage = orderError.message || '';

            // Ignorer les erreurs non-critiques (table absente, RLS, etc.)
            if (
              errorCode === '42P01' ||
              errorCode === 'PGRST116' ||
              errorCode === '400' ||
              errorCode === '42501' ||
              errorCode === '403' ||
              errorMessage.includes('does not exist') ||
              errorMessage.includes('Bad Request') ||
              errorMessage.includes('permission denied') ||
              errorMessage.includes('RLS')
            ) {
              // Erreur non-critique, on continue sans order_number
              logger.debug('Order non accessible pour transaction (non-critique)', {
                transactionId: transaction.id,
                orderId: transaction.order_id,
                code: errorCode,
              });
            } else {
              // Autre erreur - logger mais continuer
              logger.warn('Error fetching order for transaction', {
                transactionId: transaction.id,
                orderId: transaction.order_id,
                error: orderError,
              });
            }
          } else if (data) {
            orderData = {
              order_number: data.order_number,
            };
          }
          // Si pas de data, orderData reste null (sera converti en undefined plus tard)
        } catch (orderError: unknown) {
          // Catch pour les exceptions non-Supabase
          const errorMessage =
            orderError instanceof Error ? orderError.message : String(orderError);
          logger.warn('Exception lors de la récupération de order pour transaction', {
            transactionId: transaction.id,
            orderId: transaction.order_id,
            error: errorMessage,
          });
        }
      }

      return {
        id: transaction.id,
        store_id: transaction.store_id,
        order_id: transaction.order_id ? transaction.order_id : undefined,
        customer_id: transaction.customer_id ? transaction.customer_id : undefined,
        payment_method: transaction.moneroo_payment_method || 'moneroo',
        amount: Number(transaction.amount || 0),
        currency: transaction.currency || 'XOF',
        status,
        payment_type: paymentType,
        transaction_id: transaction.moneroo_transaction_id || transaction.id,
        notes: transaction.error_message || undefined,
        customers: customerData,
        orders: orderData || undefined,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      };
    },
    []
  );

  const fetchPayments = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      // 🔧 CORRECTION: Récupérer depuis payments ET transactions (Moneroo)
      // 1. Récupérer les payments (système avancé)
      let paymentsQuery = supabase
        .from('payments')
        .select(
          `
          *,
          customers (name, email),
          orders (order_number)
        `
        )
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres pour payments
      if (filters?.status) {
        paymentsQuery = paymentsQuery.eq('status', filters.status);
      }
      if (filters?.payment_type) {
        paymentsQuery = paymentsQuery.eq('payment_type', filters.payment_type);
      }
      if (filters?.payment_method) {
        paymentsQuery = paymentsQuery.eq('payment_method', filters.payment_method);
      }
      if (filters?.is_held !== undefined) {
        paymentsQuery = paymentsQuery.eq('is_held', filters.is_held);
      }
      if (filters?.date_from) {
        paymentsQuery = paymentsQuery.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        paymentsQuery = paymentsQuery.lte('created_at', filters.date_to);
      }
      if (filters?.search) {
        paymentsQuery = paymentsQuery.or(
          `transaction_id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        );
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery;

      // 2. Récupérer les transactions (Moneroo)
      let transactionsQuery = supabase
        .from('transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      // Appliquer les filtres pour transactions (mapping des statuts)
      if (filters?.status) {
        // Mapper PaymentStatus vers transaction status
        const statusMap: Record<PaymentStatus, string[]> = {
          pending: ['pending', 'processing'],
          completed: ['completed', 'success'],
          failed: ['failed', 'error'],
          refunded: ['refunded'],
          held: ['held'],
          released: ['released'],
          disputed: ['disputed'],
        };
        const transactionStatuses = statusMap[filters.status] || [filters.status];
        transactionsQuery = transactionsQuery.in('status', transactionStatuses);
      }
      if (filters?.date_from) {
        transactionsQuery = transactionsQuery.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        transactionsQuery = transactionsQuery.lte('created_at', filters.date_to);
      }
      if (filters?.search) {
        transactionsQuery = transactionsQuery.or(
          `moneroo_transaction_id.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,error_message.ilike.%${filters.search}%`
        );
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;

      if (paymentsError) {
        logger.error('Error fetching payments:', paymentsError);
      }
      if (transactionsError) {
        logger.error('Error fetching transactions:', transactionsError);
      }

      // 3. Normaliser les transactions en AdvancedPayment
      const normalizedTransactions = await Promise.all(
        (transactionsData || []).map(transaction => normalizeTransaction(transaction, storeId))
      );

      // 4. Fusionner payments et transactions normalisées
      // Éviter les doublons (si un payment a le même order_id qu'une transaction)
      const allPayments: AdvancedPayment[] = [];
      const processedOrderIds = new Set<string>();

      // D'abord ajouter les payments (convertir null en undefined et s'assurer que status est PaymentStatus)
      (paymentsData || []).forEach(payment => {
        const normalizedPayment: AdvancedPayment = {
          ...payment,
          order_id: payment.order_id ? payment.order_id : undefined,
          customer_id: payment.customer_id ? payment.customer_id : undefined,
          transaction_id: payment.transaction_id ? payment.transaction_id : undefined,
          notes: payment.notes ? payment.notes : undefined,
          status: payment.status as PaymentStatus, // Type assertion car Supabase retourne string
          payment_type: (payment.payment_type as PaymentType) || 'full', // Type assertion car Supabase retourne string
          percentage_amount: payment.percentage_amount ?? undefined,
          percentage_rate: payment.percentage_rate ?? undefined,
          remaining_amount: payment.remaining_amount ?? undefined,
          is_held: payment.is_held ?? undefined,
        } as AdvancedPayment;
        allPayments.push(normalizedPayment);
        if (normalizedPayment.order_id) {
          processedOrderIds.add(normalizedPayment.order_id);
        }
      });

      // Ensuite ajouter les transactions qui n'ont pas déjà un payment associé
      normalizedTransactions.forEach(transaction => {
        if (!transaction.order_id || !processedOrderIds.has(transaction.order_id)) {
          allPayments.push(transaction);
          if (transaction.order_id) {
            processedOrderIds.add(transaction.order_id);
          }
        }
      });

      // Trier par date de création (plus récent en premier)
      allPayments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // 🔧 PAGINATION: Appliquer la pagination après fusion et tri
      setTotalCount(allPayments.length);
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedPayments = allPayments.slice(from, to);

      setPayments(paginatedPayments);
      setError(null);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      logger.error('Error fetching advanced payments:', { error: err.message, storeId });
      // Ne pas afficher de toast pour les erreurs de connexion réseau (sera géré par la page)
      const isConnectionError =
        err.message.includes('upstream connect error') ||
        err.message.includes('connection timeout') ||
        err.message.includes('disconnect/reset') ||
        err.message.includes('network') ||
        err.message.includes('fetch failed');

      if (!isConnectionError) {
        toast({
          title: 'Erreur',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [storeId, filters, toast, normalizeTransaction, page, pageSize]);

  const fetchStats = useCallback(async () => {
    if (!storeId) return;

    try {
      // 🔧 OPTIMISATION: Récupérer depuis payments ET transactions en parallèle
      // Utiliser Promise.allSettled pour gérer les erreurs gracieusement
      const [
        paymentsTotalResult,
        paymentsCompletedResult,
        paymentsPendingResult,
        paymentsFailedResult,
        paymentsHeldResult,
        paymentsAmountResult,
        paymentsHeldAmountResult,
        paymentsPercentageResult,
        paymentsSecuredResult,
        // Transactions (Moneroo)
        transactionsTotalResult,
        transactionsCompletedResult,
        transactionsPendingResult,
        transactionsFailedResult,
        transactionsAmountResult,
      ] = await Promise.allSettled([
        // Payments - Totaux
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('status', 'completed'),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('status', 'pending'),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('status', 'failed'),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('is_held', true),
        supabase
          .from('payments')
          .select('amount')
          .eq('store_id', storeId)
          .eq('status', 'completed'),
        supabase.from('payments').select('amount').eq('store_id', storeId).eq('is_held', true),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('payment_type', 'percentage'),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('payment_type', 'delivery_secured'),
        // Transactions (Moneroo) - Totaux
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId),
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .in('status', ['completed', 'success']),
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .in('status', ['pending', 'processing']),
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .in('status', ['failed', 'error']),
        supabase
          .from('transactions')
          .select('amount')
          .eq('store_id', storeId)
          .in('status', ['completed', 'success']),
      ]);

      // Extraire les comptes depuis payments
      const paymentsTotal =
        paymentsTotalResult.status === 'fulfilled' && paymentsTotalResult.value.count !== null
          ? paymentsTotalResult.value.count
          : 0;
      const paymentsCompleted =
        paymentsCompletedResult.status === 'fulfilled' &&
        paymentsCompletedResult.value.count !== null
          ? paymentsCompletedResult.value.count
          : 0;
      const paymentsPending =
        paymentsPendingResult.status === 'fulfilled' && paymentsPendingResult.value.count !== null
          ? paymentsPendingResult.value.count
          : 0;
      const paymentsFailed =
        paymentsFailedResult.status === 'fulfilled' && paymentsFailedResult.value.count !== null
          ? paymentsFailedResult.value.count
          : 0;
      const paymentsHeld =
        paymentsHeldResult.status === 'fulfilled' && paymentsHeldResult.value.count !== null
          ? paymentsHeldResult.value.count
          : 0;
      const paymentsAmounts =
        paymentsAmountResult.status === 'fulfilled' && paymentsAmountResult.value.data
          ? paymentsAmountResult.value.data.map((p: { amount: number }) => p.amount)
          : [];
      const paymentsHeldAmounts =
        paymentsHeldAmountResult.status === 'fulfilled' && paymentsHeldAmountResult.value.data
          ? paymentsHeldAmountResult.value.data.map((p: { amount: number }) => p.amount)
          : [];
      const paymentsPercentage =
        paymentsPercentageResult.status === 'fulfilled' &&
        paymentsPercentageResult.value.count !== null
          ? paymentsPercentageResult.value.count
          : 0;
      const paymentsSecured =
        paymentsSecuredResult.status === 'fulfilled' && paymentsSecuredResult.value.count !== null
          ? paymentsSecuredResult.value.count
          : 0;

      // Extraire les comptes depuis transactions (Moneroo)
      const transactionsTotal =
        transactionsTotalResult.status === 'fulfilled' &&
        transactionsTotalResult.value.count !== null
          ? transactionsTotalResult.value.count
          : 0;
      const transactionsCompleted =
        transactionsCompletedResult.status === 'fulfilled' &&
        transactionsCompletedResult.value.count !== null
          ? transactionsCompletedResult.value.count
          : 0;
      const transactionsPending =
        transactionsPendingResult.status === 'fulfilled' &&
        transactionsPendingResult.value.count !== null
          ? transactionsPendingResult.value.count
          : 0;
      const transactionsFailed =
        transactionsFailedResult.status === 'fulfilled' &&
        transactionsFailedResult.value.count !== null
          ? transactionsFailedResult.value.count
          : 0;
      const transactionsAmounts =
        transactionsAmountResult.status === 'fulfilled' && transactionsAmountResult.value.data
          ? transactionsAmountResult.value.data
              .map((t: { amount: number | null }) => t.amount)
              .filter(
                (amount: number | null): amount is number => amount !== null && amount !== undefined
              )
          : [];

      // Fusionner les statistiques (éviter les doublons si un payment et une transaction ont le même order_id)
      // Pour simplifier, on additionne les totaux (les doublons seront minimes)
      const totalPayments = paymentsTotal + transactionsTotal;
      const completedPayments = paymentsCompleted + transactionsCompleted;
      const pendingPayments = paymentsPending + transactionsPending;
      const failedPayments = paymentsFailed + transactionsFailed;
      const heldPayments = paymentsHeld; // Seulement depuis payments (transactions n'ont pas is_held)

      // Fusionner les revenus
      const allAmounts = [...paymentsAmounts, ...transactionsAmounts];
      const totalRevenue = allAmounts.reduce(
        (sum, amount) => sum + parseFloat(amount.toString()),
        0
      );
      const averagePayment = allAmounts.length > 0 ? totalRevenue / allAmounts.length : 0;
      const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

      // Revenus retenus (seulement depuis payments)
      const heldRevenue = paymentsHeldAmounts.reduce(
        (sum, amount) => sum + parseFloat(amount.toString()),
        0
      );

      // Paiements par type (seulement depuis payments pour l'instant)
      // Note: Les transactions Moneroo sont généralement de type 'full'
      const percentagePayments = paymentsPercentage;
      const securedPayments = paymentsSecured;

      setStats({
        total_payments: totalPayments,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        failed_payments: failedPayments,
        held_payments: heldPayments,
        total_revenue: totalRevenue,
        held_revenue: heldRevenue,
        average_payment: averagePayment,
        success_rate: successRate,
        percentage_payments: percentagePayments,
        secured_payments: securedPayments,
      });
      setError(null);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      logger.error('Error fetching payment stats:', { error: err.message, storeId });
    }
  }, [storeId]);

  // Créer un paiement standard
  const createPayment = async (options: PaymentOptions): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            store_id: options.storeId,
            order_id: options.orderId || null,
            customer_id: options.customerId || null,
            payment_method: options.paymentMethod || 'mobile_money',
            amount: options.amount,
            currency: options.currency || 'XOF',
            status: 'pending',
            payment_type: options.paymentType || 'full',
            transaction_id: options.transactionId || null,
            notes: options.notes || null,
            metadata: options.metadata as unknown, // Type assertion pour Json
          },
        ] as unknown)
        .select()
        .limit(1);

      if (error) throw error;

      await fetchPayments();
      await fetchStats();

      return {
        success: true,
        data:
          data && data.length > 0
            ? ({
                ...data[0],
                order_id: data[0].order_id ? data[0].order_id : undefined,
                customer_id: data[0].customer_id ? data[0].customer_id : undefined,
              } as AdvancedPayment)
            : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating payment:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Créer un paiement par pourcentage
  const createPercentagePayment = async (
    options: PercentagePaymentOptions
  ): Promise<PaymentResponse> => {
    try {
      const percentageAmount = options.amount * (options.percentageRate / 100);

      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            store_id: options.storeId,
            order_id: options.orderId,
            customer_id: options.customerId,
            payment_method: options.paymentMethod || 'mobile_money',
            amount: percentageAmount,
            currency: options.currency || 'XOF',
            status: 'completed',
            payment_type: 'percentage',
            percentage_amount: percentageAmount,
            percentage_rate: options.percentageRate,
            remaining_amount: options.remainingAmount,
            transaction_id: options.transactionId,
            notes: options.notes,
            metadata: options.metadata,
          },
        ])
        .select()
        .limit(1);

      if (error) throw error;

      // Créer un paiement partiel (si la table existe)
      if (options.orderId) {
        try {
          await supabase
            .from('partial_payments' as unknown as 'payments') // Type assertion car table peut ne pas exister
            .insert([
              {
                order_id: options.orderId,
                payment_id: data[0].id,
                amount: percentageAmount,
                percentage: options.percentageRate,
                status: 'completed',
                payment_method: options.paymentMethod || 'mobile_money',
                transaction_id: options.transactionId || undefined,
              },
            ]);
        } catch (partialError) {
          // Ignorer si la table n'existe pas
          logger.debug("Table partial_payments n'existe pas ou erreur non-critique", {
            error: partialError,
          });
        }
      }

      await fetchPayments();
      await fetchStats();

      return {
        success: true,
        data:
          data && data.length > 0
            ? ({
                ...data[0],
                order_id: data[0].order_id ? data[0].order_id : undefined,
                customer_id: data[0].customer_id ? data[0].customer_id : undefined,
              } as AdvancedPayment)
            : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating percentage payment:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Créer un paiement sécurisé (à la livraison)
  const createSecuredPayment = async (options: SecuredPaymentOptions): Promise<PaymentResponse> => {
    try {
      const paymentData: Record<string, unknown> = {
        store_id: options.storeId,
        order_id: options.orderId || null,
        customer_id: options.customerId || null,
        payment_method: options.paymentMethod || 'mobile_money',
        amount: options.amount,
        currency: options.currency || 'XOF',
        status: 'held',
        payment_type: 'delivery_secured',
        is_held: true,
        held_until: options.heldUntil || null,
        release_conditions: options.releaseConditions,
        transaction_id: options.transactionId || null,
        notes: options.notes || null,
        metadata: options.metadata,
      };

      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .limit(1);

      if (error) throw error;

      // Créer un paiement sécurisé (si la table existe)
      if (options.orderId) {
        try {
          await supabase
            .from('secured_payments' as unknown as 'payments') // Type assertion car table peut ne pas exister
            .insert([
              {
                order_id: options.orderId,
                payment_id: data[0].id,
                total_amount: options.amount,
                held_amount: options.amount,
                status: 'held',
                hold_reason: options.holdReason,
                release_conditions: options.releaseConditions as unknown, // Type assertion pour Json
                held_until: options.heldUntil || undefined,
              },
            ]);
        } catch (securedError) {
          // Ignorer si la table n'existe pas
          logger.debug("Table secured_payments n'existe pas ou erreur non-critique", {
            error: securedError,
          });
        }
      }

      await fetchPayments();
      await fetchStats();

      return {
        success: true,
        data:
          data && data.length > 0
            ? ({
                ...data[0],
                order_id: data[0].order_id ? data[0].order_id : undefined,
                customer_id: data[0].customer_id ? data[0].customer_id : undefined,
              } as AdvancedPayment)
            : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating secured payment:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Libérer un paiement retenu
  const releasePayment = async (
    paymentId: string,
    releasedBy: string
  ): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'released',
          is_held: false,
          delivery_confirmed_at: new Date().toISOString(),
          delivery_confirmed_by: releasedBy,
        })
        .eq('id', paymentId)
        .select()
        .limit(1);

      if (error) throw error;

      // Mettre à jour le paiement sécurisé
      await supabase
        .from('secured_payments')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_by: releasedBy,
        })
        .eq('payment_id', paymentId);

      await fetchPayments();
      await fetchStats();

      toast({
        title: 'Succès',
        description: 'Paiement libéré avec succès',
      });

      return {
        success: true,
        data:
          data && data.length > 0
            ? ({
                ...data[0],
                order_id: data[0].order_id ? data[0].order_id : undefined,
                customer_id: data[0].customer_id ? data[0].customer_id : undefined,
              } as AdvancedPayment)
            : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error releasing payment:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Ouvrir un litige
  const openDispute = async (
    paymentId: string,
    reason: string,
    description: string
  ): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'disputed',
          dispute_opened_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select()
        .limit(1);

      if (error) throw error;

      // Créer un litige (si order_id existe)
      if (data[0].order_id) {
        try {
          await supabase.from('disputes').insert([
            {
              order_id: data[0].order_id,
              initiator_id: data[0].customer_id || '',
              initiator_type: 'customer',
              subject: reason,
              description,
              status: 'open',
            },
          ]);
        } catch (disputeError) {
          // Logger mais continuer (non-critique)
          logger.warn('Error creating dispute (non-critical)', { error: disputeError });
        }
      }

      await fetchPayments();
      await fetchStats();

      toast({
        title: 'Litige ouvert',
        description: 'Un litige a été ouvert pour ce paiement',
      });

      return {
        success: true,
        data:
          data && data.length > 0
            ? ({
                ...data[0],
                order_id: data[0].order_id ? data[0].order_id : undefined,
                customer_id: data[0].customer_id ? data[0].customer_id : undefined,
              } as AdvancedPayment)
            : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error opening dispute:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Mettre à jour un paiement
  const updatePayment = async (
    id: string,
    updates: Partial<AdvancedPayment>
  ): Promise<PaymentResponse> => {
    try {
      // Convertir les types pour Supabase (null -> undefined, Record -> Json)
      const supabaseUpdates: Record<string, unknown> = {
        ...updates,
        order_id: updates.order_id !== undefined ? updates.order_id || null : undefined,
        customer_id: updates.customer_id !== undefined ? updates.customer_id || null : undefined,
        release_conditions: updates.release_conditions
          ? (updates.release_conditions as unknown)
          : undefined,
      };

      const { data, error } = await supabase
        .from('payments')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .limit(1);

      if (error) throw error;

      await fetchPayments();
      await fetchStats();

      return {
        success: true,
        data:
          data && data.length > 0
            ? ({
                ...data[0],
                order_id: data[0].order_id ? data[0].order_id : undefined,
                customer_id: data[0].customer_id ? data[0].customer_id : undefined,
              } as AdvancedPayment)
            : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating payment:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Supprimer un paiement
  const deletePayment = async (id: string): Promise<PaymentResponse> => {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);

      if (error) throw error;

      await fetchPayments();
      await fetchStats();

      toast({
        title: 'Succès',
        description: 'Paiement supprimé avec succès',
      });

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting payment:', { error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();

    // Subscribe to realtime updates pour payments ET transactions
    const paymentsChannel = supabase
      .channel('advanced-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: storeId ? `store_id=eq.${storeId}` : undefined,
        },
        () => {
          fetchPayments();
          fetchStats();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('advanced-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: storeId ? `store_id=eq.${storeId}` : undefined,
        },
        () => {
          fetchPayments();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [fetchPayments, fetchStats]);

  return {
    payments,
    loading,
    stats,
    error,
    totalCount,
    refetch: fetchPayments,
    createPayment,
    createPercentagePayment,
    createSecuredPayment,
    releasePayment,
    openDispute,
    updatePayment,
    deletePayment,
  };
};
