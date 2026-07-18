import { describe, expect, it, vi } from 'vitest';
import {
  normalizeStoreCreateInput,
  validateNormalizedCreateInput,
} from '@/lib/store/create-store-service';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

describe('create-store-service', () => {
  it('normalizes slug from name', () => {
    const normalized = normalizeStoreCreateInput({
      name: 'Ma Boutique Test',
      commerce_type: 'digital',
    });
    expect(normalized.slug).toBe('ma-boutique-test');
    expect(normalized.commerce_type).toBe('digital');
  });

  it('rejects slug shorter than 2 characters', () => {
    const normalized = normalizeStoreCreateInput({
      name: 'x',
      commerce_type: 'physical',
    });
    const result = validateNormalizedCreateInput(normalized);
    expect(result.valid).toBe(false);
    expect(result.errors.slug).toBeDefined();
  });

  it('accepts valid create payload', () => {
    const normalized = normalizeStoreCreateInput({
      name: 'Boutique Pro',
      slug: 'boutique-pro',
      description: 'Ma desc',
      commerce_type: 'service',
    });
    const result = validateNormalizedCreateInput(normalized);
    expect(result.valid).toBe(true);
    expect(result.data?.slug).toBe('boutique-pro');
  });
});
