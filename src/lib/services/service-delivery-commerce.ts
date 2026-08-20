import { supabase } from '@/integrations/supabase/client';

export type DeliveryPackageTier = 'basic' | 'standard' | 'premium' | 'custom';

export type ServiceDeliveryPackage = {
  id: string;
  service_product_id: string;
  product_id: string | null;
  store_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  package_kind: 'delivery_tier';
  tier: DeliveryPackageTier;
  price: number;
  compare_at_price: number | null;
  delivery_days: number;
  revisions: number;
  features: string[];
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
};

export type ServiceGigExtra = {
  id: string;
  service_product_id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  extra_days: number;
  is_active: boolean;
  display_order: number;
};

export type ServiceBriefFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'file'
  | 'image'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'phone'
  | 'number';

export type ServiceBriefField = {
  id: string;
  label: string;
  type: ServiceBriefFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

const PACKAGE_FIELDS = `
  id, service_product_id, product_id, store_id, name, description, slug,
  package_kind, tier, price, compare_at_price, delivery_days, revisions,
  features, sort_order, is_active, is_featured
`;

const EXTRA_FIELDS = `
  id, service_product_id, store_id, name, description, price, currency,
  extra_days, is_active, display_order
`;

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function mapPackage(row: Record<string, unknown>): ServiceDeliveryPackage {
  const features = Array.isArray(row.features) ? (row.features as unknown[]).map(String) : [];
  return {
    id: String(row.id),
    service_product_id: String(row.service_product_id),
    product_id: (row.product_id as string) ?? null,
    store_id: String(row.store_id),
    name: String(row.name ?? ''),
    description: (row.description as string) ?? null,
    slug: (row.slug as string) ?? null,
    package_kind: 'delivery_tier',
    tier: (row.tier as DeliveryPackageTier) || 'custom',
    price: Number(row.price ?? 0),
    compare_at_price: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    delivery_days: Number(row.delivery_days ?? 3),
    revisions: Number(row.revisions ?? 1),
    features,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active ?? true),
    is_featured: Boolean(row.is_featured ?? false),
  };
}

export async function fetchDeliveryPackages(
  serviceProductId: string
): Promise<ServiceDeliveryPackage[]> {
  const { data, error } = await supabase
    .from('service_packages')
    .select(PACKAGE_FIELDS)
    .eq('service_product_id', serviceProductId)
    .eq('package_kind', 'delivery_tier')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return ((data as Record<string, unknown>[]) ?? []).map(mapPackage);
}

export async function replaceDeliveryPackages(input: {
  serviceProductId: string;
  productId: string;
  storeId: string;
  packages: Array<{
    id?: string;
    name: string;
    tier: DeliveryPackageTier;
    description?: string;
    price: number;
    delivery_days: number;
    revisions: number;
    features: string[];
    is_active?: boolean;
    is_featured?: boolean;
    sort_order?: number;
  }>;
}): Promise<ServiceDeliveryPackage[]> {
  const { error: delError } = await supabase
    .from('service_packages')
    .delete()
    .eq('service_product_id', input.serviceProductId)
    .eq('package_kind', 'delivery_tier');
  if (delError) throw delError;

  if (input.packages.length === 0) return [];

  const rows = input.packages.map((pkg, index) => ({
    service_product_id: input.serviceProductId,
    product_id: input.productId,
    store_id: input.storeId,
    name: pkg.name,
    package_name: pkg.name,
    description: pkg.description ?? null,
    slug: `${slugify(pkg.name)}-${pkg.tier}-${index}`,
    package_kind: 'delivery_tier',
    tier: pkg.tier,
    price: pkg.price,
    package_price: pkg.price,
    delivery_days: pkg.delivery_days,
    revisions: pkg.revisions,
    features: pkg.features,
    sort_order: pkg.sort_order ?? index,
    is_active: pkg.is_active ?? true,
    is_featured: pkg.is_featured ?? pkg.tier === 'standard',
    sessions_count: null,
    credits_per_session: null,
    total_sessions: 1,
  }));

  const { data, error } = await supabase
    .from('service_packages')
    .insert(rows)
    .select(PACKAGE_FIELDS);
  if (error) throw error;
  return ((data as Record<string, unknown>[]) ?? []).map(mapPackage);
}

export async function fetchGigExtras(serviceProductId: string): Promise<ServiceGigExtra[]> {
  const { data, error } = await supabase
    .from('service_gig_extras')
    .select(EXTRA_FIELDS)
    .eq('service_product_id', serviceProductId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceGigExtra[];
}

export async function replaceGigExtras(input: {
  serviceProductId: string;
  storeId: string;
  extras: Array<{
    name: string;
    description?: string;
    price: number;
    extra_days?: number;
    currency?: string;
    is_active?: boolean;
    display_order?: number;
  }>;
}): Promise<ServiceGigExtra[]> {
  const { error: delError } = await supabase
    .from('service_gig_extras')
    .delete()
    .eq('service_product_id', input.serviceProductId);
  if (delError) throw delError;

  if (input.extras.length === 0) return [];

  const rows = input.extras.map((extra, index) => ({
    service_product_id: input.serviceProductId,
    store_id: input.storeId,
    name: extra.name,
    description: extra.description ?? null,
    price: extra.price,
    currency: extra.currency ?? 'XOF',
    extra_days: extra.extra_days ?? 0,
    is_active: extra.is_active ?? true,
    display_order: extra.display_order ?? index,
  }));

  const { data, error } = await supabase
    .from('service_gig_extras')
    .insert(rows)
    .select(EXTRA_FIELDS);
  if (error) throw error;
  return (data ?? []) as ServiceGigExtra[];
}

export async function updateServiceBriefFields(
  serviceProductId: string,
  briefFields: ServiceBriefField[]
): Promise<void> {
  const { error } = await supabase
    .from('service_products')
    .update({ brief_fields: briefFields, updated_at: new Date().toISOString() })
    .eq('id', serviceProductId);
  if (error) throw error;
}

export async function fetchServiceBriefFields(
  serviceProductId: string
): Promise<ServiceBriefField[]> {
  const { data, error } = await supabase
    .from('service_products')
    .select('brief_fields')
    .eq('id', serviceProductId)
    .maybeSingle();
  if (error) throw error;
  const fields = data?.brief_fields;
  return Array.isArray(fields) ? (fields as ServiceBriefField[]) : [];
}

export function computeProjectQuote(input: {
  packagePrice: number;
  extras: Array<{ price: number; extra_days: number }>;
  selectedExtraIndexes: number[];
  deliveryDays: number;
}): { totalPrice: number; totalDays: number } {
  const selected = input.selectedExtraIndexes.map(i => input.extras[i]).filter(Boolean);
  const extrasPrice = selected.reduce((sum, e) => sum + Number(e.price || 0), 0);
  const extrasDays = selected.reduce((sum, e) => sum + Number(e.extra_days || 0), 0);
  return {
    totalPrice: Number(input.packagePrice || 0) + extrasPrice,
    totalDays: Number(input.deliveryDays || 0) + extrasDays,
  };
}
