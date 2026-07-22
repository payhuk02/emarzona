import { describe, expect, it } from 'vitest';
import {
  buildCreateStoreInsertPayload,
  normalizeExpressSlugPreview,
  toMinimalStoreCreateInsert,
} from '@/lib/store/store-express-create-schema';

describe('store-express-create-schema', () => {
  it('builds insert payload with forced server fields', () => {
    const payload = buildCreateStoreInsertPayload({
      validated: {
        name: 'Ma Boutique',
        slug: 'ma-boutique',
        description: '',
        default_currency: 'XOF',
        commerce_type: 'digital',
      },
      commerceType: 'digital',
      userId: 'user-123',
      themeTemplateId: 'dark-mode',
      writableFields: { is_active: false, user_id: 'evil' },
    });

    expect(payload.name).toBe('Ma Boutique');
    expect(payload.slug).toBe('ma-boutique');
    expect(payload.user_id).toBe('user-123');
    expect(payload.is_active).toBe(true);
    expect(payload.commerce_type).toBe('digital');
    expect(payload.metadata).toEqual({ commerce_type: 'digital' });
    expect(payload.primary_color).toBeDefined();
  });

  it('toMinimalStoreCreateInsert keeps only safe stores columns', () => {
    const minimal = toMinimalStoreCreateInsert({
      user_id: 'u1',
      name: 'N',
      slug: 'n',
      description: null,
      default_currency: 'XOF',
      commerce_type: 'physical',
      metadata: { commerce_type: 'physical' },
      is_active: true,
      timezone: 'Africa/Ouagadougou',
      opening_hours: {},
      primary_color: '#000',
      free_shipping_threshold: null,
    });

    expect(Object.keys(minimal).sort()).toEqual(
      [
        'commerce_type',
        'default_currency',
        'description',
        'is_active',
        'metadata',
        'name',
        'slug',
        'user_id',
      ].sort()
    );
  });

  it('normalizes slug preview from name', () => {
    expect(normalizeExpressSlugPreview('Ma Super Boutique')).toBe('ma-super-boutique');
  });
});
