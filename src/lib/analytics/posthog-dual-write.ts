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

/** Course funnel events (views / enroll / lessons) — product analytics stream. */
export function dualWriteCourseAnalytics(input: {
  eventType: string;
  productId: string;
  extra?: Record<string, unknown>;
}): void {
  const map: Record<string, string> = {
    view: 'course_viewed',
    click: 'course_enroll_clicked',
    enrollment: 'course_enrolled',
    lesson_view: 'course_lesson_viewed',
    lesson_complete: 'course_lesson_completed',
    quiz_attempt: 'course_quiz_attempted',
  };

  capturePostHogEvent(map[input.eventType] || `course_${input.eventType}`, {
    product_id: input.productId,
    product_type: 'course',
    source: 'useCourseAnalytics',
    ...(input.extra || {}),
  });
}

/** Video player milestones — behavioral only (not business progress). */
export function dualWriteVideoAnalytics(input: {
  eventType: string;
  productId: string;
  lessonId?: string | null;
  progressPercent?: number | null;
}): void {
  const map: Record<string, string> = {
    video_play: 'course_video_played',
    video_pause: 'course_video_paused',
    video_progress: 'course_video_progress',
    video_complete: 'course_video_completed',
  };

  capturePostHogEvent(map[input.eventType] || `course_${input.eventType}`, {
    product_id: input.productId,
    lesson_id: input.lessonId ?? null,
    progress_percent: input.progressPercent ?? null,
    product_type: 'course',
    source: 'useVideoTracking',
  });
}

/** Ad pixel fire log — optional PostHog mirror when Postgres log is skipped. */
export function dualWritePixelFire(input: {
  eventType: string;
  pixelId: string;
  productId?: string | null;
  orderId?: string | null;
}): void {
  capturePostHogEvent('ad_pixel_fired', {
    pixel_event_type: input.eventType,
    pixel_id: input.pixelId,
    product_id: input.productId ?? null,
    order_id: input.orderId ?? null,
    source: 'usePixels',
  });
}

export function dualWritePlatformVisitor(input: {
  eventType: string;
  pagePath: string;
  durationMs?: number;
  country?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
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
    country: input.country ?? null,
    device_type: input.deviceType ?? null,
    browser: input.browser ?? null,
    os: input.os ?? null,
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
