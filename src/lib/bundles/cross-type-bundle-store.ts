import { supabase } from '@/integrations/supabase/client';
import type { CrossTypeBundleLine } from '@/lib/checkout/cross-type-bundle';
import { validateCrossTypeBundleLines } from '@/lib/checkout/cross-type-bundle';
import { buildCrossTypeBundleCartItem } from '@/lib/cart/cross-type-bundle-cart';
import type { CartItem, ProductType } from '@/types/cart';

export const CROSS_TYPE_BUNDLE_KIND = 'cross_type' as const;

export type CrossTypeBundleRow = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  bundle_price: number;
  original_price: number;
  discount_percentage: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type CrossTypeBundleWithItems = CrossTypeBundleRow & {
  items: CrossTypeBundleLine[];
};

const BUNDLE_FIELDS =
  'id, store_id, name, description, bundle_price, original_price, discount_percentage, is_active, created_at';

const BUNDLE_ITEM_SELECT = `
  id,
  bundle_id,
  product_id,
  variant_id,
  quantity,
  price,
  product:products!inner(
    id,
    name,
    product_type,
    price,
    promotional_price
  )
`;

export type StoreProductForBundlePicker = {
  id: string;
  name: string;
  product_type: ProductType;
  price: number;
  promotional_price: number | null;
  currency: string | null;
  image_url: string | null;
};

export async function fetchStoreProductsForBundlePicker(
  storeId: string
): Promise<StoreProductForBundlePicker[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, product_type, price, promotional_price, currency, image_url')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .neq('product_type', 'service')
    .order('name');

  if (error) throw error;
  return (data ?? []) as StoreProductForBundlePicker[];
}

function listPrice(product: { price: number; promotional_price: number | null }): number {
  return Number(product.promotional_price ?? product.price ?? 0);
}

export function mapBundleItemRowToLine(row: Record<string, unknown>): CrossTypeBundleLine {
  const product = row.product as Record<string, unknown>;
  return {
    product_id: String(row.product_id),
    product_type: product.product_type as ProductType,
    product_name: String(product.name),
    quantity: Number(row.quantity ?? 1),
    list_price: Number(row.price ?? listPrice(product as never)),
    variant_id: row.variant_id ? String(row.variant_id) : null,
  };
}

export async function fetchCrossTypeBundleLines(bundleId: string): Promise<CrossTypeBundleLine[]> {
  const { data, error } = await supabase
    .from('bundle_items')
    .select(BUNDLE_ITEM_SELECT)
    .eq('bundle_id', bundleId)
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map(row => mapBundleItemRowToLine(row as Record<string, unknown>));
}

export async function fetchCrossTypeBundleWithItems(
  bundleId: string
): Promise<CrossTypeBundleWithItems | null> {
  const { data: bundle, error: bundleError } = await supabase
    .from('product_bundles')
    .select(BUNDLE_FIELDS)
    .eq('id', bundleId)
    .eq('type', CROSS_TYPE_BUNDLE_KIND)
    .maybeSingle();

  if (bundleError) throw bundleError;
  if (!bundle) return null;

  const items = await fetchCrossTypeBundleLines(bundleId);
  return { ...(bundle as CrossTypeBundleRow), items };
}

export async function listCrossTypeBundles(storeId: string): Promise<CrossTypeBundleRow[]> {
  const { data, error } = await supabase
    .from('product_bundles')
    .select(BUNDLE_FIELDS)
    .eq('store_id', storeId)
    .eq('type', CROSS_TYPE_BUNDLE_KIND)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CrossTypeBundleRow[];
}

export function assertCrossTypeBundleLines(lines: CrossTypeBundleLine[]): void {
  const validation = validateCrossTypeBundleLines(lines);
  if (!validation.ok) {
    throw new Error(validation.message ?? 'Bundle cross-type invalide');
  }
}

export function buildCartItemFromCrossTypeBundle(
  bundle: CrossTypeBundleWithItems,
  currency = 'XOF'
): CartItem {
  assertCrossTypeBundleLines(bundle.items);
  return buildCrossTypeBundleCartItem({
    bundleId: bundle.id,
    bundleName: bundle.name,
    bundlePrice: bundle.bundle_price,
    storeId: bundle.store_id,
    currency,
    lines: bundle.items,
  });
}

export async function createCrossTypeBundle(input: {
  storeId: string;
  name: string;
  description?: string;
  bundlePrice: number;
  lines: CrossTypeBundleLine[];
}): Promise<CrossTypeBundleRow> {
  assertCrossTypeBundleLines(input.lines);

  const originalPrice = input.lines.reduce((sum, line) => sum + line.list_price * line.quantity, 0);
  const discountAmount = originalPrice - input.bundlePrice;
  const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

  const { data: bundle, error: bundleError } = await supabase
    .from('product_bundles')
    .insert({
      store_id: input.storeId,
      name: input.name,
      description: input.description ?? null,
      type: CROSS_TYPE_BUNDLE_KIND,
      original_price: originalPrice,
      bundle_price: input.bundlePrice,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
      is_active: true,
      show_savings: true,
      show_individual_prices: true,
      track_inventory: false,
    })
    .select(BUNDLE_FIELDS)
    .single();

  if (bundleError) throw bundleError;

  const itemsToInsert = input.lines.map((line, index) => ({
    bundle_id: bundle.id,
    product_id: line.product_id,
    variant_id: line.variant_id ?? null,
    quantity: line.quantity,
    price: line.list_price,
    is_required: true,
    display_order: index,
  }));

  const { error: itemsError } = await supabase.from('bundle_items').insert(itemsToInsert);
  if (itemsError) throw itemsError;

  return bundle as CrossTypeBundleRow;
}

export async function deleteCrossTypeBundle(bundleId: string): Promise<void> {
  const { error } = await supabase.from('product_bundles').delete().eq('id', bundleId);
  if (error) throw error;
}

export async function setCrossTypeBundleActive(bundleId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('product_bundles')
    .update({ is_active: isActive })
    .eq('id', bundleId)
    .eq('type', CROSS_TYPE_BUNDLE_KIND);

  if (error) throw error;
}
