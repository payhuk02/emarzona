import { describe, expect, it } from 'vitest';
import {
  validatePhysicalWizardPublishSteps,
  validatePhysicalWizardStep,
} from '@/lib/physical-wizard-step-validation';

describe('validatePhysicalWizardStep', () => {
  const baseForm = {
    name: 'Produit physique E2E',
    slug: 'produit-physique-e2e',
    description: 'Description complète du produit physique pour les tests automatisés.',
    price: 12000,
    images: ['https://example.com/image.png'],
    track_inventory: true,
    sku: 'SKU-E2E-001',
    quantity: 10,
    requires_shipping: true,
    weight: 1.5,
  };

  it('accepts valid step 1', () => {
    expect(validatePhysicalWizardStep(1, baseForm).valid).toBe(true);
  });

  it('rejects step 1 without images', () => {
    const result = validatePhysicalWizardStep(1, { ...baseForm, images: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects step 3 without sku when tracking inventory', () => {
    const result = validatePhysicalWizardStep(3, { ...baseForm, sku: '' });
    expect(result.valid).toBe(false);
  });

  it('validatePhysicalWizardPublishSteps returns failedStep', () => {
    const result = validatePhysicalWizardPublishSteps({ ...baseForm, weight: null });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(4);
  });

  it('rejects step 6 affiliate with invalid commission rate', () => {
    const result = validatePhysicalWizardStep(6, {
      ...baseForm,
      affiliate: {
        enabled: true,
        commission_rate: 0,
        commission_type: 'percentage',
        fixed_commission_amount: 0,
        cookie_duration_days: 30,
        min_order_amount: 0,
        allow_self_referral: false,
        require_approval: false,
        terms_and_conditions: '',
      },
    });
    expect(result.valid).toBe(false);
  });

  it('validatePhysicalWizardPublishSteps returns failedStep 8 without CTA label', () => {
    const result = validatePhysicalWizardPublishSteps({
      ...baseForm,
      payment: {
        checkout_method: 'online',
        cta_button_label: '',
        payment_type: 'full',
        percentage_rate: 30,
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(8);
  });

  it('accepts step 8 with default checkout options', () => {
    const result = validatePhysicalWizardStep(8, baseForm);
    expect(result.valid).toBe(true);
  });
});
