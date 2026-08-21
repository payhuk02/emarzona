import { describe, expect, it } from 'vitest';
import {
  validateServiceWizardPublishSteps,
  validateServiceWizardStep,
} from '@/lib/service-wizard-step-validation';

describe('validateServiceWizardStep', () => {
  const baseForm = {
    name: 'Consultation E2E',
    slug: 'consultation-e2e',
    description: 'Description du service de consultation pour les tests.',
    price: 25000,
    duration_minutes: 60,
    max_participants: 1,
    location_type: 'online',
    meeting_url: 'https://meet.example.com/room',
    category_id: '00000000-0000-4000-8000-000000000001',
    fulfillment_mode: 'appointment' as const,
    availability_slots: [{ day_of_week: 1, start_time: '09:00', end_time: '12:00' }],
  };

  it('accepts valid step 1', () => {
    expect(validateServiceWizardStep(1, { ...baseForm, promotional_price: 15000 }).valid).toBe(
      true
    );
  });

  it('rejects step 1 without promotional selling price', () => {
    const result = validateServiceWizardStep(1, baseForm);
    expect(result.valid).toBe(false);
    expect(result.errors.some(msg => msg.toLowerCase().includes('promotionnel'))).toBe(true);
  });

  it('rejects step 1 without name', () => {
    const result = validateServiceWizardStep(1, { ...baseForm, name: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects step 1 without category_id', () => {
    const result = validateServiceWizardStep(1, { ...baseForm, category_id: null });
    expect(result.valid).toBe(false);
  });

  it('rejects step 2 without availability slots for appointment mode', () => {
    const result = validateServiceWizardStep(2, { ...baseForm, availability_slots: [] });
    expect(result.valid).toBe(false);
    expect(result.toastTitle).toBe('Créneaux requis');
  });

  it('allows step 2 without slots when fulfillment_mode is project', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      fulfillment_mode: 'project',
      availability_slots: [],
    });
    expect(result.valid).toBe(true);
  });

  it('validateServiceWizardPublishSteps returns failedStep', () => {
    const result = validateServiceWizardPublishSteps({ ...baseForm, name: '' });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(1);
  });

  it('rejects step 1 when required category attributes are missing', () => {
    const result = validateServiceWizardStep(1, {
      ...baseForm,
      promotional_price: 15000,
      category: 'svc-traduction',
      category_attributes: { word_count: 500 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(msg => /requis/i.test(msg))).toBe(true);
  });

  it('allows step 2 without slots for marketing mode both', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-community-management',
      fulfillment_mode: 'both',
      availability_slots: [],
    });
    expect(result.valid).toBe(true);
  });

  it('still requires slots for appointment mode even when family is project-first', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-developpement-web',
      fulfillment_mode: 'appointment',
      availability_slots: [],
    });
    expect(result.valid).toBe(false);
    expect(result.toastTitle).toBe('Créneaux requis');
  });

  it('rejects step 3 when staff is required but missing', () => {
    const result = validateServiceWizardStep(3, {
      ...baseForm,
      requires_staff: true,
      staff_members: [],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects publish on missing deposit amount', () => {
    const result = validateServiceWizardPublishSteps({
      ...baseForm,
      promotional_price: 15000,
      deposit_required: true,
      deposit_amount: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(4);
  });
});
