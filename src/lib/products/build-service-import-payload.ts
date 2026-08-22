import {
  fetchServiceCategories,
  findCategoryById,
  findCategoryBySlug,
  type ServiceCategoryRow,
} from '@/lib/services/service-categories';
import { getServiceFormProfile } from '@/lib/services/service-form-profiles';
import { toPersistedPricingType } from '@/lib/service/service-pricing';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FALLBACK_SERVICE = {
  duration_minutes: 60,
  location_type: 'online',
  pricing_type: 'fixed',
  fulfillment_mode: 'appointment',
  service_type: 'other',
  requires_staff: false,
} as const;

export type ServiceImportHints = {
  category?: string | null;
  category_id?: string | null;
  duration_minutes?: number | string | null;
  location_type?: string | null;
  pricing_type?: string | null;
  fulfillment_mode?: string | null;
  service_type?: string | null;
};

export type ResolvedServiceImportCategory = {
  category: string | null;
  category_id: string | null;
  parentSlug: string | null;
  leafSlug: string | null;
};

export type ServiceCreateFields = {
  duration_minutes: number;
  location_type: string;
  pricing_type: string;
  fulfillment_mode: string;
  service_type: string;
  requires_staff: boolean;
};

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function findCategoryByName(rows: ServiceCategoryRow[], name: string): ServiceCategoryRow | null {
  const needle = name.trim().toLowerCase();
  if (!needle) return null;
  return rows.find(row => row.name.trim().toLowerCase() === needle) ?? null;
}

export function resolveServiceCategoryFromRows(
  rows: ServiceCategoryRow[],
  hints: Pick<ServiceImportHints, 'category' | 'category_id'>
): ResolvedServiceImportCategory {
  const empty: ResolvedServiceImportCategory = {
    category: null,
    category_id: null,
    parentSlug: null,
    leafSlug: null,
  };

  const hint = (hints.category_id || hints.category || '').trim();
  if (!hint) return empty;

  let match: ServiceCategoryRow | null = null;
  if (isUuid(hint)) {
    match = findCategoryById(rows, hint);
  } else {
    match = findCategoryBySlug(rows, hint) ?? findCategoryByName(rows, hint);
  }

  if (!match) {
    return { ...empty, category: hint };
  }

  const parent = match.parent_id ? findCategoryById(rows, match.parent_id) : null;
  const isLeaf = Boolean(match.parent_id);
  return {
    category: isLeaf ? match.slug : match.slug,
    category_id: isLeaf ? match.id : null,
    parentSlug: parent?.slug ?? (isLeaf ? null : match.slug),
    leafSlug: isLeaf ? match.slug : null,
  };
}

function parseDuration(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseInt(value.replace(/\s/g, ''), 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function buildServiceCreateFields(
  resolved: ResolvedServiceImportCategory,
  overrides: ServiceImportHints = {}
): ServiceCreateFields {
  const profile = getServiceFormProfile(resolved.parentSlug, resolved.leafSlug);
  const defaults = profile?.defaults;

  return {
    duration_minutes:
      parseDuration(overrides.duration_minutes) ??
      defaults?.duration_minutes ??
      FALLBACK_SERVICE.duration_minutes,
    location_type:
      overrides.location_type || defaults?.location_type || FALLBACK_SERVICE.location_type,
    pricing_type: toPersistedPricingType(
      overrides.pricing_type || defaults?.pricing_type || FALLBACK_SERVICE.pricing_type
    ),
    fulfillment_mode:
      overrides.fulfillment_mode || defaults?.fulfillment_mode || FALLBACK_SERVICE.fulfillment_mode,
    service_type: overrides.service_type || defaults?.service_type || FALLBACK_SERVICE.service_type,
    requires_staff: defaults?.requires_staff ?? FALLBACK_SERVICE.requires_staff,
  };
}

let categoriesCache: { at: number; rows: ServiceCategoryRow[] } | null = null;
const CATEGORIES_TTL_MS = 60_000;

async function loadServiceCategoriesCached(): Promise<ServiceCategoryRow[]> {
  if (categoriesCache && Date.now() - categoriesCache.at < CATEGORIES_TTL_MS) {
    return categoriesCache.rows;
  }
  const rows = await fetchServiceCategories({ activeOnly: true });
  categoriesCache = { at: Date.now(), rows };
  return rows;
}

export async function buildServiceImportPayload(hints: ServiceImportHints): Promise<{
  category: string | null;
  category_id: string | null;
  service: ServiceCreateFields;
}> {
  const rows = await loadServiceCategoriesCached();
  const resolved = resolveServiceCategoryFromRows(rows, hints);
  return {
    category: resolved.category,
    category_id: resolved.category_id,
    service: buildServiceCreateFields(resolved, hints),
  };
}
