import { describe, expect, it } from 'vitest';
import {
  normalizeServiceCtaButtonLabel,
  parseServiceCheckoutOptions,
} from '../service-checkout-display';

describe('service-checkout-display', () => {
  it('defaults to Réserver when no label is set', () => {
    expect(parseServiceCheckoutOptions(null).cta_button_label).toBe('Réserver');
    expect(parseServiceCheckoutOptions({ payment_type: 'full' }).cta_button_label).toBe('Réserver');
  });

  it('reads vendor CTA label from payment_options', () => {
    expect(
      parseServiceCheckoutOptions({
        payment_type: 'full',
        cta_button_label: 'En savoir plus',
      }).cta_button_label
    ).toBe('En savoir plus');
  });

  it('parses JSON string payment_options', () => {
    expect(
      parseServiceCheckoutOptions(JSON.stringify({ cta_button_label: 'Voir les formules' }))
        .cta_button_label
    ).toBe('Voir les formules');
  });

  it('normalizes empty labels to default', () => {
    expect(normalizeServiceCtaButtonLabel('   ')).toBe('Réserver');
    expect(normalizeServiceCtaButtonLabel('Commander')).toBe('Commander');
  });
});
