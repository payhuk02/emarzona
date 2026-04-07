// ============================================================================
// HOOKS: Loyalty Program Management
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type {
  LoyaltyPoints,
  LoyaltyTier,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyRewardRedemption,
  CreateLoyaltyTierForm,
  CreateLoyaltyRewardForm,
  LoyaltyStats,
  LoyaltyFilters,
} from '@/types/loyalty';

// ============================================================================
// useLoyaltyPoints: Points de fidélité d'un client
// ============================================================================

export const useLoyaltyPoints = (storeId: string | undefined, customerId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-points', storeId, customerId || user?.id],
    queryFn: async () => {
      if (!storeId) return null;
      
      const userId = customerId || user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          current_tier:loyalty_tiers(*)
        `)
        .eq('store_id', storeId)
        .eq('customer_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as LoyaltyPoints | null;
    },
    enabled: !!storeId && (!!customerId || !!user),
  });
};

// ============================================================================
// useMyLoyaltyPoints: Mes points de fidélité (pour tous les stores)
// ============================================================================

export const useMyLoyaltyPoints = () => {
  return useQuery({
    queryKey: ['my-loyalty-points'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Récupérer les points de fidélité sans jointure avec stores pour éviter les problèmes RLS
      const { data: pointsData, error: pointsError } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          current_tier:loyalty_tiers(*)
        `)
        .eq('customer_id', user.id)
        .order('updated_at', { ascending: false });

      if (pointsError) throw pointsError;
      if (!pointsData || pointsData.length === 0) return [];

      // Récupérer les informations des stores séparément pour chaque store_id unique
      const storeIds = [...new Set(pointsData.map(p => p.store_id))];
      const { data: storesData } = await supabase
        .from('stores_public' as any)
        .select('id, name, slug')
        .in('id', storeIds);

      // Combiner les données
      const pointsWithStores = pointsData.map(point => {
        const store = storesData?.find(s => s.id === point.store_id);
        return {
          ...point,
          store: store || null,
        } as LoyaltyPoints;
      });

      return pointsWithStores;
    },
  });
};

// ============================================================================
// useLoyaltyTiers: Tiers de fidélité d'un store
// ============================================================================

export const useLoyaltyTiers = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['loyalty-tiers', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('min_points_required', { ascending: true });

      if (error) throw error;
      return (data || []) as LoyaltyTier[];
    },
    enabled: !!storeId,
  });
};

// ============================================================================
// useLoyaltyRewards: Récompenses disponibles d'un store
// ============================================================================

