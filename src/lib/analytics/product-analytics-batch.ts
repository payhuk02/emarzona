/**
 * LOT 4 — batch buffer for analytics_events inserts.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { createEventBatchBuffer } from '@/lib/analytics/event-batch-buffer';

export type AnalyticsEventInsertRow = {
  product_id: string;
  store_id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  session_id: string;
  page_url: string;
  referrer: string | null;
  user_agent: string;
  device_type: string;
  revenue: number | null;
  created_at: string;
};

async function flushAnalyticsEventRows(rows: AnalyticsEventInsertRow[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase.from('analytics_events').insert(rows);
  if (error) {
    logger.warn('analytics_events batch insert failed', {
      error: error.message,
      count: rows.length,
    });
    throw error;
  }
}

const productAnalyticsBuffer = createEventBatchBuffer(flushAnalyticsEventRows, {
  name: 'analytics_events',
  maxBatchSize: 20,
  flushIntervalMs: 15_000,
});

const IMMEDIATE_TYPES = new Set(['conversion', 'purchase']);

export function enqueueAnalyticsEvent(row: AnalyticsEventInsertRow): void {
  productAnalyticsBuffer.enqueue(row, {
    immediate: IMMEDIATE_TYPES.has(row.event_type),
  });
}

export function flushAnalyticsEventsBuffer(): Promise<void> {
  return productAnalyticsBuffer.flush();
}
