import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

type ShippingAddress = {
  full_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  state?: string;
} | null;

export interface Payment {
  id: string;
  store_id: string;
  order_id: string | null;
  customer_id: string | null;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
  } | null;
  orders?: {
    order_number: string;
  } | null;
  // Informations depuis transactions (Moneroo)
  transaction?: {
    customer_email: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    metadata: Record<string, unknown> | null;
    shipping_address?: {
      full_name?: string;
      email?: string;
      phone?: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      postal_code?: string;
      country?: string;
      state?: string;
    } | null;
  } | null;
}

export const usePayments = (
  storeId?: string,
  searchTerm?: string,
  statusFilter?: string,
  methodFilter?: string
) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      // 🔧 CORRECTION: Récupérer depuis transactions (Moneroo) ET payments
      // Priorité aux transactions car elles contiennent plus d'informations

      // 1. Récupérer les transactions (Moneroo)
      let  transactionsQuery= supabase
        .from('transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        transactionsQuery = transactionsQuery.eq('status', statusFilter);
      }

      const { data: transactions, error: transactionsError } = await transactionsQuery;

      // 2. Récupérer les payments (système générique)
      let  paymentsQuery= supabase
        .from('payments')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        paymentsQuery = paymentsQuery.or(
          `transaction_id.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter) {
        paymentsQuery = paymentsQuery.eq('status', statusFilter);
      }

      if (methodFilter) {
        paymentsQuery = paymentsQuery.eq('payment_method', methodFilter);
      }

      const { data: paymentsData, error: paymentsError } = await paymentsQuery;

      if (transactionsError) {
        logger.error('Error fetching transactions:', transactionsError);
      }
      if (paymentsError) {
        logger.error('Error fetching payments:', paymentsError);
      }

      // 3. Convertir les transactions en format Payment et enrichir
      const transactionsAsPayments = await Promise.all(
        (transactions || []).map(async transaction => {
          // Type guard pour s'assurer que store_id existe
          if (!transaction.store_id) {
            logger.warn('Transaction sans store_id ignorée', { transactionId: transaction.id });
            return null;
          }
          // Extraire shipping_address depuis metadata
          let  shippingAddress: ShippingAddress = null;
          if (
            transaction.metadata &&
            typeof transaction.metadata === 'object' &&
            !Array.isArray(transaction.metadata)
          ) {
            const metadata = transaction.metadata as Record<string, unknown>;
            shippingAddress = (metadata.shipping_address as ShippingAddress) || null;
          }

          const  payment: Payment = {
            id: transaction.id,
            store_id: transaction.store_id,
            order_id: transaction.order_id,
            customer_id: transaction.customer_id,
            payment_method:
              (transaction as { moneroo_payment_method?: string | null }).moneroo_payment_method ||
              'moneroo',
            amount: Number(transaction.amount || 0),
            currency: transaction.currency || 'XOF',
            status: transaction.status || 'pending',
            transaction_id:
              (transaction as { moneroo_transaction_id?: string | null }).moneroo_transaction_id ||
              transaction.id,
            notes: transaction.error_message || null,
            created_at: transaction.created_at || new Date().toISOString(),
            updated_at: transaction.updated_at || new Date().toISOString(),
            transaction: {
              customer_email: transaction.customer_email,
              customer_name: transaction.customer_name,
              customer_phone: transaction.customer_phone,
              metadata: transaction.metadata as Record<string, unknown> | null,
              shipping_address: shippingAddress,
            },
          };

          // Enrichir avec les données customer si customer_id existe
          if (transaction.customer_id) {
            try {
              const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('name, email, full_name, phone, address, city, postal_code, country')
                .eq('id', transaction.customer_id)
                .eq('store_id', storeId)
                .single();

              // 🔧 AMÉLIORATION: Gestion spécifique des erreurs Supabase
              if (customerError) {
                const errorCode = customerError.code;
                const errorMessage = customerError.message || '';

                // Ignorer les erreurs non-critiques
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
                  // Erreur non-critique, utiliser les données de la transaction
                  payment.customers = {
                    name: transaction.customer_name || 'N/A',
                    email: transaction.customer_email,
                    phone: transaction.customer_phone,
                    address: shippingAddress?.address_line1 || null,
                    city: shippingAddress?.city || null,
                    postal_code: shippingAddress?.postal_code || null,
                    country: shippingAddress?.country || null,
                  };
                } else {
                  // Autre erreur - logger mais utiliser les données de la transaction
                  logger.warn('Error fetching customer for transaction', {
                    transactionId: transaction.id,
                    customerId: transaction.customer_id,
                    error: customerError,
                  });
                  payment.customers = {
                    name: transaction.customer_name || 'N/A',
                    email: transaction.customer_email,
                    phone: transaction.customer_phone,
                    address: shippingAddress?.address_line1 || null,
                    city: shippingAddress?.city || null,
                    postal_code: shippingAddress?.postal_code || null,
                    country: shippingAddress?.country || null,
                  };
                }
              } else if (customerData && !customerError) {
                payment.customers = {
                  name:
                    (customerData as { name?: string; full_name?: string }).name ||
                    (customerData as { name?: string; full_name?: string }).full_name ||
                    transaction.customer_name ||
                    'N/A',
                  email:
                    (customerData as { email?: string | null }).email || transaction.customer_email,
                  phone:
                    (customerData as { phone?: string | null }).phone || transaction.customer_phone,
                  address: (customerData as { address?: string | null }).address || null,
                  city:
                    (customerData as { city?: string | null }).city ||
                    shippingAddress?.city ||
                    null,
                  postal_code:
                    (customerData as { postal_code?: string | null }).postal_code ||
                    shippingAddress?.postal_code ||
                    null,
                  country:
                    (customerData as { country?: string | null }).country ||
                    shippingAddress?.country ||
                    null,
                };
              } else {
                // Pas de données customer, utiliser les données de la transaction
                payment.customers = {
                  name: transaction.customer_name || 'N/A',
                  email: transaction.customer_email,
                  phone: transaction.customer_phone,
                  address: shippingAddress?.address_line1 || null,
                  city: shippingAddress?.city || null,
                  postal_code: shippingAddress?.postal_code || null,
                  country: shippingAddress?.country || null,
                };
              }
            } catch ( _customerError: unknown) {
              // Utiliser les données de la transaction en fallback
              const errorMessage =
                customerError instanceof Error ? customerError.message : String(customerError);
              payment.customers = {
                name: transaction.customer_name || 'N/A',
                email: transaction.customer_email,
                phone: transaction.customer_phone,
                address: shippingAddress?.address_line1 || null,
                city: shippingAddress?.city || null,
                postal_code: shippingAddress?.postal_code || null,
                country: shippingAddress?.country || null,
              };
              logger.warn('Exception fetching customer for transaction, using transaction data', {
                transactionId: transaction.id,
                customerId: transaction.customer_id,
                error: errorMessage,
              });
            }
          } else {
            // Pas de customer_id, utiliser les données de la transaction
            payment.customers = {
              name: transaction.customer_name || 'N/A',
              email: transaction.customer_email,
              phone: transaction.customer_phone,
              address: shippingAddress?.address_line1 || null,
              city: shippingAddress?.city || null,
              postal_code: shippingAddress?.postal_code || null,
              country: shippingAddress?.country || null,
            };
          }

          // Récupérer les données order si order_id existe
          if (transaction.order_id) {
            try {
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('order_number')
                .eq('id', transaction.order_id)
                .eq('store_id', storeId)
                .single();

              // 🔧 AMÉLIORATION: Gestion spécifique des erreurs Supabase
              if (orderError) {
                const errorCode = orderError.code;
                const errorMessage = orderError.message || '';

                // Ignorer les erreurs non-critiques
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
              } else if (orderData) {
                payment.orders = {
                  order_number: orderData.order_number,
                };
              }
            } catch ( _orderError: unknown) {
              // Catch pour les exceptions non-Supabase
              const errorMessage =
                orderError instanceof Error ? orderError.message : String(orderError);
              logger.warn('Exception fetching order for transaction', {
                transactionId: transaction.id,
                orderId: transaction.order_id,
                error: errorMessage,
              });
            }
          }

          return payment;
        })
      );

      // Filtrer les null (transactions sans store_id)
      const validTransactionsAsPayments = transactionsAsPayments.filter(
        (p): p is Payment => p !== null
      );

      // 4. Enrichir les payments existants (système générique)
      const paymentsEnriched = await Promise.all(
        (paymentsData || []).map(
          async (payment: {
            id: string;
            store_id: string;
            order_id: string | null;
            customer_id: string | null;
            payment_method: string;
            amount: number;
            currency: string;
            status: string;
            transaction_id: string | null;
            notes: string | null;
            created_at: string;
            updated_at: string;
          }) => {
            // Vérifier si cette payment a déjà été traitée comme transaction
            const existingTransaction = validTransactionsAsPayments.find(
              p => p.order_id === payment.order_id && p.transaction_id === payment.transaction_id
            );

            if (existingTransaction) {
              // Ignorer les doublons, la transaction est déjà incluse
              return null;
            }

            // Type guard pour s'assurer que store_id existe
            if (!payment.store_id) {
              logger.warn('Payment sans store_id ignoré', { paymentId: payment.id });
              return null;
            }

            const  enrichedPayment: Payment = {
              ...payment,
              customers: null,
              orders: null,
              transaction: null,
            };

            // Récupérer les données client si customer_id existe
            if (payment.customer_id) {
              try {
                const { data: customerData, error: customerError } = await supabase
                  .from('customers')
                  .select('name, email, full_name, phone, address, city, postal_code, country')
                  .eq('id', payment.customer_id)
                  .eq('store_id', storeId)
                  .single();

                // 🔧 AMÉLIORATION: Gestion spécifique des erreurs Supabase
                if (customerError) {
                  const errorCode = customerError.code;
                  const errorMessage = customerError.message || '';

                  // Ignorer les erreurs non-critiques
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
                    // Erreur non-critique, on continue sans customer
                    logger.debug('Customer non accessible pour payment (non-critique)', {
                      paymentId: payment.id,
                      customerId: payment.customer_id,
                      code: errorCode,
                    });
                  } else {
                    // Autre erreur - logger mais continuer
                    logger.warn('Error fetching customer for payment', {
                      paymentId: payment.id,
                      customerId: payment.customer_id,
                      error: customerError,
                    });
                  }
                } else if (customerData && !customerError) {
                  enrichedPayment.customers = {
                    name:
                      (customerData as { name?: string; full_name?: string }).name ||
                      (customerData as { name?: string; full_name?: string }).full_name ||
                      'N/A',
                    email: (customerData as { email?: string | null }).email ?? null,
                    phone: (customerData as { phone?: string | null }).phone ?? null,
                    address: (customerData as { address?: string | null }).address || null,
                    city: (customerData as { city?: string | null }).city || null,
                    postal_code:
                      (customerData as { postal_code?: string | null }).postal_code || null,
                    country: (customerData as { country?: string | null }).country || null,
                  };
                }
              } catch ( _customerError: unknown) {
                const errorMessage =
                  customerError instanceof Error ? customerError.message : String(customerError);
                logger.warn('Exception fetching customer for payment', {
                  paymentId: payment.id,
                  customerId: payment.customer_id,
                  error: errorMessage,
                });
              }
            }

            // Récupérer les données order si order_id existe
            if (payment.order_id) {
              try {
                const { data: orderData, error: orderError } = await supabase
                  .from('orders')
                  .select('order_number')
                  .eq('id', payment.order_id)
                  .eq('store_id', storeId)
                  .single();

                // 🔧 AMÉLIORATION: Gestion spécifique des erreurs Supabase
                if (orderError) {
                  const errorCode = orderError.code;
                  const errorMessage = orderError.message || '';

                  // Ignorer les erreurs non-critiques
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
                    logger.debug('Order non accessible pour payment (non-critique)', {
                      paymentId: payment.id,
                      orderId: payment.order_id,
                      code: errorCode,
                    });
                  } else {
                    // Autre erreur - logger mais continuer
                    logger.warn('Error fetching order for payment', {
                      paymentId: payment.id,
                      orderId: payment.order_id,
                      error: orderError,
                    });
                  }
                } else if (orderData) {
                  enrichedPayment.orders = {
                    order_number: orderData.order_number,
                  };
                }
              } catch ( _orderError: unknown) {
                const errorMessage =
                  orderError instanceof Error ? orderError.message : String(orderError);
                logger.warn('Exception fetching order for payment', {
                  paymentId: payment.id,
                  orderId: payment.order_id,
                  error: errorMessage,
                });
              }
            }

            return enrichedPayment;
          }
        )
      );

      // 5. Combiner et filtrer par searchTerm si nécessaire
      let  allPayments= [
        ...validTransactionsAsPayments,
        ...paymentsEnriched.filter((p): p is Payment => p !== null),
      ];

      // Appliquer le filtre de recherche si nécessaire
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        allPayments = allPayments.filter(payment => {
          return (
            payment.transaction_id?.toLowerCase().includes(searchLower) ||
            payment.customers?.name?.toLowerCase().includes(searchLower) ||
            payment.customers?.email?.toLowerCase().includes(searchLower) ||
            payment.customers?.phone?.toLowerCase().includes(searchLower) ||
            payment.orders?.order_number?.toLowerCase().includes(searchLower) ||
            payment.payment_method?.toLowerCase().includes(searchLower) ||
            payment.notes?.toLowerCase().includes(searchLower)
          );
        });
      }

      // Trier par date de création (plus récent en premier)
      allPayments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPayments(allPayments);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [storeId, searchTerm, statusFilter, methodFilter]);

  return { payments, loading, refetch: fetchPayments };
};






