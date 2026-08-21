import { describe, expect, it } from 'vitest';
import {
  buildServiceCategoryTree,
  formatServiceCategoryLabel,
  resolveServiceCategorySelection,
  type ServiceCategoryRow,
} from '@/lib/services/service-categories';
import { validateServiceWizardStep } from '@/lib/service-wizard-step-validation';

const parentId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const otherParentId = '33333333-3333-4333-8333-333333333333';

function row(
  partial: Pick<ServiceCategoryRow, 'id' | 'name' | 'slug' | 'parent_id'>
): ServiceCategoryRow {
  return {
    description: null,
    icon: null,
    image_url: null,
    sort_order: 0,
    is_active: true,
    product_types: ['service'],
    created_at: '',
    updated_at: '',
    ...partial,
  };
}

describe('resolveServiceCategorySelection', () => {
  const tree = buildServiceCategoryTree([
    row({ id: parentId, name: 'Conseil', slug: 'svc-conseil', parent_id: null }),
    row({ id: childId, name: 'Juridique', slug: 'svc-juridique', parent_id: parentId }),
    row({ id: otherParentId, name: 'Beauté', slug: 'svc-beaute', parent_id: null }),
  ]);

  it('derives the parent from the selected leaf even if parent_category_id is stale', () => {
    const resolved = resolveServiceCategorySelection(tree, otherParentId, childId);
    expect(resolved.error).toBeNull();
    expect(resolved.parentId).toBe(parentId);
    expect(resolved.categoryId).toBe(childId);
    expect(resolved.categorySlug).toBe('svc-juridique');
  });

  it('rejects a parent UUID stored as category_id', () => {
    const resolved = resolveServiceCategorySelection(tree, parentId, parentId);
    expect(resolved.categoryId).toBeNull();
    expect(resolved.parentId).toBe(parentId);
    expect(resolved.error).toMatch(/sous-catégorie/i);
  });

  it('requires a subcategory when only the parent is selected', () => {
    const resolved = resolveServiceCategorySelection(tree, parentId, null);
    expect(resolved.error).toMatch(/sous-catégorie/i);
    expect(resolved.categoryId).toBeNull();
  });
});

describe('formatServiceCategoryLabel', () => {
  const rows = [
    row({ id: parentId, name: 'Conseil', slug: 'svc-conseil', parent_id: null }),
    row({ id: childId, name: 'Juridique', slug: 'svc-juridique', parent_id: parentId }),
  ];

  it('joins parent and leaf names', () => {
    expect(
      formatServiceCategoryLabel(rows, { categoryId: childId, categorySlug: 'svc-juridique' })
    ).toBe('Conseil · Juridique');
  });
});

describe('validateServiceWizardStep category pair', () => {
  const tree = buildServiceCategoryTree([
    row({ id: parentId, name: 'Conseil', slug: 'svc-conseil', parent_id: null }),
    row({ id: childId, name: 'Juridique', slug: 'svc-juridique', parent_id: parentId }),
  ]);

  const baseForm = {
    name: 'Consultation E2E',
    slug: 'consultation-e2e',
    description: 'Description du service de consultation pour les tests.',
    price: 25000,
    promotional_price: 15000,
    duration_minutes: 60,
    max_participants: 1,
    location_type: 'online',
    meeting_url: 'https://meet.example.com/room',
    category_id: childId,
    parent_category_id: parentId,
  };

  it('accepts a leaf that belongs to the selected parent', () => {
    expect(validateServiceWizardStep(1, baseForm, { categoryTree: tree }).valid).toBe(true);
  });

  it('rejects a parent selected as the subcategory', () => {
    const result = validateServiceWizardStep(
      1,
      { ...baseForm, category_id: parentId, parent_category_id: parentId },
      { categoryTree: tree }
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(msg => msg.toLowerCase().includes('sous-catégorie'))).toBe(true);
  });
});
