/**
 * Produits complémentaires service + addon (Phase 4 audit J+90).
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProductType } from '@/types/cart';

export const SERVICE_ADDON_PRODUCT_TYPES: ProductType[] = ['digital', 'physical'];

export type ServiceProductAddonRow = {
  id: string;
  service_product_id: string;
  addon_product_id: string;
  store_id: string;
  quantity: number;
  is_required: boolean;
  display_order: number;
};

export type ServiceProductAddonWithProduct = ServiceProductAddonRow & {
  addon: {
    id: string;
    name: string;
    slug: string | null;
    product_type: ProductType;
    price: number;
    promotional_price: number | null;
    currency: string;
    image_url: string | null;
    is_active: boolean;
  };
};

export function addonEffectivePrice(addon: ServiceProductAddonWithProduct['addon']): number {
  return addon.promotional_price ?? addon.price;
}

export function validateServiceAddonProductType(productType: string): boolean {
  return SERVICE_ADDON_PRODUCT_TYPES.includes(productType as ProductType);
}

export function validateServiceAddonSelection(
  addons: ServiceProductAddonWithProduct[],
  selectedAddonProductIds: string[]
): { ok: boolean; message?: string } {
  const required = addons.filter(a => a.is_required);
  for (const req of required) {
    if (!selectedAddonProductIds.includes(req.addon_product_id)) {
      return {
        ok: false,
        message: `Le produit « ${req.addon.name} » est obligatoire avec ce service.`,
      };
    }
  }
  return { ok: true };
}

export async function fetchServiceProductAddons(
  serviceProductId: string
): Promise<ServiceProductAddonWithProduct[]> {
  const { data: rows, error } = await supabase
    .from('service_product_addons')
    .select(
      'id, service_product_id, addon_product_id, store_id, quantity, is_required, display_order'
    )
    .eq('service_product_id', serviceProductId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  if (!rows?.length) return [];

  const productIds = rows.map(r => r.addon_product_id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(
      'id, name, slug, product_type, price, promotional_price, currency, image_url, is_active'
    )
    .in('id', productIds);

  if (productsError) throw productsError;

  const productById = new Map((products ?? []).map(p => [p.id, p]));

  return rows
    .map(row => {
      const addon = productById.get(row.addon_product_id);
      if (!addon || !validateServiceAddonProductType(addon.product_type)) return null;
      return {
        ...row,
        is_required: row.is_required ?? false,
        addon: addon as ServiceProductAddonWithProduct['addon'],
      };
    })
    .filter((row): row is ServiceProductAddonWithProduct => row !== null);
}

export async function fetchStoreProductsForServiceAddonPicker(
  storeId: string,
  excludeProductId?: string
): Promise<
  Array<{
    id: string;
    name: string;
    product_type: ProductType;
    price: number;
    currency: string;
  }>
> {
  let query = supabase
    .from('products')
    .select('id, name, product_type, price, currency')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .in('product_type', SERVICE_ADDON_PRODUCT_TYPES)
    .order('name');

  if (excludeProductId) {
    query = query.neq('id', excludeProductId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    name: string;
    product_type: ProductType;
    price: number;
    currency: string;
  }>;
}

export async function createServiceProductAddon(input: {
  serviceProductId: string;
  addonProductId: string;
  storeId: string;
  quantity?: number;
  isRequired?: boolean;
  displayOrder?: number;
}): Promise<void> {
  const { error } = await supabase.from('service_product_addons').insert({
    service_product_id: input.serviceProductId,
    addon_product_id: input.addonProductId,
    store_id: input.storeId,
    quantity: input.quantity ?? 1,
    is_required: input.isRequired ?? false,
    display_order: input.displayOrder ?? 0,
  });
  if (error) throw error;
}

export async function deleteServiceProductAddon(addonRowId: string): Promise<void> {
  const { error } = await supabase.from('service_product_addons').delete().eq('id', addonRowId);
  if (error) throw error;
}
