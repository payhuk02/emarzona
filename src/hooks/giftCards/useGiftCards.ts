/**
 * Hooks React Query pour gérer les Gift Cards
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  GiftCard,
  GiftCardTransaction,
  GiftCardValidationResult,
  GiftCardRedemptionResult,
  CreateGiftCardInput,
  UpdateGiftCardInput
} from '@/types/giftCards';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Récupérer toutes les cartes cadeaux d'un store
 */
export const useGiftCards = (storeId?: string, filters?: {
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['giftCards', storeId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('gift_cards')
        .select(`
          *,
          store:stores(id, name, slug),
          purchased_by_user:profiles!gift_cards_purchased_by_fkey(id, email, full_name)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`code.ilike.%${filters.search}%,recipient_email.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as GiftCard[];
    },
    enabled: !!storeId
  });
};

/**
 * Récupérer une carte cadeau par ID
 */
export const useGiftCard = (giftCardId?: string) => {
  return useQuery({
    queryKey: ['giftCard', giftCardId],
    queryFn: async () => {
      if (!giftCardId) return null;

      const { data, error } = await supabase
        .from('gift_cards')
        .select(`
          *,
          store:stores(id, name, slug),
          purchased_by_user:profiles!gift_cards_purchased_by_fkey(id, email, full_name)
        `)
        .eq('id', giftCardId)
        .single();

      if (error) throw error;
      return data as GiftCard;
    },
    enabled: !!giftCardId
  });
};

/**
 * Récupérer les cartes cadeaux d'un utilisateur (achetées ou reçues)
 */
export const useMyGiftCards = () => {
  return useQuery({
    queryKey: ['myGiftCards'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Cartes achetées par l'utilisateur
      const { data: purchasedCards, error: purchasedError } = await supabase
        .from('gift_cards')
        .select(`
          *,
          store:stores(id, name, slug)
        `)
        .eq('purchased_by', user.id)
        .order('created_at', { ascending: false });

      if (purchasedError) throw purchasedError;

      // Cartes reçues (par email)
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (!userData?.email) return purchasedCards || [];

      const { data: receivedCards, error: receivedError } = await supabase
        .from('gift_cards')
        .select(`
          *,
          store:stores(id, name, slug)
        `)
        .eq('recipient_email', userData.email)
        .neq('purchased_by', user.id) // Exclure celles qu'il a achetées
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      return [...(purchasedCards || []), ...(receivedCards || [])] as GiftCard[];
    }
  });
};

/**
 * Valider une carte cadeau (vérifier code et solde)
 */
export const useValidateGiftCard = () => {
  return useMutation({
    mutationFn: async ({ storeId, code }: { storeId: string; code: string }) => {
      const { data, error } = await supabase.rpc('validate_gift_card', {
        p_store_id: storeId,
        p_code: code
      });

      if (error) throw error;

      const result = data?.[0] as GiftCardValidationResult | undefined;
      if (!result) {
        throw new Error('Réponse invalide de la validation');
      }

      return result;
    }
  });
};

/**
 * Obtenir le solde d'une carte cadeau
 */
export const useGiftCardBalance = () => {
  return useMutation({
    mutationFn: async ({ storeId, code }: { storeId: string; code: string }) => {
      const { data, error } = await supabase.rpc('get_gift_card_balance', {
        p_store_id: storeId,
        p_code: code
      });

      if (error) throw error;
      return data as number;
    }
  });
};

/**
 * Rédimer une carte cadeau
 */
export const useRedeemGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      giftCardId, 
      orderId, 
      amount 
    }: { 
      giftCardId: string; 
      orderId: string; 
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('redeem_gift_card', {
        p_gift_card_id: giftCardId,
        p_order_id: orderId,
        p_amount: amount
      });

      if (error) throw error;

      const result = data?.[0] as GiftCardRedemptionResult | undefined;
      if (!result) {
        throw new Error('Réponse invalide de la rédemption');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftCards'] });
      queryClient.invalidateQueries({ queryKey: ['myGiftCards'] });
      queryClient.invalidateQueries({ queryKey: ['giftCardTransactions'] });
    }
  });
};

/**
 * Créer une carte cadeau
 */
