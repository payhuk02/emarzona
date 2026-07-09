/**
 * Envoie une campagne email en enchaînant tous les batches jusqu'à épuisement des destinataires.
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

export interface CampaignSendBatchResponse {
  success?: boolean;
  sent?: number;
  errors?: number;
  has_more?: boolean;
  next_batch_index?: number | null;
  error?: string;
}

export interface CampaignSendOrchestratorResult {
  success: boolean;
  total_sent: number;
  total_errors: number;
  batches_processed: number;
  error?: string;
}

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCHES_PER_RUN = 500;

export async function sendCampaignAllBatches(
  supabase: SupabaseClient,
  campaignId: string,
  options?: { batchSize?: number; maxBatches?: number; pauseMs?: number }
): Promise<CampaignSendOrchestratorResult> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxBatches = options?.maxBatches ?? MAX_BATCHES_PER_RUN;
  const pauseMs = options?.pauseMs ?? 300;

  let batchIndex = 0;
  let totalSent = 0;
  let totalErrors = 0;
  let batchesProcessed = 0;

  while (batchesProcessed < maxBatches) {
    const { data, error } = await supabase.functions.invoke('send-email-campaign', {
      body: {
        campaign_id: campaignId,
        batch_size: batchSize,
        batch_index: batchIndex,
      },
    });

    if (error) {
      return {
        success: false,
        total_sent: totalSent,
        total_errors: totalErrors,
        batches_processed: batchesProcessed,
        error: error.message || 'send-email-campaign invoke failed',
      };
    }

    const batch = (data ?? {}) as CampaignSendBatchResponse;
    if (batch.success === false) {
      return {
        success: false,
        total_sent: totalSent,
        total_errors: totalErrors,
        batches_processed: batchesProcessed,
        error: batch.error || 'send-email-campaign returned failure',
      };
    }

    totalSent += batch.sent ?? 0;
    totalErrors += batch.errors ?? 0;
    batchesProcessed += 1;

    if (!batch.has_more) {
      return {
        success: true,
        total_sent: totalSent,
        total_errors: totalErrors,
        batches_processed: batchesProcessed,
      };
    }

    batchIndex =
      typeof batch.next_batch_index === 'number' ? batch.next_batch_index : batchIndex + 1;

    if (pauseMs > 0) {
      await new Promise(resolve => setTimeout(resolve, pauseMs));
    }
  }

  return {
    success: false,
    total_sent: totalSent,
    total_errors: totalErrors,
    batches_processed: batchesProcessed,
    error: `Campaign batch limit reached (${maxBatches} batches). Resume with next batch_index.`,
  };
}
