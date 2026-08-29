import type { ServiceBriefField } from '@/lib/services/service-delivery-commerce';

export type ServiceProjectOrderSummary = {
  packageName: string | null;
  deliveryDays: number | null;
  extrasTotal: number | null;
  serverQuotedTotal: number | null;
  briefAnswers: Record<string, string | boolean>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parseServiceProjectOrderMetadata(
  metadata: unknown
): ServiceProjectOrderSummary | null {
  const meta = asRecord(metadata);
  if (!meta) return null;

  const fulfillmentMode = String(meta.fulfillment_mode ?? '');
  const hasPackage = Boolean(meta.delivery_package_id);
  if (fulfillmentMode !== 'project' && !hasPackage) return null;

  const briefRaw = meta.brief_answers;
  const briefAnswers: Record<string, string | boolean> = {};
  if (briefRaw && typeof briefRaw === 'object' && !Array.isArray(briefRaw)) {
    for (const [key, value] of Object.entries(briefRaw as Record<string, unknown>)) {
      if (typeof value === 'boolean' || typeof value === 'string') {
        briefAnswers[key] = value;
      } else if (value != null) {
        briefAnswers[key] = String(value);
      }
    }
  }

  return {
    packageName: typeof meta.package_name === 'string' ? meta.package_name : null,
    deliveryDays:
      meta.delivery_days != null && meta.delivery_days !== ''
        ? Number(meta.delivery_days)
        : meta.total_days != null
          ? Number(meta.total_days)
          : null,
    extrasTotal: meta.extras_total != null ? Number(meta.extras_total) : null,
    serverQuotedTotal: meta.server_quoted_total != null ? Number(meta.server_quoted_total) : null,
    briefAnswers,
  };
}

export function resolveBriefAnswerLabel(
  fieldId: string,
  briefFields: ServiceBriefField[] | undefined
): string {
  const match = briefFields?.find(field => field.id === fieldId);
  return match?.label?.trim() || fieldId;
}

export function formatBriefAnswerValue(value: string | boolean): string {
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return value.trim() || '—';
}
