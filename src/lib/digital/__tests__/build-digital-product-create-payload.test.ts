import { describe, expect, it } from 'vitest';
import { buildDigitalProductCreatePayloads } from '@/lib/digital/build-digital-product-create-payload';
import type { DigitalProductFormData } from '@/types/digital-product-form';

const baseFormData = (): DigitalProductFormData => ({
  name: 'Mon ebook',
  slug: 'mon-ebook',
  description: '<p>Description</p>',
  short_description: 'Court',
  category: 'ebook',
  digital_type: 'ebook',
  image_url: '',
  images: [],
  price: 5000,
  promotional_price: null,
  currency: 'XOF',
  main_file_url: '',
  main_file_version: '1.0',
  downloadable_files: [
    {
      name: 'ebook.pdf',
      url: 'https://example.com/ebook.pdf',
      size: 0,
      is_main: true,
      type: 'application/pdf',
    } as DigitalProductFormData['downloadable_files'][number] & { type: string },
  ],
  license_type: 'unlimited',
  license_duration_days: null,
  max_activations: -1,
  allow_license_transfer: false,
  auto_generate_keys: true,
  download_limit: -1,
  download_expiry_days: -1,
  require_registration: true,
  watermark_enabled: false,
  watermark_text: '',
  version: '1.0',
  affiliate: {
    enabled: false,
    commission_rate: 20,
    commission_type: 'percentage',
    fixed_commission_amount: 0,
    cookie_duration_days: 30,
    min_order_amount: 0,
    allow_self_referral: false,
    require_approval: false,
    terms_and_conditions: '',
  },
  seo: {
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
  },
  faqs: [{ id: '1', question: 'Q?', answer: 'A.', order: 0 }],
  licensing_type: 'standard',
  license_terms: '',
  product_type: 'digital',
  is_active: true,
});

describe('buildDigitalProductCreatePayloads', () => {
  it('preserves unlimited download settings (-1) and main file url', () => {
    const { product, digital, files } = buildDigitalProductCreatePayloads({
      formData: baseFormData(),
      slug: 'mon-ebook',
      isDraft: false,
    });

    expect(digital.download_limit).toBe(-1);
    expect(digital.download_expiry_days).toBe(-1);
    expect(digital.main_file_url).toBe('https://example.com/ebook.pdf');
    expect(files).toHaveLength(1);
    expect(product.faqs).toEqual([{ question: 'Q?', answer: 'A.', order: 0 }]);
    expect(JSON.stringify({ product, digital, files })).not.toContain('undefined');
  });

  it('sanitizes invalid faqs and images from draft state', () => {
    const formData = baseFormData();
    formData.faqs = 'invalid' as unknown as DigitalProductFormData['faqs'];
    formData.images = [42, 'https://cdn.example.com/a.png'] as unknown as string[];

    const { product } = buildDigitalProductCreatePayloads({
      formData,
      slug: 'mon-ebook',
      isDraft: true,
    });

    expect(product.faqs).toEqual([]);
    expect(product.images).toEqual(['https://cdn.example.com/a.png']);
    expect(product.is_draft).toBe(true);
    expect(product.is_active).toBe(false);
  });
});
