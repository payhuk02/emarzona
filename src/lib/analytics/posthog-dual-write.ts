/**
 * LOT A — dual-write helpers (PostHog + existing Supabase paths).
 * Does not replace Postgres writes.
 */

import { capturePostHogEvent } from '@/lib/analytics/posthog';

export function dualWriteProductAnalytics(input: {
  eventType: string;
  productId: string;
  storeId?: string | null;
  revenue?: number | null;
  extra?: Record<string, unknown>;
}): void {
  const eventName =
    input.eventType === 'view'
      ? 'product_viewed'
      : input.eventType === 'click'
        ? 'product_clicked'
        : input.eventType === 'conversion'
          ? 'purchase_completed'
          : input.eventType === 'custom'
            ? 'product_custom_event'
            : `product_${input.eventType}`;

  capturePostHogEvent(eventName, {
    product_id: input.productId,
    store_id: input.storeId ?? null,
    revenue: input.revenue ?? null,
    source: 'useAnalyticsTracking',
    ...input.extra,
  });
}

export function dualWritePlatformVisitor(input: {
  eventType: string;
  pagePath: string;
  durationMs?: number;
}): void {
  const eventName =
    input.eventType === 'page_view'
      ? 'app_page_viewed'
      : input.eventType === 'session_heartbeat'
        ? 'session_heartbeat'
        : input.eventType === 'session_end'
          ? 'session_ended'
          : input.eventType;

  capturePostHogEvent(eventName, {
    page_path: input.pagePath,
    duration_ms: input.durationMs ?? 0,
    source: 'platform_visitor',
  });
}

export function dualWriteStoreAnalytics(input: {
  eventType: string;
  storeId: string;
  eventData?: Record<string, unknown>;
}): void {
  const map: Record<string, string> = {
    store_view: 'store_viewed',
    product_view: 'product_viewed',
    product_click: 'product_clicked',
    add_to_cart: 'product_added_to_cart',
    checkout_initiated: 'checkout_started',
    purchase: 'purchase_completed',
    page_view: 'app_page_viewed',
    search: 'search_performed',
    physical_onboarding_seen: 'physical_onboarding_seen',
    trial_continue_clicked: 'trial_continue_clicked',
    billing_cta_clicked: 'billing_cta_clicked',
    store_create_started: 'store_create_started',
    store_create_completed: 'store_create_completed',
  };

  capturePostHogEvent(map[input.eventType] || `store_${input.eventType}`, {
    store_id: input.storeId,
    source: 'useAnalytics',
    ...(input.eventData || {}),
  });
}
