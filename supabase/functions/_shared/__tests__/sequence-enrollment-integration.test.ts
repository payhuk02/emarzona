/**
 * Tests intégration — triggerSequenceEnrollmentsForEvent (checkout invité → séquence)
 */
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import { triggerSequenceEnrollmentsForEvent } from '../sequence-enrollment-utils.ts';

type RpcCall = { fn: string; args: Record<string, unknown> };

function createMockSupabase(options: {
  sequences?: Array<Record<string, unknown>>;
  rpcResult?: string | null;
  rpcError?: { message: string } | null;
  fetchError?: { message: string } | null;
}) {
  const rpcCalls: RpcCall[] = [];

  const supabase = {
    from(table: string) {
      return {
        select(_cols: string) {
          return {
            eq(_col: string, _val: unknown) {
              return {
                eq(_col2: string, _val2: unknown) {
                  return {
                    eq(_col3: string, _val3: unknown) {
                      if (table !== 'email_sequences') {
                        return Promise.resolve({ data: null, error: null });
                      }
                      if (options.fetchError) {
                        return Promise.resolve({ data: null, error: options.fetchError });
                      }
                      return Promise.resolve({
                        data: options.sequences ?? [],
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    rpc(fn: string, args: Record<string, unknown>) {
      rpcCalls.push({ fn, args });
      if (options.rpcError) {
        return Promise.resolve({ data: null, error: options.rpcError });
      }
      return Promise.resolve({ data: options.rpcResult ?? 'mock-enrollment-id', error: null });
    },
  };

  return { supabase: supabase as unknown as SupabaseClient, rpcCalls };
}

Deno.test('triggerSequenceEnrollmentsForEvent — guest order.paid enrolls via RPC', async () => {
  const { supabase, rpcCalls } = createMockSupabase({
    sequences: [
      {
        id: 'seq-welcome',
        store_id: 'store-1',
        name: 'Post-achat invité',
        trigger_type: 'event',
        trigger_config: { event_name: 'order.paid' },
        status: 'active',
      },
    ],
  });

  const result = await triggerSequenceEnrollmentsForEvent(supabase, 'store-1', 'order.paid', {
    store_id: 'store-1',
    email: 'guest.checkout@example.com',
    order_id: 'order-abc',
    customer_id: 'cust-1',
    guest_checkout: true,
  });

  assertEquals(result.triggered, 1);
  assertEquals(result.enrolled, 1);
  assertEquals(result.errors, 0);
  assertEquals(rpcCalls.length, 1);
  assertEquals(rpcCalls[0].fn, 'enroll_store_email_in_sequence');
  assertEquals(rpcCalls[0].args.p_email, 'guest.checkout@example.com');
  assertEquals(
    (rpcCalls[0].args.p_context as Record<string, unknown>).guest_checkout,
    true
  );
  assertEquals(
    (rpcCalls[0].args.p_context as Record<string, unknown>).order_id,
    'order-abc'
  );
});

Deno.test('triggerSequenceEnrollmentsForEvent — skips without email', async () => {
  const { supabase, rpcCalls } = createMockSupabase({
    sequences: [
      {
        id: 'seq-1',
        store_id: 'store-1',
        name: 'Test',
        trigger_type: 'event',
        trigger_config: { event_name: 'order.paid' },
        status: 'active',
      },
    ],
  });

  const result = await triggerSequenceEnrollmentsForEvent(supabase, 'store-1', 'order.paid', {
    store_id: 'store-1',
    guest_checkout: true,
  });

  assertEquals(result.enrolled, 0);
  assertEquals(rpcCalls.length, 0);
});

Deno.test('triggerSequenceEnrollmentsForEvent — guest_only filter', async () => {
  const { supabase, rpcCalls } = createMockSupabase({
    sequences: [
      {
        id: 'seq-guest-only',
        store_id: 'store-1',
        name: 'Invités uniquement',
        trigger_type: 'event',
        trigger_config: { event_name: 'order.paid', filters: { guest_only: true } },
        status: 'active',
      },
    ],
  });

  const guestResult = await triggerSequenceEnrollmentsForEvent(
    supabase,
    'store-1',
    'order.paid',
    {
      store_id: 'store-1',
      email: 'guest@example.com',
      guest_checkout: true,
    }
  );
  assertEquals(guestResult.enrolled, 1);

  const { supabase: supabase2, rpcCalls: rpcCalls2 } = createMockSupabase({
    sequences: [
      {
        id: 'seq-guest-only',
        store_id: 'store-1',
        name: 'Invités uniquement',
        trigger_type: 'event',
        trigger_config: { event_name: 'order.paid', filters: { guest_only: true } },
        status: 'active',
      },
    ],
  });

  const memberResult = await triggerSequenceEnrollmentsForEvent(
    supabase2,
    'store-1',
    'order.paid',
    {
      store_id: 'store-1',
      email: 'member@example.com',
      guest_checkout: false,
    }
  );
  assertEquals(memberResult.enrolled, 0);
  assertEquals(rpcCalls2.length, 0);
  assertEquals(rpcCalls.length, 1);
});

Deno.test('triggerSequenceEnrollmentsForEvent — counts RPC errors', async () => {
  const { supabase } = createMockSupabase({
    sequences: [
      {
        id: 'seq-1',
        store_id: 'store-1',
        name: 'Test',
        trigger_type: 'event',
        trigger_config: { event_name: 'order.paid' },
        status: 'active',
      },
    ],
    rpcError: { message: 'sequence inactive' },
  });

  const result = await triggerSequenceEnrollmentsForEvent(supabase, 'store-1', 'order.paid', {
    store_id: 'store-1',
    email: 'guest@example.com',
    guest_checkout: true,
  });

  assertEquals(result.triggered, 1);
  assertEquals(result.enrolled, 0);
  assertEquals(result.errors, 1);
});
