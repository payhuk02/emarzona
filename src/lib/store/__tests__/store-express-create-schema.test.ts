import { describe, expect, it } from 'vitest';
import {
  buildCreateStoreInsertPayload,
  normalizeExpressSlugPreview,
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

  it('normalizes slug preview from name', () => {
    expect(normalizeExpressSlugPreview('Ma Super Boutique')).toBe('ma-super-boutique');
  });
});
