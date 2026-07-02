/**
 * Contrat isolation multi-boutique — hooks vendeur + politiques RLS store-scoped.
 * Validé offline par Vitest (Phase 4.4).
 */

export interface StoreScopedHookRequirement {
  hookFile: string;
  hookExport: string;
  /** Pattern attendu dans le corps du hook (filtrage store_id). */
  storeFilterPattern: RegExp;
}

export interface StoreRlsPolicyRequirement {
  table: string;
  policyName: string;
}

/** Hooks critiques — toute requête liste doit filtrer par store_id. */
export const STORE_SCOPED_HOOK_REQUIREMENTS: StoreScopedHookRequirement[] = [
  {
    hookFile: 'src/hooks/useProducts.ts',
    hookExport: 'useProducts',
    storeFilterPattern: /\.eq\s*\(\s*['"]store_id['"]/,
  },
  {
    hookFile: 'src/hooks/useOrders.ts',
    hookExport: 'useOrders',
    storeFilterPattern: /\.eq\s*\(\s*['"]store_id['"]/,
  },
  {
    hookFile: 'src/hooks/useCustomers.ts',
    hookExport: 'useCustomers',
    storeFilterPattern: /\.eq\s*\(\s*['"]store_id['"]/,
  },
];

/** Politiques RLS vendeur — isolation par boutique. */
export const STORE_RLS_POLICY_REQUIREMENTS: StoreRlsPolicyRequirement[] = [
  { table: 'products', policyName: 'Store owners can manage their products' },
  { table: 'orders', policyName: 'Store owners can view their orders' },
  { table: 'customers', policyName: 'Store owners can view their customers' },
];

export function buildStorePolicyPattern(table: string, policyName: string): RegExp {
  const escaped = policyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`CREATE\\s+POLICY\\s+"${escaped}"\\s+ON\\s+public\\.${table}\\b`, 'i');
}
