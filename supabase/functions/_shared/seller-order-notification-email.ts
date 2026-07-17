import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSellerOrderEmailVariables } from './seller-order-email-utils.ts';
import { createSupabaseAdmin } from './supabase-admin.ts';

type AdminSupabaseClient = SupabaseClient<any, 'public', any>;

export type StoreNotificationSettingsRow = {
  email_enabled?: boolean | null;
  email_new_order?: boolean | null;
  notification_email?: string | null;
  quiet_hours_enabled?: boolean | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  quiet_hours_timezone?: string | null;
  critical_alerts_enabled?: boolean | null;
  notification_frequency?: string | null;
};

export type SendEmailInvoker = (
  body: Record<string, unknown>
) => Promise<{ ok: boolean; error?: string }>;

export type SellerOrderNotificationResult = {
  sent: boolean;
  skipped?: string;
  error?: string;
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(part => Number(part));
  if (!Number.isFinite(hours)) return 0;
  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function isWithinStoreQuietHours(
  settings: StoreNotificationSettingsRow,
  now: Date = new Date()
): boolean {
  if (settings.quiet_hours_enabled !== true) return false;

  const timeZone = settings.quiet_hours_timezone || 'Africa/Ouagadougou';
  const start = settings.quiet_hours_start || '22:00';
  const end = settings.quiet_hours_end || '08:00';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
  const nowMinutes = hour * 60 + minute;

  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes <= endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export function shouldSendSellerNewOrderEmail(
  settings: StoreNotificationSettingsRow | null | undefined,
  options?: { isCritical?: boolean; now?: Date }
): { allowed: boolean; reason?: string } {
  const merged: StoreNotificationSettingsRow = {
    email_enabled: true,
    email_new_order: true,
    critical_alerts_enabled: true,
    ...settings,
  };

  if (merged.email_enabled === false) {
    return { allowed: false, reason: 'email_disabled' };
  }

  if (merged.email_new_order === false) {
    return { allowed: false, reason: 'email_new_order_disabled' };
  }

  const isCritical = options?.isCritical ?? true;
  if (isWithinStoreQuietHours(merged, options?.now)) {
    const bypassQuietHours = isCritical && merged.critical_alerts_enabled !== false;
    if (!bypassQuietHours) {
      return { allowed: false, reason: 'quiet_hours' };
    }
  }

  return { allowed: true };
}

export async function fetchStoreNotificationSettings(
  supabase: AdminSupabaseClient,
  storeId: string
): Promise<StoreNotificationSettingsRow | null> {
  const { data } = await supabase
    .from('store_notification_settings')
    .select(
      'email_enabled, email_new_order, notification_email, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, critical_alerts_enabled, notification_frequency'
    )
    .eq('store_id', storeId)
    .maybeSingle();

  return (data as StoreNotificationSettingsRow | null) ?? null;
}

export async function resolveSellerOrderNotificationRecipient(
  supabase: AdminSupabaseClient,
  storeId: string,
  settings: StoreNotificationSettingsRow | null | undefined
): Promise<{ email: string; name: string; userId: string } | null> {
  const { data: storeRow } = await supabase
    .from('stores')
    .select('user_id, name, contact_email')
    .eq('id', storeId)
    .maybeSingle();

  if (!storeRow?.user_id) return null;

  const dedicatedEmail = settings?.notification_email?.trim();
  if (dedicatedEmail) {
    return {
      email: dedicatedEmail,
      name: storeRow.name ?? 'Vendeur',
      userId: storeRow.user_id,
    };
  }

  if (storeRow.contact_email?.trim()) {
    return {
      email: storeRow.contact_email.trim(),
      name: storeRow.name ?? 'Vendeur',
      userId: storeRow.user_id,
    };
  }

  const admin = createSupabaseAdmin();
  const { data: sellerUser, error: sellerError } = await admin.auth.admin.getUserById(
    storeRow.user_id
  );
  if (sellerError || !sellerUser.user?.email) {
    return null;
  }

  return {
    email: sellerUser.user.email,
    name:
      (sellerUser.user.user_metadata?.full_name as string) || storeRow.name || 'Vendeur',
    userId: storeRow.user_id,
  };
}

function summarizeProductNames(items: Array<Record<string, unknown>>): string {
  const names = items
    .map(item => item.product_name)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);

  if (names.length === 0) return 'Produit';
  if (names.length === 1) return names[0];
  return names.join(', ');
}

export async function sendSellerOrderNotificationEmail(
  supabase: AdminSupabaseClient,
  options: {
    order: Record<string, unknown>;
    items: Array<Record<string, unknown>>;
    primaryItem: Record<string, unknown>;
    invokeSendEmail: SendEmailInvoker;
  }
): Promise<SellerOrderNotificationResult> {
  const storeId = options.order.store_id as string | undefined;
  if (!storeId) {
    return { sent: false, skipped: 'missing_store_id' };
  }

  const settings = await fetchStoreNotificationSettings(supabase, storeId);
  const permission = shouldSendSellerNewOrderEmail(settings);
  if (!permission.allowed) {
    console.log(
      `Seller order email skipped for order ${options.order.id}: ${permission.reason ?? 'not_allowed'}`
    );
    return { sent: false, skipped: permission.reason };
  }

  const recipient = await resolveSellerOrderNotificationRecipient(supabase, storeId, settings);
  if (!recipient) {
    console.warn('Seller order email skipped: no recipient email found');
    return { sent: false, skipped: 'no_recipient' };
  }

  const { data: storeRow } = await supabase
    .from('stores')
    .select('name')
    .eq('id', storeId)
    .maybeSingle();

  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  const itemForVariables = {
    ...options.primaryItem,
    product_name: summarizeProductNames(options.items),
  };

  const variables = await buildSellerOrderEmailVariables(supabase, {
    order: options.order,
    item: itemForVariables,
    storeName: storeRow?.name ?? 'Boutique',
    siteUrl,
  });

  const sendResult = await options.invokeSendEmail({
    templateSlug: 'seller-order-notification',
    to: recipient.email,
    toName: recipient.name,
    userId: recipient.userId,
    productType: (options.primaryItem.product_type as string) || 'generic',
    productId: options.primaryItem.product_id as string | undefined,
    productName: itemForVariables.product_name as string | undefined,
    orderId: options.order.id as string,
    storeId,
    variables,
  });

  if (!sendResult.ok) {
    return { sent: false, error: sendResult.error ?? 'send-email failed' };
  }

  return { sent: true };
}
