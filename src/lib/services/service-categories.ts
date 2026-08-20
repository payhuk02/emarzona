import { supabase } from '@/integrations/supabase/client';

export type ServiceCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  product_types: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ServiceCategoryTreeNode = ServiceCategoryRow & {
  children: ServiceCategoryRow[];
};

const CATEGORY_FIELDS = `
  id,
  name,
  slug,
  description,
  icon,
  image_url,
  parent_id,
  sort_order,
  is_active,
  product_types,
  created_at,
  updated_at
`;

export async function fetchServiceCategories(options?: {
  activeOnly?: boolean;
  includeInactive?: boolean;
}): Promise<ServiceCategoryRow[]> {
  const activeOnly = options?.activeOnly ?? true;
  // product_types / icon / image_url added in P0 migration — cast until types regenerate
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('categories')
    .select(CATEGORY_FIELDS)
    .filter('product_types', 'cs', '{service}')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (activeOnly && !options?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ServiceCategoryRow[];
}

export function buildServiceCategoryTree(rows: ServiceCategoryRow[]): ServiceCategoryTreeNode[] {
  const parents = rows
    .filter(r => !r.parent_id)
    .map(p => ({
      ...p,
      children: rows
        .filter(c => c.parent_id === p.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    }));
  return parents.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function findCategoryById(
  rows: ServiceCategoryRow[],
  id: string | null | undefined
): ServiceCategoryRow | null {
  if (!id) return null;
  return rows.find(r => r.id === id) ?? null;
}

export function findCategoryBySlug(
  rows: ServiceCategoryRow[],
  slug: string | null | undefined
): ServiceCategoryRow | null {
  if (!slug) return null;
  return rows.find(r => r.slug === slug) ?? null;
}

export function getCategoryBreadcrumb(
  rows: ServiceCategoryRow[],
  leafId: string | null | undefined
): { parent: ServiceCategoryRow | null; leaf: ServiceCategoryRow | null } {
  const leaf = findCategoryById(rows, leafId);
  if (!leaf) return { parent: null, leaf: null };
  const parent = leaf.parent_id ? findCategoryById(rows, leaf.parent_id) : null;
  return { parent, leaf };
}

export async function upsertServiceCategory(input: {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
  is_active?: boolean;
}): Promise<ServiceCategoryRow> {
  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: input.description ?? null,
    icon: input.icon ?? null,
    image_url: input.image_url ?? null,
    parent_id: input.parent_id ?? null,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
    product_types: ['service'],
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('categories') as any)
      .update(payload)
      .eq('id', input.id)
      .select(CATEGORY_FIELDS)
      .single();
    if (error) throw error;
    return data as ServiceCategoryRow;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('categories') as any)
    .insert(payload)
    .select(CATEGORY_FIELDS)
    .single();
  if (error) throw error;
  return data as ServiceCategoryRow;
}

export async function setServiceCategoryActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteServiceCategoryIfUnused(
  id: string
): Promise<'deleted' | 'deactivated'> {
  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if (countError) throw countError;

  if ((count ?? 0) > 0) {
    await setServiceCategoryActive(id, false);
    return 'deactivated';
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  return 'deleted';
}

export async function reorderServiceCategories(
  items: Array<{ id: string; sort_order: number }>
): Promise<void> {
  await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase
        .from('categories')
        .update({ sort_order, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  );
}

export function slugifyCategoryName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base.startsWith('svc-') ? base : `svc-${base}`;
}
