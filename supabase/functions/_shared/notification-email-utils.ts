/**
 * Rendu des notification_templates (canal email) côté Edge
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { replaceVariables } from './email-template-utils.ts';

export interface NotificationEmailPayload {
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  language?: string;
  store_id?: string;
  recipient_email?: string;
  recipient_name?: string;
}

export function replaceNotificationVariables(
  text: string,
  variables: Record<string, unknown>
): string {
  const merged: Record<string, unknown> = {
    platform_name: 'Emarzona',
    current_year: String(new Date().getFullYear()),
    current_date: new Date().toLocaleDateString('fr-FR'),
    ...variables,
  };
  let result = text;
  for (const [key, value] of Object.entries(merged)) {
    const safe = value === null || value === undefined ? '' : String(value);
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}|\\{${key}\\}`, 'g');
    result = result.replace(regex, safe);
  }
  return replaceVariables(result, merged);
}

export async function resolveRecipientEmail(
  supabase: SupabaseClient,
  userId: string,
  override?: string
): Promise<{ email: string; name?: string } | null> {
  if (override?.includes('@')) {
    return { email: override.trim().toLowerCase() };
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user?.email) {
    return null;
  }

  const meta = data.user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    data.user.email.split('@')[0];

  return { email: data.user.email.toLowerCase(), name };
}

export async function renderNotificationEmail(
  supabase: SupabaseClient,
  payload: NotificationEmailPayload,
  recipientName: string
): Promise<{ subject: string; html: string }> {
  const language = payload.language === 'en' ? 'en' : 'fr';
  const storeId = payload.store_id || (payload.metadata?.store_id as string | undefined);

  const variables: Record<string, unknown> = {
    title: payload.title,
    message: payload.message,
    action_url: payload.action_url || '',
    action_label: payload.action_label || '',
    user_name: recipientName,
    platform_name: 'Emarzona',
    notification_type: payload.type,
    ...payload.metadata,
  };

  let query = supabase
    .from('notification_templates')
    .select('subject,body,html,store_id')
    .eq('slug', payload.type)
    .eq('channel', 'email')
    .eq('language', language)
    .eq('is_active', true);

  if (storeId) {
    query = query.or(`store_id.eq.${storeId},store_id.is.null`);
  } else {
    query = query.is('store_id', null);
  }

  const { data: rows } = await query.order('store_id', { ascending: false }).limit(1);
  const template = rows?.[0];

  if (template) {
    const subject = replaceNotificationVariables(template.subject || payload.title, variables);
    const html =
      (template.html && replaceNotificationVariables(template.html as string, variables)) ||
      replaceNotificationVariables(template.body as string, variables);
    return { subject, html };
  }

  return {
    subject: payload.title,
    html: buildFallbackNotificationHtml(payload, recipientName),
  };
}

function buildFallbackNotificationHtml(
  payload: NotificationEmailPayload,
  recipientName: string
): string {
  const actionBlock =
    payload.action_url && payload.action_label
      ? `<p style="margin:24px 0;"><a href="${payload.action_url}" style="background:#667eea;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">${payload.action_label}</a></p>`
      : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <p>Bonjour ${recipientName},</p>
  <h2 style="color:#667eea;">${payload.title}</h2>
  <p>${payload.message}</p>
  ${actionBlock}
  <p style="margin-top:30px;color:#666;">Cordialement,<br>L'équipe Emarzona</p>
</body></html>`;
}
