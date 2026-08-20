import { describe, expect, it } from 'vitest';

/**
 * Pure helpers mirroring server project pricing rules (for unit coverage without DB).
 */
export function computeProjectQuotedTotal(input: {
  packagePrice: number;
  extras: Array<{ id: string; price: number; is_active?: boolean }>;
  extraIds: string[];
}): number {
  const extrasTotal = input.extraIds.reduce((sum, id) => {
    const extra = input.extras.find(e => e.id === id && e.is_active !== false);
    if (!extra) throw new Error('invalid_extra');
    return sum + Number(extra.price);
  }, 0);
  return Math.round((Number(input.packagePrice) + extrasTotal) * 100) / 100;
}

describe('project quoted total (server rules mirror)', () => {
  const extras = [
    { id: 'e1', price: 5000, is_active: true },
    { id: 'e2', price: 2000, is_active: true },
    { id: 'e3', price: 9999, is_active: false },
  ];

  it('sums package + selected active extras', () => {
    expect(
      computeProjectQuotedTotal({
        packagePrice: 25000,
        extras,
        extraIds: ['e1', 'e2'],
      })
    ).toBe(32000);
  });

  it('ignores client quoted_total conceptually (server uses DB prices only)', () => {
    const server = computeProjectQuotedTotal({
      packagePrice: 10000,
      extras,
      extraIds: ['e1'],
    });
    const clientQuoted = 1;
    expect(server).toBe(15000);
    expect(server).not.toBe(clientQuoted);
  });

  it('rejects inactive extras', () => {
    expect(() =>
      computeProjectQuotedTotal({
        packagePrice: 10000,
        extras,
        extraIds: ['e3'],
      })
    ).toThrow('invalid_extra');
  });
});
