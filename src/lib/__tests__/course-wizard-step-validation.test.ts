import { describe, expect, it } from 'vitest';
import {
  validateCourseWizardPublishSteps,
  validateCourseWizardStep,
} from '@/lib/course-wizard-step-validation';

describe('validateCourseWizardStep', () => {
  const baseForm = {
    title: 'Mon cours',
    slug: 'mon-cours',
    short_description: 'Résumé court',
    description: 'Description complète du cours.',
    level: 'beginner',
    language: 'fr',
    category: 'business',
    price: 10000,
  };

  it('accepts valid step 1', () => {
    const result = validateCourseWizardStep(1, baseForm, []);
    expect(result.valid).toBe(true);
  });

  it('rejects step 1 without slug', () => {
    const result = validateCourseWizardStep(1, { ...baseForm, slug: '' }, []);
    expect(result.valid).toBe(false);
    expect(result.fieldErrors.slug).toBeTruthy();
  });

  it('rejects empty curriculum on step 2', () => {
    const result = validateCourseWizardStep(2, baseForm, []);
    expect(result.valid).toBe(false);
    expect(result.toastTitle).toBe('Curriculum vide');
  });

  it('validateCourseWizardPublishSteps returns failedStep', () => {
    const result = validateCourseWizardPublishSteps({ ...baseForm, title: '' }, [
      { lessons: [{ id: '1' }] },
    ]);
    expect(result.valid).toBe(false);
    expect(result.failedStep).toBe(1);
  });
});
