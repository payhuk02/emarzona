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
    availability_slots: [{ day_of_week: 1, start_time: '09:00', end_time: '12:00' }],
  };

  it('accepts valid step 1', () => {
    expect(validateServiceWizardStep(1, baseForm).valid).toBe(true);
  });

  it('rejects step 1 without name', () => {
    const result = validateServiceWizardStep(1, { ...baseForm, name: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects step 2 without availability slots', () => {
    const result = validateServiceWizardStep(2, { ...baseForm, availability_slots: [] });
    expect(result.valid).toBe(false);
    expect(result.toastTitle).toBe('Créneaux requis');
  });

  it('validateServiceWizardPublishSteps returns failedStep', () => {
    const result = validateServiceWizardPublishSteps({ ...baseForm, name: '' });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(1);
  });
});
