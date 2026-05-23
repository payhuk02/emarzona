import { describe, it, expect } from 'vitest';
import { convertRatesToXOF } from '../currency-exchange-api';

describe('convertRatesToXOF', () => {
  it('convertit 10 000 XOF vers EUR avec un taux cohérent (÷655, pas ×655)', () => {
    const rates = convertRatesToXOF({ EUR: 1, USD: 1.1 });
    const xofToEur = rates.XOF_EUR;

    expect(xofToEur).toBeDefined();
    expect(xofToEur).toBeLessThan(1);
    expect(10_000 * xofToEur).toBeCloseTo(15.24, 0);
  });

  it('convertit 1 EUR vers XOF avec le taux fixe BCEAO', () => {
    const rates = convertRatesToXOF({ EUR: 1 });
    expect(rates.EUR_XOF).toBeCloseTo(655.957, 1);
  });
});
