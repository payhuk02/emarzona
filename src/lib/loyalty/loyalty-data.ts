/**
 * Requêtes fidélité alignées sur le schéma Supabase prod (hybride legacy + programme 20250127).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type {
  LoyaltyPoints,
  LoyaltyTier,
  LoyaltyTierType,
  LoyaltyTransaction,
  LoyaltyTransactionType,
  LoyaltyReward,
  LoyaltyRewardRedemption,
} from '@/types/loyalty';

export const LOYALTY_POINTS_SELECT =
  'id, store_id, customer_id, total_points, available_points, lifetime_points, current_tier_id, current_tier_type, total_orders, total_spent, last_activity_at, points_expiring_soon, next_expiration_date, metadata, created_at, updated_at';

// Schéma "legacy" (migration 2026-03-29) : colonnes différentes de la version 2025-01-27.
const LEGACY_POINTS_SELECT_V603 =
  'id, store_id, user_id, points, lifetime_points, tier, last_earned_at, last_redeemed_at, created_at, updated_at';

const LEGACY_TIER_SELECT =
  'id, store_id, name, description, level, min_points, max_points, benefits, badge_color, badge_icon, created_at, updated_at';

const MODERN_TIER_SELECT =
  'id, store_id, tier_type, name, description, min_points_required, min_orders_required, min_spent_amount, points_multiplier, discount_percentage, free_shipping, exclusive_access, badge_color, badge_icon, is_default, display_order, is_active, created_at, updated_at';

const LOYALTY_REWARD_SELECT =
  'id, store_id, name, description, reward_type, points_cost, discount_percentage, discount_amount, free_product_id, gift_card_amount, cash_back_amount, custom_value, max_redemptions, max_redemptions_per_customer, redemption_count, available_from, available_until, min_tier, applicable_to_product_types, applicable_to_products, image_url, badge_text, status, display_order, created_at, updated_at';

const LOYALTY_REDEMPTION_SELECT =
  'id, store_id, customer_id, reward_id, loyalty_points_id, redemption_code, points_used, status, used_at, expires_at, applied_to_order_id, applied_at, metadata, created_at';

const LEGACY_TRANSACTION_SELECT =
  'id, user_id, store_id, points, type, reason, reference_id, reference_type, metadata, expires_at, created_at';

// Schéma transactions legacy (migration 2026-03-29)
const LEGACY_TRANSACTION_SELECT_V603 =
  'id, user_id, store_id, points, type, source, order_id, description, created_at';

const LEGACY_REDEMPTION_SELECT_V603 =
  'id, store_id, user_id, reward_id, loyalty_points_id, redemption_code, points_used, status, used_at, expires_at, applied_to_order_id, applied_at, metadata, created_at';

const TIER_BY_LEVEL: LoyaltyTierType[] = ['bronze', 'silver', 'gold', 'platinum'];

type LegacyTierRow = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  level: number;
  min_points: number;
  max_points: number | null;
  benefits: unknown;
  badge_color: string | null;
  badge_icon: string | null;
  created_at: string;
  updated_at: string;
};

type LegacyTransactionRow = {
  id: string;
  user_id: string;
  store_id: string;
  points: number;
  type: string;
  reason: string;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
};

type LegacyPointsV603Row = {
  id: string;
  store_id: string;
  user_id: string;
  points: number;
  lifetime_points: number;
  tier: string | null;
  last_earned_at: string | null;
  last_redeemed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type LegacyTransactionV603Row = {
  id: string;
  user_id: string;
  store_id: string;
  points: number;
  type: string;
  source: string | null;
  order_id: string | null;
  description: string | null;
  created_at: string;
};

type ModernPointsRow = {
  store_id: string;
  current_tier_id: string | null;
};

type RedemptionRow = {
  id: string;
  reward_id: string;
  loyalty_points_id: string;
  store_id: string;
  customer_id?: string;
  user_id?: string;
  points_used: number | null;
  redemption_code: string;
  status: LoyaltyRewardRedemption['status'];
  used_at: string | null;
  expires_at: string | null;
  applied_to_order_id: string | null;
  applied_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export const loyaltyQueryOptions = {
  retry: false as const,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: false as const,
  refetchOnMount: false as const,
  staleTime: 60_000,
};

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function toTierType(value: unknown): LoyaltyTierType {
  const tiers: LoyaltyTierType[] = ['bronze', 'silver', 'gold', 'platinum'];
  return tiers.includes(value as LoyaltyTierType) ? (value as LoyaltyTierType) : 'bronze';
}

export function mapLegacyTier(row: LegacyTierRow): LoyaltyTier {
  const level = Math.max(1, row.level ?? 1);
  const tier_type = TIER_BY_LEVEL[Math.min(level - 1, TIER_BY_LEVEL.length - 1)];

  return {
    id: row.id,
    store_id: row.store_id,
    tier_type,
    name: row.name,
    description: row.description,
    min_points_required: row.min_points ?? 0,
    min_orders_required: null,
    min_spent_amount: null,
    points_multiplier: 1,
    discount_percentage: 0,
    free_shipping: false,
    exclusive_access: false,
    badge_color: row.badge_color ?? '#808080',
    badge_icon: row.badge_icon,
    is_default: level === 1,
    display_order: level,
    is_active: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapModernTier(row: Record<string, unknown>): LoyaltyTier {
  return {
    id: row.id as string,
    store_id: row.store_id as string,
    tier_type: toTierType(row.tier_type),
    name: (row.name as string) ?? '',
    description: (row.description as string | null) ?? null,
    min_points_required: Number(row.min_points_required ?? 0),
    min_orders_required:
      row.min_orders_required === undefined ? null : (row.min_orders_required as number | null),
    min_spent_amount:
      row.min_spent_amount === undefined ? null : (row.min_spent_amount as number | null),
    points_multiplier: Number(row.points_multiplier ?? 1),
    discount_percentage: Number(row.discount_percentage ?? 0),
    free_shipping: Boolean(row.free_shipping),
    exclusive_access: Boolean(row.exclusive_access),
    badge_color: (row.badge_color as string | null) ?? '#808080',
    badge_icon: (row.badge_icon as string | null) ?? null,
    is_default: Boolean(row.is_default),
    display_order: Number(row.display_order ?? 0),
    is_active: row.is_active === undefined ? true : Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapTransactionType(type: string): LoyaltyTransactionType {
  switch (type) {
    case 'earn':
    case 'earned':
      return 'earned';
    case 'spent':
      return 'redeemed';
    case 'expired':
      return 'expired';
    case 'bonus':
      return 'bonus';
    case 'adjustment':
      return 'adjusted';
    default:
      return 'earned';
  }
}

export function mapLegacyTransaction(row: LegacyTransactionRow): LoyaltyTransaction {
  return {
    id: row.id,
    loyalty_points_id: '',
    store_id: row.store_id,
    customer_id: row.user_id,
    transaction_type: mapTransactionType(row.type),
    points_amount: row.points,
    balance_before: 0,
    balance_after: 0,
    order_id: row.reference_type === 'order' ? row.reference_id : null,
    reward_id: null,
    description: row.reason,
    reference_number: row.reference_id,
    expires_at: row.expires_at,
    metadata: (row.metadata ?? {}) as LoyaltyTransaction['metadata'],
    created_at: row.created_at,
    created_by: null,
  };
}

function mapLegacyTransactionV603(row: LegacyTransactionV603Row): LoyaltyTransaction {
  return {
    id: row.id,
    loyalty_points_id: '',
    store_id: row.store_id,
    customer_id: row.user_id,
    transaction_type: mapTransactionType(row.type),
    points_amount: row.points,
    balance_before: 0,
    balance_after: 0,
    order_id: row.order_id ?? null,
    reward_id: null,
    description: (row.description ?? row.source ?? null) as string | null,
    reference_number: null,
    expires_at: null,
    metadata: {},
    created_at: row.created_at,
    created_by: null,
  };
}

function mapLegacyPointsV603Row(row: LegacyPointsV603Row): LoyaltyPoints {
  const lastActivity = row.last_redeemed_at ?? row.last_earned_at ?? null;
  const tier = toTierType(row.tier);

  return {
    id: row.id,
    store_id: row.store_id,
    customer_id: row.user_id,
    total_points: Number(row.lifetime_points ?? 0),
    available_points: Number(row.points ?? 0),
    lifetime_points: Number(row.lifetime_points ?? row.points ?? 0),
    current_tier_id: null,
    current_tier_type: tier,
    total_orders: 0,
    total_spent: 0,
    last_activity_at: lastActivity,
    points_expiring_soon: 0,
    next_expiration_date: null,
    metadata: {},
    created_at: row.created_at,
    updated_at: (row.updated_at ?? row.created_at) as string,
  };
}

export function mapLoyaltyPointsRow(
  row: Record<string, unknown>,
  currentTier?: LoyaltyTier | null
): LoyaltyPoints {
  return {
    id: row.id as string,
    store_id: row.store_id as string,
    customer_id: row.customer_id as string,
    total_points: Number(row.total_points ?? 0),
    available_points: Number(row.available_points ?? 0),
    lifetime_points: Number(row.lifetime_points ?? 0),
    current_tier_id: (row.current_tier_id as string | null) ?? null,
    current_tier_type: (row.current_tier_type as LoyaltyTierType) ?? 'bronze',
    total_orders: Number(row.total_orders ?? 0),
    total_spent: Number(row.total_spent ?? 0),
    last_activity_at: (row.last_activity_at as string | null) ?? null,
    points_expiring_soon: Number(row.points_expiring_soon ?? 0),
    next_expiration_date: (row.next_expiration_date as string | null) ?? null,
    metadata: (row.metadata ?? {}) as LoyaltyPoints['metadata'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    current_tier: currentTier ?? undefined,
  };
}

export async function fetchLoyaltyTiersForStore(storeId: string): Promise<LoyaltyTier[]> {
  try {
    // 1) Essayer le schéma moderne
    const modern = await supabase
      .from('loyalty_tiers')
      .select(MODERN_TIER_SELECT)
      .eq('store_id', storeId)
      .order('display_order', { ascending: true })
      .order('min_points_required', { ascending: true });

    if (!modern.error && modern.data?.length) {
      return (modern.data ?? []).map(row => mapModernTier(row as Record<string, unknown>));
    }

    // 2) Fallback schéma legacy
    const legacy = await supabase
      .from('loyalty_tiers')
      .select(LEGACY_TIER_SELECT)
      .eq('store_id', storeId)
      .order('level', { ascending: true });

    if (legacy.error) {
      logger.warn('fetchLoyaltyTiersForStore failed', { error: legacy.error, storeId });
      return [];
    }

    return (legacy.data ?? []).map(row => mapLegacyTier(row as LegacyTierRow));
  } catch (error) {
    logger.warn('fetchLoyaltyTiersForStore threw', { error, storeId });
    return [];
  }
}

export async function fetchLoyaltyTiersByIds(tierIds: string[]): Promise<Map<string, LoyaltyTier>> {
  if (tierIds.length === 0) return new Map();

  try {
    // 1) Moderne
    const modern = await supabase
      .from('loyalty_tiers')
      .select(MODERN_TIER_SELECT)
      .in('id', tierIds);

    if (!modern.error && modern.data?.length) {
      const map = new Map<string, LoyaltyTier>();
      for (const row of modern.data ?? []) {
        const tier = mapModernTier(row as Record<string, unknown>);
        map.set(tier.id, tier);
      }
      return map;
    }

    // 2) Legacy
    const legacy = await supabase
      .from('loyalty_tiers')
      .select(LEGACY_TIER_SELECT)
      .in('id', tierIds);

    if (legacy.error) {
      logger.warn('fetchLoyaltyTiersByIds failed', { error: legacy.error });
      return new Map();
    }

    const map = new Map<string, LoyaltyTier>();
    for (const row of legacy.data ?? []) {
      const tier = mapLegacyTier(row as LegacyTierRow);
      map.set(tier.id, tier);
    }
    return map;
  } catch (error) {
    logger.warn('fetchLoyaltyTiersByIds threw', { error });
    return new Map();
  }
}

export async function fetchMyLoyaltyPointsRows(userId: string): Promise<LoyaltyPoints[]> {
  if (!isUuid(userId)) return [];
  try {
    // 1) Moderne (2025-01-27)
    const modern = await supabase
      .from('loyalty_points')
      .select(LOYALTY_POINTS_SELECT)
      .eq('customer_id', userId)
      .order('updated_at', { ascending: false });

    if (!modern.error && modern.data?.length) {
      const rows = modern.data as ModernPointsRow[];
      const tierIds = [
        ...new Set(
          rows.map(p => p.current_tier_id).filter((id): id is string => typeof id === 'string')
        ),
      ];
      const tiersById = await fetchLoyaltyTiersByIds(tierIds);

      const storeIds = [...new Set(rows.map(p => p.store_id))];
      const { data: storesData } = await supabase
        .from('stores_public')
        .select('id, name, slug')
        .in('id', storeIds);

      return (modern.data ?? []).map(row => {
        const typedRow = row as ModernPointsRow & Record<string, unknown>;
        const point = mapLoyaltyPointsRow(
          typedRow,
          typedRow.current_tier_id ? tiersById.get(typedRow.current_tier_id) : null
        );
        const store = storesData?.find(s => s.id === point.store_id);
        return { ...point, store: store ?? null } as LoyaltyPoints;
      });
    }

    // 2) Legacy (2026-03-29) : customer_id => user_id, points => available_points, tier => current_tier_type
    const legacy = await supabase
      .from('loyalty_points')
      .select(LEGACY_POINTS_SELECT_V603)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (legacy.error) {
      logger.warn('fetchMyLoyaltyPointsRows failed', { error: legacy.error, userId });
      return [];
    }

    if (!legacy.data?.length) return [];

    const storeIds = [
      ...new Set((legacy.data ?? []).map(p => (p as LegacyPointsV603Row).store_id)),
    ];
    const { data: storesData } = await supabase
      .from('stores_public')
      .select('id, name, slug')
      .in('id', storeIds);

    return (legacy.data ?? []).map(row => {
      const point = mapLegacyPointsV603Row(row as LegacyPointsV603Row);
      const store = storesData?.find(s => s.id === point.store_id);
      return { ...point, store: store ?? null } as LoyaltyPoints;
    });
  } catch (error) {
    logger.warn('fetchMyLoyaltyPointsRows threw', { error, userId });
    return [];
  }
}

export async function fetchLoyaltyPointsForStore(
  storeId: string,
  userId: string
): Promise<LoyaltyPoints | null> {
  if (!isUuid(storeId) || !isUuid(userId)) return null;
  try {
    // 1) Moderne
    const modern = await supabase
      .from('loyalty_points')
      .select(LOYALTY_POINTS_SELECT)
      .eq('store_id', storeId)
      .eq('customer_id', userId)
      .maybeSingle();

    if (!modern.error && modern.data) {
      const row = modern.data as ModernPointsRow & Record<string, unknown>;
      const tier = row.current_tier_id
        ? (await fetchLoyaltyTiersByIds([row.current_tier_id])).get(row.current_tier_id)
        : null;

      return mapLoyaltyPointsRow(row, tier);
    }

    // 2) Legacy
    const legacy = await supabase
      .from('loyalty_points')
      .select(LEGACY_POINTS_SELECT_V603)
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (legacy.error || !legacy.data) {
      logger.warn('fetchLoyaltyPointsForStore failed', { error: legacy.error, storeId, userId });
      return null;
    }

    return mapLegacyPointsV603Row(legacy.data as LegacyPointsV603Row);
  } catch (error) {
    logger.warn('fetchLoyaltyPointsForStore threw', { error, storeId, userId });
    return null;
  }
}

export async function fetchLoyaltyTransactions(
  storeId: string,
  userId: string,
  filters?: { transaction_type?: string; date_from?: string; date_to?: string }
): Promise<LoyaltyTransaction[]> {
  if (!isUuid(storeId) || !isUuid(userId)) return [];
  try {
    // 1) Legacy v1 (colonnes reason/reference/metadata)
    let queryV1 = supabase
      .from('loyalty_transactions')
      .select(LEGACY_TRANSACTION_SELECT)
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.transaction_type) {
      const legacyType =
        filters.transaction_type === 'redeemed' ? 'spent' : filters.transaction_type;
      queryV1 = queryV1.eq('type', legacyType);
    }
    if (filters?.date_from) queryV1 = queryV1.gte('created_at', filters.date_from);
    if (filters?.date_to) queryV1 = queryV1.lte('created_at', filters.date_to);

    const v1Res = await queryV1;
    if (!v1Res.error && v1Res.data) {
      return (v1Res.data ?? []).map(row => mapLegacyTransaction(row as LegacyTransactionRow));
    }

    // 2) Legacy v603 (colonnes source/order_id/description)
    let queryV603 = supabase
      .from('loyalty_transactions')
      .select(LEGACY_TRANSACTION_SELECT_V603)
      .eq('store_id', storeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.transaction_type) {
      if (filters.transaction_type === 'earned') {
        // Certains systèmes stockent 'earn' au lieu de 'earned'
        queryV603 = queryV603.or('type.eq.earned,type.eq.earn');
      } else {
        const legacyType =
          filters.transaction_type === 'redeemed' ? 'spent' : filters.transaction_type;
        queryV603 = queryV603.eq('type', legacyType);
      }
    }
    if (filters?.date_from) queryV603 = queryV603.gte('created_at', filters.date_from);
    if (filters?.date_to) queryV603 = queryV603.lte('created_at', filters.date_to);

    const v603Res = await queryV603;
    if (v603Res.error) {
      logger.warn('fetchLoyaltyTransactions failed', { error: v603Res.error, storeId, userId });
      return [];
    }

    return (v603Res.data ?? []).map(row =>
      mapLegacyTransactionV603(row as LegacyTransactionV603Row)
    );
  } catch (error) {
    logger.warn('fetchLoyaltyTransactions threw', { error, storeId, userId });
    return [];
  }
}

export async function fetchLoyaltyRedemptions(
  userId: string,
  storeId?: string
): Promise<LoyaltyRewardRedemption[]> {
  if (!isUuid(userId)) return [];
  if (storeId && !isUuid(storeId)) return [];
  try {
    // IMPORTANT: pas de join embed ici pour éviter des 400 si le schéma de `loyalty_rewards` diverge.
    const fetchModern = async (): Promise<LoyaltyRewardRedemption[] | null> => {
      let query = supabase
        .from('loyalty_reward_redemptions')
        .select(LOYALTY_REDEMPTION_SELECT)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (storeId) query = query.eq('store_id', storeId);

      const { data, error } = await query;
      if (error) return null;
      return (data ?? []).map((row): LoyaltyRewardRedemption => {
        const r = row as RedemptionRow;
        return {
          id: r.id,
          reward_id: r.reward_id,
          loyalty_points_id: r.loyalty_points_id,
          store_id: r.store_id,
          customer_id: r.customer_id ?? '',
          points_used: Number(r.points_used ?? 0),
          redemption_code: r.redemption_code,
          status: r.status,
          used_at: r.used_at ?? null,
          expires_at: r.expires_at ?? null,
          applied_to_order_id: r.applied_to_order_id ?? null,
          applied_at: r.applied_at ?? null,
          metadata: (r.metadata ?? {}) as LoyaltyRewardRedemption['metadata'],
          created_at: r.created_at,
        };
      });
    };

    const fetchLegacy = async (): Promise<LoyaltyRewardRedemption[] | null> => {
      let query = supabase
        .from('loyalty_reward_redemptions')
        .select(LEGACY_REDEMPTION_SELECT_V603)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (storeId) query = query.eq('store_id', storeId);

      const { data, error } = await query;
      if (error) return null;

      return (data ?? []).map((row): LoyaltyRewardRedemption => {
        const r = row as RedemptionRow;
        return {
          id: r.id,
          reward_id: r.reward_id,
          loyalty_points_id: r.loyalty_points_id,
          store_id: r.store_id,
          customer_id: r.user_id ?? '',
          points_used: Number(r.points_used ?? 0),
          redemption_code: r.redemption_code,
          status: r.status,
          used_at: r.used_at ?? null,
          expires_at: r.expires_at ?? null,
          applied_to_order_id: r.applied_to_order_id ?? null,
          applied_at: r.applied_at ?? null,
          metadata: (r.metadata ?? {}) as LoyaltyRewardRedemption['metadata'],
          created_at: r.created_at,
        };
      });
    };

    const redemptions = (await fetchModern()) ?? (await fetchLegacy());

    if (!redemptions) {
      logger.warn('fetchLoyaltyRedemptions failed', { userId, storeId });
      return [];
    }

    // Enrichissement récompenses (best-effort)
    const rewardIds = [...new Set(redemptions.map(r => r.reward_id))].filter(Boolean);
    if (rewardIds.length > 0) {
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select(LOYALTY_REWARD_SELECT)
        .in('id', rewardIds);

      if (!rewardsError && rewardsData?.length) {
        const rewardsById = new Map(rewardsData.map(r => [r.id, r as LoyaltyReward]));
        redemptions.forEach(redemption => {
          const reward = rewardsById.get(redemption.reward_id);
          if (reward) redemption.reward = reward;
        });
      }
    }

    return redemptions;
  } catch (error) {
    logger.warn('fetchLoyaltyRedemptions threw', { error, userId, storeId });
    return [];
  }
}

export { LOYALTY_REWARD_SELECT };
