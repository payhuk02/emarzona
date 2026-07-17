import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  isWithinStoreQuietHours,
  shouldSendSellerNewOrderEmail,
} from '../seller-order-notification-email.ts';

Deno.test('shouldSendSellerNewOrderEmail allows by default', () => {
  const result = shouldSendSellerNewOrderEmail(null);
  assertEquals(result.allowed, true);
});

Deno.test('shouldSendSellerNewOrderEmail respects email_new_order', () => {
  const result = shouldSendSellerNewOrderEmail({ email_new_order: false });
  assertEquals(result.allowed, false);
  assertEquals(result.reason, 'email_new_order_disabled');
});

Deno.test('shouldSendSellerNewOrderEmail respects email_enabled', () => {
  const result = shouldSendSellerNewOrderEmail({ email_enabled: false });
  assertEquals(result.allowed, false);
  assertEquals(result.reason, 'email_disabled');
});

Deno.test('shouldSendSellerNewOrderEmail blocks non-critical alerts during quiet hours', () => {
  const now = new Date('2026-07-17T23:30:00Z');
  const settings = {
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    quiet_hours_timezone: 'UTC',
    critical_alerts_enabled: false,
  };

  assertEquals(isWithinStoreQuietHours(settings, now), true);

  const result = shouldSendSellerNewOrderEmail(settings, { isCritical: false, now });
  assertEquals(result.allowed, false);
  assertEquals(result.reason, 'quiet_hours');
});

Deno.test('shouldSendSellerNewOrderEmail bypasses quiet hours for critical new orders', () => {
  const now = new Date('2026-07-17T23:30:00Z');
  const settings = {
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    quiet_hours_timezone: 'UTC',
    critical_alerts_enabled: true,
  };

  assertEquals(isWithinStoreQuietHours(settings, now), true);

  const result = shouldSendSellerNewOrderEmail(settings, { isCritical: true, now });
  assertEquals(result.allowed, true);
});
