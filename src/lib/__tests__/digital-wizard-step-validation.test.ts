import { describe, expect, it } from 'vitest';
import {
  validateDigitalWizardPublishSteps,
  validateDigitalWizardSaveSteps,
  validateDigitalWizardStep,
} from '@/lib/digital-wizard-step-validation';

describe('validateDigitalWizardStep', () => {
  const baseForm = {
    name: 'Ebook E2E',
    slug: 'ebook-e2e',
    description: 'Description complète du produit digital pour les tests.',
    price: 5000,
    pricing_model: 'one-time',
    main_file_url: 'https://example.com/e2e-digital.pdf',
    is_active: true,
  };

  it('accepts valid step 1', () => {
    expect(validateDigitalWizardStep(1, baseForm).valid).toBe(true);
  });

  it('rejects step 2 without files', () => {
    const result = validateDigitalWizardStep(2, {
      ...baseForm,
      main_file_url: '',
      downloadable_files: [],
    });
    expect(result.valid).toBe(false);
  });

  it('validateDigitalWizardPublishSteps returns failedStep', () => {
    const result = validateDigitalWizardPublishSteps({ ...baseForm, name: '' });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(1);
  });

  it('allows inactive save without files', () => {
    const result = validateDigitalWizardSaveSteps({
      ...baseForm,
      is_active: false,
      main_file_url: '',
      downloadable_files: [],
    });
    expect(result.valid).toBe(true);
  });

  it('requires files when product stays active', () => {
    const result = validateDigitalWizardSaveSteps({
      ...baseForm,
      is_active: true,
      main_file_url: '',
      downloadable_files: [],
    });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(2);
  });
});
