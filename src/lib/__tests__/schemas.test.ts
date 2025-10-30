import { describe, it, expect } from 'vitest';
import { productSchema, orderSchema, storeSchema } from '../schemas';

describe('Zod Schemas', () => {
  it('productSchema – valid payload passes', () => {
    const payload = {
      name: 'Produit Test',
      description: 'Desc',
      price: 1999,
      currency: 'XOF',
      slug: 'produit-test',
      image_url: '',
      category: 'ebooks',
    };

    const parsed = productSchema.parse(payload);
    expect(parsed.name).toBe('Produit Test');
  });

  it('productSchema – invalid currency fails', () => {
    const payload = {
      name: 'P', // too short
      price: 100,
      currency: 'xof', // lowercase -> invalid
      slug: 'bad slug', // contains space -> invalid
    } as any;

    expect(() => productSchema.parse(payload)).toThrowError();
  });

  it('orderSchema – valid payload passes', () => {
    const payload = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      total_amount: 5000,
      currency: 'XOF',
      notes: 'RAS',
    };

    const parsed = orderSchema.parse(payload);
    expect(parsed.currency).toBe('XOF');
  });

  it('orderSchema – invalid email fails', () => {
    const payload = {
      customer_name: 'John Doe',
      customer_email: 'invalid-email',
      total_amount: 5000,
      currency: 'XOF',
    } as any;

    expect(() => orderSchema.parse(payload)).toThrowError();
  });

  it('storeSchema – valid payload passes', () => {
    const payload = {
      name: 'Ma Boutique',
      description: 'Desc',
      slug: 'ma-boutique',
      contact_email: '',
      contact_phone: '',
      facebook_url: '',
      instagram_url: '',
      twitter_url: '',
      linkedin_url: '',
    };

    const parsed = storeSchema.parse(payload);
    expect(parsed.slug).toBe('ma-boutique');
  });

  it('storeSchema – invalid urls or slug fail', () => {
    const payload = {
      name: 'Ma Boutique',
      slug: 'Bad Slug', // invalid
      facebook_url: 'not-a-url',
    } as any;

    expect(() => storeSchema.parse(payload)).toThrowError();
  });
});


