import { describe, expect, it } from 'vitest';
import {
  chargedServiceAmount,
  getServicePricingGuidance,
  normalizeServicePricingType,
  resolveServiceAppointmentCharge,
  resolveServiceAppointmentUnitPrice,
  resolveServiceDisplayPrice,
  toPersistedPricingType,
  usesStartingFromPrice,
} from '../service-pricing';

describe('normalizeServicePricingType', () => {
  it('maps per_hour and hourly to hourly', () => {
    expect(normalizeServicePricingType('hourly')).toBe('hourly');
    expect(normalizeServicePricingType('per_hour')).toBe('hourly');
  });

  it('keeps per_participant and defaults the rest to fixed', () => {
    expect(normalizeServicePricingType('per_participant')).toBe('per_participant');
    expect(normalizeServicePricingType('fixed')).toBe('fixed');
    expect(normalizeServicePricingType(null)).toBe('fixed');
    expect(normalizeServicePricingType('unknown')).toBe('fixed');
  });
});

describe('toPersistedPricingType', () => {
  it('persists hourly as per_hour for the order RPC', () => {
    expect(toPersistedPricingType('hourly')).toBe('per_hour');
    expect(toPersistedPricingType('per_hour')).toBe('per_hour');
    expect(toPersistedPricingType('fixed')).toBe('fixed');
    expect(toPersistedPricingType('per_participant')).toBe('per_participant');
  });
});

describe('chargedServiceAmount', () => {
  it('uses promotional price when it is lower than list', () => {
    expect(chargedServiceAmount(20000, 15000)).toEqual({
      amount: 15000,
      originalAmount: 20000,
    });
  });

  it('ignores promo when it is missing or not a discount', () => {
    expect(chargedServiceAmount(20000, null)).toEqual({ amount: 20000 });
    expect(chargedServiceAmount(20000, 20000)).toEqual({ amount: 20000 });
    expect(chargedServiceAmount(20000, 0)).toEqual({ amount: 20000 });
  });
});

describe('usesStartingFromPrice', () => {
  it('is true when delivery packages exist', () => {
    expect(usesStartingFromPrice({ packagePrices: [25000, 40000] })).toBe(true);
  });

  it('is true for project or both fulfillment without fetching packages', () => {
    expect(usesStartingFromPrice({ fulfillmentMode: 'project' })).toBe(true);
    expect(usesStartingFromPrice({ fulfillmentMode: 'both' })).toBe(true);
  });

  it('is false for appointment-only without packages', () => {
    expect(usesStartingFromPrice({ fulfillmentMode: 'appointment' })).toBe(false);
    expect(usesStartingFromPrice({})).toBe(false);
  });
});

describe('resolveServiceDisplayPrice', () => {
  it('shows À partir de from the cheapest package', () => {
    const display = resolveServiceDisplayPrice({
      price: 50000,
      promotionalPrice: 40000,
      fulfillmentMode: 'project',
      packagePrices: [35000, 55000, 80000],
    });
    expect(display.amount).toBe(35000);
    expect(display.showStartingFrom).toBe(true);
    expect(display.originalAmount).toBeUndefined();
    expect(display.unitLabel).toBe('Selon la formule');
  });

  it('falls back to promo list price for project listings without packages', () => {
    const display = resolveServiceDisplayPrice({
      price: 50000,
      promotionalPrice: 40000,
      fulfillmentMode: 'project',
    });
    expect(display.amount).toBe(40000);
    expect(display.originalAmount).toBe(50000);
    expect(display.showStartingFrom).toBe(true);
  });

  it('does not prefix À partir de on a free appointment', () => {
    const display = resolveServiceDisplayPrice({
      price: 0,
      fulfillmentMode: 'appointment',
    });
    expect(display.amount).toBe(0);
    expect(display.showStartingFrom).toBe(false);
  });

  it('adds hourly and per-participant suffixes', () => {
    expect(resolveServiceDisplayPrice({ price: 15000, pricingType: 'per_hour' }).unitSuffix).toBe(
      '/ h'
    );
    expect(
      resolveServiceDisplayPrice({ price: 5000, pricingType: 'per_participant' }).unitSuffix
    ).toBe('/ pers.');
    expect(resolveServiceDisplayPrice({ price: 20000, pricingType: 'fixed' }).unitSuffix).toBe(
      null
    );
  });
});

describe('resolveServiceAppointmentUnitPrice', () => {
  it('never uses packages and never shows À partir de', () => {
    const display = resolveServiceAppointmentUnitPrice({
      price: 20000,
      promotionalPrice: 15000,
      pricingType: 'hourly',
    });
    expect(display.amount).toBe(15000);
    expect(display.showStartingFrom).toBe(false);
    expect(display.unitSuffix).toBe('/ h');
  });
});

describe('resolveServiceAppointmentCharge', () => {
  it('mirrors RPC hourly: unit × duration/60', () => {
    expect(
      resolveServiceAppointmentCharge({
        price: 20000,
        promotionalPrice: 15000,
        pricingType: 'per_hour',
        durationMinutes: 90,
      })
    ).toBe(22500);
  });

  it('mirrors RPC per_participant: unit × participants', () => {
    expect(
      resolveServiceAppointmentCharge({
        price: 5000,
        pricingType: 'per_participant',
        participants: 4,
      })
    ).toBe(20000);
  });

  it('keeps fixed price unchanged', () => {
    expect(
      resolveServiceAppointmentCharge({
        price: 25000,
        promotionalPrice: 20000,
        pricingType: 'fixed',
        durationMinutes: 90,
        participants: 3,
      })
    ).toBe(20000);
  });
});

describe('getServicePricingGuidance', () => {
  it('matches each family to a pricing mode', () => {
    expect(getServicePricingGuidance('svc-informatique-technologie').showStartingFrom).toBe(true);
    expect(getServicePricingGuidance('svc-design-creation').pricingType).toBe('fixed');
    expect(getServicePricingGuidance('svc-formation-coaching').pricingType).toBe('hourly');
    expect(getServicePricingGuidance('svc-juridique-administratif').pricingType).toBe('hourly');
    expect(getServicePricingGuidance('svc-evenementiel').pricingType).toBe('per_participant');
    expect(getServicePricingGuidance('svc-services-entreprises').pricingType).toBe('hourly');
    expect(getServicePricingGuidance('svc-beaute-bien-etre').showStartingFrom).toBe(false);
    expect(getServicePricingGuidance('svc-maison-services-locaux').pricingType).toBe('fixed');
  });

  it('returns a safe default for unknown families', () => {
    expect(getServicePricingGuidance(null).pricingType).toBe('fixed');
    expect(getServicePricingGuidance('unknown').showStartingFrom).toBe(false);
  });
});
