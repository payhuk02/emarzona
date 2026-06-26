import { supabase } from '@/integrations/supabase/client';
import type { PhysicalProductVariant } from '@/types/physical-product';
import type { PhysicalInventoryRow } from '@/lib/physical/physical-product-display';

export const STORE_PUBLIC_FIELDS = 'id, name, slug, logo_url';
export const PRODUCT_PHYSICAL_FIELDS =
  'id, store_id, slug, name, description, short_description, category, tags, product_type, is_active, price, promotional_price, currency, image_url, images, stock, created_at, updated_at, payment_options, pricing_model, licensing_type, license_terms';
export const PHYSICAL_PRODUCT_FIELDS =
  'id, product_id, store_id, sku, manufacturer, country_of_origin, weight, weight_unit, height, length, width, dimensions_unit, whatsapp_number, whatsapp_enabled, created_at, updated_at';
export const PHYSICAL_VARIANT_FIELDS =
  'id, physical_product_id, store_id, name, sku, price, compare_at_price, is_active, attributes, created_at, updated_at';
export const PHYSICAL_INVENTORY_FIELDS =
  'id, physical_product_id, product_id, store_id, variant_id, quantity, quantity_available, available_quantity, reserved_quantity, quantity_reserved, low_stock_threshold, location, warehouse_id, created_at, updated_at';

export type PhysicalProductDetailStore = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type PhysicalProductDetailData = {
  id: string;
  store_id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  tags: string[] | null;
  product_type: string;
  is_active: boolean;
  price: number;
  promotional_price: number | null;
  currency: string;
  image_url: string | null;
  images: string[] | null;
  stock: number | null;
  created_at: string;
  updated_at: string;
  physical: Record<string, unknown> | null;
  variants: PhysicalProductVariant[];
  inventory: PhysicalInventoryRow[];
  size_chart_id: string | null;
  store: PhysicalProductDetailStore | null;
};

export async function fetchPhysicalProductDetail(
  productId: string
): Promise<PhysicalProductDetailData> {
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(
      `
      ${PRODUCT_PHYSICAL_FIELDS},
      stores (
        ${STORE_PUBLIC_FIELDS}
      )
    `
    )
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  const { data: physicalData, error: physicalError } = await supabase
    .from('physical_products')
    .select(PHYSICAL_PRODUCT_FIELDS)
    .eq('product_id', productId)
    .maybeSingle();

  if (physicalError) throw physicalError;

  const physicalId = physicalData?.id ?? null;

  const [variantsResult, inventoryResult, sizeChartResult] = await Promise.all([
    physicalId
      ? supabase
          .from('physical_product_variants')
          .select(PHYSICAL_VARIANT_FIELDS)
          .eq('physical_product_id', physicalId)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('physical_product_inventory')
      .select(PHYSICAL_INVENTORY_FIELDS)
      .eq('product_id', productId),
    supabase
      .from('product_size_charts')
      .select('size_chart_id')
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (variantsResult.error) throw variantsResult.error;
  if (inventoryResult.error) throw inventoryResult.error;
  if (sizeChartResult.error) throw sizeChartResult.error;

  const variants = (variantsResult.data ?? []) as PhysicalProductVariant[];
  let inventory = (inventoryResult.data ?? []) as PhysicalInventoryRow[];

  if (physicalId && inventory.length === 0) {
    const { data: inventoryByPhysical, error: inventoryPhysicalError } = await supabase
      .from('physical_product_inventory')
      .select(PHYSICAL_INVENTORY_FIELDS)
      .eq('physical_product_id', physicalId);

    if (inventoryPhysicalError) throw inventoryPhysicalError;
    inventory = (inventoryByPhysical ?? []) as PhysicalInventoryRow[];
  }

  const storeRaw = productData.stores as
    | PhysicalProductDetailStore
    | PhysicalProductDetailStore[]
    | null;
  const store = Array.isArray(storeRaw) ? (storeRaw[0] ?? null) : storeRaw;

  return {
    ...(productData as Omit<
      PhysicalProductDetailData,
      'physical' | 'variants' | 'inventory' | 'size_chart_id' | 'store'
    >),
    physical: physicalData,
    variants,
    inventory,
    size_chart_id: sizeChartResult.data?.size_chart_id ?? null,
    store,
  };
}
