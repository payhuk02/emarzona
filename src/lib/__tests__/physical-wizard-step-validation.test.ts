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
});
