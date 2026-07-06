/**
 * Utilitaires purs pour resend-webhook-handler (testables en Deno / CI)
 */

export interface ResendWebhookEventData {
  email_id?: string;
  from?: string;
  to?: string[];
  subject?: string;
  click?: { link?: string };
  bounce?: { message?: string };
}

export interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: ResendWebhookEventData;
}

export interface EmailLogSnapshot {
  id: string;
  metadata: Record<string, unknown>;
  campaign_id: string | null;
}

const METRIC_BY_EVENT: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
};

export function getCampaignMetricForEvent(eventType: string): string | null {
  return METRIC_BY_EVENT[eventType] ?? null;
}

export function isKnownResendEventType(eventType: string): boolean {
  return (
    eventType === 'email.sent' ||
    eventType === 'email.delivered' ||
    eventType === 'email.opened' ||
    eventType === 'email.clicked' ||
    eventType === 'email.bounced' ||
    eventType === 'email.complained'
  );
}

export function resolveWebhookDedupKey(
  svixId: string | null | undefined,
  event: ResendWebhookPayload,
  options?: { allowLegacyComposite?: boolean }
): string | null {
  const trimmedSvix = svixId?.trim();
  if (trimmedSvix) {
    return trimmedSvix;
  }

  if (!options?.allowLegacyComposite) {
    return null;
  }

  const emailId = event.data?.email_id?.trim();
  const createdAt = event.created_at?.trim();
  const eventType = event.type?.trim();
  if (!emailId || !createdAt || !eventType) {
    return null;
  }

  return `legacy:${eventType}:${emailId}:${createdAt}`;
}

export function buildEmailLogUpdate(
  payload: ResendWebhookPayload,
  emailLog: EmailLogSnapshot | null
): Record<string, unknown> | null {
  const emailId = payload.data?.email_id;
  if (!emailId || !isKnownResendEventType(payload.type)) {
    return null;
  }

  const timestamp = payload.created_at || new Date().toISOString();
  const recipientEmail = payload.data.to?.[0];
  const updateData: Record<string, unknown> = {
    updated_at: timestamp,
  };

  switch (payload.type) {
    case 'email.sent':
      updateData.status = 'sent';
      break;
    case 'email.delivered':
      updateData.status = 'delivered';
      break;
    case 'email.opened':
      updateData.status = 'opened';
      updateData.opened_at = timestamp;
      break;
    case 'email.clicked':
      updateData.status = 'clicked';
      updateData.clicked_at = timestamp;
      if (payload.data.click?.link && emailLog?.id) {
        updateData.metadata = {
          ...emailLog.metadata,
          clicked_url: payload.data.click.link,
        };
      }
      break;
    case 'email.bounced':
      updateData.status = 'bounced';
      updateData.error_message = payload.data.bounce?.message || 'bounced';
      break;
    case 'email.complained':
      updateData.status = 'spam';
      break;
    default:
      return null;
  }

  if (!emailLog?.id) {
    return payload.type === 'email.complained' && recipientEmail ? updateData : null;
  }

  if (Object.keys(updateData).length <= 1) {
    return null;
  }

  return updateData;
}

export function shouldPersistEmailLogUpdate(update: Record<string, unknown> | null): boolean {
  if (!update) return false;
  return Object.keys(update).length > 1;
}

export function buildComplaintUnsubscribeRow(
  payload: ResendWebhookPayload
): { email: string; unsubscribe_type: string; unsubscribed_at: string } | null {
  if (payload.type !== 'email.complained') return null;
  const recipientEmail = payload.data.to?.[0]?.trim().toLowerCase();
  if (!recipientEmail) return null;
  return {
    email: recipientEmail,
    unsubscribe_type: 'marketing',
    unsubscribed_at: payload.created_at || new Date().toISOString(),
  };
}

export function shouldTriggerBounceRateAlert(eventType: string): boolean {
  return eventType === 'email.bounced' || eventType === 'email.complained';
}
