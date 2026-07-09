import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ShippingAddress {
  full_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  state?: string;
}

export interface OrderTransaction {
  id: string;
  moneroo_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_provider: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string | null;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Advanced payment fields
  payment_type?: 'full' | 'percentage' | 'delivery_secured' | null;
  percentage_paid?: number | null;
  remaining_amount?: number | null;
  delivery_status?: string | null;
  // Shipping address from checkout
  shipping_address?: ShippingAddress | null;
  // Metadata for additional information
  metadata?: Record<string, unknown> | null;
  customers?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  // Transactions linked to this order
  transactions?: OrderTransaction[] | null;
}

export type SortColumn =
  | 'order_number'
  | 'created_at'
  | 'total_amount'
  | 'status'
  | 'payment_status';
export type SortDirection = 'asc' | 'desc';

interface UseOrdersOptions {
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortDirection?: SortDirection;
}

export const useOrders = (storeId?: string, options: UseOrdersOptions = {}) => {
  const { page = 0, pageSize = 25, sortBy = 'created_at', sortDirection = 'desc' } = options;
  const { toast } = useToast();

  const fetchOrders = async () => {
    if (!storeId) {
      return { data: [], count: 0 };
    }

    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const {
        data,
        error: queryError,
        count,
      } = await supabase
        .from('orders')
        .select(
          `
          *,
          customers (
            name,
            email,
            phone,
            address,
            city,
            postal_code,
            country
          )
        `,
          { count: 'exact' }
        )
        .eq('store_id', storeId)
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(from, to);

      if (queryError) {
        // 🔧 AMÉLIORATION: Gestion complète des erreurs Supabase
        const errorCode = queryError.code;
        const errorMessage = queryError.message || '';

        // Table n'existe pas (42P01) ou relation invalide
        if (
          errorCode === '42P01' ||
          errorMessage.includes('does not exist') ||
          (errorMessage.includes('relation') && errorMessage.includes('does not exist'))
        ) {
          logger.warn("Table orders n'existe pas encore", {
            code: errorCode,
            message: errorMessage,
          });
          return { data: [], count: 0 };
        }

        // Erreur 400 (Bad Request) - souvent RLS ou syntaxe
        if (
          errorCode === 'PGRST116' ||
          errorCode === '400' ||
          errorMessage.includes('Bad Request')
        ) {
          logger.warn('Erreur 400 lors de la récupération des commandes (RLS ou syntaxe)', {
            code: errorCode,
            message: errorMessage,
            storeId,
          });
          return { data: [], count: 0 };
        }

        // Erreur de permissions (403)
        if (
          errorCode === '42501' ||
          errorCode === '403' ||
          errorMessage.includes('permission denied') ||
          errorMessage.includes('RLS')
        ) {
          logger.warn('Permissions insuffisantes pour accéder aux commandes', {
            code: errorCode,
            message: errorMessage,
            storeId,
          });
          return { data: [], count: 0 };
        }

        // Autres erreurs - logger et propager
        logger.error('Erreur lors de la récupération des commandes', {
          code: errorCode,
          message: errorMessage,
          storeId,
        });
        throw queryError;
      }

      return { data: (data || []) as unknown as Order[], count: count || 0 };
    } catch (_err: unknown) {
      const error = _err instanceof Error ? _err : new Error('Erreur inconnue');
      const errorCode =
        _err && typeof _err === 'object' && 'code' in _err ? String(_err.code) : undefined;
      const errorMessage = error.message || '';

      // 🔧 AMÉLIORATION: Ne pas logger comme erreur critique si c'est une erreur non-bloquante
      const isNonCriticalError =
        errorCode === '42P01' ||
        errorCode === 'PGRST116' ||
        errorCode === '400' ||
        errorCode === '42501' ||
        errorCode === '403' ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('Bad Request') ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('RLS');

      if (isNonCriticalError) {
        logger.debug('Erreur non-critique lors de la récupération des commandes', {
          error: errorMessage,
          code: errorCode,
          filters: { storeId },
        });
      } else {
        logger.error('Erreur lors de la récupération des commandes', {
          error: errorMessage,
          code: errorCode,
          filters: { storeId },
        });
        // Afficher un toast uniquement pour les erreurs critiques
        toast({
          title: 'Erreur',
          description: errorMessage || 'Impossible de charger les commandes',
          variant: 'destructive',
        });
      }

      // Toujours retourner un tableau vide en cas d'erreur pour éviter de casser l'UI
      return { data: [], count: 0 };
    }
  };

  const {
    data: queryData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', storeId, page, pageSize, sortBy, sortDirection],
    queryFn: fetchOrders,
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const orders = queryData?.data || [];
  const totalCount = queryData?.count || 0;

  // Function to fetch transactions for a specific order
  const fetchOrderTransactions = async (orderId: string): Promise<OrderTransaction[]> => {
    try {
      const { data, error: transactionsError } = await supabase
        .from('transactions')
        .select(
          'id, moneroo_transaction_id, amount, currency, status, moneroo_payment_method, created_at, completed_at'
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        logger.warn('Error fetching transactions for order', {
          orderId,
          error: transactionsError,
        });
        return [];
      }

      return (data || []).map(t => ({
        id: t.id,
        moneroo_transaction_id: t.moneroo_transaction_id,
        amount: Number(t.amount || 0),
        currency: t.currency || 'XOF',
        status: t.status || 'pending',
        payment_method: t.moneroo_payment_method,
        payment_provider: (t as { payment_provider?: string | null }).payment_provider ?? 'moneroo',
        created_at: t.created_at,
        completed_at: t.completed_at,
      }));
    } catch (error) {
      logger.error('Error fetching order transactions', { orderId, error });
      return [];
    }
  };

  return {
    orders,
    loading,
    totalCount,
    error: error as Error | null,
    refetch,
    fetchOrderTransactions,
  };
};
