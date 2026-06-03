/**
 * Deno test — alignement Edge order-status avec src/lib/orders/order-status.ts
 * Run: deno test supabase/functions/_shared/__tests__/order-status.test.ts
 */

import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { resolveOrderStatusAfterPayment } from '../order-status.ts';

Deno.test('resolveOrderStatusAfterPayment — digital → completed', () => {
  assertEquals(resolveOrderStatusAfterPayment(['digital']), 'completed');
});

Deno.test('resolveOrderStatusAfterPayment — physical → confirmed', () => {
  assertEquals(resolveOrderStatusAfterPayment(['physical']), 'confirmed');
});

Deno.test('resolveOrderStatusAfterPayment — mixed cart → confirmed', () => {
  assertEquals(resolveOrderStatusAfterPayment(['digital', 'physical']), 'confirmed');
});
