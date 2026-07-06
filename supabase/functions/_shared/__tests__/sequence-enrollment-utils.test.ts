/**
 * Tests unitaires — sequence-enrollment-utils
 */
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  matchesSequenceEventTrigger,
  type SequenceTriggerRow,
} from '../sequence-enrollment-utils.ts';

const baseSequence = (overrides?: Partial<SequenceTriggerRow>): SequenceTriggerRow => ({
  id: 'seq-1',
  store_id: 'store-1',
  name: 'Post-achat',
  trigger_type: 'event',
  trigger_config: { event_name: 'order.paid' },
  status: 'active',
  ...overrides,
});

Deno.test('matchesSequenceEventTrigger — order.paid', () => {
  assertEquals(
    matchesSequenceEventTrigger(baseSequence(), 'order.paid', { store_id: 'store-1' }),
    true
  );
  assertEquals(
    matchesSequenceEventTrigger(baseSequence(), 'order.completed', { store_id: 'store-1' }),
    false
  );
});

Deno.test('matchesSequenceEventTrigger — legacy event key', () => {
  assertEquals(
    matchesSequenceEventTrigger(
      baseSequence({ trigger_config: { event: 'order.completed' } }),
      'order.completed',
      { store_id: 'store-1' }
    ),
    true
  );
});

Deno.test('matchesSequenceEventTrigger — guest_only filter', () => {
  const seq = baseSequence({ trigger_config: { event_name: 'order.paid', filters: { guest_only: true } } });
  assertEquals(matchesSequenceEventTrigger(seq, 'order.paid', { store_id: 'store-1', guest_checkout: true }), true);
  assertEquals(matchesSequenceEventTrigger(seq, 'order.paid', { store_id: 'store-1', guest_checkout: false }), false);
});

Deno.test('matchesSequenceEventTrigger — inactive sequence', () => {
  assertEquals(
    matchesSequenceEventTrigger(baseSequence({ status: 'paused' }), 'order.paid', { store_id: 'store-1' }),
    false
  );
});
