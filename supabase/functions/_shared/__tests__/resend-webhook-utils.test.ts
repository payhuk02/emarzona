/**
 * Tests unitaires — resend-webhook-utils (idempotence + mapping événements)
 * Run: deno test --allow-env supabase/functions/_shared/__tests__/resend-webhook-utils.test.ts
 */
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  buildComplaintUnsubscribeRow,
  buildEmailLogUpdate,
  getCampaignMetricForEvent,
  isKnownResendEventType,
  resolveWebhookDedupKey,
  shouldPersistEmailLogUpdate,
  shouldTriggerBounceRateAlert,
  type ResendWebhookPayload,
} from '../resend-webhook-utils.ts';

const basePayload = (type: string, overrides?: Partial<ResendWebhookPayload>): ResendWebhookPayload => ({
  type,
  created_at: '2026-07-06T12:00:00.000Z',
  data: {
    email_id: 'msg_abc123',
    to: ['buyer@example.com'],
    ...overrides?.data,
  },
  ...overrides,
});

const sampleLog = {
  id: 'log-1',
  metadata: { campaign_id: 'camp-1' },
  campaign_id: 'camp-1',
};

Deno.test('getCampaignMetricForEvent maps delivered/opened/clicked/bounced', () => {
  assertEquals(getCampaignMetricForEvent('email.delivered'), 'delivered');
  assertEquals(getCampaignMetricForEvent('email.opened'), 'opened');
  assertEquals(getCampaignMetricForEvent('email.clicked'), 'clicked');
  assertEquals(getCampaignMetricForEvent('email.bounced'), 'bounced');
  assertEquals(getCampaignMetricForEvent('email.complained'), null);
  assertEquals(getCampaignMetricForEvent('email.unknown'), null);
});

Deno.test('resolveWebhookDedupKey prefers svix-id header', () => {
  const event = basePayload('email.delivered');
  assertEquals(resolveWebhookDedupKey('evt_unique_svix', event), 'evt_unique_svix');
});

Deno.test('resolveWebhookDedupKey legacy composite when allowed', () => {
  const event = basePayload('email.opened');
  assertEquals(
    resolveWebhookDedupKey(null, event, { allowLegacyComposite: true }),
    'legacy:email.opened:msg_abc123:2026-07-06T12:00:00.000Z'
  );
  assertEquals(resolveWebhookDedupKey(null, event), null);
});

Deno.test('resolveWebhookDedupKey — même svix-id = même clé (replay idempotent)', () => {
  const event = basePayload('email.delivered');
  const key1 = resolveWebhookDedupKey('replay-same-id', event);
  const key2 = resolveWebhookDedupKey('replay-same-id', event);
  assertEquals(key1, key2);
});

Deno.test('buildEmailLogUpdate — delivered sets status', () => {
  const update = buildEmailLogUpdate(basePayload('email.delivered'), sampleLog);
  assertEquals(update?.status, 'delivered');
  assertEquals(shouldPersistEmailLogUpdate(update), true);
});

Deno.test('buildEmailLogUpdate — clicked preserves metadata click url', () => {
  const update = buildEmailLogUpdate(
    basePayload('email.clicked', { data: { email_id: 'msg_abc123', click: { link: 'https://x.test' } } }),
    sampleLog
  );
  assertEquals(update?.status, 'clicked');
  assertEquals((update?.metadata as Record<string, string>)?.clicked_url, 'https://x.test');
});

Deno.test('buildEmailLogUpdate — unknown event returns null', () => {
  assertEquals(buildEmailLogUpdate(basePayload('email.unknown'), sampleLog), null);
});

Deno.test('buildComplaintUnsubscribeRow — marketing opt-out', () => {
  const row = buildComplaintUnsubscribeRow(basePayload('email.complained'));
  assertEquals(row?.email, 'buyer@example.com');
  assertEquals(row?.unsubscribe_type, 'marketing');
});

Deno.test('shouldTriggerBounceRateAlert only for bounce/complaint', () => {
  assertEquals(shouldTriggerBounceRateAlert('email.bounced'), true);
  assertEquals(shouldTriggerBounceRateAlert('email.complained'), true);
  assertEquals(shouldTriggerBounceRateAlert('email.delivered'), false);
});

Deno.test('isKnownResendEventType covers Resend lifecycle events', () => {
  for (const t of [
    'email.sent',
    'email.delivered',
    'email.opened',
    'email.clicked',
    'email.bounced',
    'email.complained',
  ]) {
    assertEquals(isKnownResendEventType(t), true);
  }
  assertEquals(isKnownResendEventType('email.dropped'), false);
});
