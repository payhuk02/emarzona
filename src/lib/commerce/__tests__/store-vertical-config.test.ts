import { describe, expect, it } from 'vitest';
import {
  getStoreCustomizationPath,
  getStoreOnboardingPath,
  getStoreOnboardingSteps,
  getStoreVerticalProfile,
} from '@/lib/commerce/store-vertical-config';

const STORE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('store-vertical-config', () => {
  it('returns the store customization path', () => {
    expect(getStoreCustomizationPath(STORE_ID)).toBe(`/dashboard/store?storeId=${STORE_ID}`);
    expect(getStoreCustomizationPath(STORE_ID, 'seo')).toBe(
      `/dashboard/store?storeId=${STORE_ID}&tab=seo`
    );
  });

  it('returns vertical-specific onboarding paths', () => {
    expect(getStoreOnboardingPath(STORE_ID, 'physical')).toBe(
      `/dashboard/onboarding/physical-subscription?storeId=${STORE_ID}`
    );
    expect(getStoreOnboardingPath(STORE_ID, 'digital')).toBe(
      `/dashboard/onboarding/store?storeId=${STORE_ID}&type=digital`
    );
  });

  it('resolves dynamic hrefs in onboarding steps', () => {
    const digitalSteps = getStoreOnboardingSteps('digital', STORE_ID);
    const firstProduct = digitalSteps.find(s => s.id === 'first-product');
    expect(firstProduct?.href).toBe('/dashboard/products/new/digital');

    const customize = digitalSteps.find(s => s.id === 'customize');
    expect(customize?.href).toBe(`/dashboard/store?storeId=${STORE_ID}`);

    const physicalSteps = getStoreOnboardingSteps('physical', STORE_ID);
    const subscription = physicalSteps.find(s => s.id === 'subscription');
    expect(subscription?.href).toBe(
      `/dashboard/onboarding/physical-subscription?storeId=${STORE_ID}`
    );
  });

  it('exposes location tab preference per vertical', () => {
    expect(getStoreVerticalProfile('digital').showLocationTab).toBe(false);
    expect(getStoreVerticalProfile('course').showLocationTab).toBe(false);
    expect(getStoreVerticalProfile('physical').showLocationTab).toBe(true);
    expect(getStoreVerticalProfile('service').showLocationTab).toBe(true);
  });

  it('includes vertical-specific optional steps', () => {
    expect(getStoreOnboardingSteps('digital', STORE_ID).some(s => s.id === 'licenses')).toBe(true);
    expect(getStoreOnboardingSteps('service', STORE_ID).some(s => s.id === 'calendar')).toBe(true);
    expect(getStoreOnboardingSteps('course', STORE_ID).some(s => s.id === 'cohorts')).toBe(true);
    expect(getStoreOnboardingSteps('artist', STORE_ID).some(s => s.id === 'portfolio')).toBe(true);
  });
});
