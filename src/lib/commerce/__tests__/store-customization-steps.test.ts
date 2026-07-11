import { describe, expect, it } from 'vitest';
import {
  getStoreCustomizationSteps,
  isStoreCustomizationTabVisible,
} from '@/lib/commerce/store-customization-steps';

describe('store-customization-steps', () => {
  it('shows commerce tab only for physical stores', () => {
    expect(isStoreCustomizationTabVisible('commerce', 'physical')).toBe(true);
    expect(isStoreCustomizationTabVisible('commerce', 'digital')).toBe(false);
    expect(isStoreCustomizationTabVisible('commerce', 'service')).toBe(false);
    expect(isStoreCustomizationTabVisible('commerce', 'course')).toBe(false);
    expect(isStoreCustomizationTabVisible('commerce', 'artist')).toBe(false);
  });

  it('keeps common tabs for all commerce types', () => {
    for (const type of ['physical', 'digital', 'service', 'course', 'artist'] as const) {
      expect(isStoreCustomizationTabVisible('settings', type)).toBe(true);
      expect(isStoreCustomizationTabVisible('appearance', type)).toBe(true);
      expect(isStoreCustomizationTabVisible('analytics', type)).toBe(true);
    }
  });

  it('reindexes step ids after filtering', () => {
    const digitalSteps = getStoreCustomizationSteps('digital');
    expect(digitalSteps.some(step => step.key === 'commerce')).toBe(false);
    expect(digitalSteps.some(step => step.key === 'location')).toBe(false);
    expect(digitalSteps[0]?.id).toBe(1);
    expect(digitalSteps[digitalSteps.length - 1]?.id).toBe(digitalSteps.length);
  });

  it('hides location tab for digital and course stores', () => {
    expect(isStoreCustomizationTabVisible('location', 'digital')).toBe(false);
    expect(isStoreCustomizationTabVisible('location', 'course')).toBe(false);
    expect(isStoreCustomizationTabVisible('location', 'physical')).toBe(true);
    expect(isStoreCustomizationTabVisible('location', 'service')).toBe(true);
    expect(isStoreCustomizationTabVisible('location', 'artist')).toBe(true);
  });
});
