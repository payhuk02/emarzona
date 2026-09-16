/**
 * Client dashboards → /api/posthog-analytics-query (Vercel)
 * Fallback Edge Function si dispo (plan Pro+).
 * Never exposes PostHog personal API key to the browser.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { DashboardWebMetrics } from '@/lib/dashboard/fetch-web-metrics';

export type PostHogReport =
  | 'store_web_metrics'
  | 'store_funnel'
  | 'store_views'
  | 'platform_visitors'
  | 'physical_onboarding_funnel';

type InvokeBody = {
  report: PostHogReport;
  storeId?: string;
  periodStart?: string;
  periodEnd?: string;
  compareStart?: string;
  periodDays?: number;
};

async function invokeViaVercelApi<T>(body: InvokeBody): Promise<T | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    logger.warn('[PostHog dashboard] no session for Vercel API');
    return null;
  }

  const res = await fetch('/api/posthog-analytics-query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn('[PostHog dashboard] Vercel API failed', {
      report: body.report,
      status: res.status,
      body: text.slice(0, 200),
    });
    return null;
  }

  return (await res.json()) as T;
}

async function invokeViaEdgeFunction<T>(body: InvokeBody): Promise<T | null> {
  try {
    const { data, error } = await supabase.functions.invoke('posthog-analytics-query', { body });
    if (error) {
      logger.debug('[PostHog dashboard] Edge invoke unavailable', {
        report: body.report,
        error: error.message,
      });
      return null;
    }
    if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

async function invokePostHogReport<T>(body: InvokeBody): Promise<T | null> {
  // Prefer Vercel API (works under Free plan Edge Function quota)
  const viaApi = await invokeViaVercelApi<T>(body);
  if (viaApi) return viaApi;
  return invokeViaEdgeFunction<T>(body);
}

export async function fetchStoreWebMetricsFromPostHog(input: {
  storeId: string;
  periodStart: string;
  periodEnd: string;
  compareStart: string;
}): Promise<DashboardWebMetrics | null> {
  return invokePostHogReport<DashboardWebMetrics>({
    report: 'store_web_metrics',
    storeId: input.storeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    compareStart: input.compareStart,
  });
}

export type StoreFunnelCounts = {
  views: number;
  clicks: number;
  conversions: number;
};

export async function fetchStoreFunnelFromPostHog(input: {
  storeId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<StoreFunnelCounts | null> {
  return invokePostHogReport<StoreFunnelCounts>({
    report: 'store_funnel',
    storeId: input.storeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
  });
}

export type StoreViewsCounts = {
  currentViews: number;
  previousViews: number;
  monthlyViews: Array<{ month: string; views: number }>;
};

export async function fetchStoreViewsFromPostHog(input: {
  storeId: string;
  periodStart: string;
  periodEnd: string;
  compareStart: string;
}): Promise<StoreViewsCounts | null> {
  return invokePostHogReport<StoreViewsCounts>({
    report: 'store_views',
    storeId: input.storeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    compareStart: input.compareStart,
  });
}

/** Raw payload — mapped by admin-platform-visitors (évite import circulaire). */
export async function fetchPlatformVisitorsRawFromPostHog(
  periodDays: number
): Promise<unknown | null> {
  return invokePostHogReport<unknown>({
    report: 'platform_visitors',
    periodDays,
  });
}

export type PhysicalOnboardingFunnel = {
  onboardingViews: number;
  trialClicks: number;
  billingClicks: number;
};

export async function fetchPhysicalOnboardingFunnelFromPostHog(
  periodDays = 30
): Promise<PhysicalOnboardingFunnel | null> {
  return invokePostHogReport<PhysicalOnboardingFunnel>({
    report: 'physical_onboarding_funnel',
    periodDays,
  });
}
