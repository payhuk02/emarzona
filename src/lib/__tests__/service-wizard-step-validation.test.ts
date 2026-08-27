import { describe, expect, it } from 'vitest';
import {
  resolvePersistedFulfillmentMode,
  servicePublicShowsCalendar,
  serviceWizardShowsCalendar,
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

  it('defaults a missing duration on step 1 so save is not blocked', () => {
    const result = validateServiceWizardStep(1, {
      ...baseForm,
      promotional_price: 15000,
      duration_minutes: undefined,
      duration: undefined,
    });
    expect(result.errors.some(msg => /durée/i.test(msg))).toBe(false);
    expect(result.valid).toBe(true);
  });

  it('accepts a 7-day gig delivery delay on step 1', () => {
    const result = validateServiceWizardStep(1, {
      ...baseForm,
      promotional_price: 15000,
      duration_minutes: 7 * 24 * 60,
    });
    expect(result.errors.some(msg => /1440|24h/i.test(msg))).toBe(false);
    expect(result.valid).toBe(true);
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

  it('allows step 2 online without a static meeting URL (Daily.co per booking)', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      meeting_url: '',
    });
    expect(result.valid).toBe(true);
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

  it('ignores appointment mode for locked gig families (no slots)', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-developpement-web',
      fulfillment_mode: 'appointment',
      availability_slots: [],
    });
    expect(result.valid).toBe(true);
  });

  it('still requires slots for appointment mode on RDV families', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-coiffure',
      fulfillment_mode: 'appointment',
      availability_slots: [],
    });
    expect(result.valid).toBe(false);
    expect(result.toastTitle).toBe('Créneaux requis');
  });

  it('does not require slots for juridique contract gigs', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-redaction-contrats',
      fulfillment_mode: 'appointment',
      availability_slots: [],
    });
    expect(result.valid).toBe(true);
  });

  it('does not require slots for droit des affaires gigs', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-droit-affaires',
      fulfillment_mode: 'appointment',
      availability_slots: [],
    });
    expect(result.valid).toBe(true);
  });

  it('requires slots for support technique in hybrid mode', () => {
    const result = validateServiceWizardStep(2, {
      ...baseForm,
      category: 'svc-support-technique',
      fulfillment_mode: 'both',
      availability_slots: [],
    });
    expect(result.valid).toBe(false);
    expect(result.toastTitle).toBe('Créneaux requis');
  });

  it('skips staff validation for locked gig families', () => {
    const result = validateServiceWizardStep(3, {
      ...baseForm,
      category: 'svc-developpement-web',
      requires_staff: true,
      staff_members: [],
      max_participants: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('rejects step 3 when staff is required but missing', () => {
    const result = validateServiceWizardStep(3, {
      ...baseForm,
      requires_staff: true,
      staff_members: [],
    });
    expect(result.valid).toBe(false);
  });

  it('rejects step 3 when a staff member has no email', () => {
    const result = validateServiceWizardStep(3, {
      ...baseForm,
      requires_staff: true,
      staff_members: [{ name: 'Awa', email: '' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(msg => /e-mail/i.test(msg))).toBe(true);
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

  it('requires at least one gig formula on step 4 for project families', () => {
    const result = validateServiceWizardStep(4, {
      ...baseForm,
      category: 'svc-developpement-web',
      fulfillment_mode: 'project',
      delivery_packages: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(msg => /formule/i.test(msg))).toBe(true);
  });

  it('accepts step 4 when a gig formula has a price and delivery delay', () => {
    const result = validateServiceWizardStep(4, {
      ...baseForm,
      category: 'svc-developpement-web',
      fulfillment_mode: 'project',
      delivery_packages: [
        {
          name: 'Basic',
          tier: 'basic',
          description: '',
          price: 15000,
          delivery_days: 7,
          revisions: 1,
          featuresText: 'Site vitrine',
          is_featured: false,
        },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a required brief question without a label', () => {
    const result = validateServiceWizardStep(4, {
      ...baseForm,
      category: 'svc-developpement-web',
      fulfillment_mode: 'project',
      delivery_packages: [
        {
          name: 'Basic',
          tier: 'basic',
          description: '',
          price: 15000,
          delivery_days: 7,
          revisions: 1,
          featuresText: 'Site vitrine',
          is_featured: false,
        },
      ],
      brief_fields: [{ id: 'x', label: '', type: 'text', required: true }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(msg => /brief/i.test(msg))).toBe(true);
  });

  it('validates affiliate commission when enabled (step 5)', () => {
    expect(
      validateServiceWizardStep(5, {
        ...baseForm,
        affiliate: { enabled: true, commission_rate: 0 },
      }).valid
    ).toBe(false);
    expect(
      validateServiceWizardStep(5, {
        ...baseForm,
        affiliate: { enabled: true, commission_rate: 15 },
      }).valid
    ).toBe(true);
  });

  it('validates SEO length when provided (step 6)', () => {
    expect(
      validateServiceWizardStep(6, {
        ...baseForm,
        seo: { meta_title: 'x'.repeat(71) },
      }).valid
    ).toBe(false);
    expect(
      validateServiceWizardStep(6, {
        ...baseForm,
        seo: { meta_title: 'Consultation pro' },
      }).valid
    ).toBe(true);
  });

  it('validates payment type on step 7', () => {
    expect(
      validateServiceWizardStep(7, {
        ...baseForm,
        payment: { payment_type: 'percentage', percentage_rate: 5 },
      }).valid
    ).toBe(false);
    expect(
      validateServiceWizardStep(7, {
        ...baseForm,
        payment: { payment_type: 'delivery_secured' },
      }).valid
    ).toBe(true);
  });

  it('revalidates steps 5–7 on publish', () => {
    const result = validateServiceWizardPublishSteps({
      ...baseForm,
      promotional_price: 15000,
      affiliate: { enabled: true, commission_rate: 99 },
    });
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(5);
  });
});

describe('service calendar intent', () => {
  it('hides calendar and persists project for gig families', () => {
    const form = {
      category: 'svc-developpement-web',
      fulfillment_mode: 'appointment' as const,
    };
    expect(serviceWizardShowsCalendar(form)).toBe(false);
    expect(resolvePersistedFulfillmentMode(form)).toBe('project');
  });

  it('hides calendar for droit des affaires', () => {
    expect(
      serviceWizardShowsCalendar({
        category: 'svc-droit-affaires',
        fulfillment_mode: 'appointment',
      })
    ).toBe(false);
    expect(
      resolvePersistedFulfillmentMode({
        category: 'svc-droit-affaires',
        fulfillment_mode: 'appointment',
      })
    ).toBe('project');
  });

  it('shows calendar for support technique hybrid', () => {
    expect(
      serviceWizardShowsCalendar({
        category: 'svc-support-technique',
        fulfillment_mode: 'both',
      })
    ).toBe(true);
    expect(
      resolvePersistedFulfillmentMode({
        category: 'svc-support-technique',
        fulfillment_mode: 'both',
      })
    ).toBe('both');
  });

  it('shows calendar for hybrid both, hides it for hybrid project', () => {
    expect(
      serviceWizardShowsCalendar({
        category: 'svc-community-management',
        fulfillment_mode: 'both',
      })
    ).toBe(true);
    expect(
      serviceWizardShowsCalendar({
        category: 'svc-community-management',
        fulfillment_mode: 'project',
      })
    ).toBe(false);
  });

  it('hides the public calendar when hybrid both has no slots', () => {
    const form = {
      category: 'svc-community-management',
      fulfillment_mode: 'both' as const,
    };
    expect(serviceWizardShowsCalendar(form)).toBe(true);
    expect(servicePublicShowsCalendar(form, 0)).toBe(false);
    expect(servicePublicShowsCalendar(form, 2)).toBe(true);
  });
});
