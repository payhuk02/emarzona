import type { ServiceCategoryRow } from '@/lib/services/service-categories';
import {
  buildServiceCreateFields,
  resolveServiceCategoryFromRows,
} from '../build-service-import-payload';

function cat(id: string, slug: string, name: string, parent_id: string | null): ServiceCategoryRow {
  return {
    id,
    slug,
    name,
    parent_id,
    description: null,
    icon: null,
    image_url: null,
    sort_order: 0,
    is_active: true,
    product_types: ['service'],
    created_at: '',
    updated_at: '',
  };
}

const parentId = '11111111-1111-4111-8111-111111111111';
const leafId = '22222222-2222-4222-8222-222222222222';
const rows: ServiceCategoryRow[] = [
  cat(parentId, 'svc-informatique-technologie', 'Informatique', null),
  cat(leafId, 'svc-developpement-web', 'Développement web', parentId),
];

describe('resolveServiceCategoryFromRows', () => {
  it('resolves a leaf slug to category_id', () => {
    const resolved = resolveServiceCategoryFromRows(rows, { category: 'svc-developpement-web' });
    expect(resolved.category_id).toBe(leafId);
    expect(resolved.leafSlug).toBe('svc-developpement-web');
    expect(resolved.parentSlug).toBe('svc-informatique-technologie');
  });

  it('resolves a leaf name case-insensitively', () => {
    const resolved = resolveServiceCategoryFromRows(rows, { category: 'développement web' });
    expect(resolved.category_id).toBe(leafId);
  });

  it('does not set category_id for a family slug (wizard requires a leaf)', () => {
    const resolved = resolveServiceCategoryFromRows(rows, {
      category: 'svc-informatique-technologie',
    });
    expect(resolved.category_id).toBeNull();
    expect(resolved.parentSlug).toBe('svc-informatique-technologie');
    expect(resolved.leafSlug).toBeNull();
  });

  it('keeps unknown labels as category text', () => {
    const resolved = resolveServiceCategoryFromRows(rows, { category: 'Coaching custom' });
    expect(resolved.category_id).toBeNull();
    expect(resolved.category).toBe('Coaching custom');
  });
});

describe('buildServiceCreateFields', () => {
  it('uses the web-dev profile (project, online, no staff)', () => {
    const resolved = resolveServiceCategoryFromRows(rows, { category: 'svc-developpement-web' });
    const fields = buildServiceCreateFields(resolved);
    expect(fields.fulfillment_mode).toBe('project');
    expect(fields.location_type).toBe('online');
    expect(fields.requires_staff).toBe(false);
    expect(fields.pricing_type).toBe('fixed');
  });

  it('lets CSV duration and location override the profile', () => {
    const resolved = resolveServiceCategoryFromRows(rows, { category: 'svc-developpement-web' });
    const fields = buildServiceCreateFields(resolved, {
      duration_minutes: '90',
      location_type: 'on_site',
      pricing_type: 'hourly',
    });
    expect(fields.duration_minutes).toBe(90);
    expect(fields.location_type).toBe('on_site');
    expect(fields.pricing_type).toBe('per_hour');
  });

  it('falls back to an online appointment when the category is unknown', () => {
    const resolved = resolveServiceCategoryFromRows(rows, { category: 'Inconnu' });
    const fields = buildServiceCreateFields(resolved);
    expect(fields.duration_minutes).toBe(60);
    expect(fields.location_type).toBe('online');
    expect(fields.requires_staff).toBe(false);
    expect(fields.fulfillment_mode).toBe('appointment');
  });
});