export const useLoyaltyRewards = (storeId: string | undefined, customerTier?: string) => {
  return useQuery({
    queryKey: ['loyalty-rewards', storeId, customerTier],
    queryFn: async () => {
      if (!storeId) return [];

      let  query= supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active');

      // Filtrer par tier si fourni
      if (customerTier) {
        // Créer une condition qui permet les récompenses sans restriction de tier
        // ou avec un tier inférieur ou égal au tier du client
        query = query.or(`min_tier.is.null,min_tier.eq.${customerTier}`);
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .order('points_cost', { ascending: true });

      if (error) throw error;
      return (data || []) as LoyaltyReward[];
    },
    enabled: !!storeId,
  });
};

// ============================================================================
// useLoyaltyTransactions: Historique des transactions
// ============================================================================

export const useLoyaltyTransactions = (
  storeId: string | undefined,
  customerId?: string,
  filters?: LoyaltyFilters
) => {
  return useQuery({
    queryKey: ['loyalty-transactions', storeId, customerId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      let  query= supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (filters?.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as LoyaltyTransaction[];
    },
    enabled: !!storeId,
  });
};

// ============================================================================
// useLoyaltyRewardRedemptions: Historique des échanges
// ============================================================================

export const useLoyaltyRewardRedemptions = (
  storeId: string | undefined,
  customerId?: string
) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['loyalty-redemptions', storeId, customerId || user?.id],
    queryFn: async () => {
      const userId = customerId || user?.id;
      if (!userId) return [];

      let  query= supabase
        .from('loyalty_reward_redemptions')
        .select(`
          *,
          reward:loyalty_rewards(*)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Si storeId est fourni, filtrer par store
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as LoyaltyRewardRedemption[];
    },
    enabled: !!(customerId || user?.id),
  });
};

// ============================================================================
// useCreateLoyaltyTier: Créer un tier
// ============================================================================

export const useCreateLoyaltyTier = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: CreateLoyaltyTierForm & { store_id: string }) => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .insert({
          store_id: form.store_id,
          tier_type: form.tier_type,
          name: form.name,
          description: form.description,
          min_points_required: form.min_points_required,
          min_orders_required: form.min_orders_required || null,
          min_spent_amount: form.min_spent_amount || null,
          points_multiplier: form.points_multiplier || 1.0,
          discount_percentage: form.discount_percentage || 0,
          free_shipping: form.free_shipping || false,
          exclusive_access: form.exclusive_access || false,
          badge_color: form.badge_color || '#808080',
          badge_icon: form.badge_icon || null,
          is_default: form.is_default || false,
          display_order: form.display_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LoyaltyTier;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers', data.store_id] });
      toast({
        title: 'Tier créé',
        description: `Le tier "${data.name}" a été créé avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création du tier',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useCreateLoyaltyReward: Créer une récompense
// ============================================================================

export const useCreateLoyaltyReward = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: CreateLoyaltyRewardForm & { store_id: string }) => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .insert({
          store_id: form.store_id,
          name: form.name,
          description: form.description,
          reward_type: form.reward_type,
          points_cost: form.points_cost,
          discount_percentage: form.discount_percentage || null,
          discount_amount: form.discount_amount || null,
          free_product_id: form.free_product_id || null,
          gift_card_amount: form.gift_card_amount || null,
          cash_back_amount: form.cash_back_amount || null,
          custom_value: form.custom_value || null,
          max_redemptions: form.max_redemptions || null,
          max_redemptions_per_customer: form.max_redemptions_per_customer || null,
          available_from: form.available_from || null,
          available_until: form.available_until || null,
          min_tier: form.min_tier || null,
          applicable_to_product_types: form.applicable_to_product_types || [],
          applicable_to_products: form.applicable_to_products || [],
          image_url: form.image_url || null,
          badge_text: form.badge_text || null,
          display_order: form.display_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LoyaltyReward;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', data.store_id] });
      toast({
        title: 'Récompense créée',
        description: `La récompense "${data.name}" a été créée avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la création de la récompense',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useRedeemLoyaltyReward: Échanger une récompense
// ============================================================================

export const useRedeemLoyaltyReward = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reward_id,
      store_id,
      customer_id,
    }: {
      reward_id: string;
      store_id: string;
      customer_id: string;
    }) => {
      const { data: redemptionCode, error } = await supabase.rpc('redeem_loyalty_reward', {
        p_reward_id: reward_id,
        p_customer_id: customer_id,
        p_store_id: store_id,
      });

      if (error) throw error;
      return redemptionCode as string;
    },
    onSuccess: (redemptionCode) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      toast({
        title: 'Récompense échangée ! 🎉',
        description: `Code d'échange : ${redemptionCode}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'échange de la récompense',
        variant: 'destructive',
      });
    },
  });
};

// ============================================================================
// useLoyaltyStats: Statistiques de fidélité
// ============================================================================

export const useLoyaltyStats = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['loyalty-stats', storeId],
    queryFn: async (): Promise<LoyaltyStats | null> => {
      if (!storeId) return null;

      // Récupérer les statistiques depuis les tables
      const [pointsData, rewardsData, redemptionsData, tiersData] = await Promise.all([
        // Total points émis
        supabase
          .from('loyalty_transactions')
          .select('points_amount')
          .eq('store_id', storeId)
          .eq('transaction_type', 'earned'),
        
        // Total points échangés
        supabase
          .from('loyalty_transactions')
          .select('points_amount')
          .eq('store_id', storeId)
          .eq('transaction_type', 'redeemed'),
        
        // Récompenses actives
        supabase
          .from('loyalty_rewards')
          .select('redemption_count')
          .eq('store_id', storeId)
          .eq('status', 'active'),
        
        // Distribution des tiers
        supabase
          .from('loyalty_points')
          .select('current_tier_type')
          .eq('store_id', storeId),
      ]);

      const totalPointsIssued = pointsData.data?.reduce((sum, t) => sum + (t.points_amount || 0), 0) || 0;
      const totalPointsRedeemed = Math.abs(rewardsData.data?.reduce((sum, t) => sum + (t.points_amount || 0), 0) || 0);
      const totalRedemptions = redemptionsData.data?.reduce((sum, r) => sum + (r.redemption_count || 0), 0) || 0;
      
      // Compter par tier
      const tierDistribution = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
      };
      
      tiersData.data?.forEach((point) => {
        if (point.current_tier_type && point.current_tier_type in tierDistribution) {
          tierDistribution[point.current_tier_type as keyof typeof tierDistribution]++;
        }
      });

      // Compter les clients uniques
      const { count } = await supabase
        .from('loyalty_points')
        .select('customer_id', { count: 'exact', head: true })
        .eq('store_id', storeId);

      return {
        total_customers: count || 0,
        total_points_issued: totalPointsIssued,
        total_points_redeemed: totalPointsRedeemed,
        active_rewards: redemptionsData.data?.length || 0,
        total_redemptions: totalRedemptions,
        tier_distribution: tierDistribution,
      };
    },
    enabled: !!storeId,
  });
};