export const useCreateGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGiftCardInput) => {
      // Générer un code unique
      const { data: codeData, error: codeError } = await supabase.rpc('generate_gift_card_code');
      if (codeError) throw codeError;

      const code = codeData as string;

      // Créer la carte cadeau
      const { data, error } = await supabase
        .from('gift_cards')
        .insert({
          store_id: input.store_id,
          code,
          initial_amount: input.initial_amount,
          current_balance: input.initial_amount,
          expires_at: input.expires_at || null,
          recipient_email: input.recipient_email || null,
          recipient_name: input.recipient_name || null,
          recipient_message: input.recipient_message || null,
          min_purchase_amount: input.min_purchase_amount || 0,
          applicable_to_product_types: input.applicable_to_product_types || null,
          applicable_to_products: input.applicable_to_products || null,
          applicable_to_stores: input.applicable_to_stores || null,
          can_be_partially_used: input.can_be_partially_used ?? true,
          auto_activate: input.auto_activate ?? true,
          metadata: input.metadata || {},
          notes: input.notes || null,
          status: input.auto_activate ? 'active' : 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Créer la transaction initiale (purchase)
      await supabase
        .from('gift_card_transactions')
        .insert({
          gift_card_id: data.id,
          transaction_type: 'purchase',
          amount: input.initial_amount,
          balance_before: 0,
          balance_after: input.initial_amount,
          description: 'Création de la carte cadeau',
          metadata: {}
        });

      return data as GiftCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftCards'] });
    }
  });
};

/**
 * Mettre à jour une carte cadeau
 */
export const useUpdateGiftCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      giftCardId, 
      input 
    }: { 
      giftCardId: string; 
      input: UpdateGiftCardInput;
    }) => {
      const { data, error } = await supabase
        .from('gift_cards')
        .update(input)
        .eq('id', giftCardId)
        .select()
        .single();

      if (error) throw error;
      return data as GiftCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftCards'] });
      queryClient.invalidateQueries({ queryKey: ['giftCard'] });
      queryClient.invalidateQueries({ queryKey: ['myGiftCards'] });
    }
  });
};

/**
 * Récupérer les transactions d'une carte cadeau
 */
export const useGiftCardTransactions = (giftCardId?: string) => {
  return useQuery({
    queryKey: ['giftCardTransactions', giftCardId],
    queryFn: async () => {
      if (!giftCardId) return [];

      const { data, error } = await supabase
        .from('gift_card_transactions')
        .select(`
          *,
          gift_card:gift_cards(*),
          order:orders(id, order_number, total_amount)
        `)
        .eq('gift_card_id', giftCardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GiftCardTransaction[];
    },
    enabled: !!giftCardId
  });
};

/**
 * Récupérer toutes les transactions d'un store
 */
export const useStoreGiftCardTransactions = (storeId?: string) => {
  return useQuery({
    queryKey: ['storeGiftCardTransactions', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('gift_card_transactions')
        .select(`
          *,
          gift_card:gift_cards!inner(*, store:stores!inner(id)),
          order:orders(id, order_number, total_amount)
        `)
        .eq('gift_card.store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GiftCardTransaction[];
    },
    enabled: !!storeId
  });
};

/**
 * Récupérer les cartes cadeaux d'un client (reçues ou achetées)
 */
export const useCustomerGiftCards = (customerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myGiftCards', customerId],
    queryFn: async () => {
      if (!customerId || !user?.email) return [];

      // Récupérer les cartes cadeaux où le client est le propriétaire ou le destinataire
      const { data, error } = await supabase
        .from('gift_cards')
        .select('*')
        .or(`recipient_email.eq.${user.email},purchased_by.eq.${customerId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as GiftCard[];
    },
    enabled: !!customerId && !!user?.email
  });
};

/**
 * Récupérer les transactions de cartes cadeaux d'un client
 */
export const useCustomerGiftCardTransactions = (customerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['myGiftCardTransactions', customerId],
    queryFn: async () => {
      if (!customerId || !user?.email) return [];

      // Récupérer les cartes cadeaux du client
      const { data: giftCards } = await supabase
        .from('gift_cards')
        .select('id, code')
        .or(`recipient_email.eq.${user.email},purchased_by.eq.${customerId}`);

      if (!giftCards || giftCards.length === 0) return [];

      const giftCardIds = giftCards.map(gc => gc.id);

      const { data: transactions, error } = await supabase
        .from('gift_card_transactions')
        .select(`
          *,
          gift_card:gift_cards(id, code),
          order:orders(id, order_number)
        `)
        .in('gift_card_id', giftCardIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Formatter les données pour inclure le code et le numéro de commande
      return (transactions || []).map(t => ({
        ...t,
        gift_card_code: giftCards.find(gc => gc.id === t.gift_card_id)?.code || '',
        order_number: t.order?.order_number || null,
      })) as (GiftCardTransaction & { gift_card_code: string; order_number: string | null })[];
    },
    enabled: !!customerId && !!user?.email
  });
};

