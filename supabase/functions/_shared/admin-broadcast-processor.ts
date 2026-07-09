/**
 * Logique partagée : envoi admin broadcast (email, in-app, popup)
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { canSendEmailToRecipient } from './email-compliance-utils.ts';
import { logEmailSend } from './email-template-utils.ts';
import { renderNotificationEmail } from './notification-email-utils.ts';
import { wrapBroadcastEmailHtml, type BroadcastEmailDesign } from './broadcast-email-templates.ts';

function stripHtmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.emarzona.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Emarzona';

export type BroadcastChannel = 'email' | 'in_app' | 'popup';
export type AudienceType = 'all' | 'vendors' | 'customers' | 'emails';
export type BroadcastPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Recipient {
  user_id: string | null;
  email: string;
}

export interface PopupOptions {
  action_url?: string;
  action_label?: string;
  style?: 'info' | 'warning' | 'success' | 'announcement';
  dismissible?: boolean;
  show_once?: boolean;
  starts_at?: string;
  ends_at?: string;
  target_audience?: 'all' | 'authenticated' | 'vendors' | 'customers';
  priority?: number;
}

export interface BroadcastPayload {
  title: string;
  message: string;
  message_html?: string;
  email_design?: BroadcastEmailDesign;
  channels: BroadcastChannel[];
  audience: AudienceType;
  emails?: string[];
  priority?: BroadcastPriority;
  action_url?: string;
  action_label?: string;
  popup_options?: PopupOptions;
}

export function resolveBroadcastPlainMessage(payload: BroadcastPayload): string {
  const html = payload.message_html?.trim();
  if (html) return stripHtmlToPlainText(html) || payload.message.trim();
  return payload.message.trim();
}

export interface ProcessBroadcastResult {
  success: boolean;
  popup_id?: string | null;
  stats: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  };
  errors: string[];
  error?: string;
}

export function parseEmails(raw?: string[]): string[] {
  if (!raw?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    for (const part of item.split(/[\n,;]+/)) {
      const email = part.trim().toLowerCase();
      if (email.includes('@') && !seen.has(email)) {
        seen.add(email);
        out.push(email);
      }
    }
  }
  return out;
}

export async function resolveRecipients(
  supabase: SupabaseClient,
  audience: AudienceType,
  emails?: string[]
): Promise<Recipient[]> {
  if (audience === 'emails') {
    const parsed = parseEmails(emails);
    if (parsed.length === 0) return [];

    const { data, error } = await supabase.rpc('resolve_users_by_emails', { p_emails: parsed });
    if (error) throw new Error(error.message);

    const byEmail = new Map<string, string>();
    for (const row of (data || []) as Array<{ user_id: string; email: string }>) {
      byEmail.set(row.email.toLowerCase(), row.user_id);
    }

    return parsed.map(email => ({
      email,
      user_id: byEmail.get(email) ?? null,
    }));
  }

  const { data, error } = await supabase.rpc('get_broadcast_recipients', {
    p_audience: audience,
  });
  if (error) throw new Error(error.message);
  return ((data || []) as Array<{ user_id: string; email: string }>).map(row => ({
    user_id: row.user_id,
    email: row.email,
  }));
}

async function sendBroadcastEmail(
  supabase: SupabaseClient,
  options: {
    to: string;
    toName: string;
    subject: string;
    html: string;
    userId?: string | null;
    broadcastId: string;
  }
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'Service email non configuré (RESEND_API_KEY)' };
  }

  const normalizedTo = options.to.trim().toLowerCase();
  const eligibility = await canSendEmailToRecipient(
    supabase,
    normalizedTo,
    'transactional',
    options.userId ?? undefined
  );

  if (!eligibility.allowed) {
    await logEmailSend(supabase, {
      template_slug: 'system_announcement',
      recipient_email: normalizedTo,
      recipient_name: options.toName,
      user_id: options.userId ?? undefined,
      subject: options.subject,
      variables: { broadcast_id: options.broadcastId, source: 'admin_broadcast' },
      sendgrid_status: 'failed',
      error_message: eligibility.reason,
      error_code: 'COMPLIANCE_SKIPPED',
    });
    return { ok: true, skipped: true };
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
      to: [normalizedTo],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.text();
    await logEmailSend(supabase, {
      template_slug: 'system_announcement',
      recipient_email: normalizedTo,
      recipient_name: options.toName,
      user_id: options.userId ?? undefined,
      subject: options.subject,
      html_content: options.html,
      variables: { broadcast_id: options.broadcastId, source: 'admin_broadcast' },
      sendgrid_status: 'failed',
      error_message: errorData,
      error_code: String(resendResponse.status),
    });

    let errorMessage = `Erreur Resend (${resendResponse.status})`;
    try {
      const parsed = JSON.parse(errorData) as { message?: string };
      if (parsed.message) errorMessage = parsed.message;
    } catch {
      if (errorData) errorMessage = errorData.slice(0, 200);
    }
    return { ok: false, error: errorMessage };
  }

  const result = (await resendResponse.json()) as { id?: string };
  await logEmailSend(supabase, {
    template_slug: 'system_announcement',
    recipient_email: normalizedTo,
    recipient_name: options.toName,
    user_id: options.userId ?? undefined,
    subject: options.subject,
    html_content: options.html,
    variables: { broadcast_id: options.broadcastId, source: 'admin_broadcast' },
    sendgrid_message_id: result.id,
    sendgrid_status: 'sent',
  });

  return { ok: true };
}

export async function createBroadcastPopup(
  supabase: SupabaseClient,
  broadcastId: string,
  payload: BroadcastPayload,
  createdBy: string | null,
  options?: { active?: boolean; startsAt?: string }
): Promise<string | null> {
  if (!payload.channels.includes('popup')) return null;

  const popupOpts = payload.popup_options || {};
  const { data: popup, error: popupError } = await supabase
    .from('platform_popup_messages')
    .insert({
      broadcast_id: broadcastId,
      title: payload.title,
      message: payload.message_html?.trim() || payload.message,
      action_url: popupOpts.action_url || payload.action_url || null,
      action_label: popupOpts.action_label || payload.action_label || null,
      style: popupOpts.style || 'info',
      target_audience:
        popupOpts.target_audience || (payload.audience === 'emails' ? 'all' : payload.audience),
      starts_at: options?.startsAt || popupOpts.starts_at || new Date().toISOString(),
      ends_at: popupOpts.ends_at || null,
      dismissible: popupOpts.dismissible ?? true,
      show_once: popupOpts.show_once ?? true,
      is_active: options?.active ?? true,
      priority: popupOpts.priority ?? 0,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (popupError) throw new Error(popupError.message);
  return popup?.id ?? null;
}

export async function processBroadcastDelivery(
  supabase: SupabaseClient,
  broadcastId: string,
  payload: BroadcastPayload,
  recipientsOverride?: Recipient[]
): Promise<ProcessBroadcastResult> {
  const channels = payload.channels;
  const needsRecipients = channels.includes('email') || channels.includes('in_app');
  let recipients = recipientsOverride ?? [];

  if (needsRecipients && !recipientsOverride) {
    recipients = await resolveRecipients(supabase, payload.audience, payload.emails);
  }

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  if (needsRecipients && recipients.length === 0) {
    throw new Error('Aucun destinataire trouvé pour cette audience.');
  }

  const priority = payload.priority || 'normal';
  const actionUrl = payload.action_url?.trim() || payload.popup_options?.action_url?.trim();
  const actionLabel = payload.action_label?.trim() || payload.popup_options?.action_label?.trim();
  const plainMessage = resolveBroadcastPlainMessage(payload);
  const richHtml = payload.message_html?.trim();

  for (const recipient of recipients) {
    let recipientOk = true;

    if (channels.includes('in_app')) {
      if (!recipient.user_id) {
        errors.push(`${recipient.email} (in_app): compte utilisateur introuvable`);
        recipientOk = false;
      } else {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: recipient.user_id,
          type: 'system_announcement',
          title: payload.title,
          message: plainMessage,
          priority,
          action_url: actionUrl || null,
          action_label: actionLabel || null,
          metadata: {
            broadcast_id: broadcastId,
            source: 'admin_broadcast',
            message_html: richHtml || null,
          },
        });

        if (notifError) {
          recipientOk = false;
          errors.push(`${recipient.email} (in_app): ${notifError.message}`);
        }
      }
    }

    if (channels.includes('email')) {
      const recipientName = recipient.email.split('@')[0];
      const { subject, html } = richHtml
        ? {
            subject: payload.title,
            html: wrapBroadcastEmailHtml({
              title: payload.title,
              bodyHtml: richHtml,
              recipientName,
              actionUrl,
              actionLabel,
              design: payload.email_design || 'premium',
            }),
          }
        : await renderNotificationEmail(
            supabase,
            {
              user_id: recipient.user_id ?? '',
              type: 'system_announcement',
              title: payload.title,
              message: plainMessage,
              action_url: actionUrl,
              action_label: actionLabel,
              recipient_email: recipient.email,
              recipient_name: recipientName,
              metadata: { broadcast_id: broadcastId, source: 'admin_broadcast' },
            },
            recipientName
          );

      const sendResult = await sendBroadcastEmail(supabase, {
        to: recipient.email,
        toName: recipientName,
        subject,
        html,
        userId: recipient.user_id,
        broadcastId,
      });

      if (!sendResult.ok) {
        recipientOk = false;
        errors.push(`${recipient.email} (email): ${sendResult.error || 'send failed'}`);
      } else if (sendResult.skipped) {
        skippedCount++;
      }
    }

    if (recipientOk) {
      sentCount++;
    } else {
      failedCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 80));
  }

  const popupOnly = channels.includes('popup') && !needsRecipients;
  const finalSuccess = failedCount === 0 || popupOnly;
  const summaryError =
    failedCount > 0 && sentCount === 0 && !popupOnly
      ? errors[0] || "Aucun message n'a pu être envoyé."
      : undefined;

  return {
    success: finalSuccess,
    stats: {
      total: recipients.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
    },
    errors,
    error: summaryError,
  };
}

export function buildAudienceFilter(
  audience: AudienceType,
  emails?: string[]
): Record<string, unknown> {
  return audience === 'emails' ? { emails: parseEmails(emails) } : {};
}

export function payloadFromBroadcastRow(row: Record<string, unknown>): BroadcastPayload {
  const audienceFilter = (row.audience_filter || {}) as Record<string, unknown>;
  const emails = Array.isArray(audienceFilter.emails)
    ? (audienceFilter.emails as string[])
    : undefined;

  const messageHtml = row.message_html ? String(row.message_html) : undefined;
  const emailDesign = row.email_design ? String(row.email_design) : undefined;

  return {
    title: String(row.title),
    message: String(row.message),
    message_html: messageHtml,
    email_design: (emailDesign as BroadcastEmailDesign) || 'premium',
    channels: (row.channels as BroadcastChannel[]) || [],
    audience: (row.audience_type as AudienceType) || 'all',
    emails,
    priority: (row.priority as BroadcastPriority) || 'normal',
    action_url: row.action_url ? String(row.action_url) : undefined,
    action_label: row.action_label ? String(row.action_label) : undefined,
  };
}
